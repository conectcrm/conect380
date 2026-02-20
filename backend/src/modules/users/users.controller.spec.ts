import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRole } from './user.entity';

describe('UsersController Security', () => {
  const usersServiceMock = {
    update: jest.fn(),
    criar: jest.fn(),
    findOne: jest.fn(),
    atualizar: jest.fn(),
    listarComFiltros: jest.fn(),
    obterEstatisticas: jest.fn(),
    listarAtendentes: jest.fn(),
    findByEmpresa: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersServiceMock as any);
  });

  it('bloqueia tentativa de alterar role no proprio perfil', async () => {
    const user = {
      id: 'user-1',
      role: UserRole.VENDEDOR,
      empresa_id: 'empresa-1',
    } as any;

    await expect(controller.updateProfile(user, { role: UserRole.ADMIN } as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('impede vendedor de criar usuario', async () => {
    const vendedor = {
      id: 'user-2',
      role: UserRole.VENDEDOR,
      empresa_id: 'empresa-1',
    } as any;

    await expect(
      controller.criarUsuario(vendedor, {
        nome: 'Teste',
        email: 'teste@empresa.com',
        senha: '123456',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove senha da resposta ao criar usuario', async () => {
    const admin = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.criar.mockResolvedValue({
      id: 'novo-1',
      nome: 'Novo Usuario',
      email: 'novo@empresa.com',
      senha: 'hash-bcrypt',
      role: UserRole.VENDEDOR,
      empresa_id: 'empresa-1',
    });

    const result = await controller.criarUsuario(admin, {
      nome: 'Novo Usuario',
      email: 'novo@empresa.com',
      senha: '123456',
    });

    expect(result.data.senha).toBeUndefined();
  });

  it('impede admin de gerenciar outro admin da mesma empresa', async () => {
    const admin = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.findOne.mockResolvedValue({
      id: 'admin-2',
      role: UserRole.ADMIN,
      empresa_id: 'empresa-1',
    });

    await expect(controller.atualizarUsuario(admin, 'admin-2', { nome: 'Alterado' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejeita permissao invalida no create', async () => {
    const admin = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      empresa_id: 'empresa-1',
    } as any;

    await expect(
      controller.criarUsuario(admin, {
        nome: 'Teste',
        email: 'teste@empresa.com',
        senha: '123456',
        role: UserRole.VENDEDOR,
        permissoes: ['COMERCIAL'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('impede gerente de conceder permissao acima do proprio escopo', async () => {
    const gerente = {
      id: 'gerente-1',
      role: UserRole.GERENTE,
      empresa_id: 'empresa-1',
    } as any;

    await expect(
      controller.criarUsuario(gerente, {
        nome: 'Teste',
        email: 'teste2@empresa.com',
        senha: '123456',
        role: UserRole.VENDEDOR,
        permissoes: ['admin.empresas.manage'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('normaliza aliases legados de permissao antes de criar usuario', async () => {
    const admin = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.criar.mockResolvedValue({
      id: 'novo-2',
      nome: 'Novo Usuario',
      email: 'novo2@empresa.com',
      role: UserRole.VENDEDOR,
      empresa_id: 'empresa-1',
      permissoes: ['users.create', 'ATENDIMENTO'],
    });

    await controller.criarUsuario(admin, {
      nome: 'Novo Usuario',
      email: 'novo2@empresa.com',
      senha: '123456',
      role: UserRole.VENDEDOR,
      permissoes: ['USERS_CREATE', 'ATENDIMENTO'],
    });

    expect(usersServiceMock.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        permissoes: ['users.create', 'ATENDIMENTO'],
      }),
    );
  });

  it('rejeita permissao invalida no update', async () => {
    const admin = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.findOne.mockResolvedValue({
      id: 'user-3',
      role: UserRole.VENDEDOR,
      empresa_id: 'empresa-1',
    });

    await expect(
      controller.atualizarUsuario(admin, 'user-3', {
        permissoes: ['PERMISSAO_FANTASMA'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aplica escopo de leitura de time para gerente na listagem', async () => {
    const gerente = {
      id: 'gerente-1',
      role: UserRole.GERENTE,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.listarComFiltros.mockResolvedValue({
      usuarios: [],
      total: 0,
    });

    await controller.listarUsuarios(gerente);

    expect(usersServiceMock.listarComFiltros).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa_id: 'empresa-1',
        user_ids: ['gerente-1'],
        allowed_roles: [UserRole.VENDEDOR, UserRole.SUPORTE],
      }),
    );
  });

  it('aplica escopo proprio para role operacional no endpoint team', async () => {
    const suporte = {
      id: 'sup-1',
      role: UserRole.SUPORTE,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.findByEmpresa.mockResolvedValue([
      {
        id: 'sup-1',
        nome: 'Suporte 1',
        email: 'sup1@empresa.com',
        role: UserRole.SUPORTE,
        ativo: true,
      },
      {
        id: 'sup-2',
        nome: 'Suporte 2',
        email: 'sup2@empresa.com',
        role: UserRole.SUPORTE,
        ativo: true,
      },
    ]);

    const result = await controller.getTeam(suporte);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('sup-1');
  });

  it('propaga escopo de leitura para estatisticas', async () => {
    const gerente = {
      id: 'gerente-1',
      role: UserRole.GERENTE,
      empresa_id: 'empresa-1',
    } as any;

    usersServiceMock.obterEstatisticas.mockResolvedValue({
      total: 1,
      ativos: 1,
      inativos: 0,
      por_perfil: {
        admin: 0,
        gerente: 0,
        manager: 0,
        vendedor: 1,
        suporte: 0,
        financeiro: 0,
        user: 0,
      },
    });

    await controller.obterEstatisticas(gerente);

    expect(usersServiceMock.obterEstatisticas).toHaveBeenCalledWith('empresa-1', {
      user_ids: ['gerente-1'],
      allowed_roles: [UserRole.VENDEDOR, UserRole.SUPORTE],
    });
  });

  it('retorna catalogo canonico de permissoes para o frontend', async () => {
    const result = await controller.obterCatalogoPermissoes();

    expect(result.success).toBe(true);
    expect(result.data.groups.length).toBeGreaterThan(0);

    const atendimentoGroup = result.data.groups.find((group: { id: string }) => group.id === 'atendimento');
    if (!atendimentoGroup) {
      throw new Error('Grupo de atendimento nao encontrado no catalogo de permissoes');
    }
    expect(atendimentoGroup.options).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'atendimento.tickets.create' })]),
    );

    expect(result.data.defaultsByRole.manager).toEqual(expect.arrayContaining(['users.read']));
    expect(result.data.defaultsByRole.user).toEqual(
      expect.arrayContaining(['atendimento.tickets.read']),
    );
  });
});
