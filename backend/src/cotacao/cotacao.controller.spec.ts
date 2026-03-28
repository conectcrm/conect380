import 'reflect-metadata';
import { CotacaoController } from './cotacao.controller';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.constants';

describe('CotacaoController (permissions)', () => {
  it('deve exigir permissao de compras para converter em pedido', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.converterEmPedido,
    );

    expect(permissions).toEqual([Permission.COMPRAS_COTACOES_MANAGE]);
  });

  it('deve exigir permissao de compras para marcar adquirido', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.marcarAdquirido,
    );

    expect(permissions).toEqual([Permission.COMPRAS_COTACOES_MANAGE]);
  });

  it('deve exigir permissao de compras para gerar conta a pagar', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.gerarContaPagar,
    );

    expect(permissions).toEqual([Permission.COMPRAS_COTACOES_MANAGE]);
  });

  it('deve exigir permissao de aprovacoes para listar minhas aprovacoes', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CotacaoController.prototype.minhasAprovacoes,
    );

    expect(permissions).toEqual([Permission.COMPRAS_APROVACOES_READ]);
  });

  it('deve exigir permissao de aprovacoes para aprovar cotacao', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CotacaoController.prototype.aprovar);

    expect(permissions).toEqual([Permission.COMPRAS_APROVACOES_MANAGE]);
  });

  it('deve exigir permissao de aprovacoes para reprovar cotacao', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CotacaoController.prototype.reprovar);

    expect(permissions).toEqual([Permission.COMPRAS_APROVACOES_MANAGE]);
  });

  it('deve exigir permissao de aprovacoes para aprovar em lote', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CotacaoController.prototype.aprovarLote);

    expect(permissions).toEqual([Permission.COMPRAS_APROVACOES_MANAGE]);
  });

  it('deve exigir permissao de aprovacoes para reprovar em lote', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, CotacaoController.prototype.reprovarLote);

    expect(permissions).toEqual([Permission.COMPRAS_APROVACOES_MANAGE]);
  });
});
