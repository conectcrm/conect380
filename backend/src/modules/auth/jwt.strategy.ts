import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { resolveJwtSecret } from '../../config/jwt.config';
import { AdminBreakGlassAccessService } from '../users/services/admin-break-glass-access.service';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private adminBreakGlassAccessService: AdminBreakGlassAccessService,
  ) {
    const jwtSecret = resolveJwtSecret(configService);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
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

    return user;
  }
}
