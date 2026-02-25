import 'reflect-metadata';
import { CotacaoController } from './cotacao.controller';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.constants';

describe('CotacaoController (permissions)', () => {
  it('deve exigir permissao comercial para converter em pedido', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.converterEmPedido,
    );

    expect(permissions).toEqual([Permission.COMERCIAL_PROPOSTAS_UPDATE]);
  });

  it('deve exigir permissao financeiro para marcar adquirido', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.marcarAdquirido,
    );

    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });

  it('deve exigir permissao financeiro para gerar conta a pagar', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.gerarContaPagar,
    );

    expect(permissions).toEqual([Permission.FINANCEIRO_PAGAMENTOS_MANAGE]);
  });
});
