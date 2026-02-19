import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRole } from './user.entity';

describe('UsersController Security', () => {
  const usersServiceMock = {
    update: jest.fn(),
    criar: jest.fn(),
    findOne: jest.fn(),
    atualizar: jest.fn(),
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
});
