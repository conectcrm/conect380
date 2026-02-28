import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { AlertaOperacionalFinanceiroService } from './alerta-operacional-financeiro.service';
import {
  errosAplicacaoTotal,
  financeiroAlertasMonitorCiclosTotal,
  financeiroAlertasMonitorDuracaoUltimoCicloSegundos,
  financeiroAlertasMonitorEmpresasFalhaUltimoCiclo,
  financeiroAlertasMonitorEmpresasProcessadasUltimoCiclo,
  financeiroAlertasMonitorTotaisUltimoCiclo,
  financeiroAlertasMonitorUltimoCicloTimestamp,
  incrementCounter,
  setGauge,
} from '../../../config/metrics';

@Injectable()
export class AlertaOperacionalFinanceiroMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertaOperacionalFinanceiroMonitorService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly usuarioSistema = 'sistema:auto_recalculo_alertas_financeiro';
  private readonly enabled =
    process.env.FINANCEIRO_ALERTAS_AUTO_RECALCULO_ENABLED !== 'false' &&
    process.env.NODE_ENV !== 'test';
  private readonly intervalMs = Number(
    process.env.FINANCEIRO_ALERTAS_AUTO_RECALCULO_INTERVAL_MS ?? 5 * 60_000,
  );

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly alertaOperacionalService: AlertaOperacionalFinanceiroService,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log(
        'Financeiro alertas monitor desabilitado (FINANCEIRO_ALERTAS_AUTO_RECALCULO_ENABLED=false ou ambiente de teste)',
      );
      return;
    }

    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  private start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.executarCiclo().catch((error) => {
        this.logger.error(
          `Erro no ciclo automatico de alertas financeiros: ${
            error instanceof Error ? error.stack || error.message : String(error)
          }`,
        );
      });
    }, this.intervalMs);

    this.executarCiclo().catch((error) => {
      this.logger.error(
        `Erro no ciclo inicial de alertas financeiros: ${
          error instanceof Error ? error.stack || error.message : String(error)
        }`,
      );
    });

    this.logger.log(
      `Financeiro alertas monitor iniciado (intervalo=${this.intervalMs}ms)`,
    );
  }

  private stop() {
    if (!this.intervalId) return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.logger.log('Financeiro alertas monitor parado');
  }

  private async executarCiclo(): Promise<void> {
    const cicloIniciadoEm = Date.now();

    if (this.isRunning) {
      incrementCounter(financeiroAlertasMonitorCiclosTotal, {
        status: 'skipped_concurrent',
      });
      this.logger.warn('Ciclo automatico de alertas financeiros ignorado (execucao em andamento)');
      return;
    }

    this.isRunning = true;
    try {
      const empresas = await this.empresaRepository.find({
        where: { ativo: true },
        select: { id: true } as any,
      });

      let empresasProcessadas = 0;
      let empresasComFalha = 0;
      let totalGerados = 0;
      let totalResolvidos = 0;
      let totalAtivos = 0;

      for (const empresa of empresas) {
        await runWithTenant(empresa.id, async () => {
          try {
            const resumo = await this.alertaOperacionalService.recalcularAlertas(
              empresa.id,
              this.usuarioSistema,
            );
            empresasProcessadas += 1;
            totalGerados += resumo.gerados;
            totalResolvidos += resumo.resolvidos;
            totalAtivos += resumo.ativos;
          } catch (error) {
            empresasComFalha += 1;
            incrementCounter(errosAplicacaoTotal, {
              tipo: 'job',
              servico: 'financeiro_alertas_monitor',
            });
            this.logger.error(
              `Falha ao recalcular alertas financeiros (empresaId=${empresa.id}): ${
                error instanceof Error ? error.stack || error.message : String(error)
              }`,
            );
          }
        });
      }

      this.logger.log(
        JSON.stringify({
          event: 'financeiro.alertas_operacionais.monitor.ciclo',
          empresasProcessadas,
          totalGerados,
          totalResolvidos,
          totalAtivos,
          empresasComFalha,
        }),
      );

      const statusCiclo =
        empresasComFalha === 0
          ? 'success'
          : empresasProcessadas > 0
            ? 'partial'
            : 'fatal_error';

      this.atualizarMetricasCiclo({
        statusCiclo,
        cicloIniciadoEm,
        empresasProcessadas,
        empresasComFalha,
        totalGerados,
        totalResolvidos,
        totalAtivos,
      });
    } finally {
      this.isRunning = false;
    }
  }

  private atualizarMetricasCiclo(params: {
    statusCiclo: 'success' | 'partial' | 'fatal_error';
    cicloIniciadoEm: number;
    empresasProcessadas: number;
    empresasComFalha: number;
    totalGerados: number;
    totalResolvidos: number;
    totalAtivos: number;
  }): void {
    incrementCounter(financeiroAlertasMonitorCiclosTotal, { status: params.statusCiclo });

    const cicloFinalizadoEm = Date.now();
    const duracaoSegundos = Number(((cicloFinalizadoEm - params.cicloIniciadoEm) / 1000).toFixed(3));

    try {
      financeiroAlertasMonitorUltimoCicloTimestamp.set(Math.floor(cicloFinalizadoEm / 1000));
      financeiroAlertasMonitorDuracaoUltimoCicloSegundos.set(duracaoSegundos);
    } catch (error) {
      this.logger.warn(
        `Falha ao atualizar metrica sem labels do monitor financeiro: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    setGauge(financeiroAlertasMonitorEmpresasProcessadasUltimoCiclo, params.empresasProcessadas, {});
    setGauge(financeiroAlertasMonitorEmpresasFalhaUltimoCiclo, params.empresasComFalha, {});
    setGauge(financeiroAlertasMonitorTotaisUltimoCiclo, params.totalGerados, { tipo: 'gerados' });
    setGauge(financeiroAlertasMonitorTotaisUltimoCiclo, params.totalResolvidos, {
      tipo: 'resolvidos',
    });
    setGauge(financeiroAlertasMonitorTotaisUltimoCiclo, params.totalAtivos, { tipo: 'ativos' });
  }
}
