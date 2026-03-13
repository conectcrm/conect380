import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_ID = 'prop-acoes-sucesso-e2e-1';
const PROPOSTA_NUMERO = 'P-2026-E2E-ACOES-SUCESSO';
const TOKEN_PORTAL = '654321';
const FRONTEND_ORIGIN = new URL(process.env.FRONTEND_URL || 'http://localhost:3000').origin;

const PROPOSTA_LISTA = {
  id: PROPOSTA_ID,
  numero: PROPOSTA_NUMERO,
  cliente: 'Cliente Acoes Sucesso',
  cliente_contato: '(11) 98888-7777',
  titulo: 'Proposta valida para compartilhar e WhatsApp',
  valor: 2500,
  status: 'enviada',
  data_criacao: '2026-03-13T08:10:28.000Z',
  data_vencimento: '2026-03-28T00:00:00.000Z',
  data_aprovacao: null,
  vendedor: 'Usuario E2E',
  descricao: 'Proposta valida para acoes comerciais',
  probabilidade: 65,
  categoria: 'Geral',
  urgencia: 'normal',
  dias_restantes: 15,
};

const PROPOSTA_DETALHADA = {
  id: PROPOSTA_ID,
  numero: PROPOSTA_NUMERO,
  titulo: 'Proposta valida para compartilhar e WhatsApp',
  cliente: {
    id: 'cli-acoes-sucesso-e2e-1',
    nome: 'Cliente Acoes Sucesso',
    email: 'cliente.acoes@conectcrm.test',
    telefone: '(11) 98888-7777',
    documento: '12.345.678/0001-99',
    tipoPessoa: 'juridica',
  },
  vendedor: {
    id: 'user-e2e-1',
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
    telefone: '(11) 97777-6666',
    tipo: 'vendedor',
    ativo: true,
  },
  subtotal: 2500,
  descontoGlobal: 0,
  impostos: 0,
  total: 2500,
  valor: 2500,
  status: 'enviada',
  formaPagamento: 'avista',
  validadeDias: 15,
  observacoes: 'Proposta pronta para validar acoes comerciais',
  incluirImpostosPDF: false,
  produtos: [
    {
      id: 'item-acoes-sucesso-e2e-1',
      produtoId: 'produto-acoes-sucesso-e2e-1',
      nome: 'Pacote Conect360',
      quantidade: 1,
      precoUnitario: 2500,
      desconto: 0,
      subtotal: 2500,
      tipoItem: 'servico',
      unidade: 'licenca',
    },
  ],
  tokenPortal: TOKEN_PORTAL,
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

const setupPropostasAcoesSucessoApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  let tokenGenerationCalls = 0;
  let pdfGenerationCalls = 0;
  let whatsappStatusCalls = 0;
  let whatsappSendCalls = 0;
  let emailSendCalls = 0;
  let lastStatusUpdate:
    | {
        status: string;
        source?: string;
        observacoes?: string;
      }
    | null = null;

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
      if (url.hostname === 'localhost' && url.port === '3001') {
        if (method === 'GET' && pathname.endsWith('/propostas')) {
          await json(route, 200, [PROPOSTA_LISTA]);
          return true;
        }

        if (method === 'GET' && pathname.endsWith('/propostas/estatisticas')) {
          await json(route, 200, ESTATISTICAS_PROPOSTAS);
          return true;
        }

        if (method === 'GET' && pathname.endsWith(`/propostas/${PROPOSTA_ID}`)) {
          await json(route, 200, { proposta: PROPOSTA_DETALHADA });
          return true;
        }

        if (method === 'GET' && pathname.endsWith('/clientes')) {
          await json(route, 200, {
            data: [PROPOSTA_DETALHADA.cliente],
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
          });
          return true;
        }

        if (method === 'POST' && pathname.endsWith(`/propostas/${PROPOSTA_ID}/gerar-token`)) {
          tokenGenerationCalls += 1;
          await json(route, 200, { token: TOKEN_PORTAL });
          return true;
        }

        if (method === 'POST' && pathname.endsWith('/email/enviar-proposta')) {
          emailSendCalls += 1;
          await json(route, 200, { success: true });
          return true;
        }

        if (method === 'PUT' && pathname.endsWith(`/propostas/${PROPOSTA_ID}/status`)) {
          const body = route.request().postDataJSON() as {
            status?: string;
            source?: string;
            observacoes?: string;
          };
          lastStatusUpdate = {
            status: String(body?.status || ''),
            source: body?.source,
            observacoes: body?.observacoes,
          };
          await json(route, 200, {
            proposta: {
              ...PROPOSTA_DETALHADA,
              status: body?.status || PROPOSTA_DETALHADA.status,
            },
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
      }

      if (
        url.hostname === 'localhost' &&
        ['3000', '3300'].includes(url.port)
      ) {
        if (method === 'GET' && pathname === '/api/whatsapp/status') {
          whatsappStatusCalls += 1;
          await json(route, 200, {
            data: {
              isConnected: true,
              isAuthenticated: true,
            },
          });
          return true;
        }

        if (method === 'POST' && pathname === '/api/whatsapp/send-proposal') {
          whatsappSendCalls += 1;
          await json(route, 200, { success: true });
          return true;
        }
      }

      return false;
    },
  });

  return {
    getTokenGenerationCalls: () => tokenGenerationCalls,
    getPdfGenerationCalls: () => pdfGenerationCalls,
    getWhatsappStatusCalls: () => whatsappStatusCalls,
    getWhatsappSendCalls: () => whatsappSendCalls,
    getEmailSendCalls: () => emailSendCalls,
    getLastStatusUpdate: () => lastStatusUpdate,
  };
};

const abrirPropostaValida = async (
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

test.describe('Propostas - acoes comerciais com sucesso', () => {
  test('compartilha proposta via Web Share API com token publico gerado', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await page.addInitScript(() => {
      (window as any).__shareCalls = [];
      (window as any).__clipboardWrites = [];

      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload: unknown) => {
          (window as any).__shareCalls.push(payload);
        },
      });

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as any).__clipboardWrites.push(text);
          },
        },
      });
    });

    const apiMonitor = await setupPropostasAcoesSucessoApis(page);
    const propostaCard = await abrirPropostaValida(page);

    await propostaCard.getByTitle('Compartilhar link').click();

    await expect(page.getByText('Proposta compartilhada')).toBeVisible();
    expect(apiMonitor.getTokenGenerationCalls()).toBe(1);

    const shareCalls = await page.evaluate(() => (window as any).__shareCalls || []);
    const clipboardWrites = await page.evaluate(() => (window as any).__clipboardWrites || []);

    expect(shareCalls).toHaveLength(1);
    expect(shareCalls[0]).toMatchObject({
      title: `Proposta ${PROPOSTA_NUMERO} - ConectCRM`,
      text: 'Proposta comercial para Cliente Acoes Sucesso',
      url: `${FRONTEND_ORIGIN}/portal/${PROPOSTA_NUMERO}/${TOKEN_PORTAL}`,
    });
    expect(clipboardWrites).toHaveLength(0);
  });

  test('copia o link da proposta quando Web Share API nao estiver disponivel', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await page.addInitScript(() => {
      (window as any).__clipboardWrites = [];

      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: undefined,
      });

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as any).__clipboardWrites.push(text);
          },
        },
      });
    });

    const apiMonitor = await setupPropostasAcoesSucessoApis(page);
    const propostaCard = await abrirPropostaValida(page);

    await propostaCard.getByTitle('Compartilhar link').click();

    await expect(page.getByText('Link da proposta copiado')).toBeVisible();
    expect(apiMonitor.getTokenGenerationCalls()).toBe(1);

    const clipboardWrites = await page.evaluate(() => (window as any).__clipboardWrites || []);
    expect(clipboardWrites).toEqual([
      `${FRONTEND_ORIGIN}/portal/${PROPOSTA_NUMERO}/${TOKEN_PORTAL}`,
    ]);
  });

  test('envia proposta por email com token publico e sincroniza status', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAcoesSucessoApis(page);
    const propostaCard = await abrirPropostaValida(page);

    await propostaCard.getByTitle('Enviar por email').click();

    await expect(
      page.getByText(`Proposta enviada por email para ${PROPOSTA_DETALHADA.cliente.email}`),
    ).toBeVisible({ timeout: 15000 });

    expect(apiMonitor.getTokenGenerationCalls()).toBe(1);
    expect(apiMonitor.getEmailSendCalls()).toBe(1);
    expect(apiMonitor.getLastStatusUpdate()).toEqual({
      status: 'enviada',
      source: 'email',
      observacoes: `Proposta enviada por email para ${PROPOSTA_DETALHADA.cliente.nome} (${PROPOSTA_DETALHADA.cliente.email}).`,
    });
  });

  test('abre modal e envia proposta via WhatsApp com PDF anexado', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const apiMonitor = await setupPropostasAcoesSucessoApis(page);
    const propostaCard = await abrirPropostaValida(page);

    await propostaCard.getByTitle('Enviar por WhatsApp').click();

    await expect(page.getByText('Dados da Proposta')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/PDF.*anexado/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar via WhatsApp' })).toBeVisible();

    await page.getByRole('button', { name: 'Enviar via WhatsApp' }).click();

    await expect(page.getByText('Proposta enviada via WhatsApp!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Dados da Proposta')).toHaveCount(0);

    expect(apiMonitor.getPdfGenerationCalls()).toBe(1);
    expect(apiMonitor.getWhatsappStatusCalls()).toBeGreaterThanOrEqual(1);
    expect(apiMonitor.getWhatsappSendCalls()).toBe(1);
  });
});
