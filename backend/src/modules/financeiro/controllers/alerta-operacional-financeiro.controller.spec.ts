import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { AlertaOperacionalFinanceiroController } from './alerta-operacional-financeiro.controller';

describe('AlertaOperacionalFinanceiroController (permissions)', () => {
  it('deve exigir permissao de leitura no controller', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      AlertaOperacionalFinanceiroController,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_READ]);
  });

  it('deve exigir permissao de gestao para reconhecer alerta', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      AlertaOperacionalFinanceiroController.prototype.ack,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para resolver alerta', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      AlertaOperacionalFinanceiroController.prototype.resolver,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para recalcular alertas', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      AlertaOperacionalFinanceiroController.prototype.recalcular,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });
});
