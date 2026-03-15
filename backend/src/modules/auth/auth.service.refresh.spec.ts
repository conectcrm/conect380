import { AuthService } from './auth.service';
import { securityLogger } from '../../config/logger.config';
import { UserRole } from '../users/user.entity';

describe('AuthService.refreshToken', () => {
  type RefreshSessionUser = {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
    ativo: boolean;
    deve_trocar_senha: boolean;
    empresa_id: string;
  };

  type RefreshSession = {
    id: string;
    userId: string;
    revokedAt: Date | null;
    revokeReason: string | null;
    replacedByTokenHash: string | null;
    expiresAt: Date;
    lastActivityAt: Date;
    requestedIp: string;
    updatedAt: Date;
    createdAt: Date;
    mfaVerified: boolean;
    user: RefreshSessionUser;
  };

  const usersService = {
    findById: jest.fn(),
    updateLastLogin: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };
  const mailService = {
    enviarEmailCodigoMfa: jest.fn(),
  };
  const passwordResetTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mfaLoginChallengeRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const authLoginAttemptRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };
  const authRefreshTokenRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const empresaConfigRepository = {
    findOne: jest.fn(),
  };

  const buildSession = (overrides: Partial<RefreshSession> = {}): RefreshSession => {
    const now = Date.now();
    const baseUser: RefreshSessionUser = {
      id: 'user-1',
      nome: 'Admin',
      email: 'admin@empresa.com',
      role: UserRole.ADMIN,
      ativo: true,
      deve_trocar_senha: false,
      empresa_id: 'empresa-1',
    };

    return {
      id: 'session-1',
      userId: 'user-1',
      revokedAt: null,
      revokeReason: null,
      replacedByTokenHash: null,
      expiresAt: new Date(now + 60 * 60 * 1000),
      lastActivityAt: new Date(now - 5 * 60 * 1000),
      requestedIp: '10.0.0.1',
      updatedAt: new Date(now - 5 * 60 * 1000),
      createdAt: new Date(now - 15 * 60 * 1000),
      mfaVerified: true,
      user: { ...baseUser, ...(overrides.user || {}) },
      ...overrides,
    };
  };

  let service: AuthService;
  let originalIdleTimeout: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalIdleTimeout = process.env.AUTH_ADMIN_IDLE_TIMEOUT_MINUTES;
    process.env.AUTH_ADMIN_IDLE_TIMEOUT_MINUTES = '30';

    service = new AuthService(
      usersService as any,
      jwtService as any,
      mailService as any,
      passwordResetTokenRepository as any,
      mfaLoginChallengeRepository as any,
      authLoginAttemptRepository as any,
      authRefreshTokenRepository as any,
      empresaConfigRepository as any,
    );
  });

  afterEach(() => {
    if (typeof originalIdleTimeout === 'undefined') {
      delete process.env.AUTH_ADMIN_IDLE_TIMEOUT_MINUTES;
    } else {
      process.env.AUTH_ADMIN_IDLE_TIMEOUT_MINUTES = originalIdleTimeout;
    }
    jest.restoreAllMocks();
  });

  it('revoga sessao administrativa expirada por inatividade', async () => {
    const staleSession = buildSession({
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
      updatedAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    authRefreshTokenRepository.findOne.mockResolvedValue(staleSession);
    authRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });
    const logoutSpy = jest.spyOn(securityLogger, 'adminSessionLogout').mockImplementation(() => undefined);
    const issueRefreshTokenSpy = jest.spyOn(service as any, 'issueRefreshToken');

    await expect(
      service.refreshToken('refresh-token-1', {
        ip: '203.0.113.10',
        userAgent: 'jest-agent',
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'SESSION_IDLE_TIMEOUT',
      },
      status: 401,
    });

    expect(authRefreshTokenRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: staleSession.id }),
      expect.objectContaining({ revokeReason: 'idle_timeout' }),
    );
    expect(logoutSpy).toHaveBeenCalledWith(
      staleSession.user.id,
      staleSession.user.role,
      '203.0.113.10',
      'idle_timeout',
    );
    expect(issueRefreshTokenSpy).not.toHaveBeenCalled();
  });

  it('permite refresh administrativo dentro da janela de inatividade', async () => {
    const activeSession = buildSession({
      lastActivityAt: new Date(Date.now() - 10 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000),
    });
    authRefreshTokenRepository.findOne.mockResolvedValue(activeSession);
    const logoutSpy = jest.spyOn(securityLogger, 'adminSessionLogout').mockImplementation(() => undefined);

    jest.spyOn(service as any, 'issueRefreshToken').mockResolvedValue({
      sessionId: 'session-2',
      token: 'next-refresh-token',
      tokenHash: 'next-refresh-hash',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    jest.spyOn(service as any, 'revokeRefreshToken').mockResolvedValue(true);
    jest.spyOn(service as any, 'issueAccessToken').mockResolvedValue('next-access-token');

    const result = await service.refreshToken('refresh-token-2', {
      ip: '198.51.100.20',
      userAgent: 'jest-agent',
    });

    expect(result).toEqual({
      success: true,
      data: {
        access_token: 'next-access-token',
        refresh_token: 'next-refresh-token',
      },
    });
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('aplica idle timeout mesmo quando lastActivityAt vem como string', async () => {
    const staleSession = buildSession({
      lastActivityAt: new Date(Date.now() - 45 * 60 * 1000),
      updatedAt: new Date(Date.now() - 45 * 60 * 1000),
    });
    (staleSession as any).lastActivityAt = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    authRefreshTokenRepository.findOne.mockResolvedValue(staleSession);
    authRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });

    await expect(service.refreshToken('refresh-token-string-date')).rejects.toMatchObject({
      response: {
        code: 'SESSION_IDLE_TIMEOUT',
      },
      status: 401,
    });
    expect(authRefreshTokenRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: staleSession.id }),
      expect.objectContaining({ revokeReason: 'idle_timeout' }),
    );
  });
});
