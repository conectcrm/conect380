import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { createHash } from 'crypto';
import { dashboardV2CacheHitsTotal, incrementCounter } from '../../../config/metrics';

type CachePayload<T> = {
  data: T;
  generatedAt: string;
};

@Injectable()
export class DashboardV2CacheService {
  private readonly logger = new Logger(DashboardV2CacheService.name);
  private readonly redisClient: any;
  private readonly ttlSeconds = Number(process.env.DASHBOARD_V2_CACHE_TTL_SECONDS || 90);

  constructor(@InjectQueue('dashboard-v2-metrics') queue: Queue) {
    this.redisClient = (queue as any)?.client;
  }

  buildKey(params: {
    empresaId: string;
    periodKey: string;
    scope: string;
    filters: Record<string, unknown>;
  }): string {
    const filtersCanonical = JSON.stringify({
      scope: params.scope,
      ...params.filters,
    });
    const hash = createHash('sha256').update(filtersCanonical).digest('hex').slice(0, 16);
    return `dash:v2:${params.empresaId}:${params.periodKey}:${hash}`;
  }

  async get<T>(key: string, empresaId: string): Promise<CachePayload<T> | null> {
    if (!this.redisClient) return null;
    try {
      const raw = await this.redisClient.get(key);
      if (!raw) {
        incrementCounter(dashboardV2CacheHitsTotal, { empresaId, status: 'miss' });
        return null;
      }
      incrementCounter(dashboardV2CacheHitsTotal, { empresaId, status: 'hit' });
      return JSON.parse(raw) as CachePayload<T>;
    } catch (error: any) {
      this.logger.warn(`Erro ao recuperar cache ${key}: ${error?.message || error}`);
      incrementCounter(dashboardV2CacheHitsTotal, { empresaId, status: 'error' });
      return null;
    }
  }

  async set<T>(key: string, empresaId: string, data: T): Promise<void> {
    if (!this.redisClient) return;
    try {
      const payload: CachePayload<T> = {
        data,
        generatedAt: new Date().toISOString(),
      };
      await this.redisClient.set(key, JSON.stringify(payload), 'EX', this.ttlSeconds);
    } catch (error: any) {
      this.logger.warn(`Erro ao salvar cache ${key}: ${error?.message || error}`);
      incrementCounter(dashboardV2CacheHitsTotal, { empresaId, status: 'error' });
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      const keys = await this.scanKeysByPrefix(prefix);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (error: any) {
      this.logger.warn(`Erro ao invalidar cache por prefixo ${prefix}: ${error?.message || error}`);
    }
  }

  private async scanKeysByPrefix(prefix: string): Promise<string[]> {
    const collected: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        '100',
      );
      cursor = nextCursor;
      if (Array.isArray(keys) && keys.length > 0) {
        collected.push(...keys);
      }
    } while (cursor !== '0');

    return collected;
  }
}
