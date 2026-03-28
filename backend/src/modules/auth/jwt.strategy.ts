import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { resolveJwtSecret } from '../../config/jwt.config';
import { AdminBreakGlassAccessService } from '../users/services/admin-break-glass-access.service';
import { User } from '../users/user.entity';
import { AuthRefreshToken } from './entities/auth-refresh-token.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { AssinaturasService } from '../planos/assinaturas.service';
import { hasSubscriptionAccess } from '../planos/subscription-state-machine';
import { toCanonicalAssinaturaStatus } from '../planos/entities/assinatura-empresa.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private adminBreakGlassAccessService: AdminBreakGlassAccessService,
    private assinaturasService: AssinaturasService,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(AuthRefreshToken)
    private authRefreshTokenRepository: Repository<AuthRefreshToken>,
  ) {
    const jwtSecret = resolveJwtSecret(configService);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const sessionId = typeof payload?.sid === 'string' ? payload.sid.trim() : '';
    const userId = typeof payload?.sub === 'string' ? payload.sub.trim() : '';

    if (!sessionId || !userId) {
      return null;
    }

    const session = await this.authRefreshTokenRepository.findOne({
      where: {
        id: sessionId,
        userId,
        revokedAt: IsNull(),
      },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const user = await this.usersService.findById(userId);
    if (!user || !user.ativo) {
      return null;
    }

    if (user.empresa_id) {
      const empresa = await this.empresaRepository.findOne({
        where: { id: user.empresa_id },
      });

      if (!empresa || !empresa.ativo) {
        return null;
      }

      const tenantBillingPolicy = await this.assinaturasService.obterPoliticaTenant(user.empresa_id);
      (user as User & { platform_owner_access?: boolean }).platform_owner_access = Boolean(
        tenantBillingPolicy.isPlatformOwner,
      );

      const empresaStatus = String(empresa.status || '')
        .trim()
        .toLowerCase();
      const empresaBloqueada = ['suspended', 'suspensa', 'inactive', 'inativa', 'canceled', 'cancelada'];
      if (!tenantBillingPolicy.billingExempt && empresaBloqueada.includes(empresaStatus)) {
        return null;
      }

      const now = Date.now();
      const trialExpirouPorData =
        Boolean(empresa.trial_end_date) && new Date(empresa.trial_end_date).getTime() < now;
      const empresaExpiradaPorData =
        Boolean(empresa.data_expiracao) && new Date(empresa.data_expiracao).getTime() < now;

      if (
        !tenantBillingPolicy.billingExempt &&
        empresaStatus === 'trial' &&
        (trialExpirouPorData || empresaExpiradaPorData)
      ) {
        return null;
      }

      const assinatura = await this.assinaturasService.buscarPorEmpresa(user.empresa_id);
      if (!assinatura && !tenantBillingPolicy.isPlatformOwner) {
        return null;
      }

      if (assinatura) {
        const assinaturaStatus = toCanonicalAssinaturaStatus(assinatura.status);
        if (!tenantBillingPolicy.billingExempt && !hasSubscriptionAccess(assinaturaStatus)) {
          return null;
        }

        if (!tenantBillingPolicy.billingExempt && assinaturaStatus === 'trial') {
          const dataLimiteTrial =
            assinatura.proximoVencimento ||
            assinatura.dataFim ||
            empresa.trial_end_date ||
            empresa.data_expiracao;

          if (dataLimiteTrial && new Date(dataLimiteTrial).getTime() < now) {
            return null;
          }
        }
      }
    }

    const effective = await this.adminBreakGlassAccessService.resolveEffectivePermissionsForUser(user);
    (user as User & { permissions?: string[] }).permissions = effective.permissions;
    (
      user as User & {
        break_glass?: { active: boolean; grants: Array<{ id: string; expires_at: string; permissions: string[] }> };
      }
    ).break_glass = effective.breakGlass;
    (user as User & { mfa_verified?: boolean }).mfa_verified = Boolean(session.mfaVerified);
    (user as User & { session_id?: string }).session_id = session.id;

    return user;
  }
}
