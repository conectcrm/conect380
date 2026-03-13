import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_ALCADA_ID = '11111111-1111-4111-8111-111111111111';
const PROPOSTA_APROVADA_ID = '22222222-2222-4222-8222-222222222222';
const PROPOSTA_CONTRATO_ASSINADO_ID = '33333333-3333-4333-8333-333333333333';
const PROPOSTA_CONTRATO_GERADO_ID = '55555555-5555-4555-8555-555555555555';
const CLIENTE_APROVADO_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CLIENTE_CONTRATO_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CLIENTE_CONTRATO_GERADO_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const VENDEDOR_ID = '44444444-4444-4444-8444-444444444444';
const CONTRATO_GERADO_ID = 101;
const CONTRATO_ASSINADO_ID = 202;
const FATURA_ID = 501;

const propostasState = [
  {
    id: PROPOSTA_ALCADA_ID,
    numero: 'PROP-ALCADA-001',
    cliente: 'Cliente Alcada',
    cliente_contato: 'cliente.alcada@conectcrm.test',
    titulo: 'Proposta aguardando alcada',
    valor: 18000,
    status: 'negociacao',
    data_criacao: '2026-03-13T08:10:28.000Z',
    data_vencimento: '2026-03-28T00:00:00.000Z',
    data_aprovacao: null,
    vendedor: 'Usuario E2E',
    descricao: 'Proposta com desconto acima da alcada',
    probabilidade: 70,
    categoria: 'Geral',
    urgencia: 'normal',
    dias_restantes: 15,
    aprovacaoInterna: {
      obrigatoria: true,
      status: 'pendente',
      motivo: 'Desconto acima da politica comercial',
      limiteDesconto: 10,
      descontoDetectado: 25,
    },
  },
  {
    id: PROPOSTA_APROVADA_ID,
    numero: 'PROP-CONTRATO-001',
    cliente: 'Cliente Contrato',
    cliente_contato: 'cliente.contrato@conectcrm.test',
    titulo: 'Proposta pronta para contrato',
    valor: 25000,
    status: 'aprovada',
    data_criacao: '2026-03-13T08:10:28.000Z',
    data_vencimento: '2026-03-28T00:00:00.000Z',
    data_aprovacao: '2026-03-13T09:00:00.000Z',
    vendedor: 'Usuario E2E',
    descricao: 'Proposta aprovada para formalizacao',
    probabilidade: 100,
    categoria: 'Geral',
    urgencia: 'normal',
    dias_restantes: 15,
  },
  {
    id: PROPOSTA_CONTRATO_ASSINADO_ID,
    numero: 'PROP-FATURA-001',
    cliente: 'Cliente Fatura',
    cliente_contato: 'cliente.fatura@conectcrm.test',
    titulo: 'Proposta com contrato assinado',
    valor: 32000,
    status: 'contrato_assinado',
    data_criacao: '2026-03-13T08:10:28.000Z',
    data_vencimento: '2026-03-28T00:00:00.000Z',
    data_aprovacao: '2026-03-13T09:30:00.000Z',
    vendedor: 'Usuario E2E',
    descricao: 'Proposta pronta para faturamento',
    probabilidade: 100,
    categoria: 'Geral',
    urgencia: 'normal',
    dias_restantes: 15,
  },
  {
    id: PROPOSTA_CONTRATO_GERADO_ID,
    numero: 'PROP-ASSINATURA-001',
    cliente: 'Cliente Assinatura',
    cliente_contato: 'cliente.assinatura@conectcrm.test',
    titulo: 'Proposta aguardando assinatura externa',
    valor: 28000,
    status: 'contrato_gerado',
    data_criacao: '2026-03-13T08:10:28.000Z',
    data_vencimento: '2026-03-28T00:00:00.000Z',
    data_aprovacao: '2026-03-13T09:15:00.000Z',
    vendedor: 'Usuario E2E',
    descricao: 'Proposta com contrato aguardando assinatura',
    probabilidade: 100,
    categoria: 'Geral',
    urgencia: 'normal',
    dias_restantes: 15,
  },
];

const propostaAprovadaDetalhada = {
  id: PROPOSTA_APROVADA_ID,
  numero: 'PROP-CONTRATO-001',
  titulo: 'Proposta pronta para contrato',
  cliente: {
    id: CLIENTE_APROVADO_ID,
    nome: 'Cliente Contrato',
    email: 'cliente.contrato@conectcrm.test',
    telefone: '(11) 97777-8888',
    documento: '12.345.678/0001-10',
    tipoPessoa: 'juridica',
  },
  vendedor: {
    id: VENDEDOR_ID,
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
    telefone: '(11) 96666-5555',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: 25000,
  descontoGlobal: 0,
  impostos: 0,
  total: 25000,
  valor: 25000,
  status: 'aprovada',
  formaPagamento: 'avista',
  validadeDias: 15,
  observacoes: 'Proposta pronta para gerar contrato.',
  incluirImpostosPDF: false,
  produtos: [
    {
      id: 'item-contrato-1',
      produtoId: 'produto-contrato-1',
      nome: 'Plano Enterprise',
      quantidade: 1,
      precoUnitario: 25000,
      desconto: 0,
      subtotal: 25000,
      tipoItem: 'servico',
      unidade: 'licenca',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const propostaContratoAssinadoDetalhada = {
  id: PROPOSTA_CONTRATO_ASSINADO_ID,
  numero: 'PROP-FATURA-001',
  titulo: 'Proposta com contrato assinado',
  cliente: {
    id: CLIENTE_CONTRATO_ID,
    nome: 'Cliente Fatura',
    email: 'cliente.fatura@conectcrm.test',
    telefone: '(11) 98888-2222',
    documento: '98.765.432/0001-77',
    tipoPessoa: 'juridica',
  },
  vendedor: {
    id: VENDEDOR_ID,
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
    telefone: '(11) 96666-5555',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: 32000,
  descontoGlobal: 2000,
  impostos: 0,
  total: 30000,
  valor: 30000,
  status: 'contrato_assinado',
  formaPagamento: 'boleto',
  validadeDias: 20,
  observacoes: 'Proposta pronta para gerar fatura.',
  incluirImpostosPDF: false,
  produtos: [
    {
      id: 'item-fatura-1',
      produtoId: 'produto-fatura-1',
      nome: 'Pacote Servicos Premium',
      quantidade: 1,
      precoUnitario: 32000,
      desconto: 0,
      subtotal: 32000,
      tipoItem: 'servico',
      unidade: 'licenca',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const propostaContratoGeradoDetalhada = {
  id: PROPOSTA_CONTRATO_GERADO_ID,
  numero: 'PROP-ASSINATURA-001',
  titulo: 'Proposta aguardando assinatura externa',
  cliente: {
    id: CLIENTE_CONTRATO_GERADO_ID,
    nome: 'Cliente Assinatura',
    email: 'cliente.assinatura@conectcrm.test',
    telefone: '(11) 97777-1212',
    documento: '55.666.777/0001-44',
    tipoPessoa: 'juridica',
  },
  vendedor: {
    id: VENDEDOR_ID,
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
    telefone: '(11) 96666-5555',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: 28000,
  descontoGlobal: 0,
  impostos: 0,
  total: 28000,
  valor: 28000,
  status: 'contrato_gerado',
  formaPagamento: 'pix',
  validadeDias: 20,
  observacoes: 'Proposta aguardando assinatura externa.',
  incluirImpostosPDF: false,
  produtos: [
    {
      id: 'item-assinatura-1',
      produtoId: 'produto-assinatura-1',
      nome: 'Pacote Gestao Plus',
      quantidade: 1,
      precoUnitario: 28000,
      desconto: 0,
      subtotal: 28000,
      tipoItem: 'servico',
      unidade: 'licenca',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criadaEm: new Date().toISOString(),
  atualizadaEm: new Date().toISOString(),
};

const contratoGerado = {
  id: String(CONTRATO_GERADO_ID),
  numero: 'CTR-2026-101',
  propostaId: PROPOSTA_APROVADA_ID,
  status: 'aguardando_assinatura',
  valorTotal: 25000,
  cliente: {
    id: CLIENTE_APROVADO_ID,
    nome: 'Cliente Contrato',
    email: 'cliente.contrato@conectcrm.test',
  },
  vendedor: {
    id: VENDEDOR_ID,
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dataVencimento: '2026-03-28T00:00:00.000Z',
};

const contratoAssinado = {
  id: String(CONTRATO_ASSINADO_ID),
  numero: 'CTR-2026-202',
  propostaId: PROPOSTA_CONTRATO_ASSINADO_ID,
  status: 'assinado',
  valorTotal: 30000,
  cliente: {
    id: CLIENTE_CONTRATO_ID,
    nome: 'Cliente Fatura',
    email: 'cliente.fatura@conectcrm.test',
  },
  vendedor: {
    id: VENDEDOR_ID,
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dataVencimento: '2026-03-28T00:00:00.000Z',
};

const contratoPendenteAssinatura = {
  id: '303',
  numero: 'CTR-2026-303',
  propostaId: PROPOSTA_CONTRATO_GERADO_ID,
  status: 'aguardando_assinatura',
  valorTotal: 28000,
  cliente: {
    id: CLIENTE_CONTRATO_GERADO_ID,
    nome: 'Cliente Assinatura',
    email: 'cliente.assinatura@conectcrm.test',
  },
  vendedor: {
    id: VENDEDOR_ID,
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dataVencimento: '2026-03-28T00:00:00.000Z',
};

const ESTATISTICAS_PROPOSTAS = {
  totalPropostas: 4,
  valorTotalPipeline: 103000,
  taxaConversao: 0,
  propostasAprovadas: 1,
  estatisticasPorStatus: {
    negociacao: 1,
    aprovada: 1,
    contrato_assinado: 1,
    contrato_gerado: 1,
  },
  estatisticasPorVendedor: { 'Usuario E2E': 4 },
};

const setupPropostasAutomacaoApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  const propostasStateLocal = JSON.parse(JSON.stringify(propostasState)) as typeof propostasState;
  const aprovacaoPayloads: Array<Record<string, unknown>> = [];
  const statusUpdates: Array<{ id: string; status: string; source?: string; observacoes?: string }> =
    [];
  let contratoCriadoPayload: Record<string, unknown> | null = null;
  let faturaCriadaPayload: Record<string, unknown> | null = null;
  let assinaturaCriadaPayload: Record<string, unknown> | null = null;
  let assinaturaProcessadaPayload: Record<string, unknown> | null = null;
  const contratoPendenteAssinaturaState = { ...contratoPendenteAssinatura };

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
    customHandler: async ({ method, pathname, route, request, searchParams, url }) => {
      if (url.hostname !== 'localhost' || url.port !== '3001') {
        return false;
      }

      if (method === 'GET' && pathname.endsWith('/propostas')) {
        await json(route, 200, propostasStateLocal);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
        await json(route, 200, ESTATISTICAS_PROPOSTAS);
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_APROVADA_ID}`)) {
        await json(route, 200, { proposta: propostaAprovadaDetalhada });
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_CONTRATO_ASSINADO_ID}`)) {
        await json(route, 200, { proposta: propostaContratoAssinadoDetalhada });
        return true;
      }

      if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_CONTRATO_GERADO_ID}`)) {
        await json(route, 200, { proposta: propostaContratoGeradoDetalhada });
        return true;
      }

      if (method === 'POST' && pathname.endsWith(`/propostas/${PROPOSTA_ALCADA_ID}/aprovacao/decidir`)) {
        const body = request.postDataJSON() as Record<string, unknown>;
        aprovacaoPayloads.push(body);
        await json(route, 200, {
          aprovacao: {
            obrigatoria: true,
            status: 'aprovada',
            observacoes: body.observacoes,
          },
        });
        return true;
      }

      if (method === 'PUT' && pathname.includes('/propostas/') && pathname.endsWith('/status')) {
        const match = pathname.match(/\/propostas\/([^/]+)\/status$/);
        const propostaId = match?.[1];
        const body = request.postDataJSON() as {
          status?: string;
          source?: string;
          observacoes?: string;
        };

        if (propostaId && body?.status) {
          const proposta = propostasStateLocal.find((item) => item.id === propostaId);
          if (proposta) {
            proposta.status = body.status;
            if (propostaId === PROPOSTA_ALCADA_ID) {
              proposta.aprovacaoInterna = {
                obrigatoria: true,
                status: 'aprovada',
              };
            }
          }
          statusUpdates.push({
            id: propostaId,
            status: body.status,
            source: body.source,
            observacoes: body.observacoes,
          });
        }

        await json(route, 200, {
          proposta: propostasStateLocal.find((item) => item.id === propostaId),
        });
        return true;
      }

      if (method === 'GET' && pathname === '/contratos') {
        const propostaId = searchParams.get('propostaId');
        if (propostaId === PROPOSTA_APROVADA_ID) {
          await json(route, 200, []);
          return true;
        }
        if (propostaId === PROPOSTA_CONTRATO_ASSINADO_ID) {
          await json(route, 200, [contratoAssinado]);
          return true;
        }
        if (propostaId === PROPOSTA_CONTRATO_GERADO_ID) {
          await json(route, 200, [contratoPendenteAssinaturaState]);
          return true;
        }
      }

      if (method === 'POST' && pathname === '/contratos') {
        contratoCriadoPayload = request.postDataJSON() as Record<string, unknown>;
        await json(route, 200, contratoGerado);
        return true;
      }

      if (method === 'GET' && pathname === `/contratos/${CONTRATO_GERADO_ID}`) {
        await json(route, 200, contratoGerado);
        return true;
      }

      if (method === 'POST' && pathname === `/contratos/${contratoPendenteAssinaturaState.id}/assinaturas`) {
        assinaturaCriadaPayload = request.postDataJSON() as Record<string, unknown>;
        await json(route, 200, {
          id: 1,
          contratoId: Number(contratoPendenteAssinaturaState.id),
          usuarioId: VENDEDOR_ID,
          tipo: 'eletronica',
          status: 'pendente',
          tokenValidacao: 'token-assinatura-e2e',
        });
        return true;
      }

      if (method === 'POST' && pathname === '/contratos/assinar/processar') {
        assinaturaProcessadaPayload = request.postDataJSON() as Record<string, unknown>;
        contratoPendenteAssinaturaState.status = 'assinado';
        await json(route, 200, {
          id: 1,
          contratoId: Number(contratoPendenteAssinaturaState.id),
          usuarioId: VENDEDOR_ID,
          tipo: 'eletronica',
          status: 'assinado',
          tokenValidacao: 'token-assinatura-e2e',
        });
        return true;
      }

      if (method === 'POST' && pathname === '/faturamento/faturas') {
        faturaCriadaPayload = request.postDataJSON() as Record<string, unknown>;
        await json(route, 200, {
          id: FATURA_ID,
          numero: 'FAT-2026-501',
          valorTotal: 30000,
          status: 'pendente',
        });
        return true;
      }

      if (method === 'GET' && pathname === '/faturamento/faturas/paginadas') {
        await json(route, 200, {
          data: {
            items: [
              {
                id: FATURA_ID,
                numero: 'FAT-2026-501',
                valorTotal: 30000,
                status: 'pendente',
                observacoes: `Fatura gerada a partir da proposta PROP-FATURA-001.`,
              },
            ],
            total: 1,
            page: 1,
            pageSize: 10,
            aggregates: {
              valorTotal: 30000,
              valorRecebido: 0,
              valorEmAberto: 30000,
            },
          },
        });
        return true;
      }

      return false;
    },
  });

  return {
    getAprovacaoPayloads: () => aprovacaoPayloads,
    getStatusUpdates: () => statusUpdates,
    getContratoCriadoPayload: () => contratoCriadoPayload,
    getFaturaCriadaPayload: () => faturaCriadaPayload,
    getAssinaturaCriadaPayload: () => assinaturaCriadaPayload,
    getAssinaturaProcessadaPayload: () => assinaturaProcessadaPayload,
  };
};

const abrirCardsPropostas = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  await page.goto('/vendas/propostas');
  await expect(page.getByRole('heading', { name: 'Propostas', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole('button', { name: 'Visualizacao Cards' }).click();
};

test.describe('Propostas - automacao comercial', () => {
  test('aprova alcada pendente e avanca proposta para aprovada', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAutomacaoApis(page);

    await abrirCardsPropostas(page);

    const propostaCard = page.locator('article', { hasText: 'PROP-ALCADA-001' });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });

    await expect(propostaCard.locator('button[title="Aprovar alcada interna"]')).toHaveCount(1);
    await propostaCard.locator('button[title="Aprovar alcada interna"]').click();

    await expect(page.getByText('Alcada aprovada e proposta avancada para aprovada.')).toBeVisible({
      timeout: 15000,
    });
    await expect(propostaCard).toContainText('Aprovada', { timeout: 15000 });

    expect(apiMonitor.getAprovacaoPayloads()).toHaveLength(1);
    expect(apiMonitor.getAprovacaoPayloads()[0]).toMatchObject({
      aprovada: true,
      observacoes: 'Aprovacao interna concluida via tela de propostas.',
    });
    expect(apiMonitor.getStatusUpdates()).toContainEqual({
      id: PROPOSTA_ALCADA_ID,
      status: 'aprovada',
      source: 'alcada-aprovada',
      observacoes: 'Proposta aprovada apos decisao da alcada interna.',
    });
  });

  test('gera contrato a partir de proposta aprovada e sincroniza o status', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAutomacaoApis(page);

    await abrirCardsPropostas(page);

    const propostaCard = page.locator('article', { hasText: 'PROP-CONTRATO-001' });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });

    await propostaCard.locator('button[title="Gerar contrato a partir desta proposta"]').click();

    await expect(page).toHaveURL(new RegExp(`/contratos/${CONTRATO_GERADO_ID}$`), {
      timeout: 15000,
    });

    expect(apiMonitor.getContratoCriadoPayload()).toMatchObject({
      propostaId: PROPOSTA_APROVADA_ID,
      clienteId: CLIENTE_APROVADO_ID,
      usuarioResponsavelId: VENDEDOR_ID,
      tipo: 'servico',
      valorTotal: 25000,
    });
    expect(apiMonitor.getStatusUpdates()).toContainEqual({
      id: PROPOSTA_APROVADA_ID,
      status: 'contrato_gerado',
      source: 'automacao-contrato',
      observacoes: 'Contrato CTR-2026-101 gerado a partir da proposta.',
    });
  });

  test('cria fatura a partir de proposta com contrato assinado e navega para o financeiro', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAutomacaoApis(page);

    await abrirCardsPropostas(page);

    const propostaCard = page.locator('article', { hasText: 'PROP-FATURA-001' });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });

    await propostaCard.locator('button[title="Criar fatura automatica"]').click();

    await expect(page).toHaveURL(new RegExp(`/financeiro/faturamento\\?faturaId=${FATURA_ID}$`), {
      timeout: 15000,
    });

    expect(apiMonitor.getFaturaCriadaPayload()).toMatchObject({
      contratoId: CONTRATO_ASSINADO_ID,
      clienteId: CLIENTE_CONTRATO_ID,
      usuarioResponsavelId: VENDEDOR_ID,
      formaPagamentoPreferida: 'boleto',
    });
    expect(apiMonitor.getStatusUpdates()).toContainEqual({
      id: PROPOSTA_CONTRATO_ASSINADO_ID,
      status: 'fatura_criada',
      source: 'automacao-fatura',
      observacoes: 'Fatura FAT-2026-501 criada a partir da proposta.',
    });
  });

  test('segue fluxo de assinatura externa e gera fatura a partir de contrato aguardando assinatura', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAutomacaoApis(page);

    await abrirCardsPropostas(page);

    const propostaCard = page.locator('article', { hasText: 'PROP-ASSINATURA-001' });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });

    await propostaCard
      .locator('button[title="Confirmar assinatura externa do contrato para seguir"]')
      .click();

    await page.getByRole('button', { name: 'Sim, seguir para faturamento' }).click();

    await expect(page).toHaveURL(new RegExp(`/financeiro/faturamento\\?faturaId=${FATURA_ID}$`), {
      timeout: 15000,
    });

    expect(apiMonitor.getAssinaturaCriadaPayload()).toMatchObject({
      usuarioId: VENDEDOR_ID,
      tipo: 'eletronica',
    });
    expect(apiMonitor.getAssinaturaProcessadaPayload()).toMatchObject({
      tokenValidacao: 'token-assinatura-e2e',
    });
    expect(apiMonitor.getStatusUpdates()).toEqual(
      expect.arrayContaining([
        {
          id: PROPOSTA_CONTRATO_GERADO_ID,
          status: 'contrato_assinado',
          source: 'assinatura-externa-confirmada',
          observacoes: 'Contrato CTR-2026-303 confirmado como assinado externamente.',
        },
        {
          id: PROPOSTA_CONTRATO_GERADO_ID,
          status: 'fatura_criada',
          source: 'automacao-fatura',
          observacoes: 'Fatura FAT-2026-501 criada a partir da proposta.',
        },
      ]),
    );
  });

  test('segue fluxo aprovado sem contrato e cria fatura direta', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAutomacaoApis(page);

    await abrirCardsPropostas(page);

    const propostaCard = page.locator('article', { hasText: 'PROP-CONTRATO-001' });
    await expect(propostaCard).toBeVisible({ timeout: 15000 });

    await propostaCard
      .locator('button[title="Gerar contrato ou criar fatura a partir da proposta aprovada"]')
      .click();

    await page.getByRole('button', { name: 'Seguir sem contrato' }).click();
    await page.getByRole('button', { name: 'Sim, criar fatura' }).click();

    await expect(page).toHaveURL(new RegExp(`/financeiro/faturamento\\?faturaId=${FATURA_ID}$`), {
      timeout: 15000,
    });

    expect(apiMonitor.getFaturaCriadaPayload()).toMatchObject({
      clienteId: CLIENTE_APROVADO_ID,
      usuarioResponsavelId: VENDEDOR_ID,
    });
    expect(apiMonitor.getFaturaCriadaPayload()).not.toHaveProperty('contratoId');
    expect(apiMonitor.getStatusUpdates()).toContainEqual({
      id: PROPOSTA_APROVADA_ID,
      status: 'fatura_criada',
      source: 'automacao-fatura-sem-contrato',
      observacoes: 'Fatura FAT-2026-501 criada sem contrato para a proposta.',
    });
  });
});
