import { MercadoPagoService } from './mercado-pago.service';

describe('MercadoPagoService', () => {
  const configService = {
    get: jest.fn(),
  };
  const assinaturaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const billingEventRepository = {
    insert: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  let service: MercadoPagoService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADO_PAGO_ACCESS_TOKEN') return undefined;
      if (key === 'MERCADO_PAGO_MOCK') return 'true';
      return undefined;
    });

    service = new MercadoPagoService(
      configService as any,
      assinaturaRepository as any,
      billingEventRepository as any,
    );
  });

  it('ignora evento de pagamento duplicado', async () => {
    const payment = {
      id: '123456',
      status: 'approved',
      external_reference:
        'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:22222222-2222-2222-2222-222222222222',
    };

    const getPaymentSpy = jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    const handleApprovedSpy = jest
      .spyOn(service as any, 'handleApprovedPayment')
      .mockResolvedValue(undefined);

    billingEventRepository.insert.mockResolvedValueOnce({});
    await service.processWebhook({
      type: 'payment',
      data: { id: '123456' },
      action: 'updated',
    });

    expect(getPaymentSpy).toHaveBeenCalledTimes(1);
    expect(handleApprovedSpy).toHaveBeenCalledTimes(1);

    billingEventRepository.insert.mockRejectedValueOnce({ code: '23505' });
    await service.processWebhook({
      type: 'payment',
      data: { id: '123456' },
      action: 'updated',
    });

    expect(getPaymentSpy).toHaveBeenCalledTimes(2);
    expect(handleApprovedSpy).toHaveBeenCalledTimes(1);
  });

  it('resolve id de pagamento a partir de resource URL quando data.id nao existe', async () => {
    const payment = {
      id: '999001',
      status: 'approved',
      external_reference:
        'conectcrm:empresa:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:assinatura:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    };

    const getPaymentSpy = jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    jest.spyOn(service as any, 'handleApprovedPayment').mockResolvedValue(undefined);
    billingEventRepository.insert.mockResolvedValueOnce({});

    await service.processWebhook({
      topic: 'payment',
      resource: 'https://api.mercadopago.com/v1/payments/999001?foo=bar',
      action: 'updated',
    });

    expect(getPaymentSpy).toHaveBeenCalledWith('999001');
  });

  it('reconcilia pagamento rejeitado e move assinatura de active para past_due', async () => {
    const payment = {
      id: 'pay-200',
      status: 'rejected',
      external_reference:
        'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:22222222-2222-2222-2222-222222222222',
    };

    const assinatura = {
      id: '22222222-2222-2222-2222-222222222222',
      status: 'active',
      observacoes: null,
    };

    jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    assinaturaRepository.findOne.mockResolvedValueOnce(assinatura);
    assinaturaRepository.save.mockImplementation(async (value: any) => value);
    billingEventRepository.insert.mockResolvedValue({});

    const result = await service.reconcilePaymentById('pay-200');

    expect(result).toEqual(
      expect.objectContaining({
        paymentId: 'pay-200',
        action: 'updated',
        fromStatus: 'active',
        toStatus: 'past_due',
      }),
    );
    expect(assinaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'past_due',
      }),
    );
  });

  it('nao aplica reconciliacao quando transicao da assinatura e invalida', async () => {
    const payment = {
      id: 'pay-201',
      status: 'rejected',
      external_reference:
        'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:33333333-3333-3333-3333-333333333333',
    };

    const assinatura = {
      id: '33333333-3333-3333-3333-333333333333',
      status: 'trial',
      observacoes: null,
    };

    jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    assinaturaRepository.findOne.mockResolvedValueOnce(assinatura);
    billingEventRepository.insert.mockResolvedValue({});

    const result = await service.reconcilePaymentById('pay-201');

    expect(result).toEqual(
      expect.objectContaining({
        paymentId: 'pay-201',
        action: 'skipped',
        reason: 'invalid_transition',
        fromStatus: 'trial',
        toStatus: 'past_due',
      }),
    );
    expect(assinaturaRepository.save).not.toHaveBeenCalled();
  });

  it('executa reconciliacao em lote com base em eventos recebidos', async () => {
    billingEventRepository.manager.query.mockResolvedValueOnce([
      { payment_id: 'pay-300' },
      { payment_id: 'pay-301' },
      { payment_id: 'pay-300' },
    ]);

    const reconcileSpy = jest
      .spyOn(service, 'reconcilePaymentById')
      .mockResolvedValueOnce({
        paymentId: 'pay-300',
        source: 'batch',
        action: 'updated',
      } as any)
      .mockResolvedValueOnce({
        paymentId: 'pay-301',
        source: 'batch',
        action: 'aligned',
      } as any);

    const result = await service.reconcileRecentPayments({
      lookbackHours: 24,
      limit: 10,
    });

    expect(reconcileSpy).toHaveBeenCalledTimes(2);
    expect(reconcileSpy).toHaveBeenNthCalledWith(1, 'pay-300', 'batch');
    expect(reconcileSpy).toHaveBeenNthCalledWith(2, 'pay-301', 'batch');
    expect(result).toEqual(
      expect.objectContaining({
        candidates: 2,
        processed: 2,
        updated: 1,
        aligned: 1,
        skipped: 0,
        errors: 0,
      }),
    );
  });

  it('ativa assinatura no primeiro webhook e nao reaplica efeito no duplicado', async () => {
    const payment = {
      id: 'pay-dup-1',
      status: 'approved',
      external_reference:
        'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:44444444-4444-4444-4444-444444444444',
    };

    const assinaturaTrial = {
      id: '44444444-4444-4444-4444-444444444444',
      status: 'trial',
      observacoes: null,
      dataInicio: new Date('2026-01-01'),
      dataFim: null,
      proximoVencimento: new Date('2026-02-01'),
      renovacaoAutomatica: true,
    };

    jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    assinaturaRepository.findOne
      .mockResolvedValueOnce(assinaturaTrial)
      .mockResolvedValueOnce({
        ...assinaturaTrial,
        status: 'active',
      });
    assinaturaRepository.save.mockImplementation(async (value: any) => value);

    billingEventRepository.insert
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: '23505' })
      .mockResolvedValueOnce({});

    await service.processWebhook({
      type: 'payment',
      data: { id: 'pay-dup-1' },
      action: 'updated',
    });

    await service.processWebhook({
      type: 'payment',
      data: { id: 'pay-dup-1' },
      action: 'updated',
    });

    expect(assinaturaRepository.save).toHaveBeenCalledTimes(1);
    expect(assinaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '44444444-4444-4444-4444-444444444444',
        status: 'active',
      }),
    );
  });

  it('retorna erro de reconciliacao sem alterar estado local quando provedor esta indisponivel', async () => {
    jest.spyOn(service as any, 'getPayment').mockRejectedValueOnce(new Error('gateway_unavailable'));

    const result = await service.reconcilePaymentById('pay-offline');

    expect(result).toEqual(
      expect.objectContaining({
        paymentId: 'pay-offline',
        action: 'error',
      }),
    );
    expect(result.reason).toContain('gateway_unavailable');
    expect(assinaturaRepository.save).not.toHaveBeenCalled();
  });
});
