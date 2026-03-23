import 'reflect-metadata';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { FaturamentoWebhookController } from './faturamento-webhook.controller';

describe('FaturamentoWebhookController (metadata)', () => {
  it('deve expor endpoint fiscal webhook como publico', () => {
    const isPublic = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      FaturamentoWebhookController.prototype.receberWebhookFiscalOficial,
    );
    expect(isPublic).toBe(true);
  });

  it('deve pular validacao de empresa no endpoint fiscal webhook', () => {
    const skipEmpresaValidation = Reflect.getMetadata(
      'skipEmpresaValidation',
      FaturamentoWebhookController.prototype.receberWebhookFiscalOficial,
    );
    expect(skipEmpresaValidation).toBe(true);
  });

  it('nao deve exigir permissao no endpoint fiscal webhook', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      FaturamentoWebhookController.prototype.receberWebhookFiscalOficial,
    );
    expect(permissions).toBeUndefined();
  });
});

