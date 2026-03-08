import { test, expect, login } from './fixtures';

const jsonResponse = (payload: unknown) => ({
  contentType: 'application/json',
  body: JSON.stringify(payload),
});

test.describe('Billing - seguranca de sessao', () => {
  test('redireciona para login quando sessao expira durante carregamento de billing', async ({
    page,
    adminUser,
  }) => {
    await login(page, adminUser.email, adminUser.senha);

    await page.route('**/assinaturas/empresa/**', async (route) => {
      await route.fulfill({
        status: 401,
        ...jsonResponse({ success: false, message: 'Unauthorized' }),
      });
    });

    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        ...jsonResponse({ success: false, code: 'TOKEN_EXPIRED', message: 'Refresh expired' }),
      });
    });

    await page.goto('/billing/assinaturas');
    await page.waitForURL('**/login', { timeout: 15000 });

    await expect(page.getByText(/sua sessao expirou/i)).toBeVisible({ timeout: 10000 });

    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(authToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  test('exibe mensagem de concorrencia quando refresh falha por CONCURRENT_LOGIN no billing', async ({
    page,
    adminUser,
  }) => {
    await login(page, adminUser.email, adminUser.senha);

    await page.route('**/assinaturas/empresa/**', async (route) => {
      await route.fulfill({
        status: 401,
        ...jsonResponse({ success: false, message: 'Unauthorized' }),
      });
    });

    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        ...jsonResponse({
          success: false,
          message: {
            code: 'CONCURRENT_LOGIN',
            message:
              'Sua sessao foi encerrada porque sua conta foi acessada em outro dispositivo.',
          },
        }),
      });
    });

    await page.goto('/billing/assinaturas');
    await page.waitForURL('**/login', { timeout: 15000 });

    await expect(page.getByText(/outro dispositivo/i)).toBeVisible({ timeout: 10000 });
  });
});
