import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { FluxoCaixaController } from './fluxo-caixa.controller';

describe('FluxoCaixaController (permissions)', () => {
  it('deve exigir permissao de leitura de faturamento no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, FluxoCaixaController);
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_READ]);
  });
});
