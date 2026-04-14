import { HttpStatus } from '@nestjs/common';
import { MinhasEmpresasController } from './empresas.controller';
import { Permission } from '../common/permissions/permissions.constants';
import { UserRole } from '../modules/users/user.entity';

describe('MinhasEmpresasController - escopo de acesso', () => {
  let controller: MinhasEmpresasController;
  const originalOwnerEmpresaIds = process.env.PLATFORM_OWNER_EMPRESA_IDS;

  const empresasService = {
    listarTodasEmpresasParaGestao: jest.fn(),
    listarEmpresasDoPortfolio: jest.fn(),
    resolverOwnerKeyPortfolioPorEmpresa: jest.fn(),
    empresaPertenceAoPortfolio: jest.fn(),
    vincularEmpresaAoPortfolio: jest.fn(),
    vincularEmpresaAoPortfolioSeAusente: jest.fn(),
    obterEstatisticasCardEmpresas: jest.fn(),
    obterPorId: jest.fn(),
    atualizarEmpresaDoUsuario: jest.fn(),
    registrarEmpresa: jest.fn(),
    marcarAdminEmpresaComoSenhaTemporaria: jest.fn(),
    suspenderEmpresa: jest.fn(),
    reativarEmpresa: jest.fn(),
    cancelarServicoEmpresa: jest.fn(),
  };

  const criarEmpresa = (id: string, overrides: Record<string, unknown> = {}) =>
    ({
      id,
      nome: `Empresa ${id}`,
      cnpj: '12345678000195',
      email: `${id}@empresa.com`,
      telefone: '11999990000',
      endereco: 'Rua A, 100',
      plano: 'starter',
      status: 'active',
      ativo: true,
      data_expiracao: new Date('2026-12-31T00:00:00.000Z'),
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
      ultimo_acesso: new Date('2026-01-02T00:00:00.000Z'),
      configuracoes: {},
      limites: {},
      valor_mensal: 0,
      ...overrides,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    if (originalOwnerEmpresaIds === undefined) {
      delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
    } else {
      process.env.PLATFORM_OWNER_EMPRESA_IDS = originalOwnerEmpresaIds;
    }
    controller = new MinhasEmpresasController(empresasService as any);
  });

  afterAll(() => {
    if (originalOwnerEmpresaIds === undefined) {
      delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
      return;
    }

    process.env.PLATFORM_OWNER_EMPRESA_IDS = originalOwnerEmpresaIds;
  });

  it('retorna empresas do mesmo portfolio para admin sem tenant proprietario', async () => {
    const req = {
      user: {
        id: 'user-1',
        role: UserRole.ADMIN,
        empresa_id: 'empresa-1',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    empresasService.resolverOwnerKeyPortfolioPorEmpresa.mockResolvedValue('owner-key-1');
    empresasService.vincularEmpresaAoPortfolioSeAusente.mockResolvedValue(undefined);
    empresasService.listarEmpresasDoPortfolio.mockResolvedValue([criarEmpresa('empresa-1')]);
    empresasService.obterEstatisticasCardEmpresas.mockResolvedValue({
      'empresa-1': { usuariosAtivos: 1, totalUsuarios: 1, clientesCadastrados: 2 },
    });

    const response = await controller.getMinhasEmpresas(req as any);

    expect(empresasService.listarTodasEmpresasParaGestao).not.toHaveBeenCalled();
    expect(empresasService.listarEmpresasDoPortfolio).toHaveBeenCalledWith('owner-key-1');
    expect(response.empresas).toHaveLength(1);
    expect(response.empresas[0].id).toBe('empresa-1');
    expect(response.empresas[0].permissoes.podeGerenciarEmpresas).toBe(true);
  });

  it('restringe tenant proprietario da plataforma ao proprio contexto em minhas empresas', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'owner-tenant-id';

    const req = {
      user: {
        id: 'owner-user',
        role: UserRole.ADMIN,
        empresa_id: 'owner-tenant-id',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    controller = new MinhasEmpresasController(empresasService as any);
    empresasService.obterPorId.mockResolvedValue(criarEmpresa('owner-tenant-id'));
    empresasService.obterEstatisticasCardEmpresas.mockResolvedValue({
      'owner-tenant-id': { usuariosAtivos: 1, totalUsuarios: 1, clientesCadastrados: 1 },
    });

    const response = await controller.getMinhasEmpresas(req as any);

    expect(empresasService.listarTodasEmpresasParaGestao).not.toHaveBeenCalled();
    expect(empresasService.listarEmpresasDoPortfolio).not.toHaveBeenCalled();
    expect(response.empresas).toHaveLength(1);
    expect(response.empresas[0].id).toBe('owner-tenant-id');
    expect(response.empresas[0].permissoes.podeGerenciarEmpresas).toBe(false);
  });

  it('bloqueia switch para empresa diferente quando usuario nao e tenant proprietario', async () => {
    const req = {
      user: {
        id: 'user-1',
        role: UserRole.ADMIN,
        empresa_id: 'empresa-1',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    empresasService.resolverOwnerKeyPortfolioPorEmpresa.mockResolvedValue('owner-key-1');
    empresasService.empresaPertenceAoPortfolio.mockResolvedValue(false);

    await expect(controller.switchEmpresa(req as any, { empresaId: 'empresa-2' })).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
    expect(empresasService.empresaPertenceAoPortfolio).toHaveBeenCalledWith('empresa-2', 'owner-key-1');
    expect(empresasService.atualizarEmpresaDoUsuario).not.toHaveBeenCalled();
  });

  it('permite switch para empresa do mesmo portfolio sem tenant proprietario global', async () => {
    const req = {
      user: {
        id: 'user-1',
        role: UserRole.ADMIN,
        empresa_id: 'empresa-1',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    empresasService.resolverOwnerKeyPortfolioPorEmpresa.mockResolvedValue('owner-key-1');
    empresasService.empresaPertenceAoPortfolio.mockResolvedValue(true);
    empresasService.obterPorId.mockResolvedValue(criarEmpresa('empresa-2', { status: 'active' }));

    const response = await controller.switchEmpresa(req as any, { empresaId: 'empresa-2' });

    expect(empresasService.atualizarEmpresaDoUsuario).toHaveBeenCalledWith('user-1', 'empresa-2');
    expect(response).toMatchObject({
      success: true,
      empresaId: 'empresa-2',
    });
  });

  it('bloqueia switch para superadmin quando contexto atual e tenant proprietario da plataforma', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'owner-tenant-id';

    const req = {
      user: {
        id: 'owner-user',
        role: UserRole.SUPERADMIN,
        empresa_id: 'owner-tenant-id',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    controller = new MinhasEmpresasController(empresasService as any);

    await expect(
      controller.switchEmpresa(req as any, { empresaId: 'empresa-destino' }),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });

    expect(empresasService.empresaPertenceAoPortfolio).not.toHaveBeenCalled();
    expect(empresasService.atualizarEmpresaDoUsuario).not.toHaveBeenCalled();
  });

  it('nao expande portfolio para tenant cliente vinculado ao owner da plataforma', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'owner-tenant-id';

    const req = {
      user: {
        id: 'user-cliente',
        role: UserRole.ADMIN,
        empresa_id: 'empresa-cliente',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    controller = new MinhasEmpresasController(empresasService as any);
    empresasService.resolverOwnerKeyPortfolioPorEmpresa.mockResolvedValue('owner-tenant-id');
    empresasService.vincularEmpresaAoPortfolioSeAusente.mockResolvedValue(undefined);
    empresasService.listarEmpresasDoPortfolio.mockResolvedValue([criarEmpresa('empresa-cliente')]);
    empresasService.obterEstatisticasCardEmpresas.mockResolvedValue({
      'empresa-cliente': { usuariosAtivos: 1, totalUsuarios: 1, clientesCadastrados: 1 },
    });

    const response = await controller.getMinhasEmpresas(req as any);

    expect(empresasService.listarEmpresasDoPortfolio).toHaveBeenCalledWith('empresa-cliente');
    expect(response.empresas).toHaveLength(1);
    expect(response.empresas[0].id).toBe('empresa-cliente');
  });

  it('bloqueia operacoes de gestao no painel quando tenant atual e proprietario da plataforma', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'owner-tenant-id';

    const req = {
      user: {
        id: 'owner-user',
        role: UserRole.SUPERADMIN,
        empresa_id: 'owner-tenant-id',
        permissions: [Permission.ADMIN_EMPRESAS_MANAGE],
      },
    };

    controller = new MinhasEmpresasController(empresasService as any);

    await expect(
      controller.suspenderEmpresa(req as any, 'owner-tenant-id', { motivo: 'Teste' }),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });

    expect(empresasService.suspenderEmpresa).not.toHaveBeenCalled();
  });
});
