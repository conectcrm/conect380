import * as request from 'supertest';
import { SalesFlowE2EHarness } from '../_support/sales-flow-e2e.harness';

describe('Faturamento, Pagamentos e Gateways (E2E)', () => {
  let h: SalesFlowE2EHarness;

  jest.setTimeout(120000);

  beforeAll(async () => {
    h = new SalesFlowE2EHarness();
    await h.setup();
  });

  afterAll(async () => {
    await h.teardown();
  });

  async function obterStatusProposta(propostaId: string): Promise<string> {
    const resposta = await request(h.httpServer)
      .get(`/propostas/${propostaId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send();

    expect(resposta.status).toBe(200);
    expect(resposta.body?.success).toBe(true);
    return String(resposta.body?.proposta?.status || '');
  }

  async function garantirContratoAssinado(): Promise<number> {
    if (h.contratoEmpresaAId) return h.contratoEmpresaAId;

    const contrato = await h.criarContratoViaApi(h.tokenAdminEmpresaA, h.propostaEmpresaAId);
    h.contratoEmpresaAId = Number(contrato.id);

    const criarAssinaturaResponse = await request(h.httpServer)
      .post(`/contratos/${h.contratoEmpresaAId}/assinaturas`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        usuarioId: h.adminEmpresaAId,
        tipo: 'digital',
        dataExpiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    expect([200, 201]).toContain(criarAssinaturaResponse.status);
    const tokenAssinatura = criarAssinaturaResponse.body?.data?.tokenValidacao as string;
    expect(tokenAssinatura).toBeTruthy();

    const processarAssinatura = await request(h.httpServer)
      .post('/contratos/assinar/processar')
      .send({
        tokenValidacao: tokenAssinatura,
        hashAssinatura: `sha256-e2e-${h.runId}`,
        ipAssinatura: '127.0.0.1',
        userAgent: 'jest-e2e',
      });

    expect(processarAssinatura.status).toBe(201);
    expect(processarAssinatura.body?.success).toBe(true);

    return h.contratoEmpresaAId;
  }

  it('executa fluxo de faturamento e pagamento apos contrato assinado', async () => {
    const contratoId = await garantirContratoAssinado();

    const gerarFaturaResponse = await request(h.httpServer)
      .post('/faturamento/faturas/automatica')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        contratoId,
        enviarEmail: false,
        observacoes: `Fatura automatica E2E ${h.runId}`,
      });

    expect([200, 201]).toContain(gerarFaturaResponse.status);
    expect(gerarFaturaResponse.body?.data?.id).toBeTruthy();
    expect(gerarFaturaResponse.body?.data?.status).toBeTruthy();
    h.faturaEmpresaAId = Number(gerarFaturaResponse.body.data.id);

    const statusAposFaturaCriada = await obterStatusProposta(h.propostaEmpresaAId);
    expect(statusAposFaturaCriada).toBe('fatura_criada');

    const gatewayTransacaoId = `e2e-gw-${h.runId}-${Date.now()}`;
    const transacaoId = `e2e-pay-${h.runId}-${Date.now()}`;

    const criarPagamentoResponse = await request(h.httpServer)
      .post('/faturamento/pagamentos')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        faturaId: h.faturaEmpresaAId,
        transacaoId,
        tipo: 'pagamento',
        valor: Number(gerarFaturaResponse.body.data.valorTotal),
        metodoPagamento: 'pix',
        gateway: 'manual',
        gatewayTransacaoId,
        observacoes: 'Pagamento manual e2e',
      });

    expect([200, 201]).toContain(criarPagamentoResponse.status);
    expect(criarPagamentoResponse.body?.data?.id).toBeTruthy();
    h.pagamentoEmpresaAId = Number(criarPagamentoResponse.body.data.id);
    expect(criarPagamentoResponse.body?.data?.status).toBe('pendente');

    const processarPagamentoResponse = await request(h.httpServer)
      .post('/faturamento/pagamentos/processar')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        gatewayTransacaoId,
        novoStatus: 'aprovado',
        webhookData: {
          source: 'e2e',
          timestamp: new Date().toISOString(),
        },
      });

    expect(processarPagamentoResponse.status).toBe(200);
    expect(processarPagamentoResponse.body?.data?.status).toBe('aprovado');

    const pagamentoFinal = await request(h.httpServer)
      .get(`/faturamento/pagamentos/${h.pagamentoEmpresaAId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(pagamentoFinal.status).toBe(200);
    expect(pagamentoFinal.body?.data?.status).toBe('aprovado');

    const faturaFinal = await request(h.httpServer)
      .get(`/faturamento/faturas/${h.faturaEmpresaAId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(faturaFinal.status).toBe(200);
    expect(faturaFinal.body?.data?.status).toBe('paga');
    expect(Number(faturaFinal.body?.data?.valorPago)).toBeGreaterThan(0);

    const statusAposPagamento = await obterStatusProposta(h.propostaEmpresaAId);
    expect(statusAposPagamento).toBe('pago');
  });

  it('retorna 501 ao tentar criar configuracao de gateway em producao sem provider habilitado', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalEnabled = process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
    const originalBypass = process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;

    process.env.NODE_ENV = 'production';
    delete process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
    delete process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;

    try {
      const response = await request(h.httpServer)
        .post('/pagamentos/gateways/configuracoes')
        .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
        .set('x-forwarded-proto', 'https')
        .send({
          nome: `Stripe E2E Blocked ${h.runId}`,
          gateway: 'stripe',
          modoOperacao: 'sandbox',
          status: 'ativo',
          credenciais: { api_key: 'fake-key' },
        });

      expect(response.status).toBe(501);
      expect(String(response.body?.message || '')).toMatch(/nao esta habilitado/i);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalEnabled === undefined) delete process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
      else process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = originalEnabled;
      if (originalBypass === undefined) delete process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;
      else process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED = originalBypass;
    }
  });

  it('retorna 501 ao tentar registrar transacao de gateway com provider desabilitado', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalEnabled = process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
    const originalBypass = process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;

    process.env.NODE_ENV = 'production';
    process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = 'mercado_pago';
    delete process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;

    try {
      const cfgResponse = await request(h.httpServer)
        .post('/pagamentos/gateways/configuracoes')
        .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
        .set('x-forwarded-proto', 'https')
        .send({
          nome: `MP E2E Allowed ${h.runId}`,
          gateway: 'mercado_pago',
          modoOperacao: 'sandbox',
          status: 'ativo',
          credenciais: { access_token: 'mp-fake-token' },
        });

      expect([200, 201]).toContain(cfgResponse.status);
      expect(cfgResponse.body?.id).toBeTruthy();
      h.configuracaoGatewayEmpresaAId = cfgResponse.body.id as string;

      process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = 'stripe';

      const trxResponse = await request(h.httpServer)
        .post('/pagamentos/gateways/transacoes')
        .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
        .set('x-forwarded-proto', 'https')
        .send({
          configuracaoId: h.configuracaoGatewayEmpresaAId,
          referenciaGateway: `gw-ref-${h.runId}`,
          valorBruto: 150.5,
          metodo: 'pix',
          tipoOperacao: 'cobranca',
        });

      expect(trxResponse.status).toBe(501);
      expect(String(trxResponse.body?.message || '')).toMatch(/nao esta habilitado/i);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalEnabled === undefined) delete process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
      else process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = originalEnabled;
      if (originalBypass === undefined) delete process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;
      else process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED = originalBypass;
    }
  });
});
