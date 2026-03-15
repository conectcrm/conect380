import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getCorrelationId } from '../../../common/middleware/correlation-id.middleware';
import { User } from '../../users/user.entity';
import { GuardianCriticalAuditService } from '../services/guardian-critical-audit.service';

@Injectable()
export class GuardianCriticalAuditInterceptor implements NestInterceptor {
  private readonly criticalMethods = new Set<string>(['POST', 'PUT', 'PATCH', 'DELETE']);

  constructor(private readonly guardianCriticalAuditService: GuardianCriticalAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = String(request?.method || 'UNKNOWN').toUpperCase();

    if (!this.criticalMethods.has(method)) {
      return next.handle();
    }

    const user = request?.user as User | undefined;
    const route = this.normalizeRoute(request?.originalUrl || request?.url || '');
    const target = this.resolveTarget(route, request?.params, request?.body);
    const basePayload = {
      actorUserId: user?.id || 'unknown',
      actorRole: typeof user?.role === 'string' ? user.role : null,
      actorEmail: typeof user?.email === 'string' ? user.email : null,
      empresaId: typeof user?.empresa_id === 'string' ? user.empresa_id : null,
      targetType: target.targetType,
      targetId: target.targetId,
      requestIp: this.normalizeIp(request),
      userAgent: this.normalizeUserAgent(request?.headers?.['user-agent']),
      httpMethod: method,
      route,
      requestId: this.resolveRequestId(request?.headers),
      beforePayload: {
        params: request?.params || {},
        query: request?.query || {},
        body: request?.body || {},
      },
    };

    return next.handle().pipe(
      tap((data) => {
        void this.guardianCriticalAuditService.record({
          ...basePayload,
          statusCode: Number(response?.statusCode || 200),
          outcome: 'success',
          afterPayload: this.normalizeAfterPayload(data),
          errorMessage: null,
        });
      }),
      catchError((error) => {
        void this.guardianCriticalAuditService.record({
          ...basePayload,
          statusCode: Number(error?.status || response?.statusCode || 500),
          outcome: 'error',
          afterPayload: null,
          errorMessage: this.normalizeErrorMessage(error),
        });
        return throwError(() => error);
      }),
    );
  }

  private normalizeRoute(rawRoute: string): string {
    if (!rawRoute) {
      return '/guardian';
    }
    return rawRoute.split('?')[0] || '/guardian';
  }

  private resolveRequestId(headers: Record<string, unknown> | undefined): string | null {
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

  private normalizeUserAgent(userAgent: unknown): string | null {
    if (typeof userAgent !== 'string') {
      return null;
    }
    const normalized = userAgent.trim();
    if (!normalized) {
      return null;
    }
    return normalized.slice(0, 1000);
  }

  private normalizeIp(
    request:
      | {
          ip?: string;
          headers?: Record<string, unknown>;
          connection?: { remoteAddress?: string };
        }
      | undefined,
  ): string | null {
    const directIp = typeof request?.ip === 'string' ? request.ip : '';
    const forwarded = request?.headers?.['x-forwarded-for'];
    const forwardedIp =
      typeof forwarded === 'string' ? forwarded.split(',')[0] : Array.isArray(forwarded) ? forwarded[0] : '';
    const connectionIp =
      typeof request?.connection?.remoteAddress === 'string' ? request.connection.remoteAddress : '';
    const normalized = String(directIp || forwardedIp || connectionIp || '').trim();
    if (!normalized) {
      return null;
    }
    return normalized.slice(0, 45);
  }

  private resolveTarget(
    route: string,
    params: Record<string, unknown> | undefined,
    body: Record<string, unknown> | undefined,
  ): { targetType: string | null; targetId: string | null } {
    const routeLower = route.toLowerCase();
    const targetType = this.resolveTargetType(routeLower);
    const targetId = this.resolveTargetId(params, body);
    return { targetType, targetId };
  }

  private resolveTargetType(routeLower: string): string | null {
    if (routeLower.includes('/guardian/empresas')) {
      return 'empresa';
    }
    if (routeLower.includes('/guardian/planos')) {
      return 'plan_catalog';
    }
    if (routeLower.includes('/billing/subscriptions')) {
      return 'billing_subscription';
    }
    if (routeLower.includes('/audit/critical')) {
      return 'critical_audit';
    }
    if (routeLower.includes('/access-change-requests')) {
      return 'access_change_request';
    }
    if (routeLower.includes('/break-glass')) {
      return 'break_glass_request';
    }
    if (routeLower.includes('/access-review')) {
      return 'access_review';
    }
    return 'guardian_action';
  }

  private resolveTargetId(
    params: Record<string, unknown> | undefined,
    body: Record<string, unknown> | undefined,
  ): string | null {
    const candidateKeys = [
      'id',
      'empresaId',
      'empresa_id',
      'requestId',
      'request_id',
      'targetUserId',
      'target_user_id',
      'userId',
      'user_id',
      'modulo',
    ];
    for (const key of candidateKeys) {
      const paramValue = params?.[key];
      if (typeof paramValue === 'string' && paramValue.trim()) {
        return paramValue.trim().slice(0, 120);
      }

      const bodyValue = body?.[key];
      if (typeof bodyValue === 'string' && bodyValue.trim()) {
        return bodyValue.trim().slice(0, 120);
      }
    }

    return null;
  }

  private normalizeAfterPayload(data: unknown): Record<string, unknown> | null {
    if (data === null || data === undefined) {
      return null;
    }

    if (typeof data === 'object') {
      return data as Record<string, unknown>;
    }

    return { value: String(data) };
  }

  private normalizeErrorMessage(error: unknown): string | null {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    return null;
  }
}
