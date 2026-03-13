import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_ID = 'prop-visual-modal-e2e-1';
const PROPOSTA_NUMERO = 'PROP-2026-VISUAL-E2E';

const PRODUTO_DETALHE = {
  id: 'prod-visual-modal-e2e-1',
  nome: 'pacote conect360',
  descricao: 'Pacote principal da proposta visual',
  preco: 2500,
  categoria: 'Servicos',
  tipo: 'servico',
  status: 'ativo',
  unidade: 'pacote',
  tipoItem: 'pacote',
};

const PROPOSTA_VISUAL = {
  id: PROPOSTA_ID,
  numero: PROPOSTA_NUMERO,
  titulo: 'DIEGO HENRIQUE',
  cliente: {
    id: 'cli-visual-modal-e2e-1',
    nome: 'DIEGO HENRIQUE',
    email: '',
    telefone: '',
    documento: '',
    tipoPessoa: 'fisica',
  },
  vendedor: {
    id: 'user-e2e-1',
    nome: 'Dhonleno',
    email: 'dhonleno@conectcrm.test',
    telefone: '',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: 25000,
  descontoGlobal: 8.5,
  impostos: 0,
  total: 22875,
  valor: 22875,
  status: 'rascunho',
  formaPagamento: 'parcelado',
  parcelas: 6,
  validadeDias: 15,
  dataValidade: '2026-03-28T00:00:00.000Z',
  observacoes: 'Observacao comercial para validar o modal reorganizado.',
  incluirImpostosPDF: false,
  produtos: [
    {
      id: PRODUTO_DETALHE.id,
      produtoId: PRODUTO_DETALHE.id,
      quantidade: 10,
      desconto: 0,
      subtotal: 25000,
      produto: PRODUTO_DETALHE,
    },
  ],
  tokenPortal: '112233',
  data_criacao: '2026-03-13T08:10:28.000Z',
  data_vencimento: '2026-03-28T00:00:00.000Z',
  createdAt: '2026-03-13T08:10:28.000Z',
  updatedAt: '2026-03-13T08:10:28.000Z',
  criadaEm: '2026-03-13T08:10:28.000Z',
  atualizadaEm: '2026-03-13T08:10:28.000Z',
};

const ESTATISTICAS_LISTA = {
  totalPropostas: 1,
  valorTotalPipeline: 22875,
  taxaConversao: 0,
  propostasAprovadas: 0,
  estatisticasPorStatus: { rascunho: 1 },
  estatisticasPorVendedor: { Dhonleno: 1 },
};

const HISTORICO_MODAL = {
  criacaoEm: PROPOSTA_VISUAL.criadaEm,
  log: [
    {
      data: PROPOSTA_VISUAL.criadaEm,
      evento: 'proposta_criada',
      detalhes: 'Proposta criada no sistema',
    },
  ],
  versoes: [
    {
      versao: 1,
      criadaEm: PROPOSTA_VISUAL.criadaEm,
      origem: 'api',
      descricao: 'Versao inicial',
      snapshot: {
        total: PROPOSTA_VISUAL.total,
        subtotal: PROPOSTA_VISUAL.subtotal,
        descontoGlobal: PROPOSTA_VISUAL.descontoGlobal,
        impostos: PROPOSTA_VISUAL.impostos,
        formaPagamento: PROPOSTA_VISUAL.formaPagamento,
        validadeDias: PROPOSTA_VISUAL.validadeDias,
        observacoes: PROPOSTA_VISUAL.observacoes,
        status: PROPOSTA_VISUAL.status,
        produtos: PROPOSTA_VISUAL.produtos,
      },
    },
  ],
};

const ESTATISTICAS_MODAL = {
  totalVisualizacoes: 0,
  ultimaVisualizacao: null,
  tempoMedioVisualizacao: 0,
  acoes: [],
};

const setupPropostaVisualizacaoApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
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
        await json(route, 200, [PROPOSTA_VISUAL]);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
        await json(route, 200, ESTATISTICAS_LISTA);
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_ID}`)) {
        await json(route, 200, { proposta: PROPOSTA_VISUAL });
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_ID}/historico`)) {
        await json(route, 200, HISTORICO_MODAL);
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_ID}/estatisticas`)) {
        await json(route, 200, ESTATISTICAS_MODAL);
        return true;
      }

      return false;
    },
  });
};

test.describe('Propostas - visualizacao do modal de detalhes', () => {
  test('abre o modal reorganizado com blocos principais visiveis', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await setupPropostaVisualizacaoApis(page);

    await page.goto('/vendas/propostas');
    await expect(page.getByRole('heading', { name: 'Propostas', exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: 'Visualizacao Cards' }).click();

    const propostaCard = page.locator('article', { hasText: PROPOSTA_NUMERO });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });

    await propostaCard.locator('[title="Visualizar proposta"]').click();

    await expect(page.getByText(`Proposta #${PROPOSTA_NUMERO}`)).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('heading', { name: 'Informacoes do cliente' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Produtos / Servicos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detalhes da proposta' })).toBeVisible();

    await expect(page.getByText('Documento nao informado')).toBeVisible();
    await expect(
      page.getByText('Cliente sem dados complementares cadastrados neste rascunho.'),
    ).toBeVisible();
    const detalhesSection = page.locator('section').filter({ hasText: 'Detalhes da proposta' });
    await expect(detalhesSection.getByText('Forma de pagamento')).toBeVisible();
    await expect(detalhesSection.getByText('Parcelado em 6x')).toBeVisible();
    await expect(detalhesSection.getByText('8.50%')).toBeVisible();
    await expect(detalhesSection.getByText('R$ 22.875,00')).toBeVisible();
    await expect(detalhesSection.getByText('Valida ate: 28/03/2026')).toBeVisible();

    const observacoesSection = page.locator('section').filter({ hasText: 'Observacoes' });
    await expect(observacoesSection.getByText('Observacao comercial para validar o modal reorganizado.')).toBeVisible();

    const produtosSection = page.locator('section').filter({ hasText: 'Produtos / Servicos' });
    const produtoDetalhado = produtosSection.locator('article').first();

    await expect(produtoDetalhado).toBeVisible();
    await expect(produtoDetalhado).toBeInViewport();
    await expect(produtosSection.getByText('pacote conect360')).toBeVisible();
    await expect(produtoDetalhado.getByText('x10')).toBeVisible();
    await expect(produtoDetalhado.getByText('R$ 25.000,00')).toBeVisible();
  });
});
