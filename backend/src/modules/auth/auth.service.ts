import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes, createHash, randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MfaLoginChallenge } from './entities/mfa-login-challenge.entity';
import { AuthLoginAttempt } from './entities/auth-login-attempt.entity';
import { AuthRefreshToken } from './entities/auth-refresh-token.entity';
import { EmpresaConfig } from '../empresas/entities/empresa-config.entity';
import { MailService } from '../../mail/mail.service';
import { securityLogger } from '../../config/logger.config';
import { resolveUserPermissions } from '../../common/permissions/permissions.utils';

const RESET_TOKEN_EXPIRATION_MINUTES = 60;
const MFA_LOGIN_CODE_EXPIRATION_MINUTES = 10;
const MFA_LOGIN_MAX_ATTEMPTS = 5;
const MFA_LOGIN_RESEND_COOLDOWN_SECONDS = 30;
const MFA_INVALID_MESSAGE = 'Codigo MFA invalido ou expirado';
const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_DAYS_DEFAULT = 30;
const REFRESH_TOKEN_EXPIRES_DAYS_MIN = 1;
const REFRESH_TOKEN_EXPIRES_DAYS_MAX = 180;
const ADMIN_SESSION_MINUTES_DEFAULT = 30;
const ADMIN_SESSION_MINUTES_MIN = 5;
const ADMIN_SESSION_MINUTES_MAX = 480;
const AUTH_LOCKOUT_ATTEMPTS_DEFAULT = 5;
const AUTH_LOCKOUT_WINDOW_MINUTES_DEFAULT = 15;
const AUTH_LOCKOUT_BASE_MINUTES_DEFAULT = 15;
const AUTH_LOCKOUT_MAX_MULTIPLIER = 8;
const ADMIN_ROLES_FOR_MFA = new Set<UserRole>([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE]);
const REVOKE_REASON_SINGLE_SESSION = 'single_session_enforced';
const REVOKE_REASON_IDLE_TIMEOUT = 'idle_timeout';
const AUTH_ERROR_CODE_CONCURRENT_LOGIN = 'CONCURRENT_LOGIN';
const AUTH_ERROR_MESSAGE_CONCURRENT_LOGIN =
  'Sua sessao foi encerrada porque sua conta foi acessada em outro dispositivo.';
const AUTH_ERROR_CODE_IDLE_TIMEOUT = 'SESSION_IDLE_TIMEOUT';
const AUTH_ERROR_MESSAGE_IDLE_TIMEOUT =
  'Sua sessao expirou por inatividade. Faca login novamente.';
const ADMIN_IDLE_TIMEOUT_MINUTES_DEFAULT = 30;
const ADMIN_IDLE_TIMEOUT_MINUTES_MIN = 5;
const ADMIN_IDLE_TIMEOUT_MINUTES_MAX = 480;

type AuthRequestMetadata = {
  ip?: string;
  userAgent?: string;
};

type MfaChallengeResponseData = {
  challengeId: string;
  email: string;
  expiresInSeconds: number;
  canResendAfterSeconds: number;
  deliveryChannel?: 'email' | 'dev_fallback';
  devCode?: string;
};

type TokenIssueContext = 'login' | 'mfa_verify' | 'refresh';

type LoginLockoutConfig = {
  maxAttempts: number;
  windowMs: number;
  baseLockoutMs: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(MfaLoginChallenge)
    private mfaLoginChallengeRepository: Repository<MfaLoginChallenge>,
    @InjectRepository(AuthLoginAttempt)
    private authLoginAttemptRepository: Repository<AuthLoginAttempt>,
    @InjectRepository(AuthRefreshToken)
    private authRefreshTokenRepository: Repository<AuthRefreshToken>,
    @InjectRepository(EmpresaConfig)
    private empresaConfigRepository: Repository<EmpresaConfig>,
  ) {}

  private gerarTokenRecuperacao(): { token: string; hash: string } {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  private gerarCodigoMfa(): string {
    return randomInt(100000, 1000000).toString();
  }

  private gerarRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  private hashValor(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private getRefreshTokenExpiresInDays(): number {
    const envValue = this.parseInteger(process.env.AUTH_REFRESH_TOKEN_DAYS);
    if (!envValue) {
      return REFRESH_TOKEN_EXPIRES_DAYS_DEFAULT;
    }

    return Math.min(
      REFRESH_TOKEN_EXPIRES_DAYS_MAX,
      Math.max(REFRESH_TOKEN_EXPIRES_DAYS_MIN, envValue),
    );
  }

  private parseInteger(value: string | undefined): number | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  }

  private parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
    if (!value || typeof value !== 'string') {
      return fallback;
    }

    const normalized = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }

    return fallback;
  }

  private isLoginLockoutEnabled(): boolean {
    return this.parseBooleanFlag(process.env.AUTH_LOGIN_LOCKOUT_ENABLED, true);
  }

  private isSingleSessionEnabled(): boolean {
    return this.parseBooleanFlag(process.env.AUTH_SINGLE_SESSION_ENABLED, true);
  }

  private isDevMfaFallbackEnabled(): boolean {
    const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
    if (nodeEnv === 'production') {
      return false;
    }

    return this.parseBooleanFlag(process.env.AUTH_MFA_DEV_FALLBACK_ENABLED, true);
  }

  private normalizarIp(ip?: string): string {
    if (!ip || typeof ip !== 'string') {
      return 'desconhecido';
    }

    const sanitized = ip.trim().slice(0, 45);
    return sanitized.length > 0 ? sanitized : 'desconhecido';
  }

  private maskEmail(email?: string | null): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return email;
    }

    if (local.length <= 2) {
      return `${local[0] ?? '*'}*@${domain}`;
    }

    return `${local.slice(0, 2)}***@${domain}`;
  }

  private isAdminRoleForMfa(role?: UserRole | string | null): boolean {
    if (!role || typeof role !== 'string') {
      return false;
    }

    const normalizedRole = role.trim().toLowerCase();
    if (normalizedRole === 'manager' || normalizedRole === 'gestor') {
      return true;
    }

    return ADMIN_ROLES_FOR_MFA.has(normalizedRole as UserRole);
  }

  private getAdminSessionFallbackMinutes(): number {
    const envMinutes = this.parseInteger(process.env.AUTH_ADMIN_SESSION_MINUTES);
    if (!envMinutes) {
      return ADMIN_SESSION_MINUTES_DEFAULT;
    }

    return Math.min(
      ADMIN_SESSION_MINUTES_MAX,
      Math.max(ADMIN_SESSION_MINUTES_MIN, envMinutes),
    );
  }

  private getAdminIdleTimeoutMinutes(): number {
    const envMinutes = this.parseInteger(process.env.AUTH_ADMIN_IDLE_TIMEOUT_MINUTES);
    if (!envMinutes) {
      return ADMIN_IDLE_TIMEOUT_MINUTES_DEFAULT;
    }

    return Math.min(
      ADMIN_IDLE_TIMEOUT_MINUTES_MAX,
      Math.max(ADMIN_IDLE_TIMEOUT_MINUTES_MIN, envMinutes),
    );
  }

  private resolveDateToEpochMs(value: unknown): number | null {
    if (value instanceof Date) {
      const ms = value.getTime();
      return Number.isFinite(ms) ? ms : null;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      const ms = parsed.getTime();
      return Number.isFinite(ms) ? ms : null;
    }

    return null;
  }

  private async resolveAdminSessionMinutes(user: Pick<User, 'empresa_id'>): Promise<number> {
    const fallbackMinutes = this.getAdminSessionFallbackMinutes();

    if (!user.empresa_id) {
      return fallbackMinutes;
    }

    try {
      const config = await this.empresaConfigRepository.findOne({
        where: { empresaId: user.empresa_id },
      });

      const minutes = Number(config?.sessaoExpiracaoMinutos);
      if (!Number.isFinite(minutes)) {
        return fallbackMinutes;
      }

      return Math.min(
        ADMIN_SESSION_MINUTES_MAX,
        Math.max(ADMIN_SESSION_MINUTES_MIN, Math.trunc(minutes)),
      );
    } catch {
      return fallbackMinutes;
    }
  }

  private async resolveAccessTokenExpiresIn(user: Pick<User, 'role' | 'empresa_id'>): Promise<string> {
    if (!this.isAdminRoleForMfa(user.role)) {
      return DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
    }

    const adminSessionMinutes = await this.resolveAdminSessionMinutes(user);
    return `${adminSessionMinutes}m`;
  }

  private normalizeIdentityEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private getLoginLockoutConfig(): LoginLockoutConfig {
    const maxAttempts = this.parseInteger(process.env.AUTH_LOCKOUT_MAX_ATTEMPTS);
    const windowMinutes = this.parseInteger(process.env.AUTH_LOCKOUT_WINDOW_MINUTES);
    const baseMinutes = this.parseInteger(process.env.AUTH_LOCKOUT_DURATION_MINUTES);

    const safeMaxAttempts = Math.max(3, Math.min(20, maxAttempts || AUTH_LOCKOUT_ATTEMPTS_DEFAULT));
    const safeWindowMinutes = Math.max(
      5,
      Math.min(240, windowMinutes || AUTH_LOCKOUT_WINDOW_MINUTES_DEFAULT),
    );
    const safeBaseMinutes = Math.max(
      1,
      Math.min(1440, baseMinutes || AUTH_LOCKOUT_BASE_MINUTES_DEFAULT),
    );

    return {
      maxAttempts: safeMaxAttempts,
      windowMs: safeWindowMinutes * 60 * 1000,
      baseLockoutMs: safeBaseMinutes * 60 * 1000,
    };
  }

  private async getLoginAttempt(identity: string): Promise<AuthLoginAttempt | null> {
    if (!identity) {
      return null;
    }

    return this.authLoginAttemptRepository.findOne({
      where: { identity },
    });
  }

  private async ensureLoginIdentityUnlocked(identity: string): Promise<void> {
    const attempt = await this.getLoginAttempt(identity);
    if (!attempt) {
      return;
    }

    if (!attempt.lockedUntil) {
      return;
    }

    const now = Date.now();
    if (attempt.lockedUntil.getTime() > now) {
      const remainingSeconds = Math.max(1, Math.ceil((attempt.lockedUntil.getTime() - now) / 1000));
      securityLogger.loginFailed(identity, this.normalizarIp(attempt.lastIp || undefined), 'locked');
      throw new UnauthorizedException(
        `Conta temporariamente bloqueada. Tente novamente em ${Math.ceil(remainingSeconds / 60)} minuto(s).`,
      );
    }

    attempt.lockedUntil = null;
    attempt.failedAttempts = 0;
    attempt.firstFailedAt = null;
    await this.authLoginAttemptRepository.save(attempt);
  }

  private async clearLoginAttempts(identity: string): Promise<void> {
    const attempt = await this.getLoginAttempt(identity);
    if (!attempt) {
      return;
    }

    attempt.failedAttempts = 0;
    attempt.consecutiveLockouts = 0;
    attempt.firstFailedAt = null;
    attempt.lastFailedAt = null;
    attempt.lockedUntil = null;
    await this.authLoginAttemptRepository.save(attempt);
  }

  private async registerFailedLoginAttempt(
    identity: string,
    user: User | undefined,
    metadata?: AuthRequestMetadata,
  ): Promise<void> {
    const lockoutConfig = this.getLoginLockoutConfig();
    const now = Date.now();
    const ip = this.normalizarIp(metadata?.ip);
    const userAgent = metadata?.userAgent || null;

    let attempt = await this.getLoginAttempt(identity);
    if (!attempt) {
      attempt = this.authLoginAttemptRepository.create({
        identity,
        failedAttempts: 0,
        consecutiveLockouts: 0,
        firstFailedAt: null,
        lastFailedAt: null,
        lockedUntil: null,
        userId: user?.id || null,
        empresaId: user?.empresa_id || null,
        lastIp: ip,
        lastUserAgent: userAgent,
      });
    }

    const firstFailedAtMs = attempt.firstFailedAt ? attempt.firstFailedAt.getTime() : null;
    const shouldResetWindow =
      firstFailedAtMs === null || now - firstFailedAtMs > lockoutConfig.windowMs;

    if (shouldResetWindow) {
      attempt.failedAttempts = 0;
      attempt.firstFailedAt = new Date(now);
    }

    attempt.failedAttempts += 1;
    attempt.lastFailedAt = new Date(now);
    attempt.lastIp = ip;
    attempt.lastUserAgent = userAgent;
    attempt.userId = user?.id || attempt.userId || null;
    attempt.empresaId = user?.empresa_id || attempt.empresaId || null;

    const reachedLimit = attempt.failedAttempts >= lockoutConfig.maxAttempts;

    if (reachedLimit) {
      attempt.consecutiveLockouts = Math.max(1, (attempt.consecutiveLockouts || 0) + 1);
      const multiplier = Math.min(
        AUTH_LOCKOUT_MAX_MULTIPLIER,
        Math.pow(2, Math.max(0, attempt.consecutiveLockouts - 1)),
      );
      const lockoutMs = lockoutConfig.baseLockoutMs * multiplier;
      attempt.lockedUntil = new Date(now + lockoutMs);
      attempt.failedAttempts = 0;
      attempt.firstFailedAt = null;

      securityLogger.loginLockoutTriggered(
        identity,
        ip,
        attempt.lockedUntil,
        attempt.consecutiveLockouts,
        user?.role,
      );

      // Alerta operacional para lockout em identidade administrativa.
      if (user?.role && this.isAdminRoleForMfa(user.role)) {
        securityLogger.rateLimitExceeded(ip, 'auth/login', lockoutConfig.maxAttempts);

        if (user?.empresa_id) {
          try {
            await this.usersService.emitAdminSecurityAlert({
              empresaId: user.empresa_id,
              event: 'auth_login_lockout',
              severity: attempt.consecutiveLockouts >= 2 ? 'critical' : 'high',
              title: 'Alerta de seguranca: bloqueio por falha de autenticacao',
              message: `Conta administrativa ${this.maskEmail(identity)} bloqueada temporariamente por tentativas de login sem sucesso.`,
              actor: null,
              targetUser: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
              },
              metadata: {
                identity,
                ip,
                failed_attempts_threshold: lockoutConfig.maxAttempts,
                lockout_level: attempt.consecutiveLockouts,
                locked_until: attempt.lockedUntil?.toISOString() || null,
              },
              source: 'auth.service.registerFailedLoginAttempt',
            });
          } catch (alertError) {
            this.logger.warn(
              `Falha ao emitir alerta de lockout administrativo para ${identity}: ${
                alertError instanceof Error ? alertError.message : String(alertError)
              }`,
            );
          }
        }
      }
    }

    await this.authLoginAttemptRepository.save(attempt);
  }

  private async issueAccessToken(
    user: Pick<User, 'id' | 'email' | 'role' | 'empresa_id'>,
    context: TokenIssueContext,
    sessionId: string,
    mfaVerified: boolean,
    metadata?: AuthRequestMetadata,
  ): Promise<string> {
    const payload = {
      email: user.email,
      sub: user.id,
      empresa_id: user.empresa_id,
      role: user.role,
      sid: sessionId,
      mfa_verified: mfaVerified,
    };

    const expiresIn = await this.resolveAccessTokenExpiresIn(user);
    const token = this.jwtService.sign(payload, { expiresIn });

    if (context === 'refresh' && this.isAdminRoleForMfa(user.role)) {
      securityLogger.adminSessionRefresh(
        user.id,
        String(user.role || ''),
        this.normalizarIp(metadata?.ip),
      );
    }

    return token;
  }

  private async issueRefreshToken(
    user: Pick<User, 'id' | 'empresa_id'>,
    options?: { mfaVerified?: boolean },
    metadata?: AuthRequestMetadata,
  ): Promise<{ sessionId: string; token: string; tokenHash: string; expiresAt: Date }> {
    const token = this.gerarRefreshToken();
    const tokenHash = this.hashValor(token);
    const expiresInDays = this.getRefreshTokenExpiresInDays();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const entity = this.authRefreshTokenRepository.create({
      tokenHash,
      userId: user.id,
      empresaId: user.empresa_id ?? null,
      expiresAt,
      revokedAt: null,
      revokeReason: null,
      replacedByTokenHash: null,
      requestedIp: metadata?.ip?.slice(0, 45) ?? null,
      userAgent: metadata?.userAgent ?? null,
      mfaVerified: Boolean(options?.mfaVerified),
      lastActivityAt: new Date(),
    });

    await this.authRefreshTokenRepository.save(entity);

    return {
      sessionId: entity.id,
      token,
      tokenHash,
      expiresAt,
    };
  }

  private async issueSessionTokens(
    user: Pick<User, 'id' | 'email' | 'role' | 'empresa_id'>,
    context: TokenIssueContext,
    metadata?: AuthRequestMetadata,
  ): Promise<{ sessionId: string; accessToken: string; refreshToken: string }> {
    const mfaVerified = context === 'mfa_verify';
    const { sessionId, token: refreshToken } = await this.issueRefreshToken(
      user,
      { mfaVerified },
      metadata,
    );
    const accessToken = await this.issueAccessToken(user, context, sessionId, mfaVerified, metadata);

    return {
      sessionId,
      accessToken,
      refreshToken,
    };
  }

  private async revokeRefreshToken(
    rawRefreshToken: string,
    reason: string,
    options?: {
      replacedByTokenHash?: string | null;
      userId?: string;
    },
  ): Promise<boolean> {
    const normalizedToken = rawRefreshToken?.trim();
    if (!normalizedToken) {
      return false;
    }

    const tokenHash = this.hashValor(normalizedToken);
    const whereClause: {
      tokenHash: string;
      revokedAt: ReturnType<typeof IsNull>;
      userId?: string;
    } = {
      tokenHash,
      revokedAt: IsNull(),
    };

    if (options?.userId) {
      whereClause.userId = options.userId;
    }

    const result = await this.authRefreshTokenRepository.update(whereClause, {
      revokedAt: new Date(),
      revokeReason: reason,
      replacedByTokenHash: options?.replacedByTokenHash ?? null,
    });

    return Boolean(result.affected && result.affected > 0);
  }

  private async revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void> {
    await this.authRefreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revokeReason: reason,
        replacedByTokenHash: null,
      },
    );
  }

  private async revokeOtherUserRefreshTokens(
    userId: string,
    currentSessionId: string,
    reason: string,
  ): Promise<void> {
    await this.authRefreshTokenRepository
      .createQueryBuilder()
      .update(AuthRefreshToken)
      .set({
        revokedAt: new Date(),
        revokeReason: reason,
        replacedByTokenHash: null,
      })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .andWhere('id <> :currentSessionId', { currentSessionId })
      .execute();
  }

  private resolveUserMfaPreference(
    user: Pick<User, 'configuracoes'>,
  ): boolean | null {
    const configuracoes = user?.configuracoes;
    if (!configuracoes || typeof configuracoes !== 'object') {
      return null;
    }

    const seguranca = (configuracoes as Record<string, unknown>).seguranca;
    if (seguranca && typeof seguranca === 'object') {
      const nestedPreference = (seguranca as Record<string, unknown>).mfa_login_habilitado;
      if (typeof nestedPreference === 'boolean') {
        return nestedPreference;
      }
    }

    const legacyPreference = (configuracoes as Record<string, unknown>).mfa_login_habilitado;
    if (typeof legacyPreference === 'boolean') {
      return legacyPreference;
    }

    return null;
  }

  private async shouldRequireAdminMfa(
    user: Pick<User, 'role' | 'empresa_id' | 'configuracoes'>,
  ): Promise<boolean> {
    if (!this.isAdminRoleForMfa(user.role)) {
      return false;
    }

    const globalAdminMfaRequired = this.parseBooleanFlag(
      process.env.AUTH_ADMIN_MFA_REQUIRED,
      true,
    );

    if (globalAdminMfaRequired) {
      return true;
    }

    const userMfaPreference = this.resolveUserMfaPreference(user);
    if (userMfaPreference !== null) {
      return userMfaPreference;
    }

    if (!user.empresa_id) {
      return false;
    }

    try {
      const config = await this.empresaConfigRepository.findOne({
        where: { empresaId: user.empresa_id },
      });

      return !!config?.autenticacao2FA;
    } catch {
      return false;
    }
  }

  private ensureEmpresaDisponivelParaSessao(user: Pick<User, 'empresa_id' | 'empresa'>): void {
    if (!user?.empresa_id) {
      return;
    }

    if (!user.empresa) {
      throw new UnauthorizedException(
        'Empresa vinculada ao usuario nao foi encontrada. Contate o suporte.',
      );
    }

    if (user.empresa.ativo === false) {
      throw new UnauthorizedException(
        'Empresa vinculada ao usuario esta inativa. Solicite reativacao para acessar o sistema.',
      );
    }
  }

  private async buildAuthenticatedLoginResponse(
    user: User,
    context: Exclude<TokenIssueContext, 'refresh'> = 'login',
    metadata?: AuthRequestMetadata,
  ) {
    await this.usersService.updateLastLogin(user.id);

    const normalizedPermissions = Array.from(resolveUserPermissions(user));
    const { sessionId, accessToken, refreshToken } = await this.issueSessionTokens(
      user,
      context,
      metadata,
    );

    if (this.isSingleSessionEnabled()) {
      await this.revokeOtherUserRefreshTokens(user.id, sessionId, REVOKE_REASON_SINGLE_SESSION);
    }

    return {
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          permissoes: normalizedPermissions,
          permissions: normalizedPermissions,
          empresa: user.empresa,
        },
      },
      message: 'Login realizado com sucesso',
    };
  }

  private async criarDesafioMfaLogin(
    user: Pick<User, 'id' | 'email' | 'nome' | 'empresa_id'>,
    metadata?: AuthRequestMetadata,
  ): Promise<MfaChallengeResponseData> {
    await this.mfaLoginChallengeRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const codigo = this.gerarCodigoMfa();
    const expiresAt = new Date(Date.now() + MFA_LOGIN_CODE_EXPIRATION_MINUTES * 60 * 1000);
    const challenge = this.mfaLoginChallengeRepository.create({
      empresaId: user.empresa_id ?? null,
      userId: user.id,
      codeHash: this.hashValor(codigo),
      expiresAt,
      failedAttempts: 0,
      maxAttempts: MFA_LOGIN_MAX_ATTEMPTS,
      requestedIp: metadata?.ip?.slice(0, 45) ?? null,
      userAgent: metadata?.userAgent ?? null,
    });

    const saved = await this.mfaLoginChallengeRepository.save(challenge);

    let deliveryChannel: MfaChallengeResponseData['deliveryChannel'] = 'email';
    let devCode: string | undefined;

    try {
      await this.mailService.enviarEmailCodigoMfa({
        to: user.email,
        usuario: user.nome,
        codigo,
        expiracaoMinutos: MFA_LOGIN_CODE_EXPIRATION_MINUTES,
      });
    } catch (error) {
      if (!this.isDevMfaFallbackEnabled()) {
        await this.mfaLoginChallengeRepository.update(saved.id, { usedAt: new Date() });
        throw new UnauthorizedException(
          'Nao foi possivel concluir a validacao em duas etapas. Tente novamente.',
        );
      }

      deliveryChannel = 'dev_fallback';
      devCode = codigo;
      this.logger.warn(
        `Falha ao enviar e-mail MFA para ${this.maskEmail(user.email)}. ` +
          `Fallback de desenvolvimento habilitado (challengeId=${saved.id}, codigo=${codigo}). Detalhes: ${
            error instanceof Error ? error.message : String(error)
          }`,
      );
    }

    securityLogger.mfaChallengeIssued(
      user.id,
      user.email,
      this.normalizarIp(metadata?.ip),
      saved.id,
    );

    return {
      challengeId: saved.id,
      email: this.maskEmail(user.email),
      expiresInSeconds: MFA_LOGIN_CODE_EXPIRATION_MINUTES * 60,
      canResendAfterSeconds: MFA_LOGIN_RESEND_COOLDOWN_SECONDS,
      deliveryChannel,
      devCode,
    };
  }

  async validateUser(email: string, password: string, metadata?: AuthRequestMetadata): Promise<any> {
    const identity = this.normalizeIdentityEmail(email);
    if (!identity || !password) {
      return null;
    }

    const lockoutEnabled = this.isLoginLockoutEnabled();
    if (lockoutEnabled) {
      await this.ensureLoginIdentityUnlocked(identity);
    }

    const user = await this.usersService.findByEmail(identity);

    if (user && (await bcrypt.compare(password, user.senha))) {
      if (lockoutEnabled) {
        await this.clearLoginAttempts(identity);
      }
      // Keep inactive users at this stage; login() applies first-access and activation rules.
      const { senha, ...result } = user;
      return result;
    }

    if (lockoutEnabled) {
      await this.registerFailedLoginAttempt(identity, user, metadata);
    }
    securityLogger.loginFailed(identity, this.normalizarIp(metadata?.ip), 'invalid_credentials');
    return null;
  }

  async login(user: User & { deve_trocar_senha?: boolean }, metadata?: AuthRequestMetadata) {
    if (user.deve_trocar_senha) {
      return {
        success: false,
        action: 'TROCAR_SENHA',
        data: {
          userId: user.id,
          email: user.email,
          nome: user.nome,
        },
        message: 'Por seguranca, e necessario cadastrar uma nova senha antes de continuar.',
      };
    }

    if (!user.ativo) {
      throw new UnauthorizedException(
        'Conta inativa ou pendente de ativacao por e-mail. Verifique sua caixa de entrada.',
      );
    }

    this.ensureEmpresaDisponivelParaSessao(user);

    const shouldRequireMfa = await this.shouldRequireAdminMfa(user);
    if (shouldRequireMfa) {
      const mfaChallenge = await this.criarDesafioMfaLogin(user, metadata);
      return {
        success: false,
        action: 'MFA_REQUIRED',
        data: mfaChallenge,
        message:
          'Validacao em duas etapas obrigatoria para concluir o acesso administrativo.',
      };
    }

    return this.buildAuthenticatedLoginResponse(user, 'login', metadata);
  }

  async verificarCodigoMfaLogin(
    challengeId: string,
    codigo: string,
    metadata?: AuthRequestMetadata,
  ) {
    const challengeIdNormalizado = challengeId?.trim();
    const codigoNormalizado = codigo?.trim();

    if (!challengeIdNormalizado || !codigoNormalizado) {
      throw new BadRequestException('Challenge e codigo MFA sao obrigatorios');
    }

    if (!/^\d{6}$/.test(codigoNormalizado)) {
      throw new BadRequestException('Codigo MFA deve conter 6 digitos numericos');
    }

    const challenge = await this.mfaLoginChallengeRepository.findOne({
      where: { id: challengeIdNormalizado },
    });

    if (!challenge) {
      throw new UnauthorizedException(MFA_INVALID_MESSAGE);
    }

    const ip = this.normalizarIp(metadata?.ip ?? challenge.requestedIp ?? undefined);
    const now = Date.now();
    const isExpired = challenge.expiresAt.getTime() < now;
    const isLocked = challenge.failedAttempts >= challenge.maxAttempts;
    const isConsumed = !!challenge.usedAt;

    if (isConsumed || isExpired || isLocked) {
      if (!challenge.usedAt) {
        challenge.usedAt = new Date();
        await this.mfaLoginChallengeRepository.save(challenge);
      }

      securityLogger.mfaChallengeFailed(
        challenge.userId,
        ip,
        isExpired ? 'expired' : isLocked ? 'max_attempts' : 'already_used',
        challenge.id,
      );

      throw new UnauthorizedException(MFA_INVALID_MESSAGE);
    }

    const codigoHash = this.hashValor(codigoNormalizado);
    if (codigoHash !== challenge.codeHash) {
      challenge.failedAttempts = (challenge.failedAttempts ?? 0) + 1;
      if (challenge.failedAttempts >= challenge.maxAttempts) {
        challenge.usedAt = new Date();
      }

      await this.mfaLoginChallengeRepository.save(challenge);
      securityLogger.mfaChallengeFailed(challenge.userId, ip, 'invalid_code', challenge.id);
      throw new UnauthorizedException(MFA_INVALID_MESSAGE);
    }

    challenge.usedAt = new Date();
    await this.mfaLoginChallengeRepository.save(challenge);

    const user = await this.usersService.findById(challenge.userId);

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado para validacao MFA');
    }

    if (!user.ativo || user.deve_trocar_senha) {
      throw new UnauthorizedException(
        'Sessao de autenticacao invalida. Refaca o login para continuar.',
      );
    }

    this.ensureEmpresaDisponivelParaSessao(user);

    securityLogger.mfaChallengeVerified(user.id, ip, challenge.id);

    return this.buildAuthenticatedLoginResponse(user, 'mfa_verify', metadata);
  }

  async reenviarCodigoMfaLogin(challengeId: string, metadata?: AuthRequestMetadata) {
    const challengeIdNormalizado = challengeId?.trim();
    if (!challengeIdNormalizado) {
      throw new BadRequestException('Challenge MFA invalido');
    }

    const challenge = await this.mfaLoginChallengeRepository.findOne({
      where: { id: challengeIdNormalizado },
    });

    if (!challenge || challenge.usedAt) {
      throw new UnauthorizedException('Desafio MFA invalido ou finalizado');
    }

    const elapsedSeconds = Math.floor((Date.now() - challenge.createdAt.getTime()) / 1000);
    if (elapsedSeconds < MFA_LOGIN_RESEND_COOLDOWN_SECONDS) {
      throw new BadRequestException(
        `Aguarde ${MFA_LOGIN_RESEND_COOLDOWN_SECONDS - elapsedSeconds}s para reenviar o codigo`,
      );
    }

    const user = challenge.user ?? (await this.usersService.findById(challenge.userId));
    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado para reenvio do MFA');
    }

    const shouldRequireMfa = await this.shouldRequireAdminMfa(user);
    if (!shouldRequireMfa) {
      throw new BadRequestException('MFA nao e mais obrigatorio para este usuario');
    }

    const novoDesafio = await this.criarDesafioMfaLogin(user, metadata);

    return {
      success: true,
      data: novoDesafio,
      message: 'Codigo de verificacao reenviado com sucesso',
    };
  }

  async register(userData: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    empresa_id: string;
  }) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('Email ja esta em uso');
    }

    const hashedPassword = await bcrypt.hash(userData.senha, 10);

    const user = await this.usersService.create({
      ...userData,
      senha: hashedPassword,
    });

    const { senha, ...result } = user;
    return {
      success: true,
      data: result,
      message: 'Usuario criado com sucesso',
    };
  }

  async refreshToken(refreshToken: string, metadata?: AuthRequestMetadata) {
    const normalizedRefreshToken = refreshToken?.trim();
    if (!normalizedRefreshToken) {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    const tokenHash = this.hashValor(normalizedRefreshToken);
    const currentSession = await this.authRefreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!currentSession) {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    if (currentSession.revokedAt) {
      const revokeReason = String(currentSession.revokeReason || '')
        .trim()
        .toLowerCase();

      if (revokeReason === REVOKE_REASON_SINGLE_SESSION) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODE_CONCURRENT_LOGIN,
          message: AUTH_ERROR_MESSAGE_CONCURRENT_LOGIN,
        });
      }

      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    if (currentSession.expiresAt.getTime() < Date.now()) {
      await this.authRefreshTokenRepository.update(
        { id: currentSession.id, revokedAt: IsNull() },
        {
          revokedAt: new Date(),
          revokeReason: 'expired',
        },
      );
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    const user = currentSession.user ?? (await this.usersService.findById(currentSession.userId));

    if (!user || !user.ativo || user.deve_trocar_senha) {
      await this.authRefreshTokenRepository.update(
        { id: currentSession.id, revokedAt: IsNull() },
        {
          revokedAt: new Date(),
          revokeReason: 'invalid_user',
        },
      );
      throw new UnauthorizedException('Sessao de autenticacao invalida. Refaca o login.');
    }

    this.ensureEmpresaDisponivelParaSessao(user);

    if (this.isAdminRoleForMfa(user.role)) {
      const idleTimeoutMs = this.getAdminIdleTimeoutMinutes() * 60 * 1000;
      const lastActivityTime =
        this.resolveDateToEpochMs(currentSession.lastActivityAt) ??
        this.resolveDateToEpochMs(currentSession.updatedAt) ??
        this.resolveDateToEpochMs(currentSession.createdAt);

      if (lastActivityTime !== null && Date.now() - lastActivityTime > idleTimeoutMs) {
        await this.authRefreshTokenRepository.update(
          { id: currentSession.id, revokedAt: IsNull() },
          {
            revokedAt: new Date(),
            revokeReason: REVOKE_REASON_IDLE_TIMEOUT,
          },
        );
        securityLogger.adminSessionLogout(
          user.id,
          String(user.role || ''),
          this.normalizarIp(metadata?.ip ?? currentSession.requestedIp ?? undefined),
          REVOKE_REASON_IDLE_TIMEOUT,
        );
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODE_IDLE_TIMEOUT,
          message: AUTH_ERROR_MESSAGE_IDLE_TIMEOUT,
        });
      }
    }

    const {
      sessionId: nextSessionId,
      token: nextRefreshToken,
      tokenHash: nextRefreshTokenHash,
    } = await this.issueRefreshToken(
      user,
      { mfaVerified: Boolean(currentSession.mfaVerified) },
      metadata,
    );

    const revoked = await this.revokeRefreshToken(normalizedRefreshToken, 'rotated', {
      replacedByTokenHash: nextRefreshTokenHash,
      userId: user.id,
    });

    if (!revoked) {
      await this.revokeRefreshToken(nextRefreshToken, 'rotation_conflict', {
        userId: user.id,
      });
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    const accessToken = await this.issueAccessToken(
      user,
      'refresh',
      nextSessionId,
      Boolean(currentSession.mfaVerified),
      metadata,
    );

    return {
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: nextRefreshToken,
      },
    };
  }

  async logout(
    user: User,
    metadata?: AuthRequestMetadata,
    reason?: string,
    refreshToken?: string,
  ) {
    if (refreshToken) {
      await this.revokeRefreshToken(refreshToken, 'logout', { userId: user.id });
    }

    if (this.isAdminRoleForMfa(user.role)) {
      securityLogger.adminSessionLogout(
        user.id,
        String(user.role || ''),
        this.normalizarIp(metadata?.ip),
        reason,
      );
    }

    return {
      success: true,
      message: 'Logout registrado com sucesso',
    };
  }

  async unlockLoginIdentity(
    email: string,
    actor: Pick<User, 'id' | 'role'>,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    const identity = this.normalizeIdentityEmail(email);
    if (!identity) {
      throw new BadRequestException('Email e obrigatorio para desbloqueio');
    }

    const attempt = await this.getLoginAttempt(identity);
    if (!attempt) {
      return {
        success: true,
        message: 'Nenhum bloqueio ativo encontrado para o e-mail informado',
      };
    }

    attempt.failedAttempts = 0;
    attempt.consecutiveLockouts = 0;
    attempt.firstFailedAt = null;
    attempt.lastFailedAt = null;
    attempt.lockedUntil = null;
    await this.authLoginAttemptRepository.save(attempt);

    securityLogger.loginLockoutUnlocked(identity, actor.id, reason);

    return {
      success: true,
      message: 'Bloqueio de login removido com sucesso',
    };
  }

  async trocarSenha(userId: string, senhaAntiga: string, senhaNova: string): Promise<any> {
    if (!userId) {
      throw new BadRequestException('Identificador do usuario e obrigatorio');
    }

    if (!senhaAntiga || typeof senhaAntiga !== 'string') {
      throw new BadRequestException('Senha temporaria e obrigatoria');
    }

    if (!senhaNova || typeof senhaNova !== 'string') {
      throw new BadRequestException('Nova senha e obrigatoria');
    }

    const senhaAntigaNormalizada = senhaAntiga.trim();
    const senhaNovaNormalizada = senhaNova.trim();

    if (senhaAntigaNormalizada.length === 0) {
      throw new BadRequestException('Senha temporaria nao pode ser vazia');
    }

    if (senhaNovaNormalizada.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    if (!user.senha) {
      throw new BadRequestException('Usuario nao possui senha cadastrada');
    }

    const senhaValida = await bcrypt.compare(senhaAntigaNormalizada, user.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(senhaNovaNormalizada, 10);
    await this.usersService.updatePassword(userId, hashedPassword, true);
    await this.revokeAllUserRefreshTokens(userId, 'password_changed');

    return {
      success: true,
      message: 'Senha alterada com sucesso! Voce ja pode fazer login.',
    };
  }

  async solicitarRecuperacaoSenha(
    email: string,
    metadata?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const emailNormalizado = email?.trim().toLowerCase();

    if (!emailNormalizado) {
      return;
    }

    const user = await this.usersService.findByEmail(emailNormalizado);

    if (!user) {
      return;
    }

    if (!this.mailService.isGlobalSmtpReady()) {
      this.logger.error(
        `Canal SMTP global indisponivel para recuperacao de senha. Solicitacao ignorada para ${this.maskEmail(user.email)}.`,
      );
      return;
    }

    await this.passwordResetTokenRepository.update(
      { user_id: user.id, used_at: IsNull() },
      { used_at: new Date() },
    );

    const { token, hash } = this.gerarTokenRecuperacao();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    const resetToken = this.passwordResetTokenRepository.create({
      user_id: user.id,
      token_hash: hash,
      expires_at: expiresAt,
      requested_ip: metadata?.ip?.slice(0, 45) ?? null,
      user_agent: metadata?.userAgent ?? null,
    });

    const savedResetToken = await this.passwordResetTokenRepository.save(resetToken);

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const resetLink = `${frontendBaseUrl}/recuperar-senha?token=${token}`;

    const expiracaoHoras = Math.max(1, Math.ceil(RESET_TOKEN_EXPIRATION_MINUTES / 60));

    try {
      await this.mailService.enviarEmailRecuperacaoSenha({
        to: user.email,
        usuario: user.nome,
        empresa: user.empresa?.nome,
        resetLink,
        expiracaoHoras,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail de recuperacao para ${this.maskEmail(user.email)}. Solicitacao sera mantida como sucesso para o cliente.`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.passwordResetTokenRepository.update(
          { id: savedResetToken.id, used_at: IsNull() },
          { used_at: new Date() },
        );
      } catch (invalidateError) {
        this.logger.warn(
          `Nao foi possivel invalidar token de recuperacao apos falha de e-mail para ${this.maskEmail(user.email)}: ${
            invalidateError instanceof Error ? invalidateError.message : String(invalidateError)
          }`,
        );
      }
    }
  }

  async resetarSenhaComToken(token: string, senhaNova: string) {
    const tokenNormalizado = token?.trim();

    if (!tokenNormalizado) {
      throw new BadRequestException('Token invalido ou expirado');
    }

    const tokenHash = createHash('sha256').update(tokenNormalizado).digest('hex');

    const registro = await this.passwordResetTokenRepository.findOne({
      where: { token_hash: tokenHash },
    });

    if (!registro || registro.used_at || registro.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Token invalido ou expirado');
    }

    const senhaNormalizada = senhaNova?.trim();

    if (!senhaNormalizada || senhaNormalizada.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(senhaNormalizada, 10);

    await this.usersService.updatePassword(registro.user_id, hashedPassword, true);
    await this.revokeAllUserRefreshTokens(registro.user_id, 'password_reset');

    registro.used_at = new Date();
    await this.passwordResetTokenRepository.save(registro);

    return {
      success: true,
      message: 'Senha alterada com sucesso! Voce ja pode fazer login.',
    };
  }

  async createTestUser() {
    const email = 'cache.test@conectcrm.com';

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await this.usersService.updatePassword(existingUser.id, hashedPassword, true);

      return {
        success: true,
        message: 'Usuario de teste atualizado com senha correta',
        credentials: {
          email: 'cache.test@conectcrm.com',
          password: 'Test@123',
        },
      };
    }

    const hashedPassword = await bcrypt.hash('Test@123', 10);

    const userData = {
      nome: 'Cache Test User',
      email,
      senha: hashedPassword,
      empresa_id: null,
      ativo: true,
      role: UserRole.ADMIN,
    };

    try {
      const user = await this.usersService.createWithHash(userData);

      return {
        success: true,
        message: 'Usuario de teste criado com sucesso!',
        credentials: {
          email: 'cache.test@conectcrm.com',
          password: 'Test@123',
        },
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
        },
      };
    } catch (error) {
      throw new BadRequestException('Erro ao criar usuario de teste: ' + error.message);
    }
  }
}
