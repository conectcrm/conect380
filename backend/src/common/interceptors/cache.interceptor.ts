import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../services/cache.service';

/**
 * Cache Interceptor
 *
 * Caches HTTP GET responses to reduce load.
 *
 * Notes:
 * - `@CacheTTL(...)` accepts milliseconds.
 * - For backward compatibility, values <= 1000 are treated as seconds.
 */

export const CACHE_TTL_METADATA = 'cache_ttl';

export const CacheTTL = (ttl: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
};

interface CacheEntry {
  data: any;
  timestamp: number;
  ttlMs: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private static cache = new Map<string, CacheEntry>();
  private readonly defaultTTLMs = 60 * 1000; // 1 minute

  constructor(private reflector: Reflector) {
    CacheService.registerInterceptor(this);

    const cleanupInterval = setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
    cleanupInterval.unref?.();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    if (method !== 'GET') {
      return next.handle();
    }

    const handler = context.getHandler();
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    const ttlMs = this.normalizeTTLMs(ttl);

    const empresaId = this.resolveEmpresaId(request);
    const normalizedUrl = request.originalUrl || url;
    const cacheKey = `${empresaId}:${normalizedUrl}`;

    const cached = CacheInterceptor.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttlMs) {
      console.log(`🟢 [Cache] HIT: ${cacheKey} (${ttlMs}ms)`);
      return of(cached.data);
    }

    console.log(`🔴 [Cache] MISS: ${cacheKey}`);

    return next.handle().pipe(
      tap((data) => {
        CacheInterceptor.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttlMs,
        });
        console.log(`💾 [Cache] SAVED: ${cacheKey} (TTL: ${ttlMs}ms)`);
      }),
    );
  }

  private normalizeTTLMs(ttl?: number): number {
    if (!ttl || ttl <= 0) {
      return this.defaultTTLMs;
    }

    // Backward compatibility for old usage in seconds.
    return ttl <= 1000 ? ttl * 1000 : ttl;
  }

  private resolveEmpresaId(request: any): string {
    const userEmpresaId = request?.user?.empresa_id || request?.user?.empresaId;
    if (userEmpresaId) {
      return String(userEmpresaId);
    }

    const headerEmpresaId = request?.headers?.['x-empresa-id'];
    if (Array.isArray(headerEmpresaId)) {
      return headerEmpresaId[0] || 'default';
    }

    return String(headerEmpresaId || 'default');
  }

  private cleanExpiredCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of CacheInterceptor.cache.entries()) {
      if (now - entry.timestamp >= entry.ttlMs) {
        CacheInterceptor.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [Cache] Removed ${cleaned} expired entries`);
    }
  }

  invalidateByPrefix(prefix: string) {
    let invalidated = 0;

    for (const key of CacheInterceptor.cache.keys()) {
      if (key.includes(prefix)) {
        CacheInterceptor.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      console.log(`🗑️ [Cache] Invalidated ${invalidated} entries (${prefix})`);
    }
  }

  clearAll() {
    const size = CacheInterceptor.cache.size;
    CacheInterceptor.cache.clear();
    console.log(`🗑️ [Cache] Cleared all cache entries (${size})`);
  }

  getStats() {
    return {
      size: CacheInterceptor.cache.size,
      entries: Array.from(CacheInterceptor.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.floor((Date.now() - entry.timestamp) / 1000),
        ttl: entry.ttlMs,
      })),
    };
  }
}
