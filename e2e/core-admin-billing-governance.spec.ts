import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.CORE_ADMIN_FRONTEND_URL || 'http://127.0.0.1:3000';

const jsonResponse = (status: number, payload: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(payload),
});

const installCoreAdminMocks = async (page: Page) => {
  await page.route('**/*', async (route) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(route.request().url());
    } catch {
      await route.fallback();
      return;
    }

    if (parsedUrl.hostname !== 'localhost' || parsedUrl.port !== '3001') {
      await route.fallback();
      return;
    }

    await route.fulfill(jsonResponse(200, { success: true, data: {} }));
  });

  await page.route('**/users/profile', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: {
          id: 'core-admin-user-1',
          nome: 'Core Admin Super',
          email: 'core-admin@conect360.local',
          role: 'superadmin',
          roles: ['superadmin'],
          empresa: {
            id: 'empresa-core-admin-1',
            nome: 'Core Admin Owner',
          },
        },
      }),
    );
  });

  await page.route('**/empresas/modulos/ativos', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        data: ['CRM', 'VENDAS', 'FINANCEIRO', 'BILLING', 'ADMINISTRACAO'],
      }),
    );
  });

  await page.route('**/minhas-empresas', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        empresas: [
          {
            id: 'empresa-core-admin-1',
            nome: 'Core Admin Owner',
            status: 'ativa',
            isActive: true,
          },
        ],
      }),
    );
  });

  await page.route('**/core-admin/bff/overview', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: {
          pending_access_requests: 7,
          admin_security_alerts: 3,
          active_break_glass_accesses: 1,
          users: {
            total: 142,
            ativos: 131,
            inativos: 11,
          },
        },
      }),
    );
  });

  await page.route('**/core-admin/bff/companies**', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: [
          {
            id: 'empresa-1',
            nome: 'Empresa Alfa',
            plano: 'professional',
            status: 'active',
            ativo: true,
          },
          {
            id: 'empresa-2',
            nome: 'Empresa Beta',
            plano: 'starter',
            status: 'past_due',
            ativo: false,
          },
        ],
      }),
    );
  });

  await page.route('**/core-admin/planos**', async (route) => {
    if (route.request().method().toUpperCase() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill(
      jsonResponse(200, [
        {
          id: 'plan-starter',
          nome: 'Starter',
          codigo: 'starter',
          preco: 99,
          ativo: true,
        },
        {
          id: 'plan-pro',
          nome: 'Professional',
          codigo: 'professional',
          preco: 249,
          ativo: true,
        },
      ]),
    );
  });
};

test.describe('Core Admin billing governance - core panel baseline', () => {
  test('exibe overview, empresas e catalogo de planos no painel core-admin', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('authToken', 'core-admin-mock-token');
      window.localStorage.setItem('refreshToken', 'core-admin-mock-refresh-token');
      window.localStorage.setItem('empresaAtiva', 'empresa-core-admin-1');
      window.localStorage.setItem(
        'user_data',
        JSON.stringify({
          id: 'core-admin-user-1',
          nome: 'Core Admin Super',
          email: 'core-admin@conect360.local',
          role: 'superadmin',
          roles: ['superadmin'],
          empresa: {
            id: 'empresa-core-admin-1',
            nome: 'Core Admin Owner',
          },
        }),
      );
    });

    await installCoreAdminMocks(page);

    await page.goto(`${BASE_URL}/core-admin`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Core Admin' })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText('Usuarios totais')).toBeVisible();
    await expect(page.getByText('142')).toBeVisible();
    await expect(page.getByText('Solicitacoes de acesso')).toBeVisible();
    await expect(page.getByText('7')).toBeVisible();

    await page.getByRole('button', { name: 'Empresas e Flags' }).click();
    const companiesPanel = page.locator('section.rounded-xl', {
      has: page.getByRole('heading', { name: 'Empresas' }),
    });
    await expect(companiesPanel).toContainText('Empresa Alfa');
    await expect(companiesPanel).toContainText('professional');
    await expect(companiesPanel).toContainText('Empresa Beta');

    await page.getByRole('button', { name: 'Planos' }).click();
    const plansSection = page.locator('section.rounded-xl', {
      has: page.getByRole('heading', { name: 'Catalogo de planos' }),
    });
    await expect(plansSection).toContainText('Starter');
    await expect(plansSection).toContainText('Professional');
    await expect(plansSection).toContainText(/R\$\s*99,00/);
    await expect(plansSection).toContainText(/R\$\s*249,00/);
  });
});

