import { FaturamentoService } from './faturamento.service';
import { FormaPagamento, StatusFatura } from '../entities/fatura.entity';

describe('FaturamentoService - configuracao de gateway por empresa', () => {
  const originalEnv = {
    FINANCEIRO_MVP_MODE: process.env.FINANCEIRO_MVP_MODE,
    MVP_MODE: process.env.MVP_MODE,
    FINANCEIRO_BOLETO_ENABLED: process.env.FINANCEIRO_BOLETO_ENABLED,
  };
  const faturaRepository = {
    save: jest.fn(async (value) => value),
  };
  const itemFaturaRepository = {};
  const pagamentoRepository = {
    findOne: jest.fn(async () => null),
    save: jest.fn(async (value) => value),
  };
  const contratoRepository = {};
  const clienteRepository = {
    findOne: jest.fn(),
  };
  const propostasService = {};
  const emailService = {
    obterDiagnosticoEntregaEmail: jest.fn(),
  };
  const mercadoPagoService = {
    createPreference: jest.fn(),
  };
  const empresaConfigRepository = {
    findOne: jest.fn(),
  };

  let service: FaturamentoService;
  let buscarFaturaPorIdSpy: jest.SpyInstance;
  let registrarPagamentoPendenteSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FINANCEIRO_MVP_MODE = 'false';
    process.env.MVP_MODE = 'false';
    process.env.FINANCEIRO_BOLETO_ENABLED = 'false';

    emailService.obterDiagnosticoEntregaEmail.mockResolvedValue({
      operacional: true,
      simulado: false,
      status: 'ok',
      detalhe: 'SMTP configurado.',
    });

    service = new FaturamentoService(
      faturaRepository as any,
      itemFaturaRepository as any,
      pagamentoRepository as any,
      contratoRepository as any,
      clienteRepository as any,
      propostasService as any,
      emailService as any,
      mercadoPagoService as any,
      empresaConfigRepository as any,
    );

    buscarFaturaPorIdSpy = jest.spyOn(service, 'buscarFaturaPorId');
    registrarPagamentoPendenteSpy = jest
      .spyOn(service as any, 'registrarPagamentoPendentePorLink')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.FINANCEIRO_MVP_MODE = originalEnv.FINANCEIRO_MVP_MODE;
    process.env.MVP_MODE = originalEnv.MVP_MODE;
    process.env.FINANCEIRO_BOLETO_ENABLED = originalEnv.FINANCEIRO_BOLETO_ENABLED;
  });

  const prepararCenarioGeracaoLink = (formaPagamentoPreferida: FormaPagamento) => {
    const faturaMock: any = {
      id: 701,
      numero: 'FT2026000701',
      clienteId: 'cliente-1',
      status: StatusFatura.PENDENTE,
      dataVencimento: new Date('2026-12-20T00:00:00.000Z'),
      valorTotal: 450,
      valorPago: 0,
      formaPagamentoPreferida,
      metadados: {},
    };

    empresaConfigRepository.findOne.mockResolvedValueOnce({
      gatewayPagamentoProvider: 'mercadopago',
      gatewayPagamentoAccessToken: 'token-tenant-123',
      gatewayPagamentoWebhookSecret: 'webhook-secret-tenant',
    });
    clienteRepository.findOne.mockResolvedValueOnce({
      id: 'cliente-1',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
    });
    mercadoPagoService.createPreference.mockResolvedValueOnce({
      id: 'pref-tenant-1',
      init_point: 'https://mercadopago.example/pref-tenant-1',
    });
    buscarFaturaPorIdSpy.mockResolvedValueOnce(faturaMock);

    return faturaMock;
  };

  it('marca bloqueio quando provider da empresa nao e suportado', async () => {
    empresaConfigRepository.findOne.mockResolvedValueOnce({
      gatewayPagamentoProvider: 'stripe',
      gatewayPagamentoAccessToken: null,
      gatewayPagamentoWebhookSecret: null,
    });

    const prontidao = await service.obterProntidaoCobranca('empresa-1');

    expect(prontidao.gateway.status).toBe('bloqueio');
    expect(prontidao.gateway.operacional).toBe(false);
    expect(prontidao.gateway.detalhe.toLowerCase()).toContain('nao suportado');
  });

  it('usa access token da empresa ao gerar link de pagamento', async () => {
    prepararCenarioGeracaoLink(FormaPagamento.PIX);

    const resultado = await service.gerarLinkPagamentoFatura(701, 'empresa-1');

    expect(mercadoPagoService.createPreference).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        accessTokenOverride: 'token-tenant-123',
      }),
    );
    expect(mercadoPagoService.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_methods: expect.objectContaining({
          default_payment_type_id: 'bank_transfer',
          default_payment_method_id: 'pix',
          excluded_payment_types: expect.arrayContaining([
            expect.objectContaining({ id: 'credit_card' }),
            expect.objectContaining({ id: 'debit_card' }),
            expect.objectContaining({ id: 'ticket' }),
          ]),
        }),
      }),
      expect.any(Object),
    );
    expect(resultado.link).toBe('https://mercadopago.example/pref-tenant-1');
    expect(registrarPagamentoPendenteSpy).toHaveBeenCalled();
  });

  it('restringe checkout para cartao de credito quando forma preferida for cartao_credito', async () => {
    prepararCenarioGeracaoLink(FormaPagamento.CARTAO_CREDITO);

    await service.gerarLinkPagamentoFatura(701, 'empresa-1');

    expect(mercadoPagoService.createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_methods: expect.objectContaining({
          default_payment_type_id: 'credit_card',
          excluded_payment_types: expect.arrayContaining([
            expect.objectContaining({ id: 'bank_transfer' }),
            expect.objectContaining({ id: 'ticket' }),
            expect.objectContaining({ id: 'debit_card' }),
          ]),
        }),
      }),
      expect.any(Object),
    );
  });

  it('nao tenta excluir account_money ao gerar checkout de boleto', async () => {
    process.env.FINANCEIRO_BOLETO_ENABLED = 'true';
    service = new FaturamentoService(
      faturaRepository as any,
      itemFaturaRepository as any,
      pagamentoRepository as any,
      contratoRepository as any,
      clienteRepository as any,
      propostasService as any,
      emailService as any,
      mercadoPagoService as any,
      empresaConfigRepository as any,
    );
    buscarFaturaPorIdSpy = jest.spyOn(service, 'buscarFaturaPorId');
    registrarPagamentoPendenteSpy = jest
      .spyOn(service as any, 'registrarPagamentoPendentePorLink')
      .mockResolvedValue(undefined);

    prepararCenarioGeracaoLink(FormaPagamento.BOLETO);

    await service.gerarLinkPagamentoFatura(701, 'empresa-1');

    const chamada = mercadoPagoService.createPreference.mock.calls[0];
    const payload = chamada?.[0] as { payment_methods?: { excluded_payment_types?: Array<{ id: string }> } };
    const tiposExcluidos = payload?.payment_methods?.excluded_payment_types ?? [];
    const idsExcluidos = tiposExcluidos.map((item) => item.id);

    expect(idsExcluidos).not.toContain('account_money');
    expect(payload?.payment_methods).toMatchObject({
      default_payment_type_id: 'ticket',
    });
  });

  it('bloqueia link online quando forma preferida exigir fluxo manual', async () => {
    prepararCenarioGeracaoLink(FormaPagamento.DINHEIRO);

    await expect(service.gerarLinkPagamentoFatura(701, 'empresa-1')).rejects.toThrow(
      /fluxo manual de recebimento/i,
    );
    expect(mercadoPagoService.createPreference).not.toHaveBeenCalled();
  });
});
