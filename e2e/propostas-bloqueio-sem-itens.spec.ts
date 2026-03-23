import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_ID = 'prop-sem-itens-e2e-1';
const PROPOSTA_NUMERO = 'P-2026-E2E-SEM-ITENS';
const MENSAGEM_SEM_ITENS =
  'Adicione pelo menos 1 item/produto na proposta antes de enviar, aprovar ou gerar o PDF final.';

const PROPOSTA_SEM_ITENS = {
  id: PROPOSTA_ID,
  numero: PROPOSTA_NUMERO,
  titulo: 'Proposta sem itens para validacao E2E',
  cliente: {
    id: 'cli-e2e-sem-itens-1',
    nome: 'Cliente Sem Itens E2E',
    email: 'cliente.sem.itens@conectcrm.test',
    telefone: '(11) 98888-7777',
    documento: '98.765.432/0001-10',
    tipoPessoa: 'juridica',
  },
  vendedor: {
    id: 'user-e2e-1',
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
    telefone: '',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: 0,
  descontoGlobal: 0,
  impostos: 0,
  total: 0,
  status: 'rascunho',
  formaPagamento: 'avista',
  validadeDias: 15,
  observacoes: 'Rascunho criado sem itens para validar bloqueios',
  incluirImpostosPDF: false,
  produtos: [],
  tokenPortal: '654321',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const ESTATISTICAS_PROPOSTAS = {
  totalPropostas: 1,
  valorTotalPipeline: 0,
  taxaConversao: 0,
  propostasAprovadas: 0,
  estatisticasPorStatus: { rascunho: 1 },
  estatisticasPorVendedor: { 'Usuario E2E': 1 },
};

const setupPropostasSemItensApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  let pdfGenerationCalls = 0;
  let tokenGenerationCalls = 0;
  let emailSendCalls = 0;

  await mockPipelineUiApis(page, {
    oportunidades: [],
    metricas: {
      totalOportunidades: 0,
      valorTotalPipeline: 0,
      valorGanho: 0,
      taxaConversao: 0,
      valorMedio: 0,
      distribuicaoPorEstagio: {},
    },
    customHandler: async ({ method, pathname, route, url }) => {
      if (url.hostname !== 'localhost' || url.port !== '3001') {
        return false;
      }

      if (method === 'GET' && pathname.endsWith('/propostas')) {
        await json(route, 200, [PROPOSTA_SEM_ITENS]);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
        await json(route, 200, ESTATISTICAS_PROPOSTAS);
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_ID}`)) {
        await json(route, 200, { proposta: PROPOSTA_SEM_ITENS });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/clientes')) {
        await json(route, 200, {
          data: [PROPOSTA_SEM_ITENS.cliente],
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        });
        return true;
      }

      if (method === 'POST' && pathname.endsWith('/propostas/pdf/gerar/comercial')) {
        pdfGenerationCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF',
        });
        return true;
      }

      if (method === 'POST' && pathname.endsWith(`/propostas/${PROPOSTA_ID}/gerar-token`)) {
        tokenGenerationCalls += 1;
        await json(route, 200, { token: '123456' });
        return true;
      }

      if (method === 'POST' && pathname.endsWith('/email/enviar-proposta')) {
        emailSendCalls += 1;
        await json(route, 200, { success: true });
        return true;
      }

      return false;
    },
  });

  return {
    getPdfGenerationCalls: () => pdfGenerationCalls,
    getTokenGenerationCalls: () => tokenGenerationCalls,
    getEmailSendCalls: () => emailSendCalls,
  };
};

const abrirPropostaSemItens = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  await page.goto('/vendas/propostas');
  await expect(page.getByRole('heading', { name: 'Propostas', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole('button', { name: 'Visualizacao Cards' }).click();

  const propostaCard = page.locator('article', { hasText: PROPOSTA_NUMERO });
  await expect(propostaCard).toBeVisible({ timeout: 15000 });
  return propostaCard;
};

test.describe('Propostas - bloqueio sem itens comerciais', () => {
  test('bloqueia geracao de PDF quando a proposta nao possui itens', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasSemItensApis(page);

    const propostaCard = await abrirPropostaSemItens(page);

    await propostaCard.getByRole('button', { name: 'Baixar PDF' }).click();

    await expect(
      page.getByText(`Geracao de PDF bloqueada: ${MENSAGEM_SEM_ITENS}`),
    ).toBeVisible();
    expect(apiMonitor.getPdfGenerationCalls()).toBe(0);
  });

  test('bloqueia envio por email quando a proposta nao possui itens', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasSemItensApis(page);

    const propostaCard = await abrirPropostaSemItens(page);

    await expect(propostaCard.getByTitle('Enviar proposta por email e avancar para enviada')).toBeVisible();
    await expect(propostaCard.getByTitle('Enviar por email')).toHaveCount(0);

    await propostaCard.getByTitle('Enviar proposta por email e avancar para enviada').click();

    await expect(page.getByText(`Avanco de fluxo bloqueado: ${MENSAGEM_SEM_ITENS}`)).toBeVisible();
    expect(apiMonitor.getTokenGenerationCalls()).toBe(0);
    expect(apiMonitor.getEmailSendCalls()).toBe(0);
  });

  test('bloqueia compartilhamento quando a proposta nao possui itens', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasSemItensApis(page);

    const propostaCard = await abrirPropostaSemItens(page);

    await propostaCard.getByTitle('Compartilhar link').click();

    await expect(page.getByText(`Compartilhamento bloqueado: ${MENSAGEM_SEM_ITENS}`)).toBeVisible();
    expect(apiMonitor.getTokenGenerationCalls()).toBe(0);
  });
});
