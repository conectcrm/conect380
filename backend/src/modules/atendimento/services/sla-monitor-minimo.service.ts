import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  Ticket,
  StatusTicket,
  PrioridadeTicket,
  SeveridadeTicket,
  NivelAtendimentoTicket,
} from '../entities/ticket.entity';
import { NotificationChannelsService } from '../../../notifications/notification-channels.service';
import { notifyByPolicy } from '../../../notifications/channel-notifier';
import { ChannelPolicyKey } from '../../../notifications/channel-policy';

/**
 * Monitor mínimo de SLA baseado em campos do ticket (priority/severity/assignedLevel/slaTargetMinutes/slaExpiresAt).
 * Evita dependência de @nestjs/schedule usando setInterval controlado por envs.
 */
@Injectable()
export class SlaMonitorMinimoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlaMonitorMinimoService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private readonly policy: ChannelPolicyKey = 'sla-alert';
  private readonly enabled = process.env.SLA_MONITOR_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';
  private readonly intervalMs = Number(process.env.SLA_MONITOR_INTERVAL_MS ?? 60_000); // 1 min padrão
  private readonly batchSize = Number(process.env.SLA_MONITOR_BATCH ?? 500);
  private readonly warningThreshold = Number(process.env.SLA_WARNING_THRESHOLD ?? 0.7);
  private readonly cooldownMs = Number(process.env.SLA_ALERT_COOLDOWN_MS ?? 10 * 60_000); // 10 min
  private readonly eventCache = new Map<string, number>(); // key = ticketId|event

  private readonly adminPhone = this.normalizePhone(process.env.NOTIFICATIONS_ADMIN_PHONE);
  private readonly adminUserId = process.env.NOTIFICATIONS_ADMIN_USER_ID;

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly channels: NotificationChannelsService,
  ) { }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('⏸️ SLA monitor desabilitado (SLA_MONITOR_ENABLED=false ou ambiente de teste)');
      return;
    }
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  private start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.executarCiclo().catch((err) => {
      this.logger.error('❌ Erro no ciclo do SLA monitor:', err?.stack || err?.message || err);
    }), this.intervalMs);

    // Rodar uma vez imediatamente para não esperar o primeiro intervalo
    this.executarCiclo().catch((err) => {
      this.logger.error('❌ Erro no ciclo inicial do SLA monitor:', err?.stack || err?.message || err);
    });

    this.logger.log(`🚀 SLA monitor iniciado (intervalo=${this.intervalMs}ms, batch=${this.batchSize})`);
  }

  private stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('⏸️ SLA monitor parado');
    }
  }

  private async executarCiclo() {
    this.cleanupCache();
    const tickets = await this.ticketRepository.find({
      where: {
        status: Not(In([StatusTicket.ENCERRADO])),
      },
      take: this.batchSize,
      order: { updatedAt: 'DESC' },
    });

    if (!tickets.length) return;

    const agora = Date.now();

    for (const ticket of tickets) {
      const calculo = this.calcularDeadline(ticket);
      if (!calculo) continue;

      const { deadline, totalMinutes } = calculo;
      const remainingMs = deadline.getTime() - agora;
      const totalMs = totalMinutes * 60_000;
      if (totalMs <= 0) continue;

      const percentualConsumido = 1 - remainingMs / totalMs;
      const event = remainingMs <= 0 ? 'SLA_BREACH' : percentualConsumido >= this.warningThreshold ? 'SLA_WARNING' : null;

      if (!event) continue;
      if (this.isSuppressed(ticket.id, event)) continue;

      try {
        await this.notificar(ticket, event, remainingMs);
        this.registerEvent(ticket.id, event);
      } catch (notifyErr) {
        this.logger.error(
          `⚠️ Falha ao notificar SLA para ticket=${ticket.id} event=${event}:`,
          notifyErr?.stack || notifyErr?.message || notifyErr,
        );
      }
    }
  }

  private calcularDeadline(ticket: Ticket): { deadline: Date; totalMinutes: number } | null {
    const createdAt = ticket.createdAt || ticket.data_abertura || ticket.updatedAt;
    if (!createdAt) return null;

    // Se o ticket já tem uma expiração explícita, respeitar
    if (ticket.slaExpiresAt) {
      const deadline = new Date(ticket.slaExpiresAt);
      const totalMinutes = Math.max(1, (deadline.getTime() - createdAt.getTime()) / 60_000);
      return { deadline, totalMinutes };
    }

    // Se veio slaTargetMinutes, usar direto
    if (ticket.slaTargetMinutes && ticket.slaTargetMinutes > 0) {
      const deadline = new Date(createdAt.getTime() + ticket.slaTargetMinutes * 60_000);
      return { deadline, totalMinutes: ticket.slaTargetMinutes };
    }

    const prioridade = (ticket.prioridade || PrioridadeTicket.MEDIA).toString().toUpperCase();
    const severidade = (ticket.severity || SeveridadeTicket.MEDIA).toString().toUpperCase();

    const basePorPrioridade: Record<string, number> = {
      URGENTE: 30,
      ALTA: 120,
      MEDIA: 480,
      BAIXA: 960,
    };

    const multiplicadorSeveridade: Record<string, number> = {
      CRITICA: 0.5,
      ALTA: 0.75,
      MEDIA: 1,
      BAIXA: 1.25,
    };

    const base = basePorPrioridade[prioridade] ?? basePorPrioridade.MEDIA;
    const fator = multiplicadorSeveridade[severidade] ?? 1;
    const totalMinutes = Math.max(1, Math.round(base * fator));
    const deadline = new Date(createdAt.getTime() + totalMinutes * 60_000);
    return { deadline, totalMinutes };
  }

  private isSuppressed(ticketId: string, event: 'SLA_WARNING' | 'SLA_BREACH') {
    // Se já houve breach, não emitir warning
    const breachKey = this.cacheKey(ticketId, 'SLA_BREACH');
    if (event === 'SLA_WARNING' && this.eventCache.has(breachKey)) return true;

    const key = this.cacheKey(ticketId, event);
    const last = this.eventCache.get(key);
    if (!last) return false;
    return Date.now() - last < this.cooldownMs;
  }

  private registerEvent(ticketId: string, event: 'SLA_WARNING' | 'SLA_BREACH') {
    this.eventCache.set(this.cacheKey(ticketId, event), Date.now());
  }

  private cleanupCache() {
    const now = Date.now();
    const maxAge = this.cooldownMs * 3; // manter histórico curto
    for (const [key, ts] of this.eventCache.entries()) {
      if (now - ts > maxAge) {
        this.eventCache.delete(key);
      }
    }
  }

  private cacheKey(ticketId: string, event: string) {
    return `${ticketId}|${event}`;
  }

  private async notificar(ticket: Ticket, event: 'SLA_WARNING' | 'SLA_BREACH', remainingMs: number) {
    const remainingMinutes = Math.max(0, Math.round(remainingMs / 60_000));
    const deadline = new Date(Date.now() + remainingMs);

    const message = event === 'SLA_BREACH'
      ? `🚨 SLA VIOLADO no ticket ${ticket.id} (${ticket.prioridade}/${ticket.severity}/${ticket.assignedLevel}). Deadline ultrapassado. Empresa=${ticket.empresaId}`
      : `⚠️ SLA em risco no ticket ${ticket.id} (${ticket.prioridade}/${ticket.severity}/${ticket.assignedLevel}). Restam ~${remainingMinutes} min até ${deadline.toISOString()}. Empresa=${ticket.empresaId}`;

    await notifyByPolicy({
      policyKey: this.policy,
      channels: this.channels,
      logger: this.logger,
      targets: {
        phone: this.adminPhone,
        userId: this.adminUserId,
      },
      message,
      context: {
        source: 'sla-monitor-minimo',
        event,
        ticketId: ticket.id,
        empresaId: ticket.empresaId,
        priority: ticket.prioridade,
        severity: ticket.severity,
        level: ticket.assignedLevel,
        remainingMinutes,
      },
    });
  }

  private normalizePhone(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return undefined;
    return raw.trim();
  }
}
