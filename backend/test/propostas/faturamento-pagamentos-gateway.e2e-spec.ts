import * as request from 'supertest';
import { createHmac } from 'crypto';
import { SalesFlowE2EHarness } from '../_support/sales-flow-e2e.harness';
import { CreateWebhooksGatewayEventos1802885000000 } from '../../src/migrations/1802885000000-CreateWebhooksGatewayEventos';

describe('Faturamento, Pagamentos e Gateways (E2E)', () => {
  let h: SalesFlowE2EHarness;

  jest.setTimeout(120000);

  beforeAll(async () => {
    h = new SalesFlowE2EHarness();
    await h.setup();
    await ensureWebhooksGatewayEventos();
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

  async function criarContratoAssinadoParaNovaProposta(
    suffix: string,
  ): Promise<{ contratoId: number; propostaId: string }> {
    const propostaId = await h.criarPropostaViaApi(
      h.tokenAdminEmpresaA,
      `Portal E2E ${h.runId} ${suffix}`,
    );
    const contrato = await h.criarContratoViaApi(h.tokenAdminEmpresaA, propostaId);
    const contratoId = Number(contrato.id);

    const criarAssinaturaResponse = await request(h.httpServer)
      .post(`/contratos/${contratoId}/assinaturas`)
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
        hashAssinatura: `sha256-e2e-${h.runId}-${suffix}`,
        ipAssinatura: '127.0.0.1',
        userAgent: 'jest-e2e',
      });

    expect(processarAssinatura.status).toBe(201);
    expect(processarAssinatura.body?.success).toBe(true);

    return { contratoId, propostaId };
  }

  async function ensureWebhooksGatewayEventos(): Promise<void> {
    const migration = new CreateWebhooksGatewayEventos1802885000000();
    const queryRunner = h.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async function criarPagamentoPendente(valor?: number) {
    const contratoId = await garantirContratoAssinado();

    const gerarFaturaResponse = await request(h.httpServer)
      .post('/faturamento/faturas/automatica')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        contratoId,
        enviarEmail: false,
        observacoes: `Fatura webhook E2E ${h.runId}`,
      });

    expect([200, 201]).toContain(gerarFaturaResponse.status);
    expect(gerarFaturaResponse.body?.data?.id).toBeTruthy();
    const faturaId = Number(gerarFaturaResponse.body.data.id);
    const valorFatura = Number(gerarFaturaResponse.body.data.valorTotal || 0);
    const valorPagamento = Number(valor ?? valorFatura);

    const gatewayTransacaoId = `e2e-whk-${h.runId}-${Date.now()}`;
    const transacaoId = `e2e-whk-pay-${h.runId}-${Date.now()}`;

    const criarPagamentoResponse = await request(h.httpServer)
      .post('/faturamento/pagamentos')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        faturaId,
        transacaoId,
        tipo: 'pagamento',
        valor: valorPagamento,
        metodoPagamento: 'pix',
        gateway: 'manual',
        gatewayTransacaoId,
        observacoes: 'Pagamento pendente para webhook e2e',
      });

    expect([200, 201]).toContain(criarPagamentoResponse.status);
    expect(criarPagamentoResponse.body?.data?.id).toBeTruthy();

    return {
      faturaId,
      pagamentoId: Number(criarPagamentoResponse.body.data.id),
      gatewayTransacaoId,
      valorPagamento,
    };
  }

  async function garantirConfiguracaoWebhookPagSeguro(webhookSecret: string): Promise<void> {
    const configResponse = await request(h.httpServer)
      .post('/pagamentos/gateways/configuracoes')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        nome: `PagSeguro Webhook ${h.runId}`,
        gateway: 'pagseguro',
        modoOperacao: 'sandbox',
        status: 'ativo',
        webhookSecret,
        credenciais: { token: `fake-${h.runId}` },
      });

    expect([200, 201, 409]).toContain(configResponse.status);
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
    expect(faturaFinal.body?.data?.metadados?.recebivel?.status).toBe('baixado');

    const statusAposPagamento = await obterStatusProposta(h.propostaEmpresaAId);
    expect(statusAposPagamento).toBe('pago');
  });

  it('sincroniza proposta para contrato_assinado ao cancelar fatura', async () => {
    const { contratoId, propostaId } = await criarContratoAssinadoParaNovaProposta('cancelamento');

    const gerarFaturaResponse = await request(h.httpServer)
      .post('/faturamento/faturas/automatica')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        contratoId,
        enviarEmail: false,
        observacoes: `Fatura cancelamento E2E ${h.runId}`,
      });

    expect([200, 201]).toContain(gerarFaturaResponse.status);
    const faturaId = Number(gerarFaturaResponse.body?.data?.id);
    expect(faturaId).toBeTruthy();

    const statusAposCriacao = await obterStatusProposta(propostaId);
    expect(statusAposCriacao).toBe('fatura_criada');

    const cancelarResponse = await request(h.httpServer)
      .put(`/faturamento/faturas/${faturaId}/cancelar`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        motivo: 'Cancelamento operacional de teste',
      });

    expect(cancelarResponse.status).toBe(200);
    expect(cancelarResponse.body?.data?.status).toBe('cancelada');

    const statusAposCancelamento = await obterStatusProposta(propostaId);
    expect(statusAposCancelamento).toBe('contrato_assinado');
  });

  it('processa webhook valido com assinatura, sincroniza pagamento e registra auditoria idempotente', async () => {
    const webhookSecret = `whsec-${h.runId}`;
    await garantirConfiguracaoWebhookPagSeguro(webhookSecret);

    const { faturaId, pagamentoId, gatewayTransacaoId, valorPagamento } = await criarPagamentoPendente();
    const eventId = `evt-whk-${h.runId}-${Date.now()}`;
    const payload = {
      eventId,
      referenciaGateway: gatewayTransacaoId,
      status: 'approved',
      amount: valorPagamento,
      fee: 0,
      method: 'pix',
    };

    const signature =
      'sha256=' + createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    const response = await request(h.httpServer)
      .post(`/pagamentos/gateways/webhooks/pagseguro/${h.empresaAId}`)
      .set('x-signature', signature)
      .set('x-event-id', eventId)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        accepted: true,
        duplicate: false,
      }),
    );

    const pagamentoAtualizado = await request(h.httpServer)
      .get(`/faturamento/pagamentos/${pagamentoId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(pagamentoAtualizado.status).toBe(200);
    expect(pagamentoAtualizado.body?.data?.status).toBe('aprovado');

    const faturaAtualizada = await request(h.httpServer)
      .get(`/faturamento/faturas/${faturaId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(faturaAtualizada.status).toBe(200);
    expect(faturaAtualizada.body?.data?.status).toBe('paga');

    const auditoria = await h.dataSource.query(
      `
        SELECT idempotency_key, event_id, referencia_gateway, status, processado_em
        FROM webhooks_gateway_eventos
        WHERE empresa_id = $1 AND gateway = $2 AND idempotency_key = $3
        ORDER BY created_at DESC
      `,
      [h.empresaAId, 'pagseguro', eventId],
    );

    expect(auditoria).toHaveLength(1);
    expect(auditoria[0].idempotency_key).toBe(eventId);
    expect(auditoria[0].event_id).toBe(eventId);
    expect(auditoria[0].referencia_gateway).toBe(gatewayTransacaoId);
    expect(auditoria[0].status).toBe('processado');
    expect(auditoria[0].processado_em).toBeTruthy();

    const duplicateResponse = await request(h.httpServer)
      .post(`/pagamentos/gateways/webhooks/pagseguro/${h.empresaAId}`)
      .set('x-signature', signature)
      .set('x-event-id', eventId)
      .send(payload);

    expect(duplicateResponse.status).toBe(200);
    expect(duplicateResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        accepted: true,
        duplicate: true,
      }),
    );

    const auditoriaPosDuplicado = await h.dataSource.query(
      `
        SELECT COUNT(*)::int AS total
        FROM webhooks_gateway_eventos
        WHERE empresa_id = $1 AND gateway = $2 AND idempotency_key = $3
      `,
      [h.empresaAId, 'pagseguro', eventId],
    );

    expect(Number(auditoriaPosDuplicado[0].total)).toBe(1);
  });

  it('consulta trilha de auditoria por correlationId no fluxo webhook', async () => {
    const webhookSecret = `whsec-${h.runId}`;
    await garantirConfiguracaoWebhookPagSeguro(webhookSecret);

    const { gatewayTransacaoId, valorPagamento } = await criarPagamentoPendente();
    const eventId = `evt-whk-corr-${h.runId}-${Date.now()}`;
    const correlationId = `corr-${h.runId}-${Date.now()}`;
    const payload = {
      eventId,
      referenciaGateway: gatewayTransacaoId,
      status: 'approved',
      amount: valorPagamento,
      fee: 0,
      method: 'pix',
    };

    const signature =
      'sha256=' + createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    const webhookResponse = await request(h.httpServer)
      .post(`/pagamentos/gateways/webhooks/pagseguro/${h.empresaAId}`)
      .set('x-signature', signature)
      .set('x-event-id', eventId)
      .set('x-correlation-id', correlationId)
      .send(payload);

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body?.correlationId).toBe(correlationId);

    const trilhaResponse = await request(h.httpServer)
      .get(`/faturamento/auditoria/correlacao/${correlationId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(trilhaResponse.status).toBe(200);
    expect(trilhaResponse.body?.data?.correlationId).toBe(correlationId);
    expect(Number(trilhaResponse.body?.data?.resumo?.pagamentos || 0)).toBeGreaterThan(0);
    expect(Number(trilhaResponse.body?.data?.resumo?.faturas || 0)).toBeGreaterThan(0);
    expect(Number(trilhaResponse.body?.data?.resumo?.webhooks || 0)).toBeGreaterThan(0);
    expect(
      (trilhaResponse.body?.data?.pagamentos || []).some(
        (item: any) => String(item?.correlationId || '') === correlationId,
      ),
    ).toBe(true);
  });

  it('processa webhook rejected e sincroniza pagamento com motivo de rejeicao', async () => {
    const webhookSecret = `whsec-${h.runId}`;
    await garantirConfiguracaoWebhookPagSeguro(webhookSecret);

    const { faturaId, pagamentoId, gatewayTransacaoId, valorPagamento } = await criarPagamentoPendente();
    const eventId = `evt-whk-rejected-${h.runId}-${Date.now()}`;
    const payload = {
      eventId,
      referenciaGateway: gatewayTransacaoId,
      status: 'rejected',
      amount: valorPagamento,
      fee: 0,
      method: 'pix',
    };

    const signature =
      'sha256=' + createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    const response = await request(h.httpServer)
      .post(`/pagamentos/gateways/webhooks/pagseguro/${h.empresaAId}`)
      .set('x-signature', signature)
      .set('x-event-id', eventId)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        accepted: true,
        duplicate: false,
      }),
    );

    const pagamentoAtualizado = await request(h.httpServer)
      .get(`/faturamento/pagamentos/${pagamentoId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(pagamentoAtualizado.status).toBe(200);
    expect(pagamentoAtualizado.body?.data?.status).toBe('rejeitado');
    expect(String(pagamentoAtualizado.body?.data?.motivoRejeicao || '')).toContain('rejected');

    const faturaAtualizada = await request(h.httpServer)
      .get(`/faturamento/faturas/${faturaId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(faturaAtualizada.status).toBe(200);
    expect(String(faturaAtualizada.body?.data?.status || '')).not.toBe('paga');

    const auditoria = await h.dataSource.query(
      `
        SELECT idempotency_key, event_id, referencia_gateway, status, processado_em
        FROM webhooks_gateway_eventos
        WHERE empresa_id = $1 AND gateway = $2 AND idempotency_key = $3
        ORDER BY created_at DESC
      `,
      [h.empresaAId, 'pagseguro', eventId],
    );

    expect(auditoria).toHaveLength(1);
    expect(auditoria[0].idempotency_key).toBe(eventId);
    expect(auditoria[0].event_id).toBe(eventId);
    expect(auditoria[0].referencia_gateway).toBe(gatewayTransacaoId);
    expect(auditoria[0].status).toBe('processado');
    expect(auditoria[0].processado_em).toBeTruthy();
  });

  it('reabre recebivel quando pagamento aprovado recebe rejeicao posterior', async () => {
    const webhookSecret = `whsec-${h.runId}`;
    await garantirConfiguracaoWebhookPagSeguro(webhookSecret);

    const { faturaId, pagamentoId, gatewayTransacaoId, valorPagamento } = await criarPagamentoPendente();

    const payloadAprovado = {
      eventId: `evt-whk-approved-${h.runId}-${Date.now()}`,
      referenciaGateway: gatewayTransacaoId,
      status: 'approved',
      amount: valorPagamento,
      fee: 0,
      method: 'pix',
    };
    const assinaturaAprovado =
      'sha256=' + createHmac('sha256', webhookSecret).update(JSON.stringify(payloadAprovado)).digest('hex');

    const aprovadoResponse = await request(h.httpServer)
      .post(`/pagamentos/gateways/webhooks/pagseguro/${h.empresaAId}`)
      .set('x-signature', assinaturaAprovado)
      .set('x-event-id', payloadAprovado.eventId)
      .send(payloadAprovado);

    expect(aprovadoResponse.status).toBe(200);
    expect(aprovadoResponse.body?.success).toBe(true);

    const payloadRejeitado = {
      eventId: `evt-whk-chargeback-${h.runId}-${Date.now()}`,
      referenciaGateway: gatewayTransacaoId,
      status: 'rejected',
      amount: valorPagamento,
      fee: 0,
      method: 'pix',
    };
    const assinaturaRejeitado =
      'sha256=' + createHmac('sha256', webhookSecret).update(JSON.stringify(payloadRejeitado)).digest('hex');

    const rejeitadoResponse = await request(h.httpServer)
      .post(`/pagamentos/gateways/webhooks/pagseguro/${h.empresaAId}`)
      .set('x-signature', assinaturaRejeitado)
      .set('x-event-id', payloadRejeitado.eventId)
      .send(payloadRejeitado);

    expect(rejeitadoResponse.status).toBe(200);
    expect(rejeitadoResponse.body?.success).toBe(true);

    const pagamentoAtualizado = await request(h.httpServer)
      .get(`/faturamento/pagamentos/${pagamentoId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(pagamentoAtualizado.status).toBe(200);
    expect(pagamentoAtualizado.body?.data?.status).toBe('rejeitado');

    const faturaAtualizada = await request(h.httpServer)
      .get(`/faturamento/faturas/${faturaId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(faturaAtualizada.status).toBe(200);
    expect(String(faturaAtualizada.body?.data?.status || '')).toBe('pendente');
    expect(faturaAtualizada.body?.data?.metadados?.recebivel?.status).toBe('aberto');
  });

  it('estorna pagamento aprovado e retorna proposta para aguardando_pagamento', async () => {
    const contratoId = await garantirContratoAssinado();

    const gerarFaturaResponse = await request(h.httpServer)
      .post('/faturamento/faturas/automatica')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        contratoId,
        enviarEmail: false,
        observacoes: `Fatura estorno E2E ${h.runId}`,
      });

    expect([200, 201]).toContain(gerarFaturaResponse.status);
    const faturaId = Number(gerarFaturaResponse.body?.data?.id);
    const valorFatura = Number(gerarFaturaResponse.body?.data?.valorTotal || 0);

    const gatewayTransacaoId = `e2e-estorno-gw-${h.runId}-${Date.now()}`;
    const transacaoId = `e2e-estorno-pay-${h.runId}-${Date.now()}`;

    const criarPagamentoResponse = await request(h.httpServer)
      .post('/faturamento/pagamentos')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        faturaId,
        transacaoId,
        tipo: 'pagamento',
        valor: valorFatura,
        metodoPagamento: 'pix',
        gateway: 'manual',
        gatewayTransacaoId,
        observacoes: 'Pagamento para estorno e2e',
      });

    expect([200, 201]).toContain(criarPagamentoResponse.status);
    const pagamentoId = Number(criarPagamentoResponse.body?.data?.id);
    expect(pagamentoId).toBeTruthy();

    const processarPagamentoResponse = await request(h.httpServer)
      .post('/faturamento/pagamentos/processar')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        gatewayTransacaoId,
        novoStatus: 'aprovado',
        webhookData: {
          source: 'e2e-estorno',
          timestamp: new Date().toISOString(),
        },
      });

    expect(processarPagamentoResponse.status).toBe(200);
    expect(processarPagamentoResponse.body?.data?.status).toBe('aprovado');
    expect(await obterStatusProposta(h.propostaEmpresaAId)).toBe('pago');

    const estornoResponse = await request(h.httpServer)
      .post(`/faturamento/pagamentos/${pagamentoId}/estornar`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        motivo: 'Estorno operacional de teste',
      });

    expect(estornoResponse.status).toBe(201);
    expect(estornoResponse.body?.data?.tipo).toBe('estorno');
    expect(Number(estornoResponse.body?.data?.valor)).toBeLessThan(0);

    const faturaAtualizada = await request(h.httpServer)
      .get(`/faturamento/faturas/${faturaId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`);

    expect(faturaAtualizada.status).toBe(200);
    expect(String(faturaAtualizada.body?.data?.status || '')).toBe('pendente');
    expect(faturaAtualizada.body?.data?.metadados?.recebivel?.status).toBe('aberto');

    const statusAposEstorno = await obterStatusProposta(h.propostaEmpresaAId);
    expect(statusAposEstorno).toBe('aguardando_pagamento');
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
