import * as request from 'supertest';
import { SalesFlowE2EHarness } from '../_support/sales-flow-e2e.harness';

describe('Contratos - Fluxo de Assinatura (E2E)', () => {
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

  it('executa fluxo de contrato com PDF real e assinatura publica', async () => {
    const contrato = await h.criarContratoViaApi(h.tokenAdminEmpresaA, h.propostaEmpresaAId);
    h.contratoEmpresaAId = Number(contrato.id);

    const statusAposContratoGerado = await obterStatusProposta(h.propostaEmpresaAId);
    expect(statusAposContratoGerado).toBe('contrato_gerado');

    const pdfResponse = await request(h.httpServer)
      .get(`/contratos/${h.contratoEmpresaAId}/pdf`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send();

    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toContain('application/pdf');
    expect(String(pdfResponse.headers['content-disposition'] || '')).toContain('.pdf');

    const criarAssinaturaResponse = await request(h.httpServer)
      .post(`/contratos/${h.contratoEmpresaAId}/assinaturas`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        usuarioId: h.adminEmpresaAId,
        tipo: 'digital',
        dataExpiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    expect([200, 201]).toContain(criarAssinaturaResponse.status);
    expect(criarAssinaturaResponse.body?.success).toBe(true);
    const tokenAssinatura = criarAssinaturaResponse.body?.data?.tokenValidacao as string;
    expect(tokenAssinatura).toBeTruthy();

    const paginaAssinatura = await request(h.httpServer)
      .get(`/contratos/assinar/${tokenAssinatura}`)
      .send();

    expect(paginaAssinatura.status).toBe(200);
    expect(paginaAssinatura.body?.success).toBe(true);
    expect(paginaAssinatura.body?.data?.tokenValidacao).toBe(tokenAssinatura);

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
    expect(processarAssinatura.body?.data?.status).toBe('assinado');

    const contratoAtualizado = await request(h.httpServer)
      .get(`/contratos/${h.contratoEmpresaAId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send();

    expect(contratoAtualizado.status).toBe(200);
    expect(contratoAtualizado.body?.success).toBe(true);
    expect(contratoAtualizado.body?.data?.status).toBe('assinado');

    const statusAposContratoAssinado = await obterStatusProposta(h.propostaEmpresaAId);
    expect(statusAposContratoAssinado).toBe('contrato_assinado');
  });

  it('retorna 400 na pagina publica de assinatura quando token esta expirado', async () => {
    const propostaExpiracaoId = await h.criarPropostaViaApi(
      h.tokenAdminEmpresaA,
      `Portal E2E Expiracao ${h.runId}`,
    );
    const contratoExpiracao = await h.criarContratoViaApi(h.tokenAdminEmpresaA, propostaExpiracaoId);
    const contratoIdExpiracao = Number(contratoExpiracao.id);

    const criarAssinaturaExpirada = await request(h.httpServer)
      .post(`/contratos/${contratoIdExpiracao}/assinaturas`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        usuarioId: h.adminEmpresaAId,
        tipo: 'digital',
        dataExpiracao: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });

    expect([200, 201]).toContain(criarAssinaturaExpirada.status);
    expect(criarAssinaturaExpirada.body?.success).toBe(true);
    const tokenExpirado = criarAssinaturaExpirada.body?.data?.tokenValidacao as string;
    expect(tokenExpirado).toBeTruthy();

    const paginaAssinatura = await request(h.httpServer)
      .get(`/contratos/assinar/${tokenExpirado}`)
      .send();

    expect(paginaAssinatura.status).toBe(400);
    expect(String(paginaAssinatura.body?.message || '')).toMatch(/expirado/i);
  });

  it('bloqueia criacao de contrato quando proposta ainda nao foi aprovada', async () => {
    const propostaRascunhoId = await h.criarPropostaViaApi(
      h.tokenAdminEmpresaA,
      `Portal E2E Bloqueio Contrato ${h.runId}`,
    );

    const response = await request(h.httpServer)
      .post('/contratos')
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        propostaId: propostaRascunhoId,
        clienteId: h.clienteEmpresaAId,
        usuarioResponsavelId: h.adminEmpresaAId,
        tipo: 'servico',
        objeto: `Contrato bloqueado E2E ${h.runId}`,
        valorTotal: 3200,
        dataInicio: '2026-02-01',
        dataFim: '2027-02-01',
        dataVencimento: '2026-03-01',
      });

    expect(response.status).toBe(400);
    expect(String(response.body?.message || '')).toMatch(/deve estar aprovada/i);
  });
});
