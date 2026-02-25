import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
  type PipelineUiRequestContext,
} from './pipeline-ui.helpers';

const OPORTUNIDADE_STAGE_BASE = {
  id: 1,
  titulo: 'Oportunidade E2E Pipeline',
  descricao: 'Teste de validacao de estagio',
  valor: '15000.00',
  probabilidade: 10,
  estagio: 'leads',
  prioridade: 'medium',
  origem: 'website',
  tags: [],
  nomeContato: 'Cliente Teste',
  empresaContato: 'Empresa E2E',
  responsavel: {
    id: 'user-e2e-1',
    nome: 'Usuario E2E',
    email: 'usuario.e2e@conectcrm.test',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  atividades: [],
};

const METRICAS_STAGE = {
  totalOportunidades: 1,
  valorTotalPipeline: 15000,
  valorGanho: 0,
  taxaConversao: 0,
  valorMedio: 15000,
  distribuicaoPorEstagio: {
    leads: { quantidade: 1, valor: 15000 },
  },
};

const mockPipelineStageApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
  customHandler?: (ctx: PipelineUiRequestContext) => Promise<boolean> | boolean,
) => {
  await mockPipelineUiApis(page, {
    oportunidades: [OPORTUNIDADE_STAGE_BASE],
    metricas: METRICAS_STAGE,
    customHandler,
  });
};

test.describe('Pipeline - validacao de estagio (UI)', () => {
  test('exibe erro contextual no modal de mudanca de estagio quando backend retorna 400', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineStageApis(page, async ({ method, pathname, route }) => {
      if (method === 'PATCH' && /\/oportunidades\/1$/.test(pathname)) {
        await json(route, 400, {
          statusCode: 400,
          message: 'Transicao invalida: leads nao pode ir direto para qualification neste cenario',
          error: 'Bad Request',
        });
        return true;
      }
      return false;
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('pipeline-card-1')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('pipeline-card-1').dragTo(page.getByTestId('pipeline-column-qualification'));

    await expect(page.getByTestId('modal-mudanca-estagio')).toBeVisible();
    await page.getByTestId('modal-mudanca-estagio-motivo').selectOption('avanco_natural');
    await page.getByTestId('modal-mudanca-estagio-confirmar').click();

    await expect(page.getByTestId('modal-mudanca-estagio-error')).toContainText('Transicao invalida');
  });

  test('fecha modal e move card quando backend aceita a mudanca de estagio', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineStageApis(page);

    await page.route('**/oportunidades/1', async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue();
      }

      return json(route, 200, {
        ...OPORTUNIDADE_STAGE_BASE,
        estagio: 'qualification',
        updatedAt: new Date().toISOString(),
      });
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('pipeline-card-1')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('pipeline-card-1').dragTo(page.getByTestId('pipeline-column-qualification'));

    await expect(page.getByTestId('modal-mudanca-estagio')).toBeVisible();
    await page.getByTestId('modal-mudanca-estagio-motivo').selectOption('avanco_natural');
    await page.getByTestId('modal-mudanca-estagio-confirmar').click();

    await expect(page.getByTestId('modal-mudanca-estagio')).toHaveCount(0);
    await expect(
      page.getByTestId('pipeline-column-qualification').getByTestId('pipeline-card-1'),
    ).toBeVisible();
  });
});
