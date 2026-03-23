import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const jsonResponse = (status: number, payload: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(payload),
});

const mockGuardianAdminUser = {
  id: 'user-e2e-guardian-admin-1',
  nome: 'Guardian Admin E2E',
  email: 'guardian-admin@conect360.com.br',
  role: 'superadmin',
  roles: ['superadmin'],
  permissoes: [
    'dashboard.read',
    'planos.manage',
    'financeiro.faturamento.read',
    'crm.clientes.read',
    'admin.empresas.manage',
  ],
  permissions: [
    'dashboard.read',
    'planos.manage',
    'financeiro.faturamento.read',
    'crm.clientes.read',
    'admin.empresas.manage',
  ],
  empresa: {
    id: 'empresa-e2e-billing-1',
    nome: 'Empresa Billing E2E',
  },
};

const installGuardianStubRoute = async (page: Page): Promise<void> => {
  await page.route(/^https?:\/\/localhost:3020\/.*/i, async (route) => {
    const requestUrl = new URL(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html><body>Guardian Stub ${requestUrl.pathname}${requestUrl.search}</body></html>`,
    });
  });
};

const elevateSessionToGuardianAdmin = async (page: Page): Promise<void> => {
  await page.route('**/empresas/modulos/ativos', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        data: ['CRM', 'VENDAS', 'FINANCEIRO', 'BILLING', 'ADMINISTRACAO'],
      }),
    );
  });

  await page.route('**/users/profile', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: mockGuardianAdminUser,
      }),
    );
  });

  await page.evaluate((user) => {
    window.localStorage.setItem('user_data', JSON.stringify(user));
  }, mockGuardianAdminUser);

  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
};

test.describe('Billing legacy admin routes lockdown', () => {
  test('bloqueia aliases admin no cliente e mantém apenas relay explicito para guardian', async ({ authenticatedPage }) => {
    await installGuardianStubRoute(authenticatedPage);
    await elevateSessionToGuardianAdmin(authenticatedPage);

    const blockedClientAliases = [
      '/admin/empresas',
      '/admin/empresas/emp-legacy-01',
      '/admin/usuarios',
      '/admin/sistema',
      '/admin/branding',
      '/nuclei/administracao',
    ];

    for (const source of blockedClientAliases) {
      await authenticatedPage.goto(source, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
      await authenticatedPage.waitForTimeout(400);
      const currentUrl = authenticatedPage.url();
      expect(currentUrl).not.toContain('/governance/');
      expect(currentUrl).not.toContain(':3020/');
      await expect(authenticatedPage.locator('body')).not.toContainText('Guardian Stub');
    }

    await authenticatedPage.goto('/sistema/backup', { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await expect
      .poll(() => authenticatedPage.url(), {
        timeout: 10000,
        message: 'Redirecionamento autorizado de /sistema/backup nao ocorreu.',
      })
      .toMatch(/(:3020\/(governance\/system|login)|\/configuracoes\/empresa\?tab=backup)/);
  });
});
