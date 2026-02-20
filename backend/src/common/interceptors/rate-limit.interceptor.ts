import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked?: boolean;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly limitsByIP = new Map<string, RateLimitEntry>();
  private readonly limitsByEmpresa = new Map<string, RateLimitEntry>();
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly DEV_BYPASS_GET_PATHS = ['/empresas/modulos/ativos'];

  // Base limits (production): 100 req/min per IP and 1000 req/min per empresa.
  // Development gets wider limits and shorter temporary block duration.
  private readonly IP_LIMIT = this.isDevelopment ? 300 : 100;
  private readonly EMPRESA_LIMIT = this.isDevelopment ? 3000 : 1000;
  private readonly WINDOW_MS = 60 * 1000;
  private readonly BLOCK_DURATION_MS = this.isDevelopment ? 30 * 1000 : 5 * 60 * 1000;

  constructor() {
    const cleanupTimer = setInterval(() => this.cleanExpiredEntries(), this.WINDOW_MS);
    if (typeof cleanupTimer.unref === 'function') {
      cleanupTimer.unref();
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (this.shouldBypassInDevelopment(request)) {
      return next.handle();
    }

    const ip = this.getClientIP(request);
    const empresaId = (request.headers?.['x-empresa-id'] || request.user?.empresaId) as
      | string
      | undefined;

    const ipAllowed = this.checkRateLimit(this.limitsByIP, ip, this.IP_LIMIT, 'IP');
    if (!ipAllowed) {
      return throwError(
        () =>
          new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Muitas requisicoes. Tente novamente em alguns minutos.',
              error: 'Too Many Requests',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          ),
      );
    }

    if (empresaId) {
      const empresaAllowed = this.checkRateLimit(
        this.limitsByEmpresa,
        empresaId,
        this.EMPRESA_LIMIT,
        'Empresa',
      );

      if (!empresaAllowed) {
        return throwError(
          () =>
            new HttpException(
              {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message:
                  'Limite de requisicoes da empresa excedido. Tente novamente em alguns minutos.',
                error: 'Too Many Requests',
              },
              HttpStatus.TOO_MANY_REQUESTS,
            ),
        );
      }
    }

    return next.handle().pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  private shouldBypassInDevelopment(request: any): boolean {
    if (!this.isDevelopment) {
      return false;
    }

    const method = String(request?.method || '').toUpperCase();
    if (method !== 'GET') {
      return false;
    }

    const path = String(request?.originalUrl || request?.url || '').split('?')[0];
    return this.DEV_BYPASS_GET_PATHS.some(
      (allowedPath) => path === allowedPath || path.endsWith(allowedPath),
    );
  }

  private checkRateLimit(
    limitMap: Map<string, RateLimitEntry>,
    key: string,
    limit: number,
    type: 'IP' | 'Empresa',
  ): boolean {
    const now = Date.now();
    let entry = limitMap.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      };
      limitMap.set(key, entry);
      return true;
    }

    if (entry.blocked) {
      if (now >= entry.resetAt) {
        entry.blocked = false;
        entry.count = 1;
        entry.resetAt = now + this.WINDOW_MS;
        return true;
      }
      return false;
    }

    entry.count += 1;

    if (entry.count > limit) {
      entry.blocked = true;
      entry.resetAt = now + this.BLOCK_DURATION_MS;
      return false;
    }

    return true;
  }

  private getClientIP(request: any): string {
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0] ||
      request.headers?.['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of this.limitsByIP.entries()) {
      if (now >= entry.resetAt) {
        this.limitsByIP.delete(key);
      }
    }

    for (const [key, entry] of this.limitsByEmpresa.entries()) {
      if (now >= entry.resetAt) {
        this.limitsByEmpresa.delete(key);
      }
    }
  }

  getStats() {
    return {
      ips: {
        total: this.limitsByIP.size,
        blocked: Array.from(this.limitsByIP.entries())
          .filter(([_, entry]) => entry.blocked)
          .map(([key, entry]) => ({
            ip: key,
            count: entry.count,
            unblockIn: Math.ceil((entry.resetAt - Date.now()) / 1000),
          })),
      },
      empresas: {
        total: this.limitsByEmpresa.size,
        blocked: Array.from(this.limitsByEmpresa.entries())
          .filter(([_, entry]) => entry.blocked)
          .map(([key, entry]) => ({
            empresaId: key,
            count: entry.count,
            unblockIn: Math.ceil((entry.resetAt - Date.now()) / 1000),
          })),
      },
    };
  }

  unblock(type: 'ip' | 'empresa', key: string): boolean {
    const map = type === 'ip' ? this.limitsByIP : this.limitsByEmpresa;
    const entry = map.get(key);

    if (entry && entry.blocked) {
      map.delete(key);
      return true;
    }

    return false;
  }
}
