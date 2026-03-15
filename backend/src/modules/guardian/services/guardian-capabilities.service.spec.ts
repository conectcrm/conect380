import { ConfigService } from '@nestjs/config';
import { GuardianCapabilitiesService } from './guardian-capabilities.service';

describe('GuardianCapabilitiesService', () => {
  it('retorna capacidades desabilitadas por padrao', () => {
    const configService = {
      get: jest.fn(() => undefined),
    };
    const service = new GuardianCapabilitiesService(configService as unknown as ConfigService);

    expect(service.getCapabilities()).toEqual({
      allowBreakGlassRequestCreation: false,
      allowManualBillingDueDateCycle: false,
      allowPlanDeletion: false,
      allowDirectAccessRecertification: false,
      allowCompanyModuleManagement: false,
    });
  });

  it('interpreta flags habilitadas em formatos textuais e numericos', () => {
    const flags: Record<string, string | number> = {
      GUARDIAN_ALLOW_BREAK_GLASS_REQUEST_CREATION: 'true',
      GUARDIAN_ALLOW_MANUAL_BILLING_DUE_DATE_CYCLE: '1',
      GUARDIAN_ALLOW_PLAN_DELETION: 'yes',
      GUARDIAN_ALLOW_DIRECT_ACCESS_RECERTIFICATION: 'on',
      GUARDIAN_ALLOW_COMPANY_MODULE_MANAGEMENT: 1,
    };
    const configService = {
      get: jest.fn((key: string) => flags[key]),
    };
    const service = new GuardianCapabilitiesService(configService as unknown as ConfigService);

    expect(service.getCapabilities()).toEqual({
      allowBreakGlassRequestCreation: true,
      allowManualBillingDueDateCycle: true,
      allowPlanDeletion: true,
      allowDirectAccessRecertification: true,
      allowCompanyModuleManagement: true,
    });
  });

  it('expoe contexto runtime para a governanca somente leitura', () => {
    const flags: Record<string, string> = {
      NODE_ENV: 'production',
      APP_RELEASE_VERSION: '2026.03.09-guardian',
      AUTH_ADMIN_MFA_REQUIRED: 'true',
      GUARDIAN_LEGACY_TRANSITION_MODE: 'guardian_only',
      GUARDIAN_ALLOW_BREAK_GLASS_REQUEST_CREATION: 'false',
      GUARDIAN_ALLOW_MANUAL_BILLING_DUE_DATE_CYCLE: 'false',
      GUARDIAN_ALLOW_PLAN_DELETION: 'false',
      GUARDIAN_ALLOW_DIRECT_ACCESS_RECERTIFICATION: 'false',
      GUARDIAN_ALLOW_COMPANY_MODULE_MANAGEMENT: 'true',
    };
    const configService = {
      get: jest.fn((key: string) => flags[key]),
    };
    const service = new GuardianCapabilitiesService(configService as unknown as ConfigService);

    expect(service.getRuntimeContext()).toEqual({
      environment: 'production',
      policySource: 'environment',
      releaseVersion: '2026.03.09-guardian',
      adminMfaRequired: true,
      legacyTransitionMode: 'guardian_only',
      capabilities: {
        allowBreakGlassRequestCreation: false,
        allowManualBillingDueDateCycle: false,
        allowPlanDeletion: false,
        allowDirectAccessRecertification: false,
        allowCompanyModuleManagement: true,
      },
    });
  });
});
