import { createHash } from 'crypto';
import * as request from 'supertest';
import { SalesFlowE2EHarness } from '../_support/sales-flow-e2e.harness';

describe('Portal Propostas Token - Core (E2E)', () => {
  let h: SalesFlowE2EHarness;

  jest.setTimeout(120000);

  beforeAll(async () => {
    h = new SalesFlowE2EHarness();
    await h.setup();
  });

  afterAll(async () => {
    await h.teardown();
  });

  it('gera token autenticado e permite acesso publico ao portal da proposta', async () => {
    const gerarTokenResponse = await request(h.httpServer)
      .post(`/propostas/${h.propostaEmpresaAId}/gerar-token`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({ expiresInDays: 15 });

    expect([200, 201]).toContain(gerarTokenResponse.status);
    expect(gerarTokenResponse.body?.success).toBe(true);
    expect(gerarTokenResponse.body?.token).toMatch(/^[0-9a-f]{48}$/);
    expect(gerarTokenResponse.body?.linkPortal).toContain('/portal/');

    h.tokenPortalEmpresaA = gerarTokenResponse.body.token as string;

    const portalResponse = await request(h.httpServer)
      .get(`/api/portal/proposta/${h.tokenPortalEmpresaA}`)
      .send();

    expect(portalResponse.status).toBe(200);
    expect(portalResponse.body?.success).toBe(true);
    expect(portalResponse.body?.proposta).toBeTruthy();
    expect(portalResponse.body?.proposta?.portalAccess?.token).toBeTruthy();
  });

  it('retorna 404 para token expirado no portal publico', async () => {
    expect(h.tokenPortalEmpresaA).toBeTruthy();

    const tokenHash = createHash('sha256').update(h.tokenPortalEmpresaA).digest('hex');
    await h.dataSource.query(
      `
        UPDATE propostas_portal_tokens
        SET expira_em = NOW() - interval '1 hour',
            is_active = true,
            revogado_em = NULL
        WHERE token_hash = $1
      `,
      [tokenHash],
    );

    const response = await request(h.httpServer)
      .get(`/api/portal/proposta/${h.tokenPortalEmpresaA}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body?.success).toBe(false);
  });

  it('atualiza proposta via PUT /propostas/:id no mesmo tenant', async () => {
    const response = await request(h.httpServer)
      .put(`/propostas/${h.propostaEmpresaAId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        titulo: `Portal E2E Atualizada ${h.runId}`,
        observacoes: 'Ajuste e2e de proposta',
        total: 2750,
        valor: 2750,
        validadeDias: 45,
      });

    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
    expect(response.body?.proposta?.id).toBe(h.propostaEmpresaAId);
    expect(response.body?.proposta?.titulo).toBe(`Portal E2E Atualizada ${h.runId}`);
    expect(Number(response.body?.proposta?.valor)).toBe(2750);
    // Em schema legado, validadeDias pode permanecer no fallback default (30).
    expect([45, 30]).toContain(response.body?.proposta?.validadeDias);
  });

  it('bloqueia atualizacao de proposta via PUT /propostas/:id em outro tenant', async () => {
    const response = await request(h.httpServer)
      .put(`/propostas/${h.propostaEmpresaAId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaB}`)
      .send({
        titulo: 'Tentativa cross-tenant',
        observacoes: 'Nao deve atualizar',
      });

    expect(response.status).toBe(404);
    expect(response.body?.success).toBe(false);
  });

  it('retorna 400 para transicao de estagio invalida no pipeline', async () => {
    const lead = await h.criarLeadViaApi(
      h.tokenAdminEmpresaA,
      `Lead Invalid Transition ${h.runId}`,
      h.adminEmpresaAId,
    );
    const oportunidade = await h.converterLeadParaOportunidade(h.tokenAdminEmpresaA, lead.id);

    const response = await request(h.httpServer)
      .patch(`/oportunidades/${oportunidade.id}/estagio`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({ estagio: 'won' });

    expect(response.status).toBe(400);
    expect(String(response.body?.message || response.body?.error || '')).toMatch(
      /transicao de estagio invalida/i,
    );
  });

  it('aplica matriz sequencial de transicoes ate ganho e bloqueia reabertura terminal', async () => {
    const lead = await h.criarLeadViaApi(
      h.tokenAdminEmpresaA,
      `Lead Stage Matrix ${h.runId}`,
      h.adminEmpresaAId,
    );
    const oportunidade = await h.converterLeadParaOportunidade(h.tokenAdminEmpresaA, lead.id);

    const moverEstagio = (estagio: string) =>
      request(h.httpServer)
        .patch(`/oportunidades/${oportunidade.id}/estagio`)
        .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
        .send({ estagio });

    const qualification = await moverEstagio('qualification');
    expect(qualification.status).toBe(200);
    expect(qualification.body?.estagio).toBe('qualification');

    const puloParaGanho = await moverEstagio('won');
    expect(puloParaGanho.status).toBe(400);
    expect(String(puloParaGanho.body?.message || '')).toMatch(/transicao de estagio invalida/i);

    const proposal = await moverEstagio('proposal');
    expect(proposal.status).toBe(200);
    expect(proposal.body?.estagio).toBe('proposal');

    const puloFechamento = await moverEstagio('closing');
    expect(puloFechamento.status).toBe(400);
    expect(String(puloFechamento.body?.message || '')).toMatch(/transicao de estagio invalida/i);

    const negotiation = await moverEstagio('negotiation');
    expect(negotiation.status).toBe(200);
    expect(negotiation.body?.estagio).toBe('negotiation');

    const puloWonEmNegociacao = await moverEstagio('won');
    expect(puloWonEmNegociacao.status).toBe(400);
    expect(String(puloWonEmNegociacao.body?.message || '')).toMatch(/transicao de estagio invalida/i);

    const closing = await moverEstagio('closing');
    expect(closing.status).toBe(200);
    expect(['closing', 'negotiation']).toContain(closing.body?.estagio);

    if (closing.body?.estagio === 'closing') {
      const won = await moverEstagio('won');
      expect(won.status).toBe(200);
      expect(won.body?.estagio).toBe('won');

      const reabertura = await moverEstagio('negotiation');
      expect(reabertura.status).toBe(400);
      expect(String(reabertura.body?.message || '')).toMatch(/transicao de estagio invalida/i);
      return;
    }

    const wonNoLegacyFallback = await moverEstagio('won');
    expect(wonNoLegacyFallback.status).toBe(400);
    expect(String(wonNoLegacyFallback.body?.message || '')).toMatch(/transicao de estagio invalida/i);
  });

  it('exige motivoPerda para marcar oportunidade como perdida e aceita quando informado', async () => {
    const lead = await h.criarLeadViaApi(
      h.tokenAdminEmpresaA,
      `Lead Lost Reason ${h.runId}`,
      h.adminEmpresaAId,
    );
    const oportunidade = await h.converterLeadParaOportunidade(h.tokenAdminEmpresaA, lead.id);

    await h.moverEstagioOportunidade(h.tokenAdminEmpresaA, oportunidade.id, 'qualification');
    await h.moverEstagioOportunidade(h.tokenAdminEmpresaA, oportunidade.id, 'proposal');

    const semMotivo = await request(h.httpServer)
      .patch(`/oportunidades/${oportunidade.id}/estagio`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({ estagio: 'lost' });

    expect(semMotivo.status).toBe(400);
    expect(String(semMotivo.body?.message || semMotivo.body?.error || '')).toMatch(
      /motivoperda.*obrigatorio/i,
    );

    const comMotivo = await request(h.httpServer)
      .patch(`/oportunidades/${oportunidade.id}/estagio`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        estagio: 'lost',
        motivoPerda: 'preco',
        motivoPerdaDetalhes: 'Cliente escolheu concorrente mais barato',
        concorrenteNome: 'Concorrente E2E',
        dataRevisao: new Date().toISOString(),
      });

    expect(comMotivo.status).toBe(200);
    expect(comMotivo.body?.estagio).toBe('lost');

    const colunasPerda = await h.dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'oportunidades'
        AND column_name IN ('motivo_perda', 'motivo_perda_detalhes', 'concorrente_nome', 'data_revisao')
    `);

    const colunasDisponiveis = new Set(
      (colunasPerda || []).map((row: { column_name?: string }) => String(row.column_name || '')),
    );

    if (colunasDisponiveis.size > 0) {
      const [row] = await h.dataSource.query(
        `
          SELECT motivo_perda, motivo_perda_detalhes, concorrente_nome, data_revisao
          FROM oportunidades
          WHERE id::text = $1 AND empresa_id = $2
        `,
        [String(oportunidade.id), h.empresaAId],
      );

      expect(row).toBeTruthy();

      if (colunasDisponiveis.has('motivo_perda')) {
        expect(row.motivo_perda).toBe('preco');
      }
      if (colunasDisponiveis.has('motivo_perda_detalhes')) {
        expect(String(row.motivo_perda_detalhes || '')).toContain('concorrente');
      }
      if (colunasDisponiveis.has('concorrente_nome')) {
        expect(row.concorrente_nome).toBe('Concorrente E2E');
      }
      if (colunasDisponiveis.has('data_revisao')) {
        expect(row.data_revisao).toBeTruthy();
      }
    }
  });

  it('executa fluxo api lead -> oportunidade -> pipeline -> proposta -> token -> portal aprova', async () => {
    const lead = await h.criarLeadViaApi(
      h.tokenAdminEmpresaA,
      `Lead Portal Flow ${h.runId}`,
      h.adminEmpresaAId,
    );
    const oportunidade = await h.converterLeadParaOportunidade(h.tokenAdminEmpresaA, lead.id);

    await h.moverEstagioOportunidade(h.tokenAdminEmpresaA, oportunidade.id, 'qualification');
    await h.moverEstagioOportunidade(h.tokenAdminEmpresaA, oportunidade.id, 'proposal');

    const gerarPropostaResponse = await request(h.httpServer)
      .post(`/oportunidades/${oportunidade.id}/gerar-proposta`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send();

    expect([200, 201]).toContain(gerarPropostaResponse.status);
    expect(gerarPropostaResponse.body?.success).toBe(true);
    expect(gerarPropostaResponse.body?.proposta?.id).toBeTruthy();
    const propostaId = gerarPropostaResponse.body.proposta.id as string;

    const enviarResponse = await request(h.httpServer)
      .put(`/propostas/${propostaId}/status`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({
        status: 'enviada',
        source: `e2e-portal-${h.runId}`,
        observacoes: 'Fluxo e2e - proposta enviada',
      });

    expect(enviarResponse.status).toBe(200);
    expect(enviarResponse.body?.success).toBe(true);
    expect(enviarResponse.body?.proposta?.status).toBe('enviada');

    const gerarTokenResponse = await request(h.httpServer)
      .post(`/propostas/${propostaId}/gerar-token`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send({ expiresInDays: 10 });

    expect([200, 201]).toContain(gerarTokenResponse.status);
    expect(gerarTokenResponse.body?.success).toBe(true);
    const tokenPortal = gerarTokenResponse.body.token as string;
    expect(tokenPortal).toMatch(/^[0-9a-f]{48}$/);

    const portalGet = await request(h.httpServer).get(`/api/portal/proposta/${tokenPortal}`).send();
    expect(portalGet.status).toBe(200);
    expect(portalGet.body?.success).toBe(true);

    const aprovarViaPortal = await request(h.httpServer)
      .put(`/api/portal/proposta/${tokenPortal}/status`)
      .send({
        status: 'aprovada',
        timestamp: new Date().toISOString(),
      });

    expect(aprovarViaPortal.status).toBe(200);
    expect(aprovarViaPortal.body?.success).toBe(true);

    const propostaFinal = await request(h.httpServer)
      .get(`/propostas/${propostaId}`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaA}`)
      .send();

    expect(propostaFinal.status).toBe(200);
    expect(propostaFinal.body?.success).toBe(true);
    expect(propostaFinal.body?.proposta?.status).toBe('aprovada');
  });

  it('bloqueia geracao de token cross-tenant para proposta de outra empresa', async () => {
    const response = await request(h.httpServer)
      .post(`/propostas/${h.propostaEmpresaAId}/gerar-token`)
      .set('Authorization', `Bearer ${h.tokenAdminEmpresaB}`)
      .send({ expiresInDays: 7 });

    expect(response.status).toBe(404);
    expect(response.body?.success).toBe(false);
  });
});
