import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaConfig } from '../../empresas/entities/empresa-config.entity';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import {
  InadimplenciaOperacionalService,
  ResumoReavaliacaoInadimplenciaEmpresa,
} from './inadimplencia-operacional.service';

@Injectable()
export class InadimplenciaOperacionalMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InadimplenciaOperacionalMonitorService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly actorId = 'sistema:inadimplencia_operacional_monitor';
  private readonly nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  private readonly enabled =
    this.nodeEnv !== 'test' &&
    (process.env.FINANCEIRO_INADIMPLENCIA_OPERACIONAL_MONITOR_ENABLED === 'true' ||
      (process.env.FINANCEIRO_INADIMPLENCIA_OPERACIONAL_MONITOR_ENABLED !== 'false' &&
        this.nodeEnv !== 'development'));
  private readonly intervalMs = Number(
    process.env.FINANCEIRO_INADIMPLENCIA_OPERACIONAL_MONITOR_INTERVAL_MS ?? 60 * 60_000,
  );

  constructor(
    @InjectRepository(EmpresaConfig)
    private readonly empresaConfigRepository: Repository<EmpresaConfig>,
    private readonly inadimplenciaOperacionalService: InadimplenciaOperacionalService,
  ) {}

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log(
        'Monitor de inadimplencia operacional desabilitado (defina FINANCEIRO_INADIMPLENCIA_OPERACIONAL_MONITOR_ENABLED=true para habilitar em desenvolvimento)',
      );
      return;
    }

    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  async executarEmpresa(
    empresaId: string,
    actorId?: string,
  ): Promise<ResumoReavaliacaoInadimplenciaEmpresa> {
    return runWithTenant(empresaId, async () => {
      return this.inadimplenciaOperacionalService.reavaliarEmpresa(empresaId, {
        actorId: actorId || this.actorId,
        trigger: 'reavaliacao_manual',
      });
    });
  }

  async executarCiclo(): Promise<{
    empresasProcessadas: number;
    empresasComFalha: number;
    clientesAvaliados: number;
    bloqueados: number;
    emRisco: number;
    ativos: number;
  }> {
    if (this.isRunning) {
      this.logger.warn('Ciclo de inadimplencia operacional ignorado: execucao em andamento.');
      return {
        empresasProcessadas: 0,
        empresasComFalha: 0,
        clientesAvaliados: 0,
        bloqueados: 0,
        emRisco: 0,
        ativos: 0,
      };
    }

    this.isRunning = true;
    try {
      const configs = await this.empresaConfigRepository.find({
        where: { inadimplenciaAutomacaoAtiva: true },
        select: {
          empresaId: true,
        } as any,
      });

      const resultado = {
        empresasProcessadas: 0,
        empresasComFalha: 0,
        clientesAvaliados: 0,
        bloqueados: 0,
        emRisco: 0,
        ativos: 0,
      };

      for (const config of configs) {
        await runWithTenant(config.empresaId, async () => {
          try {
            const resumo = await this.inadimplenciaOperacionalService.reavaliarEmpresa(
              config.empresaId,
              {
                actorId: this.actorId,
                trigger: 'scheduler',
              },
            );
            resultado.empresasProcessadas += 1;
            resultado.clientesAvaliados += resumo.clientesAvaliados;
            resultado.bloqueados += resumo.bloqueados;
            resultado.emRisco += resumo.emRisco;
            resultado.ativos += resumo.ativos;
          } catch (error) {
            resultado.empresasComFalha += 1;
            this.logger.error(
              `Falha ao reavaliar inadimplencia operacional (empresaId=${config.empresaId}): ${
                error instanceof Error ? error.stack || error.message : String(error)
              }`,
            );
          }
        });
      }

      this.logger.log(
        `Ciclo de inadimplencia operacional finalizado: empresas=${resultado.empresasProcessadas}, clientes=${resultado.clientesAvaliados}, bloqueados=${resultado.bloqueados}, emRisco=${resultado.emRisco}`,
      );

      return resultado;
    } finally {
      this.isRunning = false;
    }
  }

  private start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.executarCiclo().catch((error) => {
        this.logger.error(
          `Erro no ciclo automatico de inadimplencia operacional: ${
            error instanceof Error ? error.stack || error.message : String(error)
          }`,
        );
      });
    }, this.intervalMs);

    this.executarCiclo().catch((error) => {
      this.logger.error(
        `Erro no ciclo inicial de inadimplencia operacional: ${
          error instanceof Error ? error.stack || error.message : String(error)
        }`,
      );
    });

    this.logger.log(
      `Monitor de inadimplencia operacional iniciado (intervalo=${this.intervalMs}ms)`,
    );
  }

  private stop(): void {
    if (!this.intervalId) return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.logger.log('Monitor de inadimplencia operacional parado');
  }
}
