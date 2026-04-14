import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { CentroCustoController } from './centro-custo.controller';

describe('CentroCustoController (permissions)', () => {
  it('deve exigir permissao de leitura no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CentroCustoController);
    expect(permissions).toEqual([Permission.FINANCEIRO_CENTRO_CUSTOS_READ]);
  });

  it('deve exigir permissao de gestao para criar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CentroCustoController.prototype.create);
    expect(permissions).toEqual([Permission.FINANCEIRO_CENTRO_CUSTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para atualizar', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CentroCustoController.prototype.update);
    expect(permissions).toEqual([Permission.FINANCEIRO_CENTRO_CUSTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para desativar', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CentroCustoController.prototype.desativar,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_CENTRO_CUSTOS_MANAGE]);
  });

  it('deve exigir permissao de gestao para excluir', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CentroCustoController.prototype.remove);
    expect(permissions).toEqual([Permission.FINANCEIRO_CENTRO_CUSTOS_MANAGE]);
  });
});
