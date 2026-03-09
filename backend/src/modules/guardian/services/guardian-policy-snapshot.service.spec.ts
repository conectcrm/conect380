import { createHash } from 'crypto';
import { GuardianPolicySnapshotService } from './guardian-policy-snapshot.service';

describe('GuardianPolicySnapshotService', () => {
  const runtimeContext = {
    environment: 'production',
    policySource: 'environment' as const,
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
  };

  const createExpectedFingerprint = () =>
    createHash('sha256')
      .update(
        JSON.stringify({
          environment: runtimeContext.environment,
          policySource: runtimeContext.policySource,
          adminMfaRequired: runtimeContext.adminMfaRequired,
          legacyTransitionMode: runtimeContext.legacyTransitionMode,
          capabilities: runtimeContext.capabilities,
        }),
      )
      .digest('hex');

  it('cria snapshot quando nao existe historico anterior', async () => {
    const repository = {
      find: jest.fn(async () => []),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({ id: 1, ...input })),
    };
    const service = new GuardianPolicySnapshotService(repository as never);

    const result = await service.recordRuntimeContext(runtimeContext);

    expect(result.created).toBe(true);
    expect(result.snapshot).toEqual(
      expect.objectContaining({
        id: 1,
        releaseVersion: '2026.03.09',
        enabledCapabilities: ['allowCompanyModuleManagement'],
      }),
    );
  });

  it('reaproveita snapshot quando politica e release nao mudaram', async () => {
    const existingSnapshot = {
      id: 5,
      releaseVersion: '2026.03.09',
      policyFingerprint: createExpectedFingerprint(),
    };
    const repository = {
      find: jest.fn(async () => [existingSnapshot]),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new GuardianPolicySnapshotService(repository as never);

    const result = await service.recordRuntimeContext(runtimeContext);

    expect(result.created).toBe(false);
    expect(result.snapshot).toBe(existingSnapshot);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('gera novo snapshot quando a release muda mesmo com mesma politica', async () => {
    const repository = {
      find: jest.fn(async () => [{
        id: 5,
        releaseVersion: '2026.03.08',
        policyFingerprint: createExpectedFingerprint(),
      }]),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({ id: 6, ...input })),
    };
    const service = new GuardianPolicySnapshotService(repository as never);

    const result = await service.recordRuntimeContext(runtimeContext);

    expect(result.created).toBe(true);
    expect(result.previousSnapshot).toEqual(expect.objectContaining({ id: 5 }));
    expect(result.snapshot).toEqual(expect.objectContaining({ id: 6 }));
  });

  it('nao mascara erro de persistencia como snapshot criado', async () => {
    const repository = {
      find: jest.fn(async () => {
        throw new Error('db down');
      }),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new GuardianPolicySnapshotService(repository as never);

    const result = await service.recordRuntimeContext(runtimeContext);

    expect(result.created).toBe(false);
    expect(result.snapshot).toEqual(
      expect.objectContaining({
        id: 0,
        policySource: 'environment',
      }),
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
