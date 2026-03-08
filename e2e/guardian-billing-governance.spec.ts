import { expect, test, type Page, type Route } from '@playwright/test';

const BASE_URL = process.env.GUARDIAN_FRONTEND_URL || 'http://127.0.0.1:3020';

type MockModule = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  essencial: boolean;
  ordem: number;
};

type MockPlan = {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number;
  limiteApiCalls: number;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ativo: boolean;
  ordem: number;
  modulosInclusos: Array<{ id: string; modulo: MockModule }>;
};

type PlanPayload = {
  nome: string;
  codigo: string;
  descricao?: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number;
  limiteApiCalls: number;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ativo: boolean;
  ordem: number;
  modulosInclusos: string[];
};

const jsonResponse = (status: number, payload: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(payload),
});

const createInitialModules = (): MockModule[] => [
  {
    id: 'mod-crm',
    nome: 'CRM',
    codigo: 'crm',
    ativo: true,
    essencial: true,
    ordem: 1,
  },
  {
    id: 'mod-api',
    nome: 'API',
    codigo: 'api',
    ativo: true,
    essencial: false,
    ordem: 2,
  },
  {
    id: 'mod-finance',
    nome: 'Financeiro',
    codigo: 'financeiro',
    ativo: true,
    essencial: false,
    ordem: 3,
  },
];

const createInitialPlans = (modules: MockModule[]): MockPlan[] => {
  const byId = new Map(modules.map((item) => [item.id, item]));

  const relation = (id: string) => ({
    id: `rel-${id}`,
    modulo: byId.get(id) as MockModule,
  });

  return [
    {
      id: 'plan-starter',
      nome: 'Starter',
      codigo: 'starter',
      descricao: 'Plano inicial',
      preco: 99,
      limiteUsuarios: 5,
      limiteClientes: 500,
      limiteStorage: 10737418240,
      limiteApiCalls: 5000,
      whiteLabel: false,
      suportePrioritario: false,
      ativo: true,
      ordem: 1,
      modulosInclusos: [relation('mod-crm')],
    },
    {
      id: 'plan-pro',
      nome: 'Professional',
      codigo: 'professional',
      descricao: 'Plano profissional',
      preco: 249,
      limiteUsuarios: 25,
      limiteClientes: 5000,
      limiteStorage: 53687091200,
      limiteApiCalls: 25000,
      whiteLabel: true,
      suportePrioritario: true,
      ativo: true,
      ordem: 2,
      modulosInclusos: [relation('mod-crm'), relation('mod-api')],
    },
  ];
};

const toPlanResponse = (plan: MockPlan): Record<string, unknown> => ({
  ...plan,
  modulosInclusos: plan.modulosInclusos.map((item) => ({
    id: item.id,
    modulo: item.modulo,
  })),
});

const parsePlanPayload = (route: Route): PlanPayload => {
  const data = route.request().postDataJSON() as Partial<PlanPayload> | undefined;
  return {
    nome: String(data?.nome ?? ''),
    codigo: String(data?.codigo ?? ''),
    descricao: typeof data?.descricao === 'string' ? data.descricao : undefined,
    preco: Number(data?.preco ?? 0),
    limiteUsuarios: Number(data?.limiteUsuarios ?? -1),
    limiteClientes: Number(data?.limiteClientes ?? -1),
    limiteStorage: Number(data?.limiteStorage ?? -1),
    limiteApiCalls: Number(data?.limiteApiCalls ?? -1),
    whiteLabel: Boolean(data?.whiteLabel),
    suportePrioritario: Boolean(data?.suportePrioritario),
    ativo: data?.ativo !== false,
    ordem: Number(data?.ordem ?? 0),
    modulosInclusos: Array.isArray(data?.modulosInclusos)
      ? data!.modulosInclusos.map((id) => String(id))
      : [],
  };
};

const installGuardianBillingMocks = async (page: Page) => {
  const modules = createInitialModules();
  const plans = createInitialPlans(modules);
  let seq = 1;

  const calls: {
    created: PlanPayload[];
    updated: PlanPayload[];
    toggled: string[];
    deleted: string[];
  } = {
    created: [],
    updated: [],
    toggled: [],
    deleted: [],
  };

  await page.route('**/users/profile', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: {
          id: 'guardian-user-1',
          nome: 'Guardian Superadmin',
          email: 'guardian@conect360.local',
          role: 'superadmin',
        },
      }),
    );
  });

  await page.route('**/guardian/bff/billing/subscriptions**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: [
          {
            empresa: {
              id: 'empresa-1',
              nome: 'Empresa Demo Guardian',
              status: 'active',
              plano: 'professional',
              ativo: true,
            },
            assinatura: {
              id: 'ass-1',
              status: 'active',
              status_canonico: 'active',
              valor_mensal: 249,
              proximo_vencimento: '2026-04-15T00:00:00.000Z',
              renovacao_automatica: true,
              plano: {
                id: 'plan-pro',
                nome: 'Professional',
              },
            },
          },
        ],
      }),
    );
  });

  await page.route('**/guardian/bff/billing/subscriptions/jobs/due-date-cycle', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: {
          checked: 1,
          markedPastDue: 0,
          suspended: 0,
        },
      }),
    );
  });

  await page.route('**/guardian/planos/modulos', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill(jsonResponse(200, modules));
  });

  await page.route('**/guardian/planos**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = request.url();
    const parsed = new URL(url);
    const path = parsed.pathname;

    if (method === 'GET' && path.endsWith('/guardian/planos')) {
      await route.fulfill(jsonResponse(200, plans.map(toPlanResponse)));
      return;
    }

    if (method === 'POST' && path.endsWith('/guardian/planos')) {
      const payload = parsePlanPayload(route);
      calls.created.push(payload);

      const relations = payload.modulosInclusos
        .map((moduleId) => modules.find((item) => item.id === moduleId))
        .filter((item): item is MockModule => !!item)
        .map((moduleItem) => ({
          id: `rel-${moduleItem.id}-${seq}`,
          modulo: moduleItem,
        }));

      const createdPlan: MockPlan = {
        id: `plan-created-${seq}`,
        nome: payload.nome,
        codigo: payload.codigo,
        descricao: payload.descricao || '',
        preco: payload.preco,
        limiteUsuarios: payload.limiteUsuarios,
        limiteClientes: payload.limiteClientes,
        limiteStorage: payload.limiteStorage,
        limiteApiCalls: payload.limiteApiCalls,
        whiteLabel: payload.whiteLabel,
        suportePrioritario: payload.suportePrioritario,
        ativo: payload.ativo,
        ordem: payload.ordem,
        modulosInclusos: relations,
      };

      seq += 1;
      plans.push(createdPlan);
      plans.sort((left, right) => left.ordem - right.ordem);

      await route.fulfill(jsonResponse(201, toPlanResponse(createdPlan)));
      return;
    }

    const matchToggle = path.match(/\/guardian\/planos\/([^/]+)\/toggle-status$/);
    if (method === 'PUT' && matchToggle) {
      const planId = matchToggle[1];
      calls.toggled.push(planId);
      const targetPlan = plans.find((item) => item.id === planId);

      if (!targetPlan) {
        await route.fulfill(jsonResponse(404, { message: 'Plano nao encontrado' }));
        return;
      }

      targetPlan.ativo = !targetPlan.ativo;
      await route.fulfill(jsonResponse(200, toPlanResponse(targetPlan)));
      return;
    }

    const matchUpdate = path.match(/\/guardian\/planos\/([^/]+)$/);
    if (method === 'PUT' && matchUpdate) {
      const planId = matchUpdate[1];
      const targetPlan = plans.find((item) => item.id === planId);

      if (!targetPlan) {
        await route.fulfill(jsonResponse(404, { message: 'Plano nao encontrado' }));
        return;
      }

      const payload = parsePlanPayload(route);
      calls.updated.push(payload);

      const relations = payload.modulosInclusos
        .map((moduleId) => modules.find((item) => item.id === moduleId))
        .filter((item): item is MockModule => !!item)
        .map((moduleItem) => ({
          id: `rel-${moduleItem.id}-${seq}`,
          modulo: moduleItem,
        }));

      targetPlan.nome = payload.nome;
      targetPlan.codigo = payload.codigo;
      targetPlan.descricao = payload.descricao || '';
      targetPlan.preco = payload.preco;
      targetPlan.limiteUsuarios = payload.limiteUsuarios;
      targetPlan.limiteClientes = payload.limiteClientes;
      targetPlan.limiteStorage = payload.limiteStorage;
      targetPlan.limiteApiCalls = payload.limiteApiCalls;
      targetPlan.whiteLabel = payload.whiteLabel;
      targetPlan.suportePrioritario = payload.suportePrioritario;
      targetPlan.ativo = payload.ativo;
      targetPlan.ordem = payload.ordem;
      targetPlan.modulosInclusos = relations;
      seq += 1;

      await route.fulfill(jsonResponse(200, toPlanResponse(targetPlan)));
      return;
    }

    if (method === 'DELETE' && matchUpdate) {
      const planId = matchUpdate[1];
      calls.deleted.push(planId);
      const index = plans.findIndex((item) => item.id === planId);
      if (index >= 0) {
        plans.splice(index, 1);
      }
      await route.fulfill(jsonResponse(200, { message: 'Plano removido com sucesso' }));
      return;
    }

    await route.fallback();
  });

  return calls;
};

test.describe('Guardian billing governance - plan catalog', () => {
  test('cria, edita, alterna status e remove plano', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('guardian_auth_token', 'guardian-mock-token');
      window.localStorage.setItem(
        'guardian_user_data',
        JSON.stringify({
          id: 'guardian-user-1',
          nome: 'Guardian Superadmin',
          email: 'guardian@conect360.local',
          role: 'superadmin',
        }),
      );
    });

    const calls = await installGuardianBillingMocks(page);
    await page.goto(`${BASE_URL}/governance/billing`, { waitUntil: 'domcontentloaded' });

    const catalogSection = page.locator('section.card', {
      has: page.getByRole('heading', { name: 'Catalogo de planos' }),
    });
    const catalogTable = catalogSection.locator('table');

    await expect(page.getByRole('heading', { name: 'Catalogo de planos' })).toBeVisible({
      timeout: 10000,
    });
    await expect(catalogTable).toContainText('Starter');

    await page.getByRole('button', { name: 'Novo plano' }).click();
    await page.getByLabel('Nome').fill('Enterprise Plus');
    await page.getByLabel('Codigo').fill('enterprise_plus');
    await page.getByLabel('Preco mensal (BRL)').fill('599.90');
    await page.getByLabel('Ordem').fill('4');
    await page.getByLabel('Limite usuarios (-1 ilimitado)').fill('100');
    await page.getByLabel('Limite clientes (-1 ilimitado)').fill('10000');
    await page.getByLabel('Limite storage em bytes (-1 ilimitado)').fill('107374182400');
    await page.getByLabel('Limite API calls/hora (-1 ilimitado)').fill('50000');
    await page.getByLabel('Descricao').fill('Plano enterprise para governanca completa');

    const apiModuleCheckbox = page.locator('.module-checkbox', { hasText: 'API' }).locator('input');
    await apiModuleCheckbox.check();

    await page.getByRole('button', { name: 'Criar plano' }).click();

    await expect(page.getByText('Plano Enterprise Plus criado com sucesso.')).toBeVisible();
    await expect(catalogTable).toContainText('Enterprise Plus');
    expect(calls.created).toHaveLength(1);
    expect(calls.created[0].modulosInclusos).toContain('mod-api');

    const createdRow = page.locator('tr', { hasText: 'Enterprise Plus' });
    await createdRow.getByRole('button', { name: 'Editar' }).click();

    await page.getByLabel('Preco mensal (BRL)').fill('649.90');
    await page.getByLabel('Limite usuarios (-1 ilimitado)').fill('120');
    const financeModuleCheckbox = page
      .locator('.module-checkbox', { hasText: 'Financeiro' })
      .locator('input');
    await financeModuleCheckbox.check();

    await page.getByRole('button', { name: 'Atualizar plano' }).click();

    await expect(page.getByText('Plano Enterprise Plus atualizado com sucesso.')).toBeVisible();
    await expect(catalogTable).toContainText('R$ 649,90');
    expect(calls.updated).toHaveLength(1);
    expect(calls.updated[0].modulosInclusos).toEqual(expect.arrayContaining(['mod-api', 'mod-finance']));

    await createdRow.getByRole('button', { name: 'Desativar' }).click();
    await expect(createdRow).toContainText('Inativo');
    expect(calls.toggled.length).toBeGreaterThanOrEqual(1);

    page.once('dialog', (dialog) => dialog.accept());
    await createdRow.getByRole('button', { name: 'Excluir' }).click();

    await expect(page.getByText('Plano Enterprise Plus removido com sucesso.')).toBeVisible();
    await expect(catalogTable).not.toContainText('Enterprise Plus');
    expect(calls.deleted.length).toBeGreaterThanOrEqual(1);
  });
});
