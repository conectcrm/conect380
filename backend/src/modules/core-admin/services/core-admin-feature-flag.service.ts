import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagTenant } from '../../dashboard-v2/entities/feature-flag-tenant.entity';

export type CoreAdminTenantFlagInput = {
  flagKey: string;
  enabled: boolean;
  rolloutPercentage?: number;
  updatedBy?: string | null;
};

const DEFAULT_FEATURE_FLAG_CATALOG = [
  'dashboard_v2_enabled',
  'crm.reports',
  'financeiro.gateway',
  'agenda.notifications',
  'atendimento.omnichannel',
  'compras.cotacoes',
];

@Injectable()
export class CoreAdminFeatureFlagService {
  constructor(
    @InjectRepository(FeatureFlagTenant)
    private readonly featureFlagRepository: Repository<FeatureFlagTenant>,
  ) {}

  async listCatalog(): Promise<string[]> {
    const envCatalog = String(process.env.CORE_ADMIN_FEATURE_FLAG_CATALOG || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const rows = await this.featureFlagRepository
      .createQueryBuilder('flag')
      .select('DISTINCT flag.flag_key', 'flag_key')
      .orderBy('flag.flag_key', 'ASC')
      .getRawMany<{ flag_key: string }>();

    const dbCatalog = rows
      .map((row) => String(row.flag_key || '').trim())
      .filter(Boolean);

    return Array.from(new Set([...DEFAULT_FEATURE_FLAG_CATALOG, ...envCatalog, ...dbCatalog])).sort(
      (a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }

  async listByEmpresa(empresaId: string): Promise<FeatureFlagTenant[]> {
    const normalizedEmpresaId = String(empresaId || '').trim();
    if (!normalizedEmpresaId) {
      throw new BadRequestException('empresaId obrigatorio');
    }

    return this.featureFlagRepository.find({
      where: { empresa_id: normalizedEmpresaId },
      order: { flag_key: 'ASC' },
    });
  }

  async upsertMany(empresaId: string, inputs: CoreAdminTenantFlagInput[]): Promise<FeatureFlagTenant[]> {
    const normalizedEmpresaId = String(empresaId || '').trim();
    if (!normalizedEmpresaId) {
      throw new BadRequestException('empresaId obrigatorio');
    }

    const normalizedInputs = (inputs || [])
      .map((input) => this.normalizeInput(input))
      .filter((input) => Boolean(input.flagKey));

    if (normalizedInputs.length === 0) {
      throw new BadRequestException('Informe ao menos uma feature flag valida');
    }

    for (const input of normalizedInputs) {
      await this.featureFlagRepository
        .createQueryBuilder()
        .insert()
        .into(FeatureFlagTenant)
        .values({
          empresa_id: normalizedEmpresaId,
          flag_key: input.flagKey,
          enabled: input.enabled,
          rollout_percentage: input.rolloutPercentage,
          updated_by: input.updatedBy || null,
        })
        .onConflict(
          `("empresa_id","flag_key") DO UPDATE SET enabled = EXCLUDED.enabled, rollout_percentage = EXCLUDED.rollout_percentage, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        )
        .execute();
    }

    return this.listByEmpresa(normalizedEmpresaId);
  }

  private normalizeInput(input: CoreAdminTenantFlagInput): Required<CoreAdminTenantFlagInput> {
    const flagKey = String(input?.flagKey || '').trim();
    if (!flagKey) {
      throw new BadRequestException('flagKey obrigatorio');
    }

    const rolloutRaw =
      typeof input?.rolloutPercentage === 'number' ? input.rolloutPercentage : 0;
    const rolloutPercentage = Math.max(0, Math.min(100, Math.trunc(rolloutRaw)));

    return {
      flagKey,
      enabled: input?.enabled === true,
      rolloutPercentage,
      updatedBy: input?.updatedBy || null,
    };
  }
}
