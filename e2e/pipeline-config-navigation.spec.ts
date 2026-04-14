import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
  type PipelineUiRequestContext,
} from './pipeline-ui.helpers';

const OPORTUNIDADE_BASE = {
  id: 1,
  titulo: 'Oportunidade E2E Pipeline',
  descricao: 'Teste de navegacao entre workspace e configuracoes',
  valor: '10000.00',
  probabilidade: 40,
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

const METRICAS_BASE = {
  totalOportunidades: 1,
  valorTotalPipeline: 10000,
  valorGanho: 0,
  taxaConversao: 0,
  valorMedio: 10000,
  distribuicaoPorEstagio: {
    leads: { quantidade: 1, valor: 10000 },
  },
};

test.describe('Pipeline - navegacao configuracao', () => {
  test('permite entrar em Configurar e voltar ao pipeline', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);
    await mockPipelineUiApis(page, {
      oportunidades: [OPORTUNIDADE_BASE],
      metricas: METRICAS_BASE,
      customHandler: async ({ method, pathname, route }: PipelineUiRequestContext) => {
        if (method === 'GET' && pathname.endsWith('/oportunidades/lifecycle/feature-flag')) {
          await json(route, 200, {
            enabled: true,
            source: 'enabled',
            rolloutPercentage: 100,
          });
          return true;
        }

        if (method === 'GET' && pathname.endsWith('/oportunidades/lifecycle/stale-policy')) {
          await json(route, 200, {
            enabled: true,
            thresholdDays: 30,
            source: 'default',
            autoArchiveEnabled: true,
            autoArchiveAfterDays: 60,
            autoArchiveSource: 'default',
          });
          return true;
        }

        if (method === 'GET' && pathname.endsWith('/oportunidades/lifecycle/engagement-policy')) {
          await json(route, 200, {
            hotMinProbability: 75,
            hotMinProbabilitySource: 'default',
            hotCloseWindowDays: 14,
            hotCloseWindowSource: 'default',
            nextActionDueSoonDays: 3,
            nextActionDueSoonSource: 'default',
          });
          return true;
        }

        return false;
      },
    });

    await page.goto('/pipeline');

    const configureButton = page.getByRole('button', { name: 'Configurar' });
    await expect(configureButton).toBeVisible({ timeout: 15000 });
    await configureButton.click();

    await expect(page.getByRole('button', { name: 'Voltar ao pipeline' })).toBeVisible();
    await expect(page.getByText('Política de oportunidades paradas')).toBeVisible();

    await page.getByRole('button', { name: 'Voltar ao pipeline' }).click();
    await expect(page.getByRole('button', { name: 'Configurar' })).toBeVisible();
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible();
  });
});
