import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class GuardianMfaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const isMfaVerified = user?.mfa_verified === true || user?.mfaVerified === true;

    if (!isMfaVerified) {
      throw new UnauthorizedException({
        code: 'GUARDIAN_MFA_REQUIRED',
        message: 'Validacao MFA obrigatoria para acessar recursos guardian',
      });
    }

    return true;
  }
}

