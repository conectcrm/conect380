import { AssinaturasController } from './assinaturas.controller';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { LegacyAdminTransitionGuard } from '../admin/guards/legacy-admin-transition.guard';

describe('AssinaturasController', () => {
  const assinaturasService = {
    criarAssinaturaPendenteParaCheckout: jest.fn(),
  };
  const mercadoPagoService = {
    createPreference: jest.fn(),
  };
  const assinaturaDueDateSchedulerService = {
    runDueDateStatusCycle: jest.fn(),
  };

  let controller: AssinaturasController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AssinaturasController(
      assinaturasService as any,
      mercadoPagoService as any,
      assinaturaDueDateSchedulerService as any,
    );
  });

  it('gera checkout com external_reference no formato esperado', async () => {
    assinaturasService.criarAssinaturaPendenteParaCheckout.mockResolvedValueOnce({
      id: '22222222-2222-2222-2222-222222222222',
      plano: { nome: 'Business' },
      valorMensal: 549,
    });
    mercadoPagoService.createPreference.mockResolvedValueOnce({
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

    expect(result).toEqual(
      expect.objectContaining({
        assinaturaId: '22222222-2222-2222-2222-222222222222',
        externalReference:
          'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:22222222-2222-2222-2222-222222222222',
        preferenceId: 'pref-123',
      }),
    );
    expect(mercadoPagoService.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_url: 'https://api.conectcrm.com/mercadopago/webhooks',
      }),
    );
  });

  it.each([
    'criar',
    'suspender',
    'reativar',
    'atualizarContadores',
    'registrarChamadaApi',
    'executarJobVencimento',
  ] as const)(
    'aplica LegacyAdminTransitionGuard no metodo sensivel %s',
    (methodName) => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, AssinaturasController.prototype[methodName]);
      expect(Array.isArray(guards)).toBe(true);
      expect(guards).toContain(LegacyAdminTransitionGuard);
    },
  );
});
