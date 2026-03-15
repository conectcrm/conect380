import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { ContaBancariaController } from './conta-bancaria.controller';

describe('ContaBancariaController (permissions)', () => {
  it('deve exigir permissao de leitura no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaBancariaController);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_READ]);
  });

  it('deve exigir permissao de gestao para criar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaBancariaController.prototype.create);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para atualizar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaBancariaController.prototype.update);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para desativar', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaBancariaController.prototype.desativar,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para excluir', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaBancariaController.prototype.remove);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });
});
