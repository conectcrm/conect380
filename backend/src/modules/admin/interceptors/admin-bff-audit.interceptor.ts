import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getCorrelationId } from '../../../common/middleware/correlation-id.middleware';
import { AtividadeTipo } from '../../users/entities/user-activity.entity';
import { User } from '../../users/user.entity';
import { UserActivitiesService } from '../../users/services/user-activities.service';

@Injectable()
export class AdminBffAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminBffAuditInterceptor.name);
  private readonly sensitiveKeys = new Set<string>([
    'password',
    'senha',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    'secret',
    'api_key',
    'apikey',
  ]);

  constructor(private readonly userActivitiesService: UserActivitiesService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request?.user as User | undefined;
    const method = String(request?.method || 'UNKNOWN').toUpperCase();
    const route = this.normalizeRoute(request?.originalUrl || request?.url || '');
    const source = this.resolveSource(request?.headers);

    const registerAudit = (statusCode: number, outcome: 'success' | 'error', error?: unknown) => {
      if (!user?.id || !user?.empresa_id) {
        return;
      }

      const details = {
        categoria: 'admin_bff_audit',
        evento: 'gateway_request',
        method,
        route,
        status_code: statusCode,
        outcome,
        source,
        correlation_id: this.resolveCorrelationId(request?.headers),
        request: {
          params: this.sanitizeValue(request?.params),
          query: this.sanitizeValue(request?.query),
          body: this.sanitizeValue(request?.body),
        },
        error: error instanceof Error ? error.message : typeof error === 'string' ? error : null,
        timestamp: new Date().toISOString(),
      };

      const descricao = `Gateway admin ${method} ${route} (${statusCode})`;
      void this.userActivitiesService
        .registrarAtividade(
          user.id,
          user.empresa_id,
          AtividadeTipo.EDICAO,
          descricao,
          JSON.stringify(details),
        )
        .catch((auditError) => {
          this.logger.warn(
            `Falha ao registrar auditoria do admin-bff para ${method} ${route}: ${
              auditError instanceof Error ? auditError.message : String(auditError)
            }`,
          );
        });
    };

    return next.handle().pipe(
      tap(() => {
        registerAudit(Number(response?.statusCode || 200), 'success');
      }),
      catchError((error) => {
        const statusCode = Number(error?.status || response?.statusCode || 500);
        registerAudit(statusCode, 'error', error);
        return throwError(() => error);
      }),
    );
  }

  private normalizeRoute(rawRoute: string): string {
    if (!rawRoute) {
      return '/admin/bff';
    }
    return rawRoute.split('?')[0] || '/admin/bff';
  }

  private resolveCorrelationId(headers: Record<string, unknown> | undefined): string | null {
    const fromContext = getCorrelationId();
    if (fromContext) {
      return fromContext;
    }

    const fromHeader = headers?.['x-correlation-id'];
    if (typeof fromHeader === 'string' && fromHeader.trim()) {
      return fromHeader.trim();
    }

    return null;
  }

  private resolveSource(headers: Record<string, unknown> | undefined): string {
    const source = headers?.['x-client-source'];
    if (typeof source === 'string' && source.trim()) {
      return source.trim();
    }
    return 'admin-bff';
  }

  private sanitizeValue(input: unknown, depth = 0): unknown {
    if (input === null || input === undefined) {
      return input;
    }

    if (depth > 3) {
      return '[depth-limited]';
    }

    if (typeof input === 'string') {
      return input.length > 400 ? `${input.slice(0, 400)}...` : input;
    }

    if (typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.slice(0, 25).map((item) => this.sanitizeValue(item, depth + 1));
    }

    const entries = Object.entries(input as Record<string, unknown>).slice(0, 40);
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      sanitized[key] = this.sanitizeValue(value, depth + 1);
    }

    return sanitized;
  }
}
