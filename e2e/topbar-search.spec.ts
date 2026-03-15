import { test, expect } from './fixtures';

test.describe('Topbar Actions', () => {
  test('abre menu do usuario e navega para perfil', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    const topbarTray = authenticatedPage.getByTestId('topbar-actions-tray');
    await expect(topbarTray).toBeVisible();

    const userMenuButton = authenticatedPage.locator('button[data-user-menu]').first();
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    const profileLink = authenticatedPage.getByRole('link', { name: /Meu Perfil/i }).first();
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    await expect(authenticatedPage).toHaveURL(/\/perfil$/);
  });

  test('abre menu do usuario e executa logout', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    const userMenuButton = authenticatedPage.locator('button[data-user-menu]').first();
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    const logoutButton = authenticatedPage.getByRole('button', { name: /Sair/i }).first();
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await authenticatedPage.waitForURL('**/login', { timeout: 10000 });
    await expect(authenticatedPage).toHaveURL(/\/login$/);
  });
});
