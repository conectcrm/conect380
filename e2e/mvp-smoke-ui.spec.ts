import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@conect360.com.br';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
const PROFILE_STORAGE_KEY = 'selectedProfileId';
const USERS_PROFILE_ROUTE_GLOB = '**/users/profile';

const MVP_SMOKE_REQUIRED_PERMISSIONS = [
  'dashboard.read',
  'crm.clientes.read',
  'crm.leads.read',
  'crm.oportunidades.read',
  'comercial.propostas.read',
  'compras.cotacoes.read',
  'compras.aprovacoes.manage',
  // Mantemos permissoes dos modulos fora do GO Core para garantir
  // que o bloqueio validado venha do escopo MVP e nao de RBAC.
  'financeiro.contas-pagar.read',
  'atendimento.chats.read',
];

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

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  await expect(page).not.toHaveURL(/.*\/login.*/);
}

async function applyProfilePermissions(page: Page, permissions: string[]) {
  await page.unroute(USERS_PROFILE_ROUTE_GLOB).catch(() => undefined);
  await page.route(USERS_PROFILE_ROUTE_GLOB, async (route) => {
    const response = await route.fetch();
    const payload = (await response.json().catch(() => ({}))) as {
      data?: Record<string, unknown>;
      [key: string]: unknown;
    };

    const currentUser =
      payload && typeof payload.data === 'object' && payload.data !== null
        ? payload.data
        : {};

    const existingPermissions = [
      ...(Array.isArray((currentUser as { permissions?: unknown[] }).permissions)
        ? ((currentUser as { permissions?: unknown[] }).permissions as unknown[])
        : []),
      ...(Array.isArray((currentUser as { permissoes?: unknown[] }).permissoes)
        ? ((currentUser as { permissoes?: unknown[] }).permissoes as unknown[])
        : []),
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());

    const mergedPermissions = Array.from(new Set([...existingPermissions, ...permissions]));

    const mergedPayload = {
      ...(payload || {}),
      success: true,
      data: {
        ...currentUser,
        permissions: mergedPermissions,
        permissoes: mergedPermissions,
      },
    };

    await route.fulfill({
      response,
      body: JSON.stringify(mergedPayload),
      contentType: 'application/json',
    });
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function assertRouteAccessible(page: Page, route: string, hints: string[]) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  await expect(page).not.toHaveURL(/.*\/login.*/);

  const content = (await page.locator('body').innerText()).toLowerCase();
  const hasExpectedContent = hints.some((hint) => content.includes(hint.toLowerCase()));
  expect(hasExpectedContent).toBeTruthy();
  expect(content).not.toContain('acesso negado');
  expect(content).not.toContain('modulo em construcao');
}

async function assertRouteBlockedByMvp(page: Page, route: string, hints: string[]) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  await expect(page).not.toHaveURL(/.*\/login.*/);

  const content = (await page.locator('body').innerText()).toLowerCase();
  const hasExpectedContent = hints.some((hint) => content.includes(hint.toLowerCase()));
  expect(hasExpectedContent).toBeTruthy();
  expect(content).not.toContain('acesso negado');
  expect(content).toContain('modulo em construcao');
}

async function detectMvpBlockingWithAnyProfile(
  page: Page,
  route: string,
  hints: string[],
  profiles: PerfilSmoke[],
): Promise<boolean> {
  for (const profile of profiles) {
    await switchProfile(page, profile);
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await expect(page).not.toHaveURL(/.*\/login.*/);

    const content = (await page.locator('body').innerText()).toLowerCase();
    const hasExpectedContent = hints.some((hint) => content.includes(hint.toLowerCase()));

    if (!hasExpectedContent) {
      continue;
    }

    if (content.includes('acesso negado')) {
      continue;
    }

    return content.includes('modulo em construcao');
  }

  throw new Error(`Nao foi possivel detectar estado MVP para a rota ${route}.`);
}

async function assertRouteAccessibleWithAnyProfile(
  page: Page,
  route: string,
  hints: string[],
  profiles: PerfilSmoke[],
) {
  let lastError: unknown = null;

  for (const profile of profiles) {
    await switchProfile(page, profile);
    try {
      await assertRouteAccessible(page, route, hints);
      return profile;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Nenhum perfil conseguiu acessar a rota ${route}.`);
}

async function assertRouteBlockedByMvpWithAnyProfile(
  page: Page,
  route: string,
  hints: string[],
  profiles: PerfilSmoke[],
) {
  let lastError: unknown = null;

  for (const profile of profiles) {
    await switchProfile(page, profile);
    try {
      await assertRouteBlockedByMvp(page, route, hints);
      return profile;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Nenhum perfil conseguiu validar o bloqueio MVP da rota ${route}.`);
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
  await page.goto('/');
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
  test('deve autenticar, alternar perfil e validar o fluxo GO Core do MVP', async ({ page }) => {
    await login(page);
    await applyProfilePermissions(page, MVP_SMOKE_REQUIRED_PERMISSIONS);

    await assertRouteAccessibleWithAnyProfile(page, '/leads', [
      'lead',
      'leads',
      'pipeline',
    ], PERFIS_SMOKE);

    await assertRouteAccessibleWithAnyProfile(page, '/pipeline', [
      'pipeline',
      'oportunidade',
      'funil',
    ], PERFIS_SMOKE);

    await assertRouteAccessibleWithAnyProfile(page, '/propostas', [
      'proposta',
      'propostas',
      'comercial',
    ], PERFIS_SMOKE);

    await assertRouteAccessibleWithAnyProfile(page, '/contratos', [
      'contrato',
      'assinatura',
      'comercial',
    ], PERFIS_SMOKE);

    await assertRouteAccessibleWithAnyProfile(page, '/financeiro/cotacoes', [
      'cotacao',
      'compras',
      'orcamento',
    ], PERFIS_SMOKE);

    await assertRouteAccessibleWithAnyProfile(page, '/financeiro/compras/aprovacoes', [
      'aprov',
      'compras',
      'cotacao',
    ], PERFIS_SMOKE);

    const mvpBlockingAtivo = await detectMvpBlockingWithAnyProfile(page, '/financeiro/contas-pagar', [
      'financeiro',
      'billing',
      'faturamento',
      'contas a pagar',
    ], PERFIS_SMOKE);

    if (mvpBlockingAtivo) {
      await assertRouteBlockedByMvpWithAnyProfile(page, '/financeiro/contas-pagar', [
        'financeiro',
        'billing',
        'faturamento',
        'contas a pagar',
        'modulo em construcao',
      ], PERFIS_SMOKE);

      await assertRouteBlockedByMvpWithAnyProfile(page, '/atendimento/inbox', [
        'atendimento',
        'modulo em construcao',
      ], PERFIS_SMOKE);
    } else {
      await assertRouteAccessibleWithAnyProfile(page, '/financeiro/contas-pagar', [
        'financeiro',
        'contas a pagar',
        'fornecedor',
      ], PERFIS_SMOKE);
    }

    for (const perfil of PERFIS_SMOKE) {
      await switchProfile(page, perfil);
      await expect(page).not.toHaveURL(/.*\/login.*/);
    }
  });
});
