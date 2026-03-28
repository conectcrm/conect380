import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CoreAdminCapabilities,
  CoreAdminRuntimeContext,
} from './core-admin-capabilities.service';
import { CoreAdminPolicySnapshot } from '../entities/core-admin-policy-snapshot.entity';

export type CoreAdminPolicySnapshotRecordResult = {
  created: boolean;
  snapshot: CoreAdminPolicySnapshot;
  previousSnapshot: CoreAdminPolicySnapshot | null;
};

@Injectable()
export class CoreAdminPolicySnapshotService {
  private readonly logger = new Logger(CoreAdminPolicySnapshotService.name);

  constructor(
    @InjectRepository(CoreAdminPolicySnapshot)
    private readonly coreAdminPolicySnapshotRepository: Repository<CoreAdminPolicySnapshot>,
  ) {}

  async recordRuntimeContext(
    runtimeContext: CoreAdminRuntimeContext,
  ): Promise<CoreAdminPolicySnapshotRecordResult> {
    const draftSnapshot = this.buildSnapshotDraft(runtimeContext);

    try {
      const [latestSnapshot] = await this.coreAdminPolicySnapshotRepository.find({
        order: { createdAt: 'DESC', id: 'DESC' },
        take: 1,
      });

      if (
        latestSnapshot &&
        latestSnapshot.policyFingerprint === draftSnapshot.policyFingerprint &&
        this.normalizeReleaseVersion(latestSnapshot.releaseVersion) === draftSnapshot.releaseVersion
      ) {
        return {
          created: false,
          snapshot: latestSnapshot,
          previousSnapshot: latestSnapshot,
        };
      }

      const snapshot = this.coreAdminPolicySnapshotRepository.create(draftSnapshot);
      const savedSnapshot = await this.coreAdminPolicySnapshotRepository.save(snapshot);
      return {
        created: true,
        snapshot: savedSnapshot,
        previousSnapshot: latestSnapshot,
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar snapshot da politica core-admin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return {
        created: false,
        snapshot: {
          id: 0,
          createdAt: new Date(),
          ...draftSnapshot,
        } as CoreAdminPolicySnapshot,
        previousSnapshot: null,
      };
    }
  }

  async list(limit = 20): Promise<CoreAdminPolicySnapshot[]> {
    const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(limit || 20)));
    try {
      return this.coreAdminPolicySnapshotRepository.find({
        order: { createdAt: 'DESC', id: 'DESC' },
        take: normalizedLimit,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao listar snapshots da politica core-admin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  private buildSnapshotDraft(runtimeContext: CoreAdminRuntimeContext) {
    return {
      environment: runtimeContext.environment,
      policySource: runtimeContext.policySource,
      releaseVersion: this.normalizeReleaseVersion(runtimeContext.releaseVersion),
      adminMfaRequired: runtimeContext.adminMfaRequired,
      legacyTransitionMode: runtimeContext.legacyTransitionMode,
      policyFingerprint: this.createPolicyFingerprint(runtimeContext),
      capabilities: runtimeContext.capabilities,
      enabledCapabilities: this.resolveEnabledCapabilities(runtimeContext.capabilities),
    };
  }

  private createPolicyFingerprint(runtimeContext: CoreAdminRuntimeContext): string {
    const payload = JSON.stringify({
      environment: runtimeContext.environment,
      policySource: runtimeContext.policySource,
      adminMfaRequired: runtimeContext.adminMfaRequired,
      legacyTransitionMode: runtimeContext.legacyTransitionMode,
      capabilities: this.normalizeCapabilities(runtimeContext.capabilities),
    });

    return createHash('sha256').update(payload).digest('hex');
  }

  private resolveEnabledCapabilities(capabilities: CoreAdminCapabilities): string[] {
    return Object.entries(this.normalizeCapabilities(capabilities))
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key);
  }

  private normalizeCapabilities(capabilities: CoreAdminCapabilities): CoreAdminCapabilities {
    return {
      allowBreakGlassRequestCreation: capabilities.allowBreakGlassRequestCreation === true,
      allowManualBillingDueDateCycle: capabilities.allowManualBillingDueDateCycle === true,
      allowPlanDeletion: capabilities.allowPlanDeletion === true,
      allowDirectAccessRecertification: capabilities.allowDirectAccessRecertification === true,
      allowCompanyModuleManagement: capabilities.allowCompanyModuleManagement === true,
    };
  }

  private normalizeReleaseVersion(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized || null;
  }
}
