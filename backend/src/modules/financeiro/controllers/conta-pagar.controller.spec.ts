import 'reflect-metadata';
import { ContaPagarController } from './conta-pagar.controller';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';

describe('ContaPagarController (permissions)', () => {
  it('deve exigir permissao de leitura no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaPagarController);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_READ]);
  });

  it('deve exigir permissao de gestao para criar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaPagarController.prototype.create);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para atualizar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaPagarController.prototype.update);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para excluir', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaPagarController.prototype.remove);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para registrar pagamento', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaPagarController.prototype.registrarPagamento,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });
});
