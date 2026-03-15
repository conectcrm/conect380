import { test, expect, login } from './fixtures';

test.describe('Billing self-service - acesso negativo', () => {
  test('bloqueia billing quando sessao nao tem planos.manage', async ({ page, adminUser }) => {
    await login(page, adminUser.email, adminUser.senha);

    await page.route('**/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'user-e2e-billing-1',
            nome: 'Billing E2E User',
            email: adminUser.email,
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
            permissaoString: '',
            permissoes: ['crm.clientes.read'],
            permissions: ['crm.clientes.read'],
          },
        }),
      });
    });

    await page.reload();
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('/billing/assinaturas');
    await expect(page.getByText(/Acesso negado/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Voltar ao dashboard/i })).toBeVisible();

    await page.goto('/billing/planos');
    await expect(page.getByText(/Acesso negado/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Voltar ao dashboard/i })).toBeVisible();
  });
});
