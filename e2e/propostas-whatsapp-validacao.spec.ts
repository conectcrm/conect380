import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_ID = 'prop-whatsapp-sem-telefone-e2e-1';
const PROPOSTA_NUMERO = 'P-2026-E2E-WPP-SEM-FONE';

const PROPOSTA_SEM_TELEFONE = {
  id: PROPOSTA_ID,
  numero: PROPOSTA_NUMERO,
  titulo: 'Proposta com item e sem telefone para validacao E2E',
  cliente: {
    id: 'cli-e2e-wpp-sem-fone-1',
    nome: 'Cliente WhatsApp Sem Telefone',
    email: 'cliente.whatsapp@conectcrm.test',
    telefone: '',
    documento: '12.345.678/0001-99',
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
  subtotal: 2500,
  descontoGlobal: 0,
  impostos: 0,
  total: 2500,
  status: 'enviada',
  formaPagamento: 'avista',
  validadeDias: 15,
  observacoes: 'Proposta com item e sem telefone para validar WhatsApp',
  incluirImpostosPDF: false,
  produtos: [
    {
      id: 'item-e2e-wpp-1',
      produtoId: 'produto-e2e-wpp-1',
      nome: 'Pacote Conect360',
      quantidade: 1,
      precoUnitario: 2500,
      desconto: 0,
      subtotal: 2500,
      tipoItem: 'servico',
      unidade: 'licenca',
    },
  ],
  tokenPortal: '987654',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const ESTATISTICAS_PROPOSTAS = {
  totalPropostas: 1,
  valorTotalPipeline: 2500,
  taxaConversao: 0,
  propostasAprovadas: 0,
  estatisticasPorStatus: { enviada: 1 },
  estatisticasPorVendedor: { 'Usuario E2E': 1 },
};

const setupPropostasWhatsAppApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  let pdfGenerationCalls = 0;

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
        await json(route, 200, [PROPOSTA_SEM_TELEFONE]);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
        await json(route, 200, ESTATISTICAS_PROPOSTAS);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/clientes')) {
        await json(route, 200, {
          data: [PROPOSTA_SEM_TELEFONE.cliente],
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

      return false;
    },
  });

  return {
    getPdfGenerationCalls: () => pdfGenerationCalls,
  };
};

test.describe('Propostas - validacao de WhatsApp', () => {
  test('bloqueia envio por WhatsApp antes de gerar PDF quando o cliente nao possui telefone', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasWhatsAppApis(page);

    await page.goto('/vendas/propostas');
    await expect(page.getByRole('heading', { name: 'Propostas', exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: 'Visualizacao Cards' }).click();

    const propostaCard = page.locator('article', { hasText: PROPOSTA_NUMERO });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });
    await expect(
      propostaCard.getByTitle('Enviar por WhatsApp (telefone do cliente sera validado antes de gerar o PDF)'),
    ).toBeVisible();

    await propostaCard
      .getByTitle('Enviar por WhatsApp (telefone do cliente sera validado antes de gerar o PDF)')
      .click();

    await expect(page.getByText('Cliente nao possui telefone cadastrado')).toBeVisible();
    expect(apiMonitor.getPdfGenerationCalls()).toBe(0);
  });
});
