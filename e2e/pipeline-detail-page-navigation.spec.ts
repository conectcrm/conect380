import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const OPORTUNIDADE_BASE = {
  id: 1,
  titulo: 'Oportunidade E2E - Full Page',
  descricao: 'Teste de navegacao para pagina completa',
  valor: '20000.00',
  probabilidade: 80,
  estagio: 'leads',
  prioridade: 'media',
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

const OPORTUNIDADE_STRING_ID = {
  ...OPORTUNIDADE_BASE,
  id: 'opp-e2e-uuid-001',
  titulo: 'Oportunidade E2E - ID string',
};

const METRICAS_BASE = {
  totalOportunidades: 1,
  valorTotalPipeline: 20000,
  valorGanho: 0,
  taxaConversao: 0,
  valorMedio: 20000,
  distribuicaoPorEstagio: {
    leads: { quantidade: 1, valor: 20000 },
  },
};

test.describe('Pipeline - detalhe em pagina completa', () => {
  test('abre a oportunidade em rota propria ao clicar no card e permite voltar', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineUiApis(page, {
      oportunidades: [OPORTUNIDADE_BASE],
      metricas: METRICAS_BASE,
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-card-1')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('pipeline-card-1').click();

    await expect(page).toHaveURL(/\/pipeline\/oportunidades\/1/);
    await expect(page.getByRole('heading', { name: 'Oportunidade E2E - Full Page' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atividades (0)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar ao pipeline' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Voltar ao pipeline' }).first().click();
    await expect(page).toHaveURL(/\/pipeline$/);
  });

  test('abre detalhe corretamente quando a oportunidade usa ID textual', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineUiApis(page, {
      oportunidades: [OPORTUNIDADE_STRING_ID],
      metricas: METRICAS_BASE,
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-card-opp-e2e-uuid-001')).toBeVisible({
      timeout: 15000,
    });

    await page.getByTestId('pipeline-card-opp-e2e-uuid-001').click();

    await expect(page).toHaveURL(/\/pipeline\/oportunidades\/opp-e2e-uuid-001/);
    await expect(page.getByRole('heading', { name: 'Oportunidade E2E - ID string' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atividades (0)' })).toBeVisible();
  });

  test('redireciona link legado com ?oportunidadeId mesmo sem item na listagem atual', async ({
    page,
  }) => {
    const oportunidadeId = 'legacy-opp-e2e-404';
    const oportunidadeDetalhe = {
      ...OPORTUNIDADE_STRING_ID,
      id: oportunidadeId,
      titulo: 'Oportunidade E2E - Link legado',
    };

    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineUiApis(page, {
      oportunidades: [],
      metricas: {
        ...METRICAS_BASE,
        totalOportunidades: 0,
        valorTotalPipeline: 0,
        valorMedio: 0,
        distribuicaoPorEstagio: {},
      },
      customHandler: async ({ method, pathname, route }) => {
        if (method === 'GET' && pathname.endsWith(`/oportunidades/${oportunidadeId}`)) {
          await json(route, 200, oportunidadeDetalhe);
          return true;
        }
        return false;
      },
    });

    await page.goto(`/pipeline?oportunidadeId=${encodeURIComponent(oportunidadeId)}`);

    await expect(page).toHaveURL(new RegExp(`/pipeline/oportunidades/${oportunidadeId}$`));
    await expect(page.getByRole('heading', { name: 'Oportunidade E2E - Link legado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar ao pipeline' }).first()).toBeVisible();
  });
});
