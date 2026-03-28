import {
  CanActivate,
  ExecutionContext,
  GoneException,
  Injectable,
  MethodNotAllowedException,
} from '@nestjs/common';
import { createHash } from 'crypto';

type CoreAdminLegacyTransitionMode = 'legacy' | 'dual' | 'canary' | 'guardian_only';

@Injectable()
export class CoreAdminLegacyTransitionGuard implements CanActivate {
  private static readonly READ_ONLY_ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
  private static readonly ENV_KEYS = {
    transitionMode: 'CORE_ADMIN_LEGACY_TRANSITION_MODE',
    canaryPercent: 'CORE_ADMIN_LEGACY_CANARY_PERCENT',
    readOnly: 'CORE_ADMIN_LEGACY_READ_ONLY',
  } as const;

  private readonly mode: CoreAdminLegacyTransitionMode;
  private readonly canaryPercent: number;
  private readonly legacyReadOnly: boolean;

  constructor() {
    this.mode = this.parseMode(process.env[CoreAdminLegacyTransitionGuard.ENV_KEYS.transitionMode]);
    this.canaryPercent = this.parseCanaryPercent(
      process.env[CoreAdminLegacyTransitionGuard.ENV_KEYS.canaryPercent],
    );
    this.legacyReadOnly = this.parseBooleanFlag(
      process.env[CoreAdminLegacyTransitionGuard.ENV_KEYS.readOnly],
      false,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; empresa_id?: string };
      headers?: Record<string, unknown>;
      method?: string;
      ip?: string;
      originalUrl?: string;
      url?: string;
    }>();
    const response = context.switchToHttp().getResponse<{
      setHeader?: (name: string, value: string) => void;
    }>();
    const currentRoute = this.resolveRoute(request);
    const method = this.resolveMethod(request);

    if (this.shouldForceGuardianForCriticalLegacyRoute(method, currentRoute)) {
      throw new GoneException({
        code: 'LEGACY_ADMIN_CRITICAL_ROUTE_DISABLED',
        message:
          'Endpoint critico legado desativado para escrita. Execute esta operacao no namespace /core-admin/*.',
        route: currentRoute,
        method,
        mode: this.mode,
        coreAdminBasePath: '/core-admin',
      });
    }

    if (this.mode === 'legacy') {
      this.ensureWriteAllowed(method, currentRoute);
      this.applyReadOnlyHeader(response);
      return true;
    }

    if (this.mode === 'dual') {
      response?.setHeader?.('x-core-admin-transition-mode', 'dual');
      this.ensureWriteAllowed(method, currentRoute);
      this.applyReadOnlyHeader(response);
      return true;
    }

    const migrateToCoreAdmin =
      this.mode === 'guardian_only' ? true : this.shouldRedirectInCanary(this.resolveRolloutKey(request));

    response?.setHeader?.('x-core-admin-transition-mode', this.mode);
    response?.setHeader?.(
      'x-core-admin-transition-target',
      migrateToCoreAdmin ? 'core-admin' : 'legacy-admin',
    );

    if (!migrateToCoreAdmin) {
      this.ensureWriteAllowed(method, currentRoute);
      this.applyReadOnlyHeader(response);
      return true;
    }

    throw new GoneException({
      code: 'LEGACY_ADMIN_DISABLED',
      message: 'Endpoint legado admin desativado para este ator. Use o namespace /core-admin/*.',
      route: currentRoute,
      mode: this.mode,
      coreAdminBasePath: '/core-admin',
    });
  }

  private shouldRedirectInCanary(rolloutKey: string): boolean {
    const hash = createHash('sha256').update(rolloutKey).digest();
    const bucket = hash.readUInt32BE(0) % 100;
    return bucket < this.canaryPercent;
  }

  private resolveRolloutKey(request: {
    user?: { id?: string; empresa_id?: string };
    headers?: Record<string, unknown>;
    ip?: string;
  }): string {
    const coreAdminExplicitKey =
      typeof request?.headers?.['x-core-admin-transition-key'] === 'string'
        ? request.headers['x-core-admin-transition-key']
        : undefined;
    if (coreAdminExplicitKey && coreAdminExplicitKey.trim()) {
      return coreAdminExplicitKey.trim();
    }

    const userId = request?.user?.id;
    if (typeof userId === 'string' && userId.trim()) {
      return userId.trim();
    }

    const empresaId = request?.user?.empresa_id;
    if (typeof empresaId === 'string' && empresaId.trim()) {
      return empresaId.trim();
    }

    const forwardedFor =
      typeof request?.headers?.['x-forwarded-for'] === 'string'
        ? request.headers['x-forwarded-for'].split(',')[0]
        : undefined;

    return String(forwardedFor || request?.ip || 'legacy-admin-anonymous');
  }

  private resolveRoute(request: { originalUrl?: string; url?: string }): string {
    const route = request?.originalUrl || request?.url || '/core-admin';
    return route.split('?')[0] || '/core-admin';
  }

  private resolveMethod(request: { method?: string }): string {
    const method = request?.method?.trim().toUpperCase();
    return method || 'GET';
  }

  private shouldForceGuardianForCriticalLegacyRoute(method: string, route: string): boolean {
    if (this.mode === 'legacy') {
      return false;
    }

    if (CoreAdminLegacyTransitionGuard.READ_ONLY_ALLOWED_METHODS.has(method)) {
      return false;
    }

    const normalizedRoute = route.toLowerCase();
    return /^\/(?:api\/)?admin\/empresas\/[^/]+\/plano\/?$/.test(normalizedRoute);
  }

  private ensureWriteAllowed(method: string, route: string): void {
    if (!this.legacyReadOnly) {
      return;
    }

    if (CoreAdminLegacyTransitionGuard.READ_ONLY_ALLOWED_METHODS.has(method)) {
      return;
    }

    throw new MethodNotAllowedException({
      code: 'LEGACY_ADMIN_READ_ONLY',
      message:
        'Backoffice legado em modo somente leitura. Execute operacoes de escrita no namespace /core-admin/*.',
      route,
      method,
      mode: this.mode,
      coreAdminBasePath: '/core-admin',
    });
  }

  private applyReadOnlyHeader(response: { setHeader?: (name: string, value: string) => void } | null): void {
    if (!this.legacyReadOnly) {
      return;
    }

    response?.setHeader?.('x-core-admin-legacy-read-only', 'true');
  }

  private parseMode(modeValue: string | undefined): CoreAdminLegacyTransitionMode {
    const normalized = (modeValue || 'legacy').trim().toLowerCase();
    if (
      normalized === 'legacy' ||
      normalized === 'dual' ||
      normalized === 'canary' ||
      normalized === 'guardian_only'
    ) {
      return normalized;
    }

    return 'legacy';
  }

  private parseCanaryPercent(rawValue: string | undefined): number {
    if (!rawValue || !rawValue.trim()) {
      return 0;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.min(100, Math.max(0, parsed));
  }

  private parseBooleanFlag(rawValue: string | undefined, fallback: boolean): boolean {
    if (!rawValue || !rawValue.trim()) {
      return fallback;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes') {
      return true;
    }

    if (normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no') {
      return false;
    }

    return fallback;
  }
}

