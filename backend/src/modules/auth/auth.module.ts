import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MfaLoginChallenge } from './entities/mfa-login-challenge.entity';
import { AuthLoginAttempt } from './entities/auth-login-attempt.entity';
import { AuthRefreshToken } from './entities/auth-refresh-token.entity';
import { MailModule } from '../../mail/mail.module';
import { resolveJwtSecret } from '../../config/jwt.config';
import { EmpresaConfig } from '../empresas/entities/empresa-config.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { PlanosModule } from '../planos/planos.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PlanosModule,
    TypeOrmModule.forFeature([
      PasswordResetToken,
      MfaLoginChallenge,
      AuthLoginAttempt,
      AuthRefreshToken,
      EmpresaConfig,
      Empresa,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = resolveJwtSecret(configService);

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '24h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
