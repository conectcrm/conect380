import { test, expect } from './fixtures';

test.describe('Billing self-service', () => {
  test('mantem navegacao por tab/query e aplica redirects legados', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/billing/assinaturas?tab=usage');
    await authenticatedPage.waitForURL('**/billing/assinaturas?tab=usage', { timeout: 15000 });

    const main = authenticatedPage.getByRole('main');

    await expect(
      main.getByRole('button', { name: 'Assinatura', exact: true }),
    ).toBeVisible();
    await expect(main.getByRole('button', { name: 'Uso', exact: true })).toBeVisible();
    await expect(
      main.getByRole('button', { name: 'Planos e Upgrade', exact: true }),
    ).toBeVisible();

    await main.getByRole('button', { name: 'Planos e Upgrade', exact: true }).click();
    await authenticatedPage.waitForURL('**/billing/planos', { timeout: 10000 });

    await authenticatedPage.goto('/billing/planos?tab=payment');
    await authenticatedPage.waitForURL('**/billing/planos', { timeout: 10000 });
    await expect(authenticatedPage).not.toHaveURL(/tab=payment/);

    await main.getByRole('button', { name: 'Assinatura', exact: true }).click();
    await authenticatedPage.waitForURL('**/billing/assinaturas', { timeout: 10000 });

    await authenticatedPage.goto('/billing/faturas');
    await authenticatedPage.waitForURL('**/financeiro/faturamento', { timeout: 10000 });

    await authenticatedPage.goto('/billing/pagamentos');
    await authenticatedPage.waitForURL('**/financeiro/faturamento', { timeout: 10000 });
  });
});
