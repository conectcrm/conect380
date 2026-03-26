import { MercadoPagoService } from './mercado-pago.service';
import { StatusPagamento } from '../faturamento/entities/pagamento.entity';

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
  const faturaRepository = {
    findOne: jest.fn(),
  };
  const pagamentoRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const pagamentoService = {
    processarPagamento: jest.fn(),
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
      faturaRepository as any,
      pagamentoRepository as any,
      pagamentoService as any,
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
    pagamentoService.processarPagamento.mockResolvedValue(undefined);

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
    pagamentoService.processarPagamento.mockResolvedValue(undefined);

    await service.processWebhook({
      topic: 'payment',
      resource: 'https://api.mercadopago.com/v1/payments/999001?foo=bar',
      action: 'updated',
    });

    expect(getPaymentSpy).toHaveBeenCalledWith('999001');
  });

  it('processa webhook subscription_preapproval e ativa assinatura vinculada', async () => {
    const assinaturaTrial = {
      id: '66666666-6666-6666-6666-666666666666',
      status: 'trial',
      observacoes: null,
      dataInicio: new Date('2026-01-01'),
      dataFim: null,
      proximoVencimento: new Date('2026-02-01'),
      renovacaoAutomatica: false,
    };

    const getSubscriptionSpy = jest
      .spyOn(service as any, 'getSubscriptionPreapproval')
      .mockResolvedValue({
        id: 'sub-001',
        status: 'authorized',
        external_reference:
          'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:66666666-6666-6666-6666-666666666666',
      });

    assinaturaRepository.findOne.mockResolvedValueOnce(assinaturaTrial);
    assinaturaRepository.save.mockImplementation(async (value: any) => value);

    await service.processWebhook({
      type: 'subscription_preapproval',
      data: { id: 'sub-001' },
      action: 'updated',
    });

    expect(getSubscriptionSpy).toHaveBeenCalledWith('sub-001');
    expect(assinaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '66666666-6666-6666-6666-666666666666',
        status: 'active',
        renovacaoAutomatica: true,
      }),
    );
  });

  it('processa webhook preapproval pausado e suspende assinatura ativa', async () => {
    const assinaturaAtiva = {
      id: '77777777-7777-7777-7777-777777777777',
      status: 'active',
      observacoes: null,
      renovacaoAutomatica: true,
    };

    jest.spyOn(service as any, 'getSubscriptionPreapproval').mockResolvedValue({
      id: 'sub-002',
      status: 'paused',
      external_reference:
        'conectcrm:empresa:11111111-1111-1111-1111-111111111111:assinatura:77777777-7777-7777-7777-777777777777',
    });

    assinaturaRepository.findOne.mockResolvedValueOnce(assinaturaAtiva);
    assinaturaRepository.save.mockImplementation(async (value: any) => value);

    await service.processWebhook({
      type: 'preapproval',
      data: { id: 'sub-002' },
      action: 'updated',
    });

    expect(assinaturaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '77777777-7777-7777-7777-777777777777',
        status: 'suspended',
        renovacaoAutomatica: false,
      }),
    );
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

  it('rejeita webhook sem secret em ambiente de producao', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADO_PAGO_ACCESS_TOKEN') return undefined;
      if (key === 'MERCADO_PAGO_MOCK') return 'true';
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    service = new MercadoPagoService(
      configService as any,
      assinaturaRepository as any,
      billingEventRepository as any,
      faturaRepository as any,
      pagamentoRepository as any,
      pagamentoService as any,
    );

    const result = await service.validateWebhookSignature(
      { data: { id: '123' } },
      'ts=1,v1=abc',
      'req-1',
    );

    expect(result).toBe(false);
  });

  it('bloqueia checkout quando Mercado Pago nao esta operacional', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MERCADO_PAGO_ACCESS_TOKEN') return undefined;
      if (key === 'MERCADO_PAGO_MOCK') return 'false';
      return undefined;
    });

    service = new MercadoPagoService(
      configService as any,
      assinaturaRepository as any,
      billingEventRepository as any,
      faturaRepository as any,
      pagamentoRepository as any,
      pagamentoService as any,
    );

    expect(() => service.assertCheckoutReady()).toThrow('Checkout Mercado Pago indisponivel');
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
    pagamentoService.processarPagamento.mockResolvedValue(undefined);
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

  it('processa webhook de fatura e delega atualizacao para PagamentoService', async () => {
    const payment = {
      id: 'mp-fatura-001',
      status: 'approved',
      external_reference: 'fatura:11111111-1111-1111-1111-111111111111:18',
      transaction_amount: 350.25,
    };

    const getPaymentSpy = jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    const handleApprovedSpy = jest.spyOn(service as any, 'handleApprovedPayment');
    billingEventRepository.insert.mockResolvedValueOnce({});
    pagamentoService.processarPagamento.mockResolvedValue(undefined);

    await service.processWebhook({
      type: 'payment',
      data: { id: 'mp-fatura-001' },
      action: 'updated',
    });

    expect(getPaymentSpy).toHaveBeenCalledWith('mp-fatura-001');
    expect(pagamentoService.processarPagamento).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayTransacaoId: 'fatura:11111111-1111-1111-1111-111111111111:18',
        novoStatus: StatusPagamento.APROVADO,
      }),
      '11111111-1111-1111-1111-111111111111',
    );
    expect(handleApprovedSpy).not.toHaveBeenCalled();
  });

  it('ignora webhook duplicado de fatura sem reprocessar pagamento', async () => {
    const payment = {
      id: 'mp-fatura-duplicado',
      status: 'approved',
      external_reference: 'fatura:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:27',
    };

    jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    billingEventRepository.insert
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: '23505' });
    pagamentoService.processarPagamento.mockResolvedValue(undefined);

    await service.processWebhook({
      type: 'payment',
      data: { id: 'mp-fatura-duplicado' },
      action: 'updated',
    });

    await service.processWebhook({
      type: 'payment',
      data: { id: 'mp-fatura-duplicado' },
      action: 'updated',
    });

    expect(pagamentoService.processarPagamento).toHaveBeenCalledTimes(1);
  });

  it('cria pagamento pendente quando webhook de fatura chega sem registro previo', async () => {
    const payment = {
      id: 'mp-fatura-sem-registro',
      status: 'approved',
      external_reference: 'fatura:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb:91',
      transaction_amount: 1200.5,
    };

    const pagamentoCriado = { id: 99 };
    jest.spyOn(service as any, 'getPayment').mockResolvedValue(payment);
    billingEventRepository.insert.mockResolvedValueOnce({});
    pagamentoService.processarPagamento
      .mockRejectedValueOnce(new Error('Pagamento no encontrado'))
      .mockResolvedValueOnce(undefined);
    pagamentoRepository.findOne.mockResolvedValueOnce(null);
    faturaRepository.findOne.mockResolvedValueOnce({
      id: 91,
      empresaId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      numero: 'FT2026000091',
      valorTotal: 1200.5,
      valorPago: 0,
      formaPagamentoPreferida: 'pix',
    });
    pagamentoRepository.create.mockReturnValue(pagamentoCriado);
    pagamentoRepository.save.mockResolvedValueOnce(pagamentoCriado);

    await service.processWebhook({
      type: 'payment',
      data: { id: 'mp-fatura-sem-registro' },
      action: 'updated',
    });

    expect(pagamentoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        faturaId: 91,
        gatewayTransacaoId: 'fatura:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb:91',
      }),
    );
    expect(pagamentoRepository.save).toHaveBeenCalledWith(pagamentoCriado);
    expect(pagamentoService.processarPagamento).toHaveBeenCalledTimes(2);
  });
});
