import * as Sentry from '@sentry/node';
import { GuardianRuntimeAlertService } from './guardian-runtime-alert.service';

jest.mock('@sentry/node', () => ({
  captureMessage: jest.fn(),
}));

describe('GuardianRuntimeAlertService', () => {
  const sentryCaptureMessage = jest.mocked(Sentry.captureMessage);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENABLE_SENTRY;
    delete process.env.SENTRY_DSN;
    delete process.env.GUARDIAN_POLICY_ALERT_EMAILS;
  });

  it('ignora ambientes fora de producao', async () => {
    const guardianCapabilitiesService = {
      getRuntimeContext: jest.fn(() => ({
        environment: 'development',
        policySource: 'environment',
        releaseVersion: 'dev-local',
        adminMfaRequired: false,
        legacyTransitionMode: 'guardian_only',
        capabilities: {
          allowBreakGlassRequestCreation: false,
          allowManualBillingDueDateCycle: false,
          allowPlanDeletion: false,
          allowDirectAccessRecertification: false,
          allowCompanyModuleManagement: false,
        },
      })),
    };
    const guardianPolicySnapshotService = {
      recordRuntimeContext: jest.fn(async () => ({
        created: true,
        snapshot: { id: 1 },
        previousSnapshot: null,
      })),
    };
    const guardianCriticalAuditService = {
      record: jest.fn(),
    };
    const notificationsQueueProducer = {
      enqueueSendEmail: jest.fn(),
    };
    const service = new GuardianRuntimeAlertService(
      guardianCapabilitiesService as never,
      guardianPolicySnapshotService as never,
      guardianCriticalAuditService as never,
      notificationsQueueProducer as never,
    );

    await service.onModuleInit();

    expect(guardianPolicySnapshotService.recordRuntimeContext).toHaveBeenCalledTimes(1);
    expect(guardianCriticalAuditService.record).not.toHaveBeenCalled();
    expect(notificationsQueueProducer.enqueueSendEmail).not.toHaveBeenCalled();
    expect(sentryCaptureMessage).not.toHaveBeenCalled();
  });

  it('registra auditoria e alerta quando uma capacidade sensivel esta ativa em producao', async () => {
    process.env.ENABLE_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://dsn.example';
    process.env.GUARDIAN_POLICY_ALERT_EMAILS = 'ops@conect360.com.br';

    const guardianCapabilitiesService = {
      getRuntimeContext: jest.fn(() => ({
        environment: 'production',
        policySource: 'environment',
        releaseVersion: '2026.03.09',
        adminMfaRequired: true,
        legacyTransitionMode: 'guardian_only',
        capabilities: {
          allowBreakGlassRequestCreation: false,
          allowManualBillingDueDateCycle: false,
          allowPlanDeletion: false,
          allowDirectAccessRecertification: false,
          allowCompanyModuleManagement: true,
        },
      })),
    };
    const guardianPolicySnapshotService = {
      recordRuntimeContext: jest.fn(async () => ({
        created: true,
        snapshot: { id: 7 },
        previousSnapshot: { id: 6 },
      })),
    };
    const guardianCriticalAuditService = {
      record: jest.fn(),
    };
    const notificationsQueueProducer = {
      enqueueSendEmail: jest.fn(async () => undefined),
    };
    const service = new GuardianRuntimeAlertService(
      guardianCapabilitiesService as never,
      guardianPolicySnapshotService as never,
      guardianCriticalAuditService as never,
      notificationsQueueProducer as never,
    );

    await service.onModuleInit();

    expect(guardianCriticalAuditService.record).toHaveBeenCalledTimes(1);
    expect(guardianCriticalAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: 'SYSTEM',
        route: '/guardian/runtime/policy-alert',
        targetType: 'guardian_runtime_policy',
        targetId: 'bootstrap',
        outcome: 'success',
        afterPayload: expect.objectContaining({
          environment: 'production',
          policySource: 'environment',
          snapshotId: 7,
          enabledCapabilities: ['allowCompanyModuleManagement'],
        }),
      }),
    );
    expect(notificationsQueueProducer.enqueueSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ops@conect360.com.br',
        subject: '[Guardian][production] Excecoes sensiveis ativas',
        text: expect.stringContaining('allowCompanyModuleManagement'),
      }),
    );
    expect(sentryCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining('allowCompanyModuleManagement'),
      'warning',
    );
  });

  it('nao reenvia alerta quando o snapshot atual nao mudou', async () => {
    process.env.GUARDIAN_POLICY_ALERT_EMAILS = 'ops@conect360.com.br';

    const guardianCapabilitiesService = {
      getRuntimeContext: jest.fn(() => ({
        environment: 'production',
        policySource: 'environment',
        releaseVersion: '2026.03.09',
        adminMfaRequired: true,
        legacyTransitionMode: 'guardian_only',
        capabilities: {
          allowBreakGlassRequestCreation: false,
          allowManualBillingDueDateCycle: false,
          allowPlanDeletion: false,
          allowDirectAccessRecertification: false,
          allowCompanyModuleManagement: true,
        },
      })),
    };
    const guardianPolicySnapshotService = {
      recordRuntimeContext: jest.fn(async () => ({
        created: false,
        snapshot: { id: 7 },
        previousSnapshot: { id: 7 },
      })),
    };
    const guardianCriticalAuditService = {
      record: jest.fn(),
    };
    const notificationsQueueProducer = {
      enqueueSendEmail: jest.fn(async () => undefined),
    };
    const service = new GuardianRuntimeAlertService(
      guardianCapabilitiesService as never,
      guardianPolicySnapshotService as never,
      guardianCriticalAuditService as never,
      notificationsQueueProducer as never,
    );

    await service.onModuleInit();

    expect(guardianCriticalAuditService.record).not.toHaveBeenCalled();
    expect(notificationsQueueProducer.enqueueSendEmail).not.toHaveBeenCalled();
    expect(sentryCaptureMessage).not.toHaveBeenCalled();
  });
});
