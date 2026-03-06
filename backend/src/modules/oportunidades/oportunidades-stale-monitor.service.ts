import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { runWithTenant } from '../../common/tenant/tenant-context';
import { OportunidadesService } from './oportunidades.service';

@Injectable()
export class OportunidadesStaleMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OportunidadesStaleMonitorService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  private readonly enabled =
    this.nodeEnv !== 'test' &&
    (process.env.OPORTUNIDADES_STALE_MONITOR_ENABLED === 'true' ||
      (process.env.OPORTUNIDADES_STALE_MONITOR_ENABLED !== 'false' &&
        this.nodeEnv !== 'development'));
  private readonly intervalMs = Number(
    process.env.OPORTUNIDADES_STALE_MONITOR_INTERVAL_MS ?? 15 * 60_000,
  );

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly oportunidadesService: OportunidadesService,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log(
        'Monitor de stale deals desabilitado (defina OPORTUNIDADES_STALE_MONITOR_ENABLED=true para habilitar em desenvolvimento).',
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
          `Falha no ciclo automatico de stale deals: ${
            error instanceof Error ? error.stack || error.message : String(error)
          }`,
        );
      });
    }, this.intervalMs);

    this.executarCiclo().catch((error) => {
      this.logger.error(
        `Falha no ciclo inicial de stale deals: ${
          error instanceof Error ? error.stack || error.message : String(error)
        }`,
      );
    });

    this.logger.log(`Monitor de stale deals iniciado (intervalo=${this.intervalMs}ms).`);
  }

  private stop() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.logger.log('Monitor de stale deals parado.');
  }

  private async executarCiclo(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Ciclo de stale deals ignorado: execucao anterior ainda em andamento.');
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
      let totalArquivadas = 0;

      for (const empresa of empresas) {
        await runWithTenant(empresa.id, async () => {
          try {
            const resultado = await this.oportunidadesService.processarAutoArquivamentoStale(
              empresa.id,
              { trigger: 'scheduler' },
            );
            empresasProcessadas += 1;
            totalArquivadas += resultado.archivedCount;
          } catch (error) {
            empresasComFalha += 1;
            this.logger.error(
              `Falha ao processar stale deals (empresaId=${empresa.id}): ${
                error instanceof Error ? error.stack || error.message : String(error)
              }`,
            );
          }
        });
      }

      this.logger.log(
        JSON.stringify({
          event: 'oportunidades.stale.monitor.ciclo',
          empresasProcessadas,
          empresasComFalha,
          totalArquivadas,
        }),
      );
    } finally {
      this.isRunning = false;
    }
  }
}

