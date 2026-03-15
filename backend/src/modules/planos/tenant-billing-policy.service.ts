import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

export type TenantBillingPolicy = {
  isPlatformOwner: boolean;
  billingExempt: boolean;
  monitorOnlyLimits: boolean;
  fullModuleAccess: boolean;
  allowCheckout: boolean;
  allowPlanMutation: boolean;
  enforceLifecycleTransitions: boolean;
};

const DEFAULT_TENANT_BILLING_POLICY: TenantBillingPolicy = {
  isPlatformOwner: false,
  billingExempt: false,
  monitorOnlyLimits: false,
  fullModuleAccess: false,
  allowCheckout: true,
  allowPlanMutation: true,
  enforceLifecycleTransitions: true,
};

@Injectable()
export class TenantBillingPolicyService {
  private readonly ownerEmpresaIds: Set<string>;

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {
    this.ownerEmpresaIds = this.parseOwnerIds(process.env.PLATFORM_OWNER_EMPRESA_IDS);
  }

  async resolveForEmpresa(empresaId: string): Promise<TenantBillingPolicy> {
    if (!empresaId) {
      return DEFAULT_TENANT_BILLING_POLICY;
    }

    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
      select: ['id', 'configuracoes'],
    });

    const configuracoes = this.normalizeConfigMap(empresa?.configuracoes);
    const ownerFromEnv = this.ownerEmpresaIds.has(empresaId);
    const ownerFromConfig = this.resolveOwnerFlag(configuracoes);
    const isPlatformOwner = ownerFromEnv || ownerFromConfig;

    if (isPlatformOwner) {
      return {
        isPlatformOwner: true,
        billingExempt: true,
        monitorOnlyLimits: true,
        fullModuleAccess: true,
        allowCheckout: false,
        allowPlanMutation: false,
        enforceLifecycleTransitions: false,
      };
    }

    const billingExempt =
      this.readBoolean(configuracoes, ['billingExempt', 'billing.exempt']) ?? false;
    const monitorOnlyLimits =
      this.readBoolean(configuracoes, ['billingMonitorOnly', 'billing.monitorOnly']) ??
      billingExempt;
    const fullModuleAccess =
      this.readBoolean(configuracoes, ['fullModuleAccess', 'billing.fullModuleAccess']) ?? false;
    const allowCheckout =
      this.readBoolean(configuracoes, ['allowCheckout', 'billing.allowCheckout']) ??
      !billingExempt;
    const allowPlanMutation =
      this.readBoolean(configuracoes, ['allowPlanMutation', 'billing.allowPlanMutation']) ??
      !billingExempt;
    const enforceLifecycleTransitions =
      this.readBoolean(configuracoes, [
        'enforceLifecycleTransitions',
        'billing.enforceLifecycleTransitions',
      ]) ?? !billingExempt;

    return {
      isPlatformOwner: false,
      billingExempt,
      monitorOnlyLimits,
      fullModuleAccess,
      allowCheckout,
      allowPlanMutation,
      enforceLifecycleTransitions,
    };
  }

  private parseOwnerIds(raw?: string): Set<string> {
    if (!raw || typeof raw !== 'string') {
      return new Set();
    }

    const ids = raw
      .split(/[;,]/g)
      .map((item) => item.trim())
      .filter(Boolean);

    return new Set(ids);
  }

  private normalizeConfigMap(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object') {
      return {};
    }

    return input as Record<string, unknown>;
  }

  private resolveOwnerFlag(config: Record<string, unknown>): boolean {
    const explicitFlag = this.readBoolean(config, [
      'isPlatformOwner',
      'platformOwner',
      'ownerTenant',
      'billing.owner',
      'billing.isPlatformOwner',
    ]);

    if (explicitFlag !== null) {
      return explicitFlag;
    }

    const tenantType = this.readString(config, ['tenantType', 'tipo', 'billing.tenantType']);
    if (tenantType && tenantType.toUpperCase() === 'OWNER') {
      return true;
    }

    return false;
  }

  private readString(config: Record<string, unknown>, paths: string[]): string | null {
    for (const path of paths) {
      const value = this.readPath(config, path);
      if (typeof value === 'string') {
        const normalized = value.trim();
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }

  private readBoolean(config: Record<string, unknown>, paths: string[]): boolean | null {
    for (const path of paths) {
      const value = this.readPath(config, path);
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on'].includes(normalized)) {
          return true;
        }
        if (['0', 'false', 'no', 'off'].includes(normalized)) {
          return false;
        }
      }

      if (typeof value === 'number') {
        if (value === 1) {
          return true;
        }
        if (value === 0) {
          return false;
        }
      }
    }

    return null;
  }

  private readPath(config: Record<string, unknown>, path: string): unknown {
    const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean);
    if (segments.length === 0) {
      return undefined;
    }

    let cursor: unknown = config;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== 'object') {
        return undefined;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }

    return cursor;
  }
}

