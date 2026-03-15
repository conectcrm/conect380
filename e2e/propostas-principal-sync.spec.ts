import { expect, test } from './fixtures';
import {
  bootstrapPipelineUiAuthenticatedSession,
  json,
  mockPipelineUiApis,
} from './pipeline-ui.helpers';

const PROPOSTA_SECUNDARIA_ID = 'prop-principal-sync-001';

const ESTATISTICAS_PROPOSTAS = {
  totalPropostas: 1,
  valorTotalPipeline: 25000,
  taxaConversao: 0,
  propostasAprovadas: 0,
  estatisticasPorStatus: { negociacao: 1 },
  estatisticasPorVendedor: { Dhonleno: 1 },
};

test.describe('Propostas - proposta principal e reflexo no pipeline', () => {
  test('permite definir uma proposta vinculada como principal na listagem', async ({ page }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);

    const propostasState = [
      {
        id: PROPOSTA_SECUNDARIA_ID,
        numero: 'PROP-PRINC-001',
        cliente: 'Cliente Vinculado',
        cliente_contato: 'cliente.vinculado@conectcrm.test',
        titulo: 'Proposta vinculada a oportunidade',
        valor: 25000,
        status: 'negociacao',
        data_criacao: '2026-03-13T08:10:28.000Z',
        data_vencimento: '2026-03-28T00:00:00.000Z',
        data_aprovacao: null,
        vendedor: 'Dhonleno',
        descricao: 'Proposta com oportunidade vinculada',
        probabilidade: 70,
        categoria: 'Geral',
        dias_restantes: 15,
        oportunidade: {
          id: 101,
          titulo: 'Oportunidade Empresa Principal',
          estagio: 'proposal',
          valor: 25000,
        },
        isPropostaPrincipal: false,
      },
    ];

    let principalRequestCount = 0;

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
          await json(route, 200, propostasState);
          return true;
        }

        if (
          method === 'GET' &&
          (pathname.endsWith('/propostas/estatisticas') ||
            pathname.endsWith('/propostas/estatisticas/dashboard'))
        ) {
          await json(route, 200, ESTATISTICAS_PROPOSTAS);
          return true;
        }

        if (method === 'PUT' && pathname.endsWith(`/propostas/${PROPOSTA_SECUNDARIA_ID}/principal`)) {
          principalRequestCount += 1;
          propostasState[0] = {
            ...propostasState[0],
            isPropostaPrincipal: true,
          };
          await json(route, 200, { proposta: propostasState[0] });
          return true;
        }

        return false;
      },
    });

    await page.goto('/vendas/propostas');
    await expect(page.getByRole('heading', { name: 'Propostas', exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: 'Visualizacao Lista' }).click();

    const row = page.locator('tr', { hasText: 'PROP-PRINC-001' });
    await expect(row).toBeVisible();
    await expect(row.getByText('Oportunidade Empresa Principal')).toBeVisible();
    await expect(row.getByText(/^Principal$/)).toHaveCount(0);

    await row
      .locator('button[title="Definir como proposta principal de Oportunidade Empresa Principal"]')
      .click();

    await expect(row.getByText(/^Principal$/)).toBeVisible({ timeout: 15000 });
    expect(principalRequestCount).toBe(1);
  });

  test('exibe o resumo da proposta principal no card do pipeline e sinaliza sugestao de perda', async ({
    page,
  }) => {
    await bootstrapPipelineUiAuthenticatedSession(page);

    await mockPipelineUiApis(page, {
      oportunidades: [
        {
          id: 21,
          titulo: 'Oportunidade com proposta principal',
          descricao: 'Resumo de proposta principal',
          valor: '25000.00',
          probabilidade: 70,
          estagio: 'proposal',
          prioridade: 'medium',
          origem: 'website',
          tags: [],
          responsavel: {
            id: 'user-e2e-1',
            nome: 'Usuario E2E',
            email: 'usuario.e2e@conectcrm.test',
          },
          propostaPrincipal: {
            id: 'prop-main-001',
            numero: 'PROP-MAIN-001',
            titulo: 'Proposta principal',
            status: 'negociacao',
            sugerePerda: false,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          atividades: [],
        },
        {
          id: 22,
          titulo: 'Oportunidade com proposta rejeitada',
          descricao: 'Sugestao de perda',
          valor: '11000.00',
          probabilidade: 40,
          estagio: 'closing',
          prioridade: 'medium',
          origem: 'website',
          tags: [],
          responsavel: {
            id: 'user-e2e-1',
            nome: 'Usuario E2E',
            email: 'usuario.e2e@conectcrm.test',
          },
          propostaPrincipal: {
            id: 'prop-main-002',
            numero: 'PROP-MAIN-002',
            titulo: 'Proposta rejeitada',
            status: 'rejeitada',
            sugerePerda: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          atividades: [],
        },
      ],
      metricas: {
        totalOportunidades: 2,
        valorTotalPipeline: 36000,
        valorGanho: 0,
        taxaConversao: 0,
        valorMedio: 18000,
        distribuicaoPorEstagio: {
          proposal: { quantidade: 1, valor: 25000 },
          closing: { quantidade: 1, valor: 11000 },
        },
      },
    });

    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view-kanban')).toBeVisible({ timeout: 15000 });

    const cardPrincipal = page.getByTestId('pipeline-card-21');
    await expect(cardPrincipal).toContainText('PROP-MAIN-001');
    await expect(cardPrincipal).toContainText('negociacao');

    const cardSugestaoPerda = page.getByTestId('pipeline-card-22');
    await expect(cardSugestaoPerda).toContainText('PROP-MAIN-002');
    await expect(cardSugestaoPerda).toContainText(
      'Avalie marcar a oportunidade como perdida.',
    );
  });
});
