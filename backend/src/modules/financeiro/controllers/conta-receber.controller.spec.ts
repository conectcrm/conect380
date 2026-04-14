import 'reflect-metadata';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { ContaReceberController } from './conta-receber.controller';

describe('ContaReceberController (permissions)', () => {
  it('deve exigir permissao de leitura de faturamento no controller', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, ContaReceberController);
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_READ]);
  });

  it('deve exigir permissao de gestao para registrar recebimento', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaReceberController.prototype.registrarRecebimento,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para criar lancamento avulso', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaReceberController.prototype.criarLancamentoAvulso,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });

  it('deve exigir permissao de gestao para reenviar cobranca', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      ContaReceberController.prototype.reenviarCobranca,
    );
    expect(permissions).toEqual([Permission.FINANCEIRO_FATURAMENTO_MANAGE]);
  });
});
