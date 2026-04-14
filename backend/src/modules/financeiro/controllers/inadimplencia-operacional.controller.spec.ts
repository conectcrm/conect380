import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { InadimplenciaOperacionalController } from './inadimplencia-operacional.controller';

describe('InadimplenciaOperacionalController (permissions)', () => {
  it('deve exigir permissao de leitura de faturamento no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, InadimplenciaOperacionalController);
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_READ]);
  });

  it('deve exigir permissao de gestao para reavaliar cliente', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      InadimplenciaOperacionalController.prototype.reavaliarCliente,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para bloquear manualmente', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      InadimplenciaOperacionalController.prototype.bloquearManual,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para desbloquear manualmente', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      InadimplenciaOperacionalController.prototype.desbloquearManual,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para reprocessar a fila operacional', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      InadimplenciaOperacionalController.prototype.reprocessarFila,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });
});
