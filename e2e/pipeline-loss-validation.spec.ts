import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
  type PipelineUiRequestContext,
} from './pipeline-ui.helpers';

const OPORTUNIDADE_LOSS_BASE = {
  id: 1,
  titulo: 'Oportunidade E2E Perda',
  descricao: 'Teste de erro no modal de perda',
  valor: '9800.00',
  probabilidade: 30,
  estagio: 'qualification',
  prioridade: 'medium',
  origem: 'website',
  tags: [],
  nomeContato: 'Contato E2E',
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

const METRICAS_LOSS = {
  totalOportunidades: 1,
  valorTotalPipeline: 9800,
  valorGanho: 0,
  taxaConversao: 0,
  valorMedio: 9800,
  distribuicaoPorEstagio: {
    qualification: { quantidade: 1, valor: 9800 },
  },
};

const mockPipelineLossApis = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
  customHandler?: (ctx: PipelineUiRequestContext) => Promise<boolean> | boolean,
) => {
  await mockPipelineUiApis(page, {
    oportunidades: [OPORTUNIDADE_LOSS_BASE],
    metricas: METRICAS_LOSS,
    customHandler,
  });
};

test.describe('Pipeline - validacao de perda (UI)', () => {
  test('exibe erro contextual no modal de motivo de perda quando backend retorna 400', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineLossApis(page, async ({ method, pathname, route }) => {
      if (method === 'PATCH' && /\/oportunidades\/1\/estagio$/.test(pathname)) {
        await json(route, 400, {
          statusCode: 400,
          message: ['Motivo de perda invalido para este cenario de validacao E2E'],
          error: 'Bad Request',
        });
        return true;
      }
      return false;
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('pipeline-card-1')).toBeVisible({ timeout: 15000 });

    const card = page.getByTestId('pipeline-card-1');
    const colunaPerdido = page.getByTestId('pipeline-column-lost');
    await colunaPerdido.scrollIntoViewIfNeeded();
    await card.dispatchEvent('dragstart');
    await colunaPerdido.dispatchEvent('dragover');
    await colunaPerdido.dispatchEvent('drop');

    await expect(page.getByTestId('modal-motivo-perda')).toBeVisible();
    await page.getByTestId('modal-motivo-perda-option-PRECO').click();
    await page.getByTestId('modal-motivo-perda-confirmar').click();

    await expect(page.getByTestId('modal-motivo-perda-error')).toContainText('Motivo de perda invalido');
  });

  test('fecha modal e move card quando backend aceita registrar perda', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineLossApis(page);

    await page.route('**/oportunidades/1/estagio', async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue();
      }

      return json(route, 200, {
        ...OPORTUNIDADE_LOSS_BASE,
        estagio: 'lost',
        motivoPerda: 'PRECO',
        updatedAt: new Date().toISOString(),
      });
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('pipeline-card-1')).toBeVisible({ timeout: 15000 });

    const card = page.getByTestId('pipeline-card-1');
    const colunaPerdido = page.getByTestId('pipeline-column-lost');
    await colunaPerdido.scrollIntoViewIfNeeded();
    await card.dispatchEvent('dragstart');
    await colunaPerdido.dispatchEvent('dragover');
    await colunaPerdido.dispatchEvent('drop');

    await expect(page.getByTestId('modal-motivo-perda')).toBeVisible();
    await page.getByTestId('modal-motivo-perda-option-PRECO').click();
    await page.getByTestId('modal-motivo-perda-confirmar').click();

    await expect(page.getByTestId('modal-motivo-perda')).toHaveCount(0);
    await expect(page.getByTestId('pipeline-column-lost').getByTestId('pipeline-card-1')).toBeVisible();
  });
});
