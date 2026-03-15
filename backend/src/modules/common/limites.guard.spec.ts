import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LimiteVerificacao, LimitesGuard } from './limites.guard';

describe('LimitesGuard', () => {
  const reflector = {
    get: jest.fn(),
  };
  const assinaturasService = {
    verificarLimites: jest.fn(),
  };

  const guard = new LimitesGuard(reflector as unknown as Reflector, assinaturasService as any);

  const makeContext = (user: Record<string, unknown> | undefined): ExecutionContext =>
    ({
      getHandler: () => makeContext,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const limiteUsuariosCreate: LimiteVerificacao = {
    tipo: 'usuarios',
    operacao: 'criar',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite acesso quando endpoint nao define limite', async () => {
    reflector.get.mockReturnValue(undefined);

    const allowed = await guard.canActivate(makeContext({ empresaId: 'empresa-1' }));

    expect(allowed).toBe(true);
    expect(assinaturasService.verificarLimites).not.toHaveBeenCalled();
  });

  it('usa empresa_id como fallback quando empresaId nao existe no token', async () => {
    reflector.get.mockReturnValue(limiteUsuariosCreate);
    assinaturasService.verificarLimites.mockResolvedValue({
      podeAdicionarUsuario: true,
    });

    const allowed = await guard.canActivate(makeContext({ empresa_id: 'empresa-2' }));

    expect(allowed).toBe(true);
    expect(assinaturasService.verificarLimites).toHaveBeenCalledWith('empresa-2');
  });

  it('bloqueia requisicao quando limite de usuarios foi atingido', async () => {
    reflector.get.mockReturnValue(limiteUsuariosCreate);
    assinaturasService.verificarLimites.mockResolvedValue({
      podeAdicionarUsuario: false,
      usuariosAtivos: 3,
      limiteUsuarios: 3,
    });

    try {
      await guard.canActivate(makeContext({ empresaId: 'empresa-3' }));
      throw new Error('expected guard rejection');
    } catch (error: any) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(error.getResponse()).toEqual(
        expect.objectContaining({
          code: 'USER_LIMIT_EXCEEDED',
          current: 3,
          limit: 3,
        }),
      );
    }
  });

  it('retorna unauthorized quando token nao possui empresa', async () => {
    reflector.get.mockReturnValue(limiteUsuariosCreate);

    await expect(guard.canActivate(makeContext({ id: 'user-1' }))).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });
  });
});
