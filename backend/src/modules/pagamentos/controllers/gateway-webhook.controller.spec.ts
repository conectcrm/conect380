import 'reflect-metadata';
import { GatewayWebhookController } from './gateway-webhook.controller';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

describe('GatewayWebhookController (metadata)', () => {
  it('deve expor o endpoint de webhook como publico', () => {
    const isPublic = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      GatewayWebhookController.prototype.receberWebhook,
    );
    expect(isPublic).toBe(true);
  });

  it('deve pular validacao de empresa no endpoint de webhook', () => {
    const skipEmpresaValidation = Reflect.getMetadata(
      'skipEmpresaValidation',
      GatewayWebhookController.prototype.receberWebhook,
    );
    expect(skipEmpresaValidation).toBe(true);
  });

  it('nao deve exigir permissao de papel no endpoint de webhook', () => {
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      GatewayWebhookController.prototype.receberWebhook,
    );
    expect(permissions).toBeUndefined();
  });
});
