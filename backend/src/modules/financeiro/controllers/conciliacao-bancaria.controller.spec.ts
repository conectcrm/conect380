import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { ConciliacaoBancariaController } from './conciliacao-bancaria.controller';

describe('ConciliacaoBancariaController (permissions)', () => {
  it('deve exigir permissao de leitura no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ConciliacaoBancariaController);
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_READ]);
  });

  it('deve exigir permissao de gestao para importar extrato', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ConciliacaoBancariaController.prototype.importarExtrato,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para executar matching automatico', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ConciliacaoBancariaController.prototype.executarMatchingAutomatico,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para conciliar item manualmente', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ConciliacaoBancariaController.prototype.conciliarItem,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para desconciliar item', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ConciliacaoBancariaController.prototype.desconciliarItem,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });
});
