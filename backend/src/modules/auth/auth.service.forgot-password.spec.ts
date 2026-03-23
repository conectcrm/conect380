import { AuthService } from './auth.service';

describe('AuthService.solicitarRecuperacaoSenha', () => {
  const usersService = {
    findByEmail: jest.fn(),
    updateLastLogin: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };
  const mailService = {
    isGlobalSmtpReady: jest.fn(),
    enviarEmailCodigoMfa: jest.fn(),
    enviarEmailRecuperacaoSenha: jest.fn(),
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

  let service: AuthService;
  let originalFrontendUrl: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://conect360.com';

    passwordResetTokenRepository.create.mockImplementation((payload) => ({
      id: 'token-1',
      ...payload,
    }));
    passwordResetTokenRepository.save.mockImplementation(async (payload) => payload);
    passwordResetTokenRepository.update.mockResolvedValue({ affected: 1 });
    mailService.isGlobalSmtpReady.mockReturnValue(true);

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
    if (typeof originalFrontendUrl === 'undefined') {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
    jest.restoreAllMocks();
  });

  it('nao propaga erro quando envio de e-mail de recuperacao falha', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@empresa.com',
      nome: 'Cliente Teste',
      empresa: { nome: 'Empresa XPTO' },
    });
    mailService.enviarEmailRecuperacaoSenha.mockRejectedValue(new Error('SMTP indisponivel'));

    await expect(
      service.solicitarRecuperacaoSenha('cliente@empresa.com', {
        ip: '203.0.113.10',
        userAgent: 'jest-agent',
      }),
    ).resolves.toBeUndefined();

    expect(passwordResetTokenRepository.update).toHaveBeenCalledTimes(2);
    expect(passwordResetTokenRepository.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({ user_id: 'user-1' }),
    );
    expect(passwordResetTokenRepository.update.mock.calls[1][0]).toEqual(
      expect.objectContaining({ id: 'token-1' }),
    );
    expect(mailService.enviarEmailRecuperacaoSenha).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'cliente@empresa.com',
        resetLink: expect.stringContaining('/recuperar-senha?token='),
      }),
    );
  });

  it('nao cria token quando e-mail nao existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.solicitarRecuperacaoSenha('inexistente@empresa.com')).resolves.toBeUndefined();

    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
    expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    expect(mailService.enviarEmailRecuperacaoSenha).not.toHaveBeenCalled();
  });

  it('nao cria token quando SMTP global esta indisponivel', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'cliente@empresa.com',
      nome: 'Cliente Teste',
      empresa: { nome: 'Empresa XPTO' },
    });
    mailService.isGlobalSmtpReady.mockReturnValue(false);

    await expect(service.solicitarRecuperacaoSenha('cliente@empresa.com')).resolves.toBeUndefined();

    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
    expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    expect(mailService.enviarEmailRecuperacaoSenha).not.toHaveBeenCalled();
  });
});
