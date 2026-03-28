import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const jsonResponse = (status: number, payload: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(payload),
});

const mockCoreAdminUser = {
  id: 'user-e2e-core-admin-1',
  nome: 'Core Admin E2E',
  email: 'core-admin@conect360.com.br',
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

const elevateSessionToCoreAdmin = async (page: Page): Promise<void> => {
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
        data: mockCoreAdminUser,
      }),
    );
  });

  await page.evaluate((user) => {
    window.localStorage.setItem('user_data', JSON.stringify(user));
  }, mockCoreAdminUser);

  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
};

test.describe('Core Admin legacy routes lockdown', () => {
  test('bloqueia aliases admin/guardian no cliente e evita relay externo legado', async ({
    authenticatedPage,
  }) => {
    await elevateSessionToCoreAdmin(authenticatedPage);

    const blockedClientAliases = [
      '/admin/empresas',
      '/admin/empresas/emp-legacy-01',
      '/admin/usuarios',
      '/admin/sistema',
      '/admin/branding',
      '/nuclei/administracao',
      '/guardian/bff/overview',
    ];

    for (const source of blockedClientAliases) {
      await authenticatedPage.goto(source, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
      await authenticatedPage.waitForTimeout(300);
      const currentUrl = authenticatedPage.url();
      expect(currentUrl).not.toContain(':3020/');
      expect(currentUrl).not.toContain('/core-admin');
      await expect(authenticatedPage.locator('body')).not.toContainText('Guardian Stub');
    }

    await authenticatedPage.goto('/sistema/backup', { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await expect
      .poll(() => authenticatedPage.url(), {
        timeout: 10000,
        message: 'Rota legada /sistema/backup deveria permanecer dentro do app principal.',
      })
      .toMatch(/\/sistema\/backup|\/dashboard|\/configuracoes\/empresa/);
  });
});
