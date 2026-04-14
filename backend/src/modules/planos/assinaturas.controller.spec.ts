import { AssinaturasController } from './assinaturas.controller';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CoreAdminLegacyTransitionGuard } from '../../common/guards/core-admin-legacy-transition.guard';

describe('AssinaturasController', () => {
  const assinaturasService = {
    criarAssinaturaPendenteParaCheckout: jest.fn(),
  };
  const paymentProvider = {
    assertCheckoutReady: jest.fn(),
    createPreference: jest.fn(),
  };
  const paymentProviderRegistryService = {
    getProvider: jest.fn(),
  };
  const assinaturaDueDateSchedulerService = {
    runDueDateStatusCycle: jest.fn(),
  };

  let controller: AssinaturasController;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalWebhookBaseUrl = process.env.WEBHOOK_BASE_URL;
  const originalMercadoPagoMock = process.env.MERCADO_PAGO_MOCK;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentProviderRegistryService.getProvider.mockReturnValue(paymentProvider);
    process.env.FRONTEND_URL = originalFrontendUrl;
    process.env.WEBHOOK_BASE_URL = originalWebhookBaseUrl;
    process.env.MERCADO_PAGO_MOCK = originalMercadoPagoMock;
    controller = new AssinaturasController(
      assinaturasService as any,
      paymentProviderRegistryService as any,
      assinaturaDueDateSchedulerService as any,
    );
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
    process.env.WEBHOOK_BASE_URL = originalWebhookBaseUrl;
    process.env.MERCADO_PAGO_MOCK = originalMercadoPagoMock;
  });

  it('gera checkout com external_reference no formato esperado', async () => {
    assinaturasService.criarAssinaturaPendenteParaCheckout.mockResolvedValueOnce({
      id: '22222222-2222-2222-2222-222222222222',
      plano: { nome: 'Business' },
      valorMensal: 549,
    });
    paymentProvider.createPreference.mockResolvedValueOnce({
      id: 'pref-123',
      init_point: 'https://checkout.example/pref-123',
      sandbox_init_point: 'https://sandbox.checkout.example/pref-123',
    });

    const req = {
      headers: { origin: 'https://app.conectcrm.com' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api.conectcrm.com'),
      user: { email: 'owner@empresa.com' },
    } as any;

    const result = await controller.criarCheckout(
      '11111111-1111-1111-1111-111111111111',
      { planoId: 'plan-business' } as any,
      req,
    );

    expect(paymentProviderRegistryService.getProvider).toHaveBeenCalledTimes(1);
    expect(paymentProvider.assertCheckoutReady).toHaveBeenCalledTimes(1);

    expect(result).toEqual(
      expect.objectContaining({
        assinaturaId: '22222222-2222-2222-2222-222222222222',
        externalReference:
          'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:22222222-2222-2222-2222-222222222222',
        preferenceId: 'pref-123',
      }),
    );
    expect(paymentProvider.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_url: 'https://api.conectcrm.com/mercadopago/webhooks',
      }),
    );
  });

  it('nao cria assinatura pendente quando checkout do provedor esta indisponivel', async () => {
    paymentProvider.assertCheckoutReady.mockImplementationOnce(() => {
      throw new Error('checkout indisponivel');
    });

    const req = {
      headers: { origin: 'https://app.conectcrm.com' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('api.conectcrm.com'),
      user: { email: 'owner@empresa.com' },
    } as any;

    await expect(
      controller.criarCheckout(
        '11111111-1111-1111-1111-111111111111',
        { planoId: 'plan-business' } as any,
        req,
      ),
    ).rejects.toThrow('checkout indisponivel');

    expect(assinaturasService.criarAssinaturaPendenteParaCheckout).not.toHaveBeenCalled();
    expect(paymentProvider.createPreference).not.toHaveBeenCalled();
  });

  it('prioriza FRONTEND_URL e WEBHOOK_BASE_URL configurados quando origin e local', async () => {
    process.env.FRONTEND_URL = 'https://5794-187-58-58-31.ngrok-free.app';
    process.env.WEBHOOK_BASE_URL = 'https://5794-187-58-58-31.ngrok-free.app';
    process.env.MERCADO_PAGO_MOCK = 'false';

    assinaturasService.criarAssinaturaPendenteParaCheckout.mockResolvedValueOnce({
      id: '22222222-2222-2222-2222-222222222222',
      plano: { nome: 'Business' },
      valorMensal: 549,
    });
    paymentProvider.createPreference.mockResolvedValueOnce({
      id: 'pref-123',
      init_point: 'https://checkout.example/pref-123',
      sandbox_init_point: 'https://sandbox.checkout.example/pref-123',
    });

    const req = {
      headers: { origin: 'http://localhost:3000' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3001'),
      user: { email: 'owner@empresa.com' },
    } as any;

    await controller.criarCheckout(
      '11111111-1111-1111-1111-111111111111',
      { planoId: 'plan-business' } as any,
      req,
    );

    expect(paymentProvider.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        back_urls: {
          success: 'https://5794-187-58-58-31.ngrok-free.app/billing?status=success',
          failure: 'https://5794-187-58-58-31.ngrok-free.app/billing?status=error',
          pending: 'https://5794-187-58-58-31.ngrok-free.app/billing?status=pending',
        },
        notification_url: 'https://5794-187-58-58-31.ngrok-free.app/mercadopago/webhooks',
      }),
    );
  });

  it('bloqueia checkout real com FRONTEND_URL local e nao cria assinatura pendente', async () => {
    process.env.FRONTEND_URL = '';
    process.env.WEBHOOK_BASE_URL = '';
    process.env.MERCADO_PAGO_MOCK = 'false';

    const req = {
      headers: { origin: 'http://localhost:3000' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3001'),
      user: { email: 'owner@empresa.com' },
    } as any;

    await expect(
      controller.criarCheckout(
        '11111111-1111-1111-1111-111111111111',
        { planoId: 'plan-business' } as any,
        req,
      ),
    ).rejects.toThrow(
      'Checkout Mercado Pago exige URL publica no retorno. Configure FRONTEND_URL com dominio HTTPS publico (ex.: ngrok ou dominio oficial).',
    );

    expect(assinaturasService.criarAssinaturaPendenteParaCheckout).not.toHaveBeenCalled();
    expect(paymentProvider.createPreference).not.toHaveBeenCalled();
  });

  it.each([
    'criar',
    'suspender',
    'reativar',
    'atualizarContadores',
    'registrarChamadaApi',
    'executarJobVencimento',
  ] as const)(
    'aplica CoreAdminLegacyTransitionGuard no metodo sensivel %s',
    (methodName) => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, AssinaturasController.prototype[methodName]);
      expect(Array.isArray(guards)).toBe(true);
      expect(guards).toContain(CoreAdminLegacyTransitionGuard);
    },
  );
});
