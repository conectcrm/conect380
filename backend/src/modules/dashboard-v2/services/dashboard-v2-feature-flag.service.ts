import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { FeatureFlagTenant } from '../entities/feature-flag-tenant.entity';

export type DashboardV2FlagDecision = {
  enabled: boolean;
  source: 'disabled' | 'enabled' | 'rollout';
  rolloutPercentage: number;
};

@Injectable()
export class DashboardV2FeatureFlagService {
  private readonly logger = new Logger(DashboardV2FeatureFlagService.name);
  private readonly flagKey = 'dashboard_v2_enabled';

  constructor(
    @InjectRepository(FeatureFlagTenant)
    private readonly featureFlagRepository: Repository<FeatureFlagTenant>,
  ) {}

  async resolve(empresaId: string): Promise<DashboardV2FlagDecision> {
    const flag = await this.featureFlagRepository.findOne({
      where: {
        empresa_id: empresaId,
        flag_key: this.flagKey,
      },
    });

    if (!flag) {
      return { enabled: false, source: 'disabled', rolloutPercentage: 0 };
    }

    if (flag.enabled) {
      return { enabled: true, source: 'enabled', rolloutPercentage: flag.rollout_percentage || 0 };
    }

    const rolloutPercentage = Math.max(0, Math.min(100, Number(flag.rollout_percentage || 0)));
    if (rolloutPercentage <= 0) {
      return { enabled: false, source: 'disabled', rolloutPercentage };
    }

    const bucket = this.getTenantBucket(empresaId);
    const enabled = bucket < rolloutPercentage;
    return {
      enabled,
      source: enabled ? 'rollout' : 'disabled',
      rolloutPercentage,
    };
  }

  async setFlag(input: {
    empresaId: string;
    enabled: boolean;
    rolloutPercentage?: number;
    updatedBy?: string | null;
  }): Promise<void> {
    const rolloutPercentage = Math.max(0, Math.min(100, Number(input.rolloutPercentage || 0)));

    await this.featureFlagRepository
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagTenant)
      .values({
        empresa_id: input.empresaId,
        flag_key: this.flagKey,
        enabled: input.enabled,
        rollout_percentage: rolloutPercentage,
        updated_by: input.updatedBy || null,
        updated_at: new Date(),
      })
      .orUpdate(
        ['enabled', 'rollout_percentage', 'updated_by', 'updated_at'],
        ['empresa_id', 'flag_key'],
      )
      .execute();

    this.logger.log(
      `Feature flag ${this.flagKey} atualizada (empresa=${input.empresaId}, enabled=${input.enabled}, rollout=${rolloutPercentage})`,
    );
  }

  private getTenantBucket(empresaId: string): number {
    const digest = createHash('md5').update(empresaId).digest('hex');
    const intValue = Number.parseInt(digest.slice(0, 8), 16);
    return intValue % 100;
  }
}
