import { test, expect, login } from './fixtures';

const applyProfilePermissions = async (page: any, permissions: string[]) => {
  await page.route('**/users/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'user-e2e-billing-1',
          nome: 'Billing E2E User',
          email: 'billing.e2e@conect360.local',
          empresa: { id: 'empresa-e2e-billing-1', nome: 'Empresa Billing E2E' },
          ativo: true,
          empresaAtiva: 'empresa-e2e-billing-1',
          isAdmin: false,
          isSuperAdmin: false,
          mfaVerified: true,
          mfaVerifiedAt: new Date().toISOString(),
          tenant: null,
          currentCompany: null,
          moduloAtivo: null,
          modulosAtivos: [],
          modulosDisponiveis: [],
          currentProfileId: null,
          tenantId: 'empresa-e2e-billing-1',
          displayRole: 'vendedor',
          roleHierarchyLevel: 10,
          hierarquiaRole: 'vendedor',
          mainRole: 'vendedor',
          allowedRoleValues: ['vendedor'],
          modulosPerCompany: {},
          role: 'vendedor',
          roles: ['vendedor'],
          permissaoString: permissions.join(','),
          permissoes: permissions,
          permissions,
        },
      }),
    });
  });

  await page.reload();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
};

test.describe('Billing legacy aliases para self-service', () => {
  test('permite aliases legados com planos.manage', async ({ page, adminUser }) => {
    await login(page, adminUser.email, adminUser.senha);
    await applyProfilePermissions(page, ['planos.manage']);

    await page.goto('/billing/faturas');
    await page.waitForURL('**/billing/assinaturas', { timeout: 10000 });
    await expect(page.getByText(/Acesso negado/i)).toHaveCount(0);

    await page.goto('/billing/pagamentos');
    await page.waitForURL('**/billing/assinaturas', { timeout: 10000 });
    await expect(page.getByText(/Acesso negado/i)).toHaveCount(0);
  });

  test('bloqueia aliases legados sem planos.manage', async ({ page, adminUser }) => {
    await login(page, adminUser.email, adminUser.senha);
    await applyProfilePermissions(page, ['financeiro.faturamento.read']);

    await page.goto('/billing/faturas');
    await expect(page.getByText(/Acesso negado/i)).toBeVisible({ timeout: 10000 });

    await page.goto('/billing/pagamentos');
    await expect(page.getByText(/Acesso negado/i)).toBeVisible({ timeout: 10000 });
  });
});
