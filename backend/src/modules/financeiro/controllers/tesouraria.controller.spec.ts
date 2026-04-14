import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { TesourariaController } from './tesouraria.controller';

describe('TesourariaController (permissions)', () => {
  it('deve exigir permissao de leitura de faturamento no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, TesourariaController);
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_READ]);
  });

  it('deve exigir permissao de gestao para criar transferencia', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      TesourariaController.prototype.criarTransferencia,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para aprovar transferencia', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      TesourariaController.prototype.aprovarTransferencia,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para cancelar transferencia', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      TesourariaController.prototype.cancelarTransferencia,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });
});
