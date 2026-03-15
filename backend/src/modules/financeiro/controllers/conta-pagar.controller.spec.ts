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

  it('deve exigir permissao de gestao para aprovar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaPagarController.prototype.aprovar);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para aprovar em lote', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaPagarController.prototype.aprovarLote,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve manter exportacao no escopo de leitura (sem override de gestao)', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaPagarController.prototype.exportarContasPagar,
    );
    expect(permissions).toBeUndefined();
  });

  it('deve manter historico de exportacao no escopo de leitura (sem override de gestao)', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaPagarController.prototype.listarHistoricoExportacoes,
    );
    expect(permissions).toBeUndefined();
  });

  it('deve exigir permissao de gestao para reprovar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaPagarController.prototype.reprovar);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });
});
