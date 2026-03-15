import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_RASCUNHO_ID = 'prop-acoes-rascunho-e2e';
const PROPOSTA_VISUALIZADA_ID = 'prop-acoes-visualizada-e2e';
const PROPOSTA_REJEITADA_ID = 'prop-acoes-rejeitada-e2e';

const criarPropostaLista = (overrides: Record<string, unknown>) => ({
  id: `prop-${Math.random().toString(36).slice(2)}`,
  numero: 'PROP-BASE',
  cliente: 'Cliente Base',
  cliente_contato: 'cliente.base@conectcrm.test',
  titulo: 'Proposta base',
  valor: 15000,
  status: 'rascunho',
  data_criacao: '2026-03-13T08:10:28.000Z',
  data_vencimento: '2026-03-28T00:00:00.000Z',
  data_aprovacao: null,
  vendedor: 'Dhonleno',
  descricao: 'Descricao base',
  probabilidade: 30,
  categoria: 'Geral',
  urgencia: 'normal',
  dias_restantes: 15,
  ...overrides,
});

const ESTATISTICAS_PROPOSTAS = {
  totalPropostas: 3,
  valorTotalPipeline: 47000,
  taxaConversao: 0,
  propostasAprovadas: 0,
  estatisticasPorStatus: { rascunho: 1, visualizada: 1, rejeitada: 1 },
  estatisticasPorVendedor: { Dhonleno: 3 },
};

const setupPropostasAcoesStatusApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  const propostasState = [
    criarPropostaLista({
      id: PROPOSTA_RASCUNHO_ID,
      numero: 'PROP-RASCUNHO-001',
      cliente: 'Cliente Rascunho',
      cliente_contato: 'cliente.rascunho@conectcrm.test',
      titulo: 'Proposta em rascunho',
      status: 'rascunho',
      valor: 12000,
    }),
    criarPropostaLista({
      id: PROPOSTA_VISUALIZADA_ID,
      numero: 'PROP-VISUALIZADA-001',
      cliente: 'Cliente Visualizada',
      cliente_contato: 'cliente.visualizada@conectcrm.test',
      titulo: 'Proposta visualizada',
      status: 'visualizada',
      valor: 18000,
    }),
    criarPropostaLista({
      id: PROPOSTA_REJEITADA_ID,
      numero: 'PROP-REJEITADA-001',
      cliente: 'Cliente Rejeitada',
      cliente_contato: 'cliente.rejeitada@conectcrm.test',
      titulo: 'Proposta rejeitada',
      status: 'rejeitada',
      valor: 17000,
      motivoPerda: 'Cliente optou por outro fornecedor',
    }),
  ];

  let lastStatusUpdate: { id: string; status: string } | null = null;

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
    customHandler: async ({ method, pathname, route, request, url }) => {
      if (url.hostname !== 'localhost' || url.port !== '3001') {
        return false;
      }

      if (method === 'GET' && pathname.endsWith('/propostas')) {
        await json(route, 200, propostasState);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
        await json(route, 200, ESTATISTICAS_PROPOSTAS);
        return true;
      }

      if (method === 'PUT' && pathname.endsWith(`/propostas/${PROPOSTA_VISUALIZADA_ID}/status`)) {
        const body = request.postDataJSON() as { status?: string };
        const proposta = propostasState.find((item) => item.id === PROPOSTA_VISUALIZADA_ID);
        if (proposta && body?.status) {
          proposta.status = body.status;
          lastStatusUpdate = { id: PROPOSTA_VISUALIZADA_ID, status: body.status };
        }
        await json(route, 200, { proposta });
        return true;
      }

      return false;
    },
  });

  return {
    getLastStatusUpdate: () => lastStatusUpdate,
  };
};

test.describe('Propostas - acoes por status na listagem', () => {
  test('aplica visibilidade coerente por status e avanca visualizada para negociacao', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAcoesStatusApis(page);

    await page.goto('/vendas/propostas');
    await expect(page.getByRole('heading', { name: 'Propostas', exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: 'Visualizacao Lista' }).click();

    const rowRascunho = page.locator('tr', { hasText: 'PROP-RASCUNHO-001' });
    const rowVisualizada = page.locator('tr', { hasText: 'PROP-VISUALIZADA-001' });
    const rowRejeitada = page.locator('tr', { hasText: 'PROP-REJEITADA-001' });

    await expect(rowRascunho).toBeVisible();
    await expect(rowVisualizada).toBeVisible();
    await expect(rowRejeitada).toBeVisible();

    const acoesRascunho = rowRascunho.locator('td').last();
    await expect(
      acoesRascunho.locator(
        'button[title="Enviar por email"], button[title="Informar e-mail e enviar"]',
      ),
    ).toHaveCount(0);
    await expect(
      acoesRascunho.locator('button[title="Enviar proposta por email e avancar para enviada"]'),
    ).toHaveCount(1);
    await expect(acoesRascunho.locator('button[title*="WhatsApp"]')).toHaveCount(1);
    await expect(acoesRascunho.locator('button[title="Compartilhar link"]')).toHaveCount(1);

    const acoesRejeitada = rowRejeitada.locator('td').last();
    await expect(acoesRejeitada.locator('button[title="Visualizar proposta"]')).toHaveCount(1);
    await expect(acoesRejeitada.locator('button[title="Baixar PDF"]')).toHaveCount(1);
    await expect(acoesRejeitada.locator('button[title*="e-mail"]')).toHaveCount(0);
    await expect(acoesRejeitada.locator('button[title*="WhatsApp"]')).toHaveCount(0);
    await expect(acoesRejeitada.locator('button[title="Compartilhar link"]')).toHaveCount(0);
    await expect(acoesRejeitada.locator('button[title*="Avancar"]')).toHaveCount(0);

    const statusVisualizada = rowVisualizada.locator('td').nth(3);
    const acoesVisualizada = rowVisualizada.locator('td').last();
    await expect(
      acoesVisualizada.locator(
        'button[title="Enviar por email"], button[title="Informar e-mail e enviar"]',
      ),
    ).toHaveCount(1);
    await expect(
      acoesVisualizada.locator('button[title="Avancar proposta para negociacao"]'),
    ).toHaveCount(1);

    await acoesVisualizada.locator('button[title="Avancar proposta para negociacao"]').click();

    await expect(statusVisualizada).toContainText('Aprovada', { timeout: 15000 });
    expect(apiMonitor.getLastStatusUpdate()).toEqual({
      id: PROPOSTA_VISUALIZADA_ID,
      status: 'negociacao',
    });
  });
});
