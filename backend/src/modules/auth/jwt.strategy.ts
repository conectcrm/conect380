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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private adminBreakGlassAccessService: AdminBreakGlassAccessService,
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
