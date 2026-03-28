import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class CoreAdminMfaGuard implements CanActivate {
  private isCoreAdminMfaRequired(): boolean {
    const raw = process.env.AUTH_ADMIN_MFA_REQUIRED;
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return true;
    }

    const normalized = raw.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on', 'sim'].includes(normalized);
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.isCoreAdminMfaRequired()) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const isMfaVerified = user?.mfa_verified === true || user?.mfaVerified === true;

    if (!isMfaVerified) {
      throw new UnauthorizedException({
        code: 'CORE_ADMIN_MFA_REQUIRED',
        message: 'Validacao MFA obrigatoria para acessar recursos core-admin',
      });
    }

    return true;
  }
}
