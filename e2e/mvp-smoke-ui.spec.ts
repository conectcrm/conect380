import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@conectsuite.com.br';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

async function login(page: any) {
  await page.goto('/login');

  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').first();

  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await expect(submitButton).toBeVisible({ timeout: 15000 });

  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitButton.click();

  await page.waitForURL(/.*dashboard/, { timeout: 20000 });
  await expect(page).toHaveURL(/.*dashboard/);
}

async function assertCoreRouteLoads(page: any, route: string, hints: string[]) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  await expect(page).not.toHaveURL(/.*\/login.*/);

  const content = (await page.locator('body').innerText()).toLowerCase();
  const hasExpectedContent = hints.some((hint) => content.includes(hint.toLowerCase()));

  expect(hasExpectedContent).toBeTruthy();
}

test.describe('MVP UI Smoke', () => {
  test('deve autenticar e carregar rotas core do MVP', async ({ page }) => {
    await login(page);

    await assertCoreRouteLoads(page, '/dashboard', [
      'dashboard',
      'crm',
      'conect',
      'módulo em construção',
      'modulo em construcao',
    ]);

    await assertCoreRouteLoads(page, '/leads', [
      'lead',
      'leads',
      'pipeline',
      'módulo em construção',
      'modulo em construcao',
    ]);

    await assertCoreRouteLoads(page, '/pipeline', [
      'pipeline',
      'oportunidade',
      'funil',
      'módulo em construção',
      'modulo em construcao',
    ]);

    await assertCoreRouteLoads(page, '/propostas', [
      'proposta',
      'propostas',
      'comercial',
      'módulo em construção',
      'modulo em construcao',
    ]);

    await assertCoreRouteLoads(page, '/atendimento/inbox', [
      'atendimento',
      'inbox',
      'ticket',
      'conversa',
      'módulo em construção',
      'modulo em construcao',
    ]);
  });
});
