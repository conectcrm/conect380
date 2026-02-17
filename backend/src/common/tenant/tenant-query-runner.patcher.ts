import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { getCurrentTenantId } from './tenant-context';

type TenantAwareQueryRunner = QueryRunner & {
  __tenantPatchApplied?: boolean;
  __tenantContextApplied?: string | null;
  __tenantContextNeedsReset?: boolean;
};

@Injectable()
export class TenantQueryRunnerPatcher implements OnModuleInit {
  private readonly logger = new Logger(TenantQueryRunnerPatcher.name);
  private patchApplied = false;

  constructor(private readonly dataSource: DataSource) {}

  onModuleInit(): void {
    if (this.patchApplied) {
      return;
    }

    const source = this.dataSource as DataSource & {
      __tenantCreateQueryRunnerPatched?: boolean;
    };

    if (source.__tenantCreateQueryRunnerPatched) {
      this.patchApplied = true;
      return;
    }

    const originalCreateQueryRunner = source.createQueryRunner.bind(source);

    source.createQueryRunner = (...args: Parameters<DataSource['createQueryRunner']>) => {
      const queryRunner = originalCreateQueryRunner(...args);
      this.patchQueryRunner(queryRunner);
      return queryRunner;
    };

    source.__tenantCreateQueryRunnerPatched = true;
    this.patchApplied = true;
    this.logger.log('Tenant QueryRunner patch enabled.');
  }

  private patchQueryRunner(queryRunner: QueryRunner): void {
    const runner = queryRunner as TenantAwareQueryRunner;

    if (runner.__tenantPatchApplied) {
      return;
    }

    runner.__tenantPatchApplied = true;
    runner.__tenantContextApplied = null;
    runner.__tenantContextNeedsReset = false;

    const originalQuery = queryRunner.query.bind(queryRunner);
    const originalRelease = queryRunner.release.bind(queryRunner);

    runner.query = async (query: string, parameters?: any[], useStructuredResult?: boolean) => {
      if (!this.isTenantControlQuery(query)) {
        await this.applyTenantContext(runner, originalQuery);
      }

      return (originalQuery as any)(query, parameters, useStructuredResult);
    };

    runner.release = async () => {
      if (runner.__tenantContextNeedsReset) {
        await this.resetTenantContext(originalQuery);
      }

      runner.__tenantContextApplied = null;
      runner.__tenantContextNeedsReset = false;

      return originalRelease();
    };
  }

  private async applyTenantContext(
    runner: TenantAwareQueryRunner,
    originalQuery: (query: string, parameters?: any[]) => Promise<any>,
  ): Promise<void> {
    const tenantId = getCurrentTenantId() ?? null;

    if (runner.__tenantContextApplied === tenantId) {
      return;
    }

    if (!tenantId) {
      await this.resetTenantContext(originalQuery);
      runner.__tenantContextApplied = null;
      runner.__tenantContextNeedsReset = false;
      return;
    }

    await originalQuery(`SELECT set_config('app.current_tenant_id', $1, false)`, [tenantId]);
    runner.__tenantContextApplied = tenantId;
    runner.__tenantContextNeedsReset = true;
  }

  private async resetTenantContext(
    originalQuery: (query: string, parameters?: any[]) => Promise<any>,
  ): Promise<void> {
    try {
      await originalQuery('RESET app.current_tenant_id');
    } catch {
      // Ignore reset errors to avoid impacting non-tenant requests.
    }
  }

  private isTenantControlQuery(query: unknown): boolean {
    if (typeof query !== 'string') {
      return false;
    }

    return /set_current_tenant|get_current_tenant|app\.current_tenant_id/i.test(query);
  }
}
