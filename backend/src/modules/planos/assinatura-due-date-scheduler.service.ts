import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { runWithTenant } from '../../common/tenant/tenant-context';
import { MercadoPagoService } from '../mercado-pago/mercado-pago.service';
import {
  AssinaturaEmpresa,
  getAssinaturaStatusAliases,
  toCanonicalAssinaturaStatus,
} from './entities/assinatura-empresa.entity';
import { AssinaturasService } from './assinaturas.service';

type DueDateStatusJobSummary = {
  checked: number;
  pastDueApplied: number;
  suspendedApplied: number;
  skipped: number;
  errors: number;
  reconciliationProcessed: number;
  reconciliationErrors: number;
};

@Injectable()
export class AssinaturaDueDateSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AssinaturaDueDateSchedulerService.name);
  private readonly nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  private readonly enabled =
    this.nodeEnv !== 'test' &&
    (process.env.ASSINATURA_DUE_DATE_JOBS_ENABLED === 'true' ||
      (process.env.ASSINATURA_DUE_DATE_JOBS_ENABLED !== 'false' &&
        this.nodeEnv !== 'development'));
  private readonly intervalMs = this.toBoundedInteger(
    process.env.ASSINATURA_DUE_DATE_JOBS_INTERVAL_MS,
    10 * 60 * 1000,
    60 * 1000,
    24 * 60 * 60 * 1000,
  );
  private readonly batchSize = this.toBoundedInteger(
    process.env.ASSINATURA_DUE_DATE_JOBS_BATCH,
    500,
    1,
    5000,
  );
  private readonly suspendAfterDays = this.toBoundedInteger(
    process.env.ASSINATURA_PAST_DUE_SUSPEND_AFTER_DAYS,
    7,
    1,
    90,
  );
  private readonly reconciliationLookbackHours = this.toBoundedInteger(
    process.env.ASSINATURA_RECONCILE_LOOKBACK_HOURS,
    72,
    1,
    24 * 30,
  );
  private readonly reconciliationLimit = this.toBoundedInteger(
    process.env.ASSINATURA_RECONCILE_LIMIT,
    200,
    1,
    500,
  );

  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @InjectRepository(AssinaturaEmpresa)
    private readonly assinaturaRepository: Repository<AssinaturaEmpresa>,
    private readonly assinaturasService: AssinaturasService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log(
        'Jobs de vencimento de assinatura desabilitados (ASSINATURA_DUE_DATE_JOBS_ENABLED=true habilita em desenvolvimento).',
      );
      return;
    }

    this.intervalId = setInterval(() => {
      void this.runDueDateStatusCycle().catch((error) => {
        this.logger.error(`Falha no ciclo de vencimento de assinatura: ${error?.message || error}`);
      });
    }, this.intervalMs);

    void this.runDueDateStatusCycle();
    this.logger.log(
      `Scheduler de assinatura iniciado (intervalo=${this.intervalMs}ms, batch=${this.batchSize}, grace=${this.suspendAfterDays}d).`,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async runDueDateStatusCycle(): Promise<DueDateStatusJobSummary> {
    if (this.running) {
      return {
        checked: 0,
        pastDueApplied: 0,
        suspendedApplied: 0,
        skipped: 0,
        errors: 0,
        reconciliationProcessed: 0,
        reconciliationErrors: 0,
      };
    }

    this.running = true;
    const summary: DueDateStatusJobSummary = {
      checked: 0,
      pastDueApplied: 0,
      suspendedApplied: 0,
      skipped: 0,
      errors: 0,
      reconciliationProcessed: 0,
      reconciliationErrors: 0,
    };

    try {
      try {
        const reconciliation = await this.mercadoPagoService.reconcileRecentPayments({
          lookbackHours: this.reconciliationLookbackHours,
          limit: this.reconciliationLimit,
        });
        summary.reconciliationProcessed = Number(reconciliation?.processed || 0);
        summary.reconciliationErrors = Number(reconciliation?.errors || 0);
      } catch (error) {
        summary.errors += 1;
        this.logger.warn(
          `Reconciliacao pre-job falhou (continuando ciclo): ${error?.message || error}`,
        );
      }

      const assinaturas = await this.fetchLatestSubscriptionsForDueDateCheck();
      summary.checked = assinaturas.length;

      const today = this.startOfDay(new Date());
      for (const assinatura of assinaturas) {
        const tenantPolicy = await this.assinaturasService.obterPoliticaTenant(assinatura.empresaId);
        if (!tenantPolicy.enforceLifecycleTransitions) {
          summary.skipped += 1;
          continue;
        }

        const dueDate = this.startOfDay(new Date(assinatura.proximoVencimento));
        if (Number.isNaN(dueDate.getTime())) {
          summary.skipped += 1;
          continue;
        }

        const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
        if (overdueDays < 1) {
          summary.skipped += 1;
          continue;
        }

        const canonicalStatus = toCanonicalAssinaturaStatus(String(assinatura.status));
        try {
          if (canonicalStatus === 'active') {
            await runWithTenant(assinatura.empresaId, async () => {
              await this.assinaturasService.marcarPastDue(assinatura.empresaId);
            });
            summary.pastDueApplied += 1;
            continue;
          }

          if (canonicalStatus === 'past_due' && overdueDays >= this.suspendAfterDays) {
            await runWithTenant(assinatura.empresaId, async () => {
              await this.assinaturasService.suspender(assinatura.empresaId);
            });
            summary.suspendedApplied += 1;
            continue;
          }

          summary.skipped += 1;
        } catch (error) {
          summary.errors += 1;
          this.logger.warn(
            `Falha na transicao automatica empresa=${assinatura.empresaId} status=${canonicalStatus} overdueDays=${overdueDays}: ${
              error?.message || error
            }`,
          );
        }
      }

      this.logger.log(
        `Ciclo vencimento assinatura concluido checked=${summary.checked} past_due=${summary.pastDueApplied} suspended=${summary.suspendedApplied} skipped=${summary.skipped} errors=${summary.errors} reconcile_processed=${summary.reconciliationProcessed} reconcile_errors=${summary.reconciliationErrors}`,
      );

      return summary;
    } finally {
      this.running = false;
    }
  }

  private async fetchLatestSubscriptionsForDueDateCheck(): Promise<
    Array<{
      id: string;
      empresaId: string;
      status: string;
      proximoVencimento: string;
    }>
  > {
    const statuses = Array.from(
      new Set([...getAssinaturaStatusAliases('active'), ...getAssinaturaStatusAliases('past_due')]),
    );

    const rows = await this.assinaturaRepository.manager.query(
      `
        SELECT DISTINCT ON (empresa_id)
          id,
          empresa_id AS "empresaId",
          status,
          "proximoVencimento" AS "proximoVencimento"
        FROM assinaturas_empresas
        WHERE status = ANY($1)
        ORDER BY empresa_id, "criadoEm" DESC
        LIMIT $2
      `,
      [statuses, this.batchSize],
    );

    return Array.isArray(rows) ? rows : [];
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private toBoundedInteger(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    const rounded = Math.floor(parsed);
    return Math.min(Math.max(rounded, min), max);
  }
}
