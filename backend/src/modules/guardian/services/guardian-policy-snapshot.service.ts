import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GuardianCapabilities,
  GuardianRuntimeContext,
} from './guardian-capabilities.service';
import { GuardianPolicySnapshot } from '../entities/guardian-policy-snapshot.entity';

export type GuardianPolicySnapshotRecordResult = {
  created: boolean;
  snapshot: GuardianPolicySnapshot;
  previousSnapshot: GuardianPolicySnapshot | null;
};

@Injectable()
export class GuardianPolicySnapshotService {
  private readonly logger = new Logger(GuardianPolicySnapshotService.name);

  constructor(
    @InjectRepository(GuardianPolicySnapshot)
    private readonly guardianPolicySnapshotRepository: Repository<GuardianPolicySnapshot>,
  ) {}

  async recordRuntimeContext(
    runtimeContext: GuardianRuntimeContext,
  ): Promise<GuardianPolicySnapshotRecordResult> {
    const draftSnapshot = this.buildSnapshotDraft(runtimeContext);

    try {
      const [latestSnapshot] = await this.guardianPolicySnapshotRepository.find({
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

      const snapshot = this.guardianPolicySnapshotRepository.create(draftSnapshot);
      const savedSnapshot = await this.guardianPolicySnapshotRepository.save(snapshot);
      return {
        created: true,
        snapshot: savedSnapshot,
        previousSnapshot: latestSnapshot,
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar snapshot da politica guardian: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return {
        created: false,
        snapshot: {
          id: 0,
          createdAt: new Date(),
          ...draftSnapshot,
        } as GuardianPolicySnapshot,
        previousSnapshot: null,
      };
    }
  }

  async list(limit = 20): Promise<GuardianPolicySnapshot[]> {
    const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(limit || 20)));
    try {
      return this.guardianPolicySnapshotRepository.find({
        order: { createdAt: 'DESC', id: 'DESC' },
        take: normalizedLimit,
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao listar snapshots da politica guardian: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  private buildSnapshotDraft(runtimeContext: GuardianRuntimeContext) {
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

  private createPolicyFingerprint(runtimeContext: GuardianRuntimeContext): string {
    const payload = JSON.stringify({
      environment: runtimeContext.environment,
      policySource: runtimeContext.policySource,
      adminMfaRequired: runtimeContext.adminMfaRequired,
      legacyTransitionMode: runtimeContext.legacyTransitionMode,
      capabilities: this.normalizeCapabilities(runtimeContext.capabilities),
    });

    return createHash('sha256').update(payload).digest('hex');
  }

  private resolveEnabledCapabilities(capabilities: GuardianCapabilities): string[] {
    return Object.entries(this.normalizeCapabilities(capabilities))
      .filter(([, enabled]) => enabled === true)
      .map(([key]) => key);
  }

  private normalizeCapabilities(capabilities: GuardianCapabilities): GuardianCapabilities {
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
