import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isPlatformUser } from '../auth/is-platform-user';

type OwnerUserShape = {
  empresa_id?: string | null;
  empresaId?: string | null;
  platform_owner_access?: boolean | null;
  platformOwnerAccess?: boolean | null;
  empresa?: {
    id?: string | null;
  } | null;
};

@Injectable()
export class PlatformOwnerGuard implements CanActivate {
  private readonly ownerEmpresaIds: Set<string>;
  private readonly enforceWhenOwnerListEmpty: boolean;

  constructor() {
    this.ownerEmpresaIds = this.parseOwnerIds(process.env.PLATFORM_OWNER_EMPRESA_IDS);
    this.enforceWhenOwnerListEmpty = this.parseBoolean(
      process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY,
      true,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: OwnerUserShape }>();
    const user = request?.user;
    const userEmpresaIds = this.extractUserEmpresaIds(user);
    const hasOwnerPolicyAccess = isPlatformUser(user);

    if (hasOwnerPolicyAccess) {
      return true;
    }

    if (this.ownerEmpresaIds.size === 0) {
      if (this.enforceWhenOwnerListEmpty) {
        throw new ForbiddenException({
          code: 'PLATFORM_OWNER_NOT_CONFIGURED',
          message:
            'Acesso administrativo bloqueado: PLATFORM_OWNER_EMPRESA_IDS nao foi configurado.',
        });
      }

      return true;
    }

    const belongsToOwnerTenant = userEmpresaIds.some((empresaId) => this.ownerEmpresaIds.has(empresaId));
    if (belongsToOwnerTenant) {
      return true;
    }

    throw new ForbiddenException({
      code: 'PLATFORM_OWNER_REQUIRED',
      message: 'Acesso permitido apenas para a empresa proprietaria da plataforma.',
    });
  }

  private extractUserEmpresaIds(user?: OwnerUserShape): string[] {
    const candidates = [user?.empresa_id, user?.empresaId, user?.empresa?.id];
    return candidates
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private parseOwnerIds(raw?: string): Set<string> {
    if (!raw || typeof raw !== 'string') {
      return new Set();
    }

    const ids = raw
      .split(/[;,]/g)
      .map((item) => item.trim())
      .filter(Boolean);

    return new Set(ids);
  }

  private parseBoolean(raw: string | undefined, fallback: boolean): boolean {
    if (!raw || typeof raw !== 'string') {
      return fallback;
    }

    const normalized = raw.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes') {
      return true;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no') {
      return false;
    }

    return fallback;
  }
}
