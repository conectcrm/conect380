import { HttpException, HttpStatus } from '@nestjs/common';
import { AssinaturaMiddleware } from './assinatura.middleware';

describe('AssinaturaMiddleware', () => {
  const assinaturasService = {
    obterPoliticaTenant: jest.fn(),
    buscarPorEmpresa: jest.fn(),
    registrarChamadaApi: jest.fn(),
  };

  let middleware: AssinaturaMiddleware;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new AssinaturaMiddleware(assinaturasService as any);
    assinaturasService.obterPoliticaTenant.mockResolvedValue({
      isPlatformOwner: false,
      billingExempt: false,
      monitorOnlyLimits: false,
      fullModuleAccess: false,
      allowCheckout: true,
      allowPlanMutation: true,
      enforceLifecycleTransitions: true,
    });
    assinaturasService.registrarChamadaApi.mockResolvedValue(true);
  });

  it('permite requisicao quando modulo requerido esta incluido no plano', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Business',
        limiteUsuarios: 10,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 50000,
        modulosInclusos: [{ modulo: { codigo: 'FINANCEIRO' } }],
      },
    });

    const next = jest.fn();
    await middleware.use(
      {
        path: '/faturamento',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('permite rota CRM legada quando plano inclui CRM', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    await middleware.use(
      {
        path: '/eventos',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('permite rota de cotacao quando plano inclui modulo COMPRAS', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Business',
        limiteUsuarios: 10,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 50000,
        modulosInclusos: [{ modulo: { codigo: 'COMPRAS' } }],
      },
    });

    const next = jest.fn();
    await middleware.use(
      {
        path: '/cotacao',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('permite rota de cotacao com prefixo /api quando plano inclui COMPRAS', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Business',
        limiteUsuarios: 10,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 50000,
        modulosInclusos: [{ modulo: { codigo: 'COMPRAS' } }],
      },
    });

    const next = jest.fn();
    await middleware.use(
      {
        path: '/api/cotacao',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('bloqueia rota de cotacao quando plano possui apenas FINANCEIRO sem COMPRAS', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Business',
        limiteUsuarios: 10,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 50000,
        modulosInclusos: [{ modulo: { codigo: 'FINANCEIRO' } }],
      },
    });

    const next = jest.fn();
    await expect(
      middleware.use(
        {
          path: '/cotacao',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
  });

  it('bloqueia modulo sensivel nao incluido no plano', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    try {
      await middleware.use(
        {
          path: '/admin/empresas',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      );
      fail('expected middleware to throw HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.FORBIDDEN);
    }
  });

  it('bloqueia rota de vendas nao incluida no plano', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    await expect(
      middleware.use(
        {
          path: '/email',
          method: 'POST',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
  });

  it('bloqueia produtos quando plano nao inclui modulo VENDAS', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    await expect(
      middleware.use(
        {
          path: '/produtos',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
  });

  it('bloqueia rota de cotacao quando plano nao inclui COMPRAS', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    await expect(
      middleware.use(
        {
          path: '/cotacao',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
  });

  it('nao bloqueia consulta de modulos ativos da propria empresa', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    await middleware.use(
      {
        path: '/empresas/modulos/ativos',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('nao exige modulo ADMINISTRACAO para rota base de usuarios', async () => {
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce({
      status: 'active',
      usuariosAtivos: 1,
      clientesCadastrados: 10,
      storageUtilizado: 1024,
      apiCallsHoje: 2,
      plano: {
        nome: 'Starter',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 1024 * 1024 * 1024,
        limiteApiCalls: 5000,
        modulosInclusos: [{ modulo: { codigo: 'CRM' } }],
      },
    });

    const next = jest.fn();
    await middleware.use(
      {
        path: '/users',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('falha fechado quando ocorre erro interno de validacao', async () => {
    assinaturasService.buscarPorEmpresa.mockRejectedValueOnce(new Error('db_offline'));

    const next = jest.fn();
    await expect(
      middleware.use(
        {
          path: '/clientes',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });

  it('permite tenant proprietario mesmo sem assinatura ativa', async () => {
    assinaturasService.obterPoliticaTenant.mockResolvedValueOnce({
      isPlatformOwner: true,
      billingExempt: true,
      monitorOnlyLimits: true,
      fullModuleAccess: true,
      allowCheckout: false,
      allowPlanMutation: false,
      enforceLifecycleTransitions: false,
    });
    assinaturasService.buscarPorEmpresa.mockResolvedValueOnce(null);

    const next = jest.fn();
    await middleware.use(
      {
        path: '/clientes',
        method: 'GET',
        user: { empresaId: 'owner-tenant-id' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignora rotas do core-admin apos reescrita legada', async () => {
    const next = jest.fn();

    await middleware.use(
      {
        path: '/core-admin/bff/overview',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(assinaturasService.buscarPorEmpresa).not.toHaveBeenCalled();
  });

  it('ignora rota padrao de documentacao do core admin', async () => {
    const next = jest.fn();

    await middleware.use(
      {
        path: '/core-admin-docs-json',
        method: 'GET',
        user: { empresaId: '11111111-1111-1111-1111-111111111111' },
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(assinaturasService.buscarPorEmpresa).not.toHaveBeenCalled();
  });

  it('ignora rota customizada de documentacao do core admin via env', async () => {
    const previousCoreAdminDocsPath = process.env.CORE_ADMIN_DOCS_PATH;
    process.env.CORE_ADMIN_DOCS_PATH = 'docs-interno';

    const next = jest.fn();

    try {
      await middleware.use(
        {
          path: '/docs-interno',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      );
    } finally {
      if (previousCoreAdminDocsPath === undefined) {
        delete process.env.CORE_ADMIN_DOCS_PATH;
      } else {
        process.env.CORE_ADMIN_DOCS_PATH = previousCoreAdminDocsPath;
      }
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(assinaturasService.buscarPorEmpresa).not.toHaveBeenCalled();
  });

  it('mantem compatibilidade com GUARDIAN_DOCS_PATH legado', async () => {
    const previousCoreAdminDocsPath = process.env.CORE_ADMIN_DOCS_PATH;
    const previousGuardianDocsPath = process.env.GUARDIAN_DOCS_PATH;
    delete process.env.CORE_ADMIN_DOCS_PATH;
    process.env.GUARDIAN_DOCS_PATH = 'guardian-docs-legado';

    const next = jest.fn();

    try {
      await middleware.use(
        {
          path: '/guardian-docs-legado-json',
          method: 'GET',
          user: { empresaId: '11111111-1111-1111-1111-111111111111' },
        } as any,
        {} as any,
        next,
      );
    } finally {
      if (previousCoreAdminDocsPath === undefined) {
        delete process.env.CORE_ADMIN_DOCS_PATH;
      } else {
        process.env.CORE_ADMIN_DOCS_PATH = previousCoreAdminDocsPath;
      }

      if (previousGuardianDocsPath === undefined) {
        delete process.env.GUARDIAN_DOCS_PATH;
      } else {
        process.env.GUARDIAN_DOCS_PATH = previousGuardianDocsPath;
      }
    }

    expect(next).toHaveBeenCalledTimes(1);
    expect(assinaturasService.buscarPorEmpresa).not.toHaveBeenCalled();
  });
});
