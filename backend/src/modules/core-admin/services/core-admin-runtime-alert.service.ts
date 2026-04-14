import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { NotificationsQueueProducer } from '../../../notifications/notifications.queue-producer';
import {
  CoreAdminCapabilities,
  CoreAdminCapabilitiesService,
} from './core-admin-capabilities.service';
import { CoreAdminCriticalAuditService } from './core-admin-critical-audit.service';
import { CoreAdminPolicySnapshotService } from './core-admin-policy-snapshot.service';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class CoreAdminRuntimeAlertService implements OnModuleInit {
  private readonly logger = new Logger(CoreAdminRuntimeAlertService.name);
  private readonly nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  private readonly appEnv = String(process.env.APP_ENV || '').trim().toLowerCase();
  private readonly runInTest =
    String(process.env.CORE_ADMIN_RUNTIME_ALERT_RUN_IN_TEST || '')
      .trim()
      .toLowerCase() === 'true';

  constructor(
    private readonly coreAdminCapabilitiesService: CoreAdminCapabilitiesService,
    private readonly coreAdminPolicySnapshotService: CoreAdminPolicySnapshotService,
    private readonly coreAdminCriticalAuditService: CoreAdminCriticalAuditService,
    private readonly notificationsQueueProducer: NotificationsQueueProducer,
  ) {}

  async onModuleInit(): Promise<void> {
    const isTestRuntime = this.nodeEnv === 'test' || this.appEnv === 'test';
    if (isTestRuntime && !this.runInTest) {
      return;
    }

    await this.syncRuntimePolicy();
  }

  async syncRuntimePolicy(): Promise<void> {
    try {
      const runtimeContext = this.coreAdminCapabilitiesService.getRuntimeContext();
      const snapshotResult =
        await this.coreAdminPolicySnapshotService.recordRuntimeContext(runtimeContext);
      if (runtimeContext.environment !== 'production') {
        return;
      }

      const enabledCapabilities = this.resolveEnabledCapabilities(runtimeContext.capabilities);
      if (enabledCapabilities.length === 0 || !snapshotResult.created) {
        return;
      }

      const message = `Core Admin iniciou em producao com excecoes sensiveis habilitadas: ${enabledCapabilities.join(', ')}`;
      this.logger.error(message);

      await this.coreAdminCriticalAuditService.record({
        actorUserId: SYSTEM_ACTOR_ID,
        actorRole: 'SYSTEM',
        actorEmail: null,
        httpMethod: 'SYSTEM',
        route: '/core-admin/runtime/policy-alert',
        statusCode: 200,
        outcome: 'success',
        targetType: 'core_admin_runtime_policy',
        targetId: 'bootstrap',
        afterPayload: {
          ...runtimeContext,
          snapshotId: snapshotResult.snapshot.id,
          enabledCapabilities,
        },
        requestId: `core-admin-runtime-${Date.now()}`,
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
        `Falha ao processar alertas de runtime do core-admin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private resolveEnabledCapabilities(capabilities: CoreAdminCapabilities): string[] {
    return Object.entries(capabilities)
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key);
  }

  private async notifyOperationalChannel(
    environment: string,
    releaseVersion: string | null,
    enabledCapabilities: string[],
  ): Promise<void> {
    const recipients = String(
      process.env.CORE_ADMIN_POLICY_ALERT_EMAILS || '',
    )
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      return;
    }

    const subject = `[Core Admin][${environment}] Excecoes sensiveis ativas`;
    const text = [
      'Core Admin iniciou com excecoes sensiveis habilitadas.',
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
            channel: 'core-admin-runtime-alert',
            environment,
            releaseVersion,
            enabledCapabilities,
          },
        }),
      ),
    );
  }
}
