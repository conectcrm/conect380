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

const dragPipelineCardToColumn = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
  cardTestId: string,
  columnDropzoneTestId: string,
) => {
  const card = page.getByTestId(cardTestId);
  const dropzone = page.getByTestId(columnDropzoneTestId);

  await card.scrollIntoViewIfNeeded();
  await dropzone.scrollIntoViewIfNeeded();
  await card.dragTo(dropzone);
};

const dragPipelineCardAndOpenLossModal = async (
  page: Parameters<typeof bootstrapPipelineUiAuthenticatedSession>[0],
  cardTestId: string,
  columnDropzoneTestId: string,
) => {
  const modal = page.getByTestId('modal-motivo-perda');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await dragPipelineCardToColumn(page, cardTestId, columnDropzoneTestId);

    try {
      await expect(modal).toBeVisible({ timeout: 2000 });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(250);
    }
  }
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
    await dragPipelineCardAndOpenLossModal(page, 'pipeline-card-1', 'pipeline-column-dropzone-lost');
    await page.getByTestId('modal-motivo-perda-option-preco').click();
    await page.getByTestId('modal-motivo-perda-confirmar').click();

    await expect(page.getByTestId('modal-motivo-perda-error')).toContainText('Motivo de perda invalido');
  });

  test('fecha modal e move card quando backend aceita registrar perda', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    const oportunidadesState = [{ ...OPORTUNIDADE_LOSS_BASE }];

    await mockPipelineLossApis(page, async ({ method, pathname, route }) => {
      if (method === 'GET' && pathname.endsWith('/oportunidades')) {
        await json(route, 200, oportunidadesState);
        return true;
      }

      if (method === 'PATCH' && /\/oportunidades\/1\/estagio$/.test(pathname)) {
        oportunidadesState[0] = {
          ...oportunidadesState[0],
          estagio: 'lost',
          motivoPerda: 'preco',
          updatedAt: new Date().toISOString(),
        };
        await json(route, 200, oportunidadesState[0]);
        return true;
      }

      return false;
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('pipeline-card-1')).toBeVisible({ timeout: 15000 });
    await dragPipelineCardAndOpenLossModal(page, 'pipeline-card-1', 'pipeline-column-dropzone-lost');
    await page.getByTestId('modal-motivo-perda-option-preco').click();
    await page.getByTestId('modal-motivo-perda-confirmar').click();

    await expect(page.getByTestId('modal-motivo-perda')).toHaveCount(0);
    await expect(page.getByTestId('pipeline-column-lost').getByTestId('pipeline-card-1')).toBeVisible();
  });
});
