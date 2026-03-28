import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CoreAdminCapabilities = {
  allowBreakGlassRequestCreation: boolean;
  allowManualBillingDueDateCycle: boolean;
  allowPlanDeletion: boolean;
  allowDirectAccessRecertification: boolean;
  allowCompanyModuleManagement: boolean;
};

export type CoreAdminRuntimeContext = {
  environment: string;
  policySource: 'environment';
  releaseVersion: string | null;
  adminMfaRequired: boolean;
  legacyTransitionMode: string;
  capabilities: CoreAdminCapabilities;
};

@Injectable()
export class CoreAdminCapabilitiesService {
  constructor(private readonly configService: ConfigService) {}

  getCapabilities(): CoreAdminCapabilities {
    return {
      allowBreakGlassRequestCreation: this.readBooleanFlag(
        'GUARDIAN_ALLOW_BREAK_GLASS_REQUEST_CREATION',
      ),
      allowManualBillingDueDateCycle: this.readBooleanFlag(
        'GUARDIAN_ALLOW_MANUAL_BILLING_DUE_DATE_CYCLE',
      ),
      allowPlanDeletion: this.readBooleanFlag('GUARDIAN_ALLOW_PLAN_DELETION'),
      allowDirectAccessRecertification: this.readBooleanFlag(
        'GUARDIAN_ALLOW_DIRECT_ACCESS_RECERTIFICATION',
      ),
      allowCompanyModuleManagement: this.readBooleanFlag(
        'GUARDIAN_ALLOW_COMPANY_MODULE_MANAGEMENT',
      ),
    };
  }

  getRuntimeContext(): CoreAdminRuntimeContext {
    return {
      environment: this.readStringValue('NODE_ENV', 'development'),
      policySource: 'environment',
      releaseVersion: this.readOptionalStringValue('APP_RELEASE_VERSION'),
      adminMfaRequired: this.readBooleanFlag('AUTH_ADMIN_MFA_REQUIRED'),
      legacyTransitionMode: this.readLegacyTransitionModeValue('guardian_only'),
      capabilities: this.getCapabilities(),
    };
  }

  assertBreakGlassRequestCreationAllowed(): void {
    if (this.getCapabilities().allowBreakGlassRequestCreation) {
      return;
    }

    throw new ForbiddenException(
      'Solicitacao de break-glass no core-admin esta desabilitada. Use o fluxo operacional previsto.',
    );
  }

  assertManualBillingDueDateCycleAllowed(): void {
    if (this.getCapabilities().allowManualBillingDueDateCycle) {
      return;
    }

    throw new ForbiddenException(
      'Execucao manual do ciclo de vencimento esta desabilitada no core-admin.',
    );
  }

  assertPlanDeletionAllowed(): void {
    if (this.getCapabilities().allowPlanDeletion) {
      return;
    }

    throw new ForbiddenException(
      'Exclusao fisica de plano esta desabilitada no core-admin. Arquive ou versione o catalogo.',
    );
  }

  assertDirectAccessRecertificationAllowed(): void {
    if (this.getCapabilities().allowDirectAccessRecertification) {
      return;
    }

    throw new ForbiddenException(
      'Recertificacao direta fora da fila formal esta desabilitada no core-admin.',
    );
  }

  assertCompanyModuleManagementAllowed(): void {
    if (this.getCapabilities().allowCompanyModuleManagement) {
      return;
    }

    throw new ForbiddenException(
      'Gestao de modulos por empresa esta desabilitada ate a publicacao oficial do catalogo core-admin.',
    );
  }

  private readBooleanFlag(key: string, fallback = false): boolean {
    const rawValue = this.configService.get<string | boolean | number | undefined>(key);

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'number') {
      return rawValue !== 0;
    }

    if (typeof rawValue !== 'string') {
      return fallback;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }

    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
      return true;
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
      return false;
    }

    return fallback;
  }

  private readStringValue(key: string, fallback: string): string {
    const rawValue = this.configService.get<string | undefined>(key);
    if (typeof rawValue !== 'string') {
      return fallback;
    }

    const normalized = rawValue.trim();
    return normalized || fallback;
  }

  private readOptionalStringValue(key: string): string | null {
    const rawValue = this.configService.get<string | undefined>(key);
    if (typeof rawValue !== 'string') {
      return null;
    }

    const normalized = rawValue.trim();
    return normalized || null;
  }

  private readLegacyTransitionModeValue(fallback: string): string {
    const canonical = this.readOptionalStringValue('CORE_ADMIN_LEGACY_TRANSITION_MODE');
    if (canonical) {
      return canonical;
    }

    const legacy = this.readOptionalStringValue('GUARDIAN_LEGACY_TRANSITION_MODE');
    if (legacy) {
      return legacy;
    }

    return fallback;
  }
}
