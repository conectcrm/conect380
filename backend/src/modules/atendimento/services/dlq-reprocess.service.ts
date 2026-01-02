import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { appendFile } from 'fs/promises';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { NOTIFICATION_JOB_NAMES } from '../../../notifications/constants/notification-job-names';
import { DlqReprocessAudit, DlqReprocessStatus } from '../entities/dlq-reprocess-audit.entity';

export type FilaReprocessavel = 'webhooks-in' | 'messages-out' | 'notifications';

const MAX_DLQ_ATTEMPT = 3;
const DLQ_ALERT_THRESHOLD = 200;
const DLQ_ALERT_MESSAGE =
  'ALERTA DLQ: fila {fila} acima do threshold com {count} jobs filtrados. Ação: {action}';

type ReprocessFilters = {
  jobName?: string;
  errCode?: string;
  from?: string;
  to?: string;
};

interface ReprocessResult {
  fila: FilaReprocessavel;
  totalFiltrados: number;
  totalSelecionados: number;
  reprocessados: number;
  ignoradosSemJobName: number;
  ignoradosSemPayload: number;
  ignoradosJobNameInvalido: number;
  ignoradosMaxAttempt: number;
  status: DlqReprocessStatus;
  sampleJobs: Array<Record<string, unknown>>;
}

interface DlqStatus {
  fila: FilaReprocessavel;
  waiting: number;
  delayed: number;
  failed: number;
  total: number;
}

@Injectable()
export class DlqReprocessService {
  private readonly logger = new Logger(DlqReprocessService.name);

  constructor(
    @InjectQueue('webhooks-in') private readonly webhooksIn: Queue,
    @InjectQueue('webhooks-in-dlq') private readonly webhooksInDlq: Queue,
    @InjectQueue('messages-out') private readonly messagesOut: Queue,
    @InjectQueue('messages-out-dlq') private readonly messagesOutDlq: Queue,
    @InjectQueue('notifications') private readonly notifications: Queue,
    @InjectQueue('notifications-dlq') private readonly notificationsDlq: Queue,
    @InjectRepository(DlqReprocessAudit)
    private readonly dlqAuditRepo: Repository<DlqReprocessAudit>,
    private readonly httpService: HttpService,
  ) { }

  private readonly webhookUrl = process.env.DLQ_ALERT_WEBHOOK_URL;

  async reprocessar(
    fila: FilaReprocessavel,
    limit = 50,
    filtros: ReprocessFilters = {},
    actor?: string | null,
    actionId?: string,
  ): Promise<ReprocessResult> {
    const limiteNormalizado = Math.min(Math.max(limit, 1), 200);
    const { main, dlq, jobNamePadrao } = this.mapearFila(fila);
    const currentActionId = actionId || randomUUID();

    const jobs = await dlq.getJobs(['waiting', 'delayed', 'failed']);
    const filtrados = jobs.filter((job) => this.matchesFilters(job, filtros));
    const selecionados = filtrados.slice(0, limiteNormalizado);

    if (filtrados.length >= DLQ_ALERT_THRESHOLD) {
      this.emitAlert(
        DLQ_ALERT_MESSAGE
          .replace('{fila}', fila)
          .replace('{count}', String(filtrados.length))
          .replace('{action}', 'reprocessamento'),
      );
    }

    let reprocessados = 0;
    let ignoradosSemJobName = 0;
    let ignoradosSemPayload = 0;
    let ignoradosJobNameInvalido = 0;
    let ignoradosMaxAttempt = 0;

    for (const job of selecionados) {
      const payloadOriginal = (job.data as any)?.data ?? job.data;
      const jobNameOriginal = (job.data as any)?.jobName || jobNamePadrao;

      if (!payloadOriginal) {
        ignoradosSemPayload += 1;
        continue;
      }

      if (!jobNameOriginal) {
        ignoradosSemJobName += 1;
        continue;
      }

      const jobNameValido =
        fila !== 'notifications' || NOTIFICATION_JOB_NAMES.includes(jobNameOriginal);

      if (!jobNameValido) {
        ignoradosJobNameInvalido += 1;
        continue;
      }

      const tentativa = ((job.data as any)?.dlqAttempt || 0) + 1;
      if (tentativa > MAX_DLQ_ATTEMPT) {
        ignoradosMaxAttempt += 1;
        continue;
      }
      const payloadComTentativa = { ...payloadOriginal, dlqAttempt: tentativa };

      try {
        await main.add(jobNameOriginal, payloadComTentativa, {
          removeOnComplete: true,
        });

        reprocessados += 1;
        await job.remove().catch(() => undefined);
      } catch (error: any) {
        this.logger.warn(
          `Falha ao reenfileirar job ${job.id} da fila ${fila}: ${error?.message || error}`,
        );
      }
    }

    const status = this.resolveStatus(reprocessados, selecionados.length);
    const sampleJobs = selecionados.slice(0, 5).map((job) => {
      const payload = (job.data as any) ?? {};
      return {
        jobId: job.id,
        jobName: payload?.jobName || payload?.data?.jobName || job.name,
        errCode: payload?.error?.errCode,
        failedAt: payload?.error?.failedAt,
        queue: fila,
      };
    });

    const auditRecord: Partial<DlqReprocessAudit> = {
      actionId: currentActionId,
      actor: actor ?? null,
      fila,
      filters: filtros || null,
      totalFiltrados: filtrados.length,
      totalSelecionados: selecionados.length,
      reprocessados,
      ignoradosSemJobName,
      ignoradosSemPayload,
      ignoradosJobNameInvalido,
      ignoradosMaxAttempt,
      status,
      sampleJobs,
    };

    await this.persistAudit(auditRecord).catch((err) => {
      this.logger.warn(`Falha ao persistir auditoria DLQ: ${err?.message || err}`);
    });

    this.emitAlert(
      DLQ_ALERT_MESSAGE
        .replace('{fila}', fila)
        .replace('{count}', String(filtrados.length))
        .replace('{action}', 'reprocessamento'),
      {
        event: 'dlq-reprocess',
        actionId: currentActionId,
        actor: actor || null,
        fila,
        stats: {
          totalFiltrados: filtrados.length,
          totalSelecionados: selecionados.length,
          reprocessados,
          ignoradosSemJobName,
          ignoradosSemPayload,
          ignoradosJobNameInvalido,
          ignoradosMaxAttempt,
        },
        filters: filtros,
        sample: sampleJobs,
        status,
        timestamp: new Date().toISOString(),
        source: 'dlq-reprocess',
      },
    );

    return {
      fila,
      totalFiltrados: filtrados.length,
      totalSelecionados: selecionados.length,
      reprocessados,
      ignoradosSemJobName,
      ignoradosSemPayload,
      ignoradosJobNameInvalido,
      ignoradosMaxAttempt,
      status,
      sampleJobs,
    };
  }

  private resolveStatus(reprocessados: number, totalSelecionados: number): DlqReprocessStatus {
    if (totalSelecionados === 0) return 'success';
    if (reprocessados === totalSelecionados) return 'success';
    if (reprocessados > 0) return 'partial';
    return 'failed';
  }

  private matchesFilters(job: Job, filtros: ReprocessFilters): boolean {
    const payload = (job.data as any) ?? {};
    const jobName = payload.jobName || payload?.data?.jobName;
    const errCode = payload?.error?.errCode;
    const failedAt = payload?.error?.failedAt;

    if (filtros.jobName && jobName !== filtros.jobName) {
      return false;
    }

    if (filtros.errCode && errCode !== filtros.errCode) {
      return false;
    }

    if (filtros.from || filtros.to) {
      const failedDate = failedAt ? new Date(failedAt).getTime() : undefined;
      if (!failedDate) return false;

      if (filtros.from) {
        const from = new Date(filtros.from).getTime();
        if (failedDate < from) return false;
      }

      if (filtros.to) {
        const to = new Date(filtros.to).getTime();
        if (failedDate > to) return false;
      }
    }

    return true;
  }

  private emitAlert(message: string, data?: Record<string, unknown>) {
    // Alerta via log; envia webhook se configurado.
    this.logger.warn(message);

    if (!this.webhookUrl) {
      return;
    }

    try {
      const payload = {
        text: message,
        timestamp: new Date().toISOString(),
        source: 'dlq-reprocess',
        data,
      };

      void lastValueFrom(this.httpService.post(this.webhookUrl, payload)).catch((err) => {
        this.logger.warn(`Falha ao enviar alerta DLQ para webhook: ${err?.message || err}`);
      });
    } catch (err: any) {
      this.logger.warn(`Erro ao preparar alerta DLQ: ${err?.message || err}`);
    }
  }

  private async persistAudit(entry: Partial<DlqReprocessAudit>) {
    try {
      await this.dlqAuditRepo.save(entry);
    } catch (err) {
      // Fallback para arquivo em caso de falha no banco.
      const auditFile = process.env.DLQ_AUDIT_FILE || join(process.cwd(), 'logs', 'dlq-reprocess.log');
      const line = `${JSON.stringify({ ...entry, fallback: true, at: new Date().toISOString() })}\n`;
      await appendFile(auditFile, line, { encoding: 'utf-8' });
      throw err;
    }

    // Sempre registrar também em arquivo para trilha paralela.
    const auditFile = process.env.DLQ_AUDIT_FILE || join(process.cwd(), 'logs', 'dlq-reprocess.log');
    const line = `${JSON.stringify({ ...entry, at: new Date().toISOString() })}\n`;
    await appendFile(auditFile, line, { encoding: 'utf-8' });
  }

  async status(fila?: FilaReprocessavel): Promise<DlqStatus | DlqStatus[]> {
    if (fila) {
      const { dlq } = this.mapearFila(fila);
      const counts = await dlq.getJobCounts();
      return this.toStatus(fila, counts);
    }

    const filas: FilaReprocessavel[] = ['webhooks-in', 'messages-out', 'notifications'];
    const results: DlqStatus[] = [];

    for (const f of filas) {
      const { dlq } = this.mapearFila(f);
      const counts = await dlq.getJobCounts();
      results.push(this.toStatus(f, counts));
    }

    return results;
  }

  private toStatus(fila: FilaReprocessavel, counts: JobCounts): DlqStatus {
    const waiting = counts.waiting || 0;
    const delayed = counts.delayed || 0;
    const failed = counts.failed || 0;

    return {
      fila,
      waiting,
      delayed,
      failed,
      total: waiting + delayed + failed,
    };
  }

  private mapearFila(fila: FilaReprocessavel): {
    main: Queue;
    dlq: Queue;
    jobNamePadrao?: string;
  } {
    if (fila === 'webhooks-in') {
      return { main: this.webhooksIn, dlq: this.webhooksInDlq, jobNamePadrao: 'process-whatsapp-webhook' };
    }

    if (fila === 'messages-out') {
      return { main: this.messagesOut, dlq: this.messagesOutDlq, jobNamePadrao: 'wa-send-text' };
    }

    // Para notifications não assumimos nome default para evitar reenfileirar errado;
    // depende de jobName vindo do payload salvo na DLQ.
    return { main: this.notifications, dlq: this.notificationsDlq, jobNamePadrao: undefined };
  }
}
