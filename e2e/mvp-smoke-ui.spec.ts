import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@conect360.com.br';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
const PROFILE_STORAGE_KEY = 'selectedProfileId';

type PerfilSmoke = {
  id: 'administrador' | 'vendedor';
  nome: string;
};

const PERFIS_SMOKE: PerfilSmoke[] = [
  {
    id: 'administrador',
    nome: 'Administrador',
  },
  {
    id: 'vendedor',
    nome: 'Vendedor',
  },
];

async function dismissDevServerOverlay(page: Page) {
  await page.evaluate(() => {
    const styleId = 'pw-hide-wds-overlay';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #webpack-dev-server-client-overlay {
        display: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  });

  const dismissButton = page
    .frameLocator('iframe#webpack-dev-server-client-overlay')
    .getByRole('button', { name: /dismiss/i });

  const isVisible = await dismissButton.isVisible().catch(() => false);
  if (isVisible) {
    await dismissButton.click({ timeout: 5000 }).catch(() => undefined);
  }
}

async function login(page: Page) {
  await page.goto('/login');
  await dismissDevServerOverlay(page);

  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').first();

  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await expect(submitButton).toBeVisible({ timeout: 15000 });

  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitButton.click({ force: true });

  await page.waitForURL(/.*dashboard/, { timeout: 20000 });
  await expect(page).toHaveURL(/.*dashboard/);
}

async function assertRouteLoads(page: Page, route: string, hints: string[]) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  await expect(page).not.toHaveURL(/.*\/login.*/);

  const content = (await page.locator('body').innerText()).toLowerCase();
  const hasExpectedContent = hints.some((hint) => content.includes(hint.toLowerCase()));
  expect(hasExpectedContent).toBeTruthy();
}

async function openUserMenu(page: Page) {
  await dismissDevServerOverlay(page);

  const menuButton = page.locator('button[data-user-menu]').first();
  await expect(menuButton).toBeVisible({ timeout: 15000 });
  await menuButton.click({ force: true });
  await expect(page.getByRole('button', { name: /Alterar Perfil/i })).toBeVisible({
    timeout: 10000,
  });
}

async function switchProfile(page: Page, profile: PerfilSmoke) {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await dismissDevServerOverlay(page);

  await openUserMenu(page);
  await page.getByRole('button', { name: /Alterar Perfil/i }).click({ force: true });

  const profileOption = page
    .locator('[data-profile-selector] .max-h-64 button')
    .filter({ hasText: profile.nome })
    .first();

  await expect(profileOption).toBeVisible({ timeout: 10000 });
  await profileOption.click({ force: true });

  await expect
    .poll(
      async () => page.evaluate((key) => window.localStorage.getItem(key), PROFILE_STORAGE_KEY),
      { timeout: 10000 },
    )
    .toBe(profile.id);
}

test.describe('MVP UI Smoke', () => {
  test('deve autenticar, alternar perfil e carregar dashboards do MVP', async ({ page }) => {
    await login(page);

    await assertRouteLoads(page, '/dashboard', [
      'dashboard',
      'crm',
      'conect',
      'modulo em construcao',
      'painel',
      'performance',
    ]);

    await assertRouteLoads(page, '/leads', [
      'lead',
      'leads',
      'pipeline',
      'modulo em construcao',
    ]);

    await assertRouteLoads(page, '/pipeline', [
      'pipeline',
      'oportunidade',
      'funil',
      'modulo em construcao',
    ]);

    await assertRouteLoads(page, '/propostas', [
      'proposta',
      'propostas',
      'comercial',
      'modulo em construcao',
    ]);

    await assertRouteLoads(page, '/atendimento/inbox', [
      'atendimento',
      'inbox',
      'ticket',
      'conversa',
      'modulo em construcao',
    ]);

    await assertRouteLoads(page, '/relatorios/analytics', [
      'analytics',
      'relatorios',
      'dashboard',
      'kpis',
    ]);

    for (const perfil of PERFIS_SMOKE) {
      await switchProfile(page, perfil);

      await assertRouteLoads(page, '/dashboard', [
        'dashboard',
        'painel',
        'performance',
      ]);

      await assertRouteLoads(page, '/atendimento/analytics', [
        'analytics',
        'tickets',
        'desempenho',
        'sla',
      ]);
    }
  });
});
