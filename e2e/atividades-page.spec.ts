import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
  type PipelineUiRequestContext,
} from './pipeline-ui.helpers';

const OPORTUNIDADES = [
  {
    id: 101,
    titulo: 'Upgrade anual - Cliente Prime',
    descricao: 'Oportunidade para renovacao e expansao',
    valor: '25000.00',
    probabilidade: 80,
    estagio: 'negotiation',
    prioridade: 'medium',
    origem: 'website',
    tags: [],
    nomeContato: 'Cliente Prime',
    empresaContato: 'Prime LTDA',
    responsavel: {
      id: 'user-e2e-1',
      nome: 'Usuario E2E',
      email: 'usuario.e2e@conectcrm.test',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    atividades: [],
  },
];

const METRICAS_BASE = {
  totalOportunidades: 1,
  valorTotalPipeline: 25000,
  valorGanho: 0,
  taxaConversao: 0,
  valorMedio: 25000,
  distribuicaoPorEstagio: {
    negotiation: { quantidade: 1, valor: 25000 },
  },
};

const createPainelState = () => ({
  generatedAt: new Date().toISOString(),
  range: {
    periodStart: new Date(Date.now() - 86400000 * 30).toISOString(),
    periodEnd: new Date().toISOString(),
  },
  filters: {
    onlyMine: true,
    status: 'all',
    includeClosed: true,
    includeArchived: false,
  },
  resumo: {
    total: 2,
    pending: 1,
    completed: 1,
    overdue: 1,
    dueToday: 0,
    dueWeek: 0,
  },
  items: [
    {
      id: 'atv-e2e-001',
      tipo: 'task',
      descricao: 'Ligar para cliente decisor',
      status: 'pending',
      resultadoConclusao: null,
      dataAtividade: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      concluidoEm: null,
      flags: {
        overdue: true,
        dueToday: false,
        dueWeek: false,
        daysDelta: -2,
      },
      oportunidade: {
        id: '101',
        titulo: 'Upgrade anual - Cliente Prime',
        estagio: 'negotiation',
        lifecycleStatus: 'open',
        valor: 25000,
        probabilidade: 80,
      },
      criadoPor: {
        id: 'user-e2e-1',
        nome: 'Usuario E2E',
      },
      responsavel: {
        id: 'user-e2e-1',
        nome: 'Usuario E2E',
      },
    },
    {
      id: 'atv-e2e-002',
      tipo: 'meeting',
      descricao: 'Reuniao de fechamento concluida',
      status: 'completed',
      resultadoConclusao: 'Cliente aprovou os termos.',
      dataAtividade: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      concluidoEm: new Date(Date.now() - 3600000).toISOString(),
      flags: {
        overdue: false,
        dueToday: false,
        dueWeek: false,
        daysDelta: -1,
      },
      oportunidade: {
        id: '101',
        titulo: 'Upgrade anual - Cliente Prime',
        estagio: 'closing',
        lifecycleStatus: 'open',
        valor: 25000,
        probabilidade: 95,
      },
      criadoPor: {
        id: 'user-e2e-1',
        nome: 'Usuario E2E',
      },
      responsavel: {
        id: 'user-e2e-1',
        nome: 'Usuario E2E',
      },
      concluidoPor: {
        id: 'user-e2e-1',
        nome: 'Usuario E2E',
      },
    },
  ],
});

const recomputeResumo = (state: ReturnType<typeof createPainelState>) => {
  const total = state.items.length;
  const pending = state.items.filter((item) => item.status === 'pending').length;
  const completed = state.items.filter((item) => item.status === 'completed').length;
  const overdue = state.items.filter((item) => item.status === 'pending' && item.flags.overdue).length;
  const dueToday = state.items.filter((item) => item.status === 'pending' && item.flags.dueToday).length;
  const dueWeek = state.items.filter((item) => item.status === 'pending' && item.flags.dueWeek).length;

  state.resumo = { total, pending, completed, overdue, dueToday, dueWeek };
};

const setupAtividadesApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
) => {
  const painelState = createPainelState();
  const concludeCalls: Array<{ oportunidadeId: string; atividadeId: string }> = [];

  await mockPipelineUiApis(page, {
    oportunidades: OPORTUNIDADES,
    metricas: METRICAS_BASE,
    customHandler: async ({ method, pathname, route }: PipelineUiRequestContext) => {
      if (method === 'GET' && pathname.endsWith('/notifications/unread-count')) {
        await json(route, 200, { count: 0 });
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/notifications')) {
        await json(route, 200, []);
        return true;
      }

      if (method === 'GET' && pathname.endsWith('/oportunidades/atividades/painel')) {
        painelState.generatedAt = new Date().toISOString();
        await json(route, 200, painelState);
        return true;
      }

      const concludeMatch = pathname.match(
        /\/oportunidades\/([^/]+)\/atividades\/([^/]+)\/concluir$/,
      );
      if (method === 'PATCH' && concludeMatch) {
        const oportunidadeId = decodeURIComponent(concludeMatch[1]);
        const atividadeId = decodeURIComponent(concludeMatch[2]);
        concludeCalls.push({ oportunidadeId, atividadeId });

        const target = painelState.items.find((item) => item.id === atividadeId);
        if (target) {
          target.status = 'completed';
          target.resultadoConclusao = 'Concluida pela central de atividades.';
          target.concluidoEm = new Date().toISOString();
          target.flags = {
            overdue: false,
            dueToday: false,
            dueWeek: false,
            daysDelta: 0,
          };
          recomputeResumo(painelState);
        }

        await json(route, 200, {
          id: atividadeId,
          tipo: target?.tipo || 'task',
          descricao: target?.descricao || 'Atividade concluida',
          status: 'completed',
          resultado_conclusao: 'Concluida pela central de atividades.',
          concluido_em: new Date().toISOString(),
          oportunidade_id: oportunidadeId,
          criado_por_id: 'user-e2e-1',
          responsavel_id: 'user-e2e-1',
          dataAtividade: target?.dataAtividade || new Date().toISOString(),
          createdAt: target?.createdAt || new Date().toISOString(),
        });
        return true;
      }

      return false;
    },
  });

  return {
    getConcludeCalls: () => [...concludeCalls],
  };
};

test.describe('Atividades comerciais - tela dedicada', () => {
  test('carrega painel com cards, lista de atividades e historico', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await setupAtividadesApis(page);

    await page.goto('/crm/atividades');

    await expect(page.getByRole('heading', { name: 'Atividades comerciais' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Lista de atividades')).toBeVisible();
    await expect(page.getByText('Historico recente')).toBeVisible();
    await expect(page.getByText('Ligar para cliente decisor')).toBeVisible();
    await expect(page.getByText('Atrasada 2d')).toBeVisible();
  });

  test('conclui atividade pendente pela central e atualiza estado da linha', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const monitor = await setupAtividadesApis(page);

    await page.goto('/crm/atividades');
    await expect(page.getByRole('heading', { name: 'Atividades comerciais' })).toBeVisible({
      timeout: 15000,
    });

    const card = page.locator('article', { hasText: 'Ligar para cliente decisor' }).first();
    await expect(card.getByRole('button', { name: 'Concluir' })).toBeVisible();
    await card.getByRole('button', { name: 'Concluir' }).click();

    await expect.poll(() => monitor.getConcludeCalls().length).toBe(1);
    await expect(card.getByRole('button', { name: 'Concluir' })).toHaveCount(0);
    await expect(card.locator('span', { hasText: 'Concluida' }).first()).toBeVisible();
  });
});
