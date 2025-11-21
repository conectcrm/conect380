import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Rate Limiting Interceptor
 * 
 * Protege contra abuso de API limitando requisições por IP/usuário.
 * 
 * CONFIGURAÇÃO:
 * - 100 requisições por minuto por IP
 * - 1000 requisições por minuto por empresa (autenticado)
 * - Bloqueio temporário após limite excedido
 * 
 * BENEFÍCIOS:
 * - Previne DDoS e brute force
 * - Protege recursos do servidor
 * - Garante fair usage entre empresas
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked?: boolean;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly limitsByIP = new Map<string, RateLimitEntry>();
  private readonly limitsByEmpresa = new Map<string, RateLimitEntry>();

  // Configurações
  private readonly IP_LIMIT = 100; // Requisições por minuto (não autenticado)
  private readonly EMPRESA_LIMIT = 1000; // Requisições por minuto (autenticado)
  private readonly WINDOW_MS = 60 * 1000; // 1 minuto
  private readonly BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueio

  constructor() {
    // Limpar entradas expiradas a cada 1 minuto
    setInterval(() => this.cleanExpiredEntries(), this.WINDOW_MS);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIP(request);
    const empresaId = request.headers['x-empresa-id'] || request.user?.empresaId;

    // Verificar rate limit por IP
    const ipAllowed = this.checkRateLimit(
      this.limitsByIP,
      ip,
      this.IP_LIMIT,
      'IP',
    );

    if (!ipAllowed) {
      return throwError(
        () =>
          new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Muitas requisições. Tente novamente em alguns minutos.',
              error: 'Too Many Requests',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          ),
      );
    }

    // Se autenticado, verificar rate limit por empresa
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
                  'Limite de requisições da empresa excedido. Tente novamente em alguns minutos.',
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

  /**
   * Verificar rate limit
   */
  private checkRateLimit(
    limitMap: Map<string, RateLimitEntry>,
    key: string,
    limit: number,
    type: 'IP' | 'Empresa',
  ): boolean {
    const now = Date.now();
    let entry = limitMap.get(key);

    // Se não existe ou resetou, criar nova entrada
    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      };
      limitMap.set(key, entry);
      return true;
    }

    // Se está bloqueado, verificar se já pode desbloquear
    if (entry.blocked) {
      if (now >= entry.resetAt) {
        // Desbloquear e resetar contador
        entry.blocked = false;
        entry.count = 1;
        entry.resetAt = now + this.WINDOW_MS;
        console.log(`✅ [RateLimit] ${type} ${key} desbloqueado`);
        return true;
      }
      // Ainda bloqueado
      console.log(
        `🚫 [RateLimit] ${type} ${key} bloqueado (${Math.ceil(
          (entry.resetAt - now) / 1000,
        )}s)`,
      );
      return false;
    }

    // Incrementar contador
    entry.count++;

    // Verificar se excedeu o limite
    if (entry.count > limit) {
      entry.blocked = true;
      entry.resetAt = now + this.BLOCK_DURATION_MS;
      console.log(
        `⚠️ [RateLimit] ${type} ${key} BLOQUEADO! (${entry.count} requisições)`,
      );
      return false;
    }

    // Avisar quando estiver próximo do limite
    if (entry.count > limit * 0.8) {
      console.log(
        `⚠️ [RateLimit] ${type} ${key} próximo do limite (${entry.count}/${limit})`,
      );
    }

    return true;
  }

  /**
   * Obter IP do cliente (considerando proxies)
   */
  private getClientIP(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Limpar entradas expiradas
   */
  private cleanExpiredEntries() {
    const now = Date.now();
    let cleanedIP = 0;
    let cleanedEmpresa = 0;

    // Limpar IPs
    for (const [key, entry] of this.limitsByIP.entries()) {
      if (now >= entry.resetAt && !entry.blocked) {
        this.limitsByIP.delete(key);
        cleanedIP++;
      }
    }

    // Limpar Empresas
    for (const [key, entry] of this.limitsByEmpresa.entries()) {
      if (now >= entry.resetAt && !entry.blocked) {
        this.limitsByEmpresa.delete(key);
        cleanedEmpresa++;
      }
    }

    if (cleanedIP > 0 || cleanedEmpresa > 0) {
      console.log(
        `🧹 [RateLimit] Limpou ${cleanedIP} IPs e ${cleanedEmpresa} empresas`,
      );
    }
  }

  /**
   * Estatísticas de rate limiting
   */
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

  /**
   * Desbloquear manualmente (admin)
   */
  unblock(type: 'ip' | 'empresa', key: string): boolean {
    const map = type === 'ip' ? this.limitsByIP : this.limitsByEmpresa;
    const entry = map.get(key);

    if (entry && entry.blocked) {
      map.delete(key);
      console.log(`✅ [RateLimit] ${type} ${key} desbloqueado manualmente`);
      return true;
    }

    return false;
  }
}
