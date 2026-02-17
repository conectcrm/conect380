import { test, expect } from './fixtures';

test.describe('Topbar Search', () => {
  test('navega ao clicar em resultado legado de cliente', async ({ authenticatedPage }) => {
    const legacyClientId = '11111111-1111-1111-1111-111111111111';

    await authenticatedPage.route('**/search**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const query = (requestUrl.searchParams.get('q') || '').toLowerCase();

      if (!query.includes('cliente')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: legacyClientId,
            title: 'CLIENTE E2E',
            subtitle: 'cliente.e2e@teste.com',
            type: 'cliente',
            path: `/clientes/${legacyClientId}`,
          },
        ]),
      });
    });

    await authenticatedPage.goto('/dashboard');

    const searchInput = authenticatedPage.getByTestId('topbar-search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('cliente');

    const firstResult = authenticatedPage.getByTestId('topbar-search-result').first();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('CLIENTE E2E');
    await firstResult.click();

    await expect(authenticatedPage).toHaveURL(
      new RegExp(`/crm/clientes\\?highlight=${legacyClientId}`),
    );
  });

  test('abre o primeiro resultado ao pressionar Enter', async ({ authenticatedPage }) => {
    const legacyProductId = '22222222-2222-2222-2222-222222222222';

    await authenticatedPage.route('**/search**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const query = (requestUrl.searchParams.get('q') || '').toLowerCase();

      if (!query.includes('produto')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: legacyProductId,
            title: 'PRODUTO E2E',
            subtitle: 'R$ 10.00',
            type: 'produto',
            path: `/produtos/${legacyProductId}`,
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            title: 'PRODUTO SECUNDARIO',
            subtitle: 'R$ 20.00',
            type: 'produto',
            path: '/vendas/produtos',
          },
        ]),
      });
    });

    await authenticatedPage.goto('/dashboard');

    const searchInput = authenticatedPage.getByTestId('topbar-search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('produto');

    const firstResult = authenticatedPage.getByTestId('topbar-search-result').first();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('PRODUTO E2E');

    await searchInput.press('Enter');

    await expect(authenticatedPage).toHaveURL(
      new RegExp(`/vendas/produtos\\?highlight=${legacyProductId}`),
    );
  });
});
