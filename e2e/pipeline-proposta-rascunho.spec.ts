import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
  type PipelineUiRequestContext,
} from './pipeline-ui.helpers';

const OPORTUNIDADE_ID = 101;
const PROPOSTA_ID = 'prop-e2e-1';
const PRODUTO_ID = 'prod-e2e-1';
const OBSERVACAO_PIPELINE_LEGADA =
  'Gerada automaticamente a partir da oportunidade 123e4567-e89b-12d3-a456-426614174000';

const OPORTUNIDADE_BASE = {
  id: OPORTUNIDADE_ID,
  titulo: 'Oportunidade Pipeline para Proposta',
  descricao: 'Fluxo E2E de rascunho de proposta',
  valor: '15000.00',
  probabilidade: 65,
  estagio: 'proposal',
  prioridade: 'high',
  origem: 'website',
  tags: [],
  nomeContato: 'Contato E2E',
  empresaContato: 'Empresa Pipeline E2E',
  cliente: {
    id: 'cli-e2e-1',
    nome: 'Cliente Pipeline E2E',
    email: 'cliente.pipeline.e2e@conectcrm.test',
    telefone: '(11) 99999-1111',
    documento: '12.345.678/0001-90',
  },
  responsavel: {
    id: 'user-e2e-1',
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  atividades: [],
};

const METRICAS_BASE = {
  totalOportunidades: 1,
  valorTotalPipeline: 15000,
  valorGanho: 0,
  taxaConversao: 0,
  valorMedio: 15000,
  distribuicaoPorEstagio: {
    proposal: { quantidade: 1, valor: 15000 },
  },
};

const CLIENTE_BASE = {
  id: 'cli-e2e-1',
  nome: 'Cliente Pipeline E2E',
  email: 'cliente.pipeline.e2e@conectcrm.test',
  telefone: '(11) 99999-1111',
  documento: '12.345.678/0001-90',
  tipo: 'pessoa_juridica',
  status: 'cliente',
  endereco: 'Rua E2E, 10',
  cidade: 'Sao Paulo',
  estado: 'SP',
  cep: '01000-000',
};

const PRODUTO_BASE = {
  id: PRODUTO_ID,
  nome: 'Plano CRM Enterprise E2E',
  descricao: 'Licenca anual para fluxo E2E',
  preco: 2500,
  categoria: 'Software',
  unidade: 'licenca',
  status: 'ativo',
  tipoItem: 'licenca',
};

const criarPropostaDetalhada = (produtos: Array<Record<string, unknown>> = []) => ({
  id: PROPOSTA_ID,
  numero: 'P-2026-E2E-001',
  titulo: 'Cliente Pipeline E2E - 12/03/2026',
  cliente: { ...CLIENTE_BASE },
  vendedor: {
    id: 'user-e2e-1',
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
    telefone: '',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: produtos.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
  descontoGlobal: 0,
  impostos: 0,
  total: produtos.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
  status: 'rascunho',
  formaPagamento: 'avista',
  validadeDias: 15,
  observacoes: OBSERVACAO_PIPELINE_LEGADA,
  incluirImpostosPDF: false,
  tokenPortal: '123456',
  oportunidade: {
    id: OPORTUNIDADE_ID,
    titulo: OPORTUNIDADE_BASE.titulo,
    estagio: OPORTUNIDADE_BASE.estagio,
    valor: 15000,
  },
  produtos,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
});

const criarMockPipelineProposalApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
  options?: {
    customHandler?: (ctx: PipelineUiRequestContext) => Promise<boolean> | boolean;
  },
) => {
  let propostaState = criarPropostaDetalhada();

  await mockPipelineUiApis(page, {
    oportunidades: [OPORTUNIDADE_BASE],
    metricas: METRICAS_BASE,
    customHandler: async (ctx) => {
      const { method, pathname, route, request } = ctx;

      if (options?.customHandler && (await options.customHandler(ctx))) {
        return true;
      }

      if (method === 'POST' && pathname.endsWith(`/oportunidades/${OPORTUNIDADE_ID}/gerar-proposta`)) {
        propostaState = criarPropostaDetalhada();
        await json(route, 200, {
          success: true,
          message: 'Rascunho criado com sucesso',
          proposta: {
            id: propostaState.id,
            numero: propostaState.numero,
            status: propostaState.status,
          },
        });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas')) {
        await json(route, 200, [propostaState]);
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_ID}`)) {
        await json(route, 200, { proposta: propostaState });
        return true;
      }

      if (method === 'PUT' && pathname.endsWith(`/propostas/${PROPOSTA_ID}`)) {
        const payload = request.postDataJSON() as Record<string, unknown>;
        propostaState = {
          ...propostaState,
          ...payload,
          cliente:
            typeof payload.cliente === 'object' && payload.cliente
              ? { ...CLIENTE_BASE, ...(payload.cliente as Record<string, unknown>) }
              : propostaState.cliente,
          vendedor:
            typeof payload.vendedor === 'object' && payload.vendedor
              ? { ...propostaState.vendedor, ...(payload.vendedor as Record<string, unknown>) }
              : propostaState.vendedor,
          produtos: Array.isArray(payload.produtos) ? payload.produtos : propostaState.produtos,
          subtotal: Number(payload.subtotal || propostaState.subtotal),
          total: Number(payload.total || propostaState.total),
          updatedAt: new Date().toISOString(),
          atualizadaEm: new Date().toISOString(),
        };
        await json(route, 200, { proposta: propostaState });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/clientes')) {
        await json(route, 200, {
          data: [{ ...CLIENTE_BASE }],
          total: 1,
          page: 1,
          limit: 500,
          totalPages: 1,
        });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/produtos')) {
        await json(route, 200, {
          data: [{ ...PRODUTO_BASE }],
          meta: {
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
          },
        });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/catalog/items')) {
        await json(route, 200, {
          data: [
            {
              id: PRODUTO_ID,
              nome: PRODUTO_BASE.nome,
              descricao: PRODUTO_BASE.descricao,
              preco: PRODUTO_BASE.preco,
              categoria: PRODUTO_BASE.categoria,
              unidade: PRODUTO_BASE.unidade,
              status: PRODUTO_BASE.status,
              tipoItem: PRODUTO_BASE.tipoItem,
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
          },
        });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
        await json(route, 200, {
          totalPropostas: 1,
          valorTotalPipeline: Number(propostaState.total || 0),
          taxaConversao: 0,
          propostasAprovadas: 0,
          estatisticasPorStatus: { rascunho: 1 },
          estatisticasPorVendedor: { 'Usuario E2E': 1 },
        });
        return true;
      }

      return false;
    },
  });

  return {
    getPropostaState: () => propostaState,
  };
};

test.describe('Pipeline -> propostas (rascunho)', () => {
  test('gera rascunho pelo pipeline, abre em edicao e salva com item comercial', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiState = await criarMockPipelineProposalApis(page);

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });

    const card = page.getByTestId(`pipeline-card-${OPORTUNIDADE_ID}`);
    await expect(card).toBeVisible();

    await card.getByLabel('Abrir menu de ações').click();
    await page.getByRole('button', { name: 'Criar rascunho de proposta' }).click();

    await page.waitForURL(/\/vendas\/propostas/, { timeout: 15000 });
    await expect(
      page.getByRole('heading', { name: 'Editar Rascunho de Proposta' }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Rascunho criado a partir da oportunidade.', { exact: false }),
    ).toBeVisible();
    await expect(page.locator('textarea').first()).toHaveValue('');

    await page.getByRole('button', { name: 'Próximo' }).click();
    await expect(page.getByText('Produtos Adicionados')).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar Produto' }).click();
    await expect(page.getByText(PRODUTO_BASE.nome)).toBeVisible();
    await page.getByText(PRODUTO_BASE.nome).click();

    await expect(page.locator('h5', { hasText: PRODUTO_BASE.nome })).toBeVisible();
    const modalRascunho = page.getByRole('dialog', { name: 'Editar Rascunho de Proposta' });
    const quantidadeInput = modalRascunho.locator('input[type="number"]').nth(0);
    await quantidadeInput.click();
    await quantidadeInput.press('Backspace');
    await expect(quantidadeInput).toHaveValue('');
    await quantidadeInput.fill('12');
    await expect(quantidadeInput).toHaveValue('12');

    const descontoInput = modalRascunho.locator('input[type="number"]').nth(1);
    await descontoInput.click();
    await descontoInput.press('Backspace');
    await expect(descontoInput).toHaveValue('');
    await descontoInput.fill('15');
    await expect(descontoInput).toHaveValue('15');
    await expect(page.getByText('R$ 25.500,00')).toBeVisible();

    await page.getByRole('button', { name: 'Próximo' }).click();

    const descontoGlobalInput = modalRascunho.locator('input[type="number"]').nth(0);
    await descontoGlobalInput.click();
    await descontoGlobalInput.press('Backspace');
    await expect(descontoGlobalInput).toHaveValue('');
    await descontoGlobalInput.fill('5');
    await expect(descontoGlobalInput).toHaveValue('5');

    const impostosInput = modalRascunho.locator('input[type="number"]').nth(1);
    await impostosInput.click();
    await impostosInput.press('Backspace');
    await expect(impostosInput).toHaveValue('');
    await impostosInput.fill('0');
    await expect(impostosInput).toHaveValue('0');

    await modalRascunho.locator('select').first().selectOption('parcelado');
    const parcelasInput = modalRascunho.locator('input[type="number"]').nth(2);
    await parcelasInput.click();
    await parcelasInput.press('Backspace');
    await expect(parcelasInput).toHaveValue('');
    await parcelasInput.fill('6');
    await expect(parcelasInput).toHaveValue('6');
    await expect(page.getByText('R$ 24.225,00')).toBeVisible();

    await page.getByRole('button', { name: 'Próximo' }).click();
    await expect(page.getByRole('button', { name: 'Salvar alteracoes' })).toBeEnabled();
    await page.getByRole('button', { name: 'Salvar alteracoes' }).click();

    await expect(
      page.getByRole('heading', { name: 'Editar Rascunho de Proposta' }),
    ).toHaveCount(0, { timeout: 15000 });

    const propostaAtualizada = apiState.getPropostaState();
    expect(Array.isArray(propostaAtualizada.produtos)).toBeTruthy();
    expect(propostaAtualizada.produtos).toHaveLength(1);
    expect(propostaAtualizada).toMatchObject({
      descontoGlobal: 5,
      impostos: 0,
      formaPagamento: 'parcelado',
      parcelas: 6,
      total: 24225,
    });
    expect(propostaAtualizada.produtos[0]).toMatchObject({
      id: PRODUTO_ID,
      produtoId: PRODUTO_ID,
      nome: PRODUTO_BASE.nome,
      quantidade: 12,
      desconto: 15,
      subtotal: 25500,
      precoUnitario: PRODUTO_BASE.preco,
    });
  });
});
