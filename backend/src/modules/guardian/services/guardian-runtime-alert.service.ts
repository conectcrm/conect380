import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { NotificationsQueueProducer } from '../../../notifications/notifications.queue-producer';
import {
  GuardianCapabilities,
  GuardianCapabilitiesService,
} from './guardian-capabilities.service';
import { GuardianCriticalAuditService } from './guardian-critical-audit.service';
import { GuardianPolicySnapshotService } from './guardian-policy-snapshot.service';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class GuardianRuntimeAlertService implements OnModuleInit {
  private readonly logger = new Logger(GuardianRuntimeAlertService.name);

  constructor(
    private readonly guardianCapabilitiesService: GuardianCapabilitiesService,
    private readonly guardianPolicySnapshotService: GuardianPolicySnapshotService,
    private readonly guardianCriticalAuditService: GuardianCriticalAuditService,
    private readonly notificationsQueueProducer: NotificationsQueueProducer,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncRuntimePolicy();
  }

  async syncRuntimePolicy(): Promise<void> {
    try {
      const runtimeContext = this.guardianCapabilitiesService.getRuntimeContext();
      const snapshotResult =
        await this.guardianPolicySnapshotService.recordRuntimeContext(runtimeContext);
      if (runtimeContext.environment !== 'production') {
        return;
      }

      const enabledCapabilities = this.resolveEnabledCapabilities(runtimeContext.capabilities);
      if (enabledCapabilities.length === 0 || !snapshotResult.created) {
        return;
      }

      const message = `Guardian iniciou em producao com excecoes sensiveis habilitadas: ${enabledCapabilities.join(', ')}`;
      this.logger.error(message);

      await this.guardianCriticalAuditService.record({
        actorUserId: SYSTEM_ACTOR_ID,
        actorRole: 'SYSTEM',
        actorEmail: null,
        httpMethod: 'SYSTEM',
        route: '/guardian/runtime/policy-alert',
        statusCode: 200,
        outcome: 'success',
        targetType: 'guardian_runtime_policy',
        targetId: 'bootstrap',
        afterPayload: {
          ...runtimeContext,
          snapshotId: snapshotResult.snapshot.id,
          enabledCapabilities,
        },
        requestId: `guardian-runtime-${Date.now()}`,
      });

      await this.notifyOperationalChannel(
        runtimeContext.environment,
        runtimeContext.releaseVersion,
        enabledCapabilities,
      );

      if (process.env.ENABLE_SENTRY === 'true' && process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, 'warning');
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao processar alertas de runtime do guardian: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private resolveEnabledCapabilities(capabilities: GuardianCapabilities): string[] {
    return Object.entries(capabilities)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key);
  }

  private async notifyOperationalChannel(
    environment: string,
    releaseVersion: string | null,
    enabledCapabilities: string[],
  ): Promise<void> {
    const recipients = String(process.env.GUARDIAN_POLICY_ALERT_EMAILS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      return;
    }

    const subject = `[Guardian][${environment}] Excecoes sensiveis ativas`;
    const text = [
      'Guardian iniciou com excecoes sensiveis habilitadas.',
      `Ambiente: ${environment}`,
      `Release: ${releaseVersion || 'n/d'}`,
      `Capacidades: ${enabledCapabilities.join(', ')}`,
    ].join('\n');

    await Promise.all(
      recipients.map((to) =>
        this.notificationsQueueProducer.enqueueSendEmail({
          to,
          subject,
          text,
          context: {
            channel: 'guardian-runtime-alert',
            environment,
            releaseVersion,
            enabledCapabilities,
          },
        }),
      ),
    );
  }
}
