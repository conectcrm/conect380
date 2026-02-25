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

  it('executa fluxo de contrato com PDF real e assinatura publica', async () => {
    const contrato = await h.criarContratoViaApi(h.tokenAdminEmpresaA, h.propostaEmpresaAId);
    h.contratoEmpresaAId = Number(contrato.id);

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
  });

  it('retorna 400 na pagina publica de assinatura quando token esta expirado', async () => {
    const contratoExpiracao = await h.criarContratoViaApi(h.tokenAdminEmpresaA, h.propostaEmpresaAId);
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
});
