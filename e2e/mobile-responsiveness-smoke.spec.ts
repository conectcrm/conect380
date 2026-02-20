import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@conectsuite.com.br";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";
const PROFILE_STORAGE_KEY = "selectedProfileId";
const ADMIN_PROFILE_ID = "administrador";

const FULL_BREAKPOINTS = [320, 360, 375, 390, 414, 430];
const SAMPLE_BREAKPOINTS = [360, 430];

const CRITICAL_ROUTES = [
  "/atendimento/inbox",
  "/vendas/propostas",
  "/configuracoes/empresa",
  "/configuracoes/usuarios",
  "/agenda",
];

const EXPANDED_ROUTES = [
  "/dashboard",
  "/atendimento/tickets",
  "/atendimento/automacoes",
  "/atendimento/equipe",
  "/atendimento/configuracoes",
  "/crm/leads",
  "/crm/pipeline",
  "/vendas/produtos",
  "/relatorios/analytics",
  "/configuracoes",
  "/admin/console",
  "/admin/empresas",
];

async function installRateLimitBypass(page: Page): Promise<void> {
  await page.context().route("**/*", async (route) => {
    const headers = {
      ...route.request().headers(),
      "x-real-ip": `127.0.0.${Math.floor(Math.random() * 200) + 20}`,
    };

    await route.continue({ headers });
  });
}

async function dismissDevOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    const styleId = "pw-hide-wds-overlay-mobile-smoke";
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
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
    .frameLocator("iframe#webpack-dev-server-client-overlay")
    .getByRole("button", { name: /dismiss/i });

  const isVisible = await dismissButton.isVisible().catch(() => false);
  if (isVisible) {
    await dismissButton.click({ timeout: 5000 }).catch(() => undefined);
  }
}

async function forceAdminProfile(page: Page): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: PROFILE_STORAGE_KEY, value: ADMIN_PROFILE_ID },
  );
}

async function login(page: Page): Promise<void> {
  let lastUrl = "";
  let lastError = "";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await dismissDevOverlay(page);

    if (/\/dashboard/.test(page.url())) {
      await forceAdminProfile(page);
      return;
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').first();

    await expect(emailInput).toBeVisible({ timeout: 20000 });
    await expect(passwordInput).toBeVisible({ timeout: 20000 });
    await expect(submitButton).toBeVisible({ timeout: 20000 });

    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);
    await submitButton.click({ force: true });

    await Promise.race([
      page.waitForURL(/.*dashboard.*/, { timeout: 15000 }).catch(() => undefined),
      page
        .getByText(/email ou senha incorretos/i)
        .first()
        .waitFor({ state: "visible", timeout: 15000 })
        .catch(() => undefined),
    ]);

    await page.waitForTimeout(1200);
    lastUrl = page.url();

    if (/\/dashboard/.test(lastUrl)) {
      await forceAdminProfile(page);
      return;
    }

    const rateLimited = await page
      .getByText(/muitas requisições|muitas requisicoes|muitas tentativas|aguarde/i)
      .first()
      .isVisible()
      .catch(() => false);

    if (rateLimited) {
      lastError = "rate limited";
      await page.waitForTimeout(4000 * attempt);
      continue;
    }

    const hasInvalidCredentials = await page
      .getByText(/email ou senha incorretos/i)
      .first()
      .isVisible()
      .catch(() => false);

    if (hasInvalidCredentials) {
      lastError = "email ou senha incorretos";
    }

    await page.waitForTimeout(2000);
  }

  throw new Error(
    `Login failed after 4 attempts. Last URL: ${lastUrl}. Last error: ${lastError || "unknown"}`,
  );
}

async function gotoRouteWithAuthRecovery(page: Page, route: string): Promise<void> {
  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await dismissDevOverlay(page);

  if (page.url().includes("/login")) {
    await login(page);
    await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await dismissDevOverlay(page);
  }

  await page.waitForTimeout(1200);
}

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const rootWidth = document.documentElement?.scrollWidth || 0;
    const bodyWidth = document.body?.scrollWidth || 0;
    const maxWidth = Math.max(rootWidth, bodyWidth);
    return maxWidth > window.innerWidth + 1;
  });
}

async function isPermissionDeniedPage(page: Page): Promise<boolean> {
  const deniedHeadingVisible = await page
    .getByRole("heading", { name: /acesso negado/i })
    .first()
    .isVisible()
    .catch(() => false);

  if (deniedHeadingVisible) {
    return true;
  }

  return page
    .getByText(/nao possui permissao|não possui permissão/i)
    .first()
    .isVisible()
    .catch(() => false);
}

async function assertMobileDrawerAndProfileInteraction(page: Page): Promise<void> {
  const menuButton = page.getByTestId("mobile-menu-open");
  await expect(menuButton).toBeVisible({ timeout: 10000 });
  await menuButton.click({ force: true });

  const drawer = page.getByTestId("mobile-sidebar-drawer");
  await expect(drawer).toBeVisible({ timeout: 10000 });

  const dashboardLabel = drawer.getByText(/dashboard/i).first();
  await expect(dashboardLabel).toBeVisible({ timeout: 10000 });

  const computedTextColor = await dashboardLabel.evaluate((node) => {
    const style = window.getComputedStyle(node);
    return style.color;
  });

  expect
    .soft(
      computedTextColor === "rgb(255, 255, 255)" || computedTextColor === "rgba(0, 0, 0, 0)",
      `mobile drawer label color unexpected: ${computedTextColor}`,
    )
    .toBeFalsy();

  const closeDrawerButton = page.getByTestId("mobile-menu-close");
  await closeDrawerButton.click({ force: true });
  await expect(drawer).toBeHidden({ timeout: 10000 });

  const profileButton = page.locator("button[data-user-menu]").first();
  await expect(profileButton).toBeVisible({ timeout: 10000 });
  await profileButton.click({ force: true });

  await expect(page.getByText("Meu Perfil")).toBeVisible({ timeout: 10000 });
}

async function assertAgendaCoreActions(page: Page): Promise<void> {
  const weekButton = page.getByRole("button", { name: /^semana$/i }).first();
  const dayButton = page.getByRole("button", { name: /^dia$/i }).first();
  const newEventButton = page.getByRole("button", { name: /novo evento/i }).first();
  const exportButton = page.getByRole("button", { name: /exportar agenda/i }).first();
  const settingsButton = page
    .getByRole("button", { name: /abrir configuracoes da agenda/i })
    .first();

  await expect(weekButton).toBeVisible({ timeout: 10000 });
  await expect(dayButton).toBeVisible({ timeout: 10000 });
  await expect(newEventButton).toBeVisible({ timeout: 10000 });
  await expect(exportButton).toBeVisible({ timeout: 10000 });
  await expect(settingsButton).toBeVisible({ timeout: 10000 });

  await dayButton.click({ force: true });
  await weekButton.click({ force: true });
  await exportButton.click({ force: true });

  await settingsButton.click({ force: true });
  const settingsTitle = page.getByText(/configuracoes da agenda/i).first();
  await expect(settingsTitle).toBeVisible({ timeout: 10000 });
  await page
    .getByRole("button", { name: /^salvar$/i })
    .first()
    .click({ force: true });
  await expect(settingsTitle).toBeHidden({ timeout: 10000 });

  await newEventButton.click({ force: true });
  const modalTitle = page.getByText(/criar evento|editar evento/i).first();
  await expect(modalTitle).toBeVisible({ timeout: 10000 });

  const modalFitsViewport = await page.evaluate(() => {
    const overlay = document.querySelector(".fixed.inset-0");
    const modal = overlay?.firstElementChild as HTMLElement | null;
    if (!modal) {
      return false;
    }

    const rect = modal.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= window.innerWidth + 1;
  });

  expect.soft(modalFitsViewport, "agenda modal exceeds viewport width").toBeTruthy();

  const cancelButton = page.getByRole("button", { name: /^cancelar$/i }).first();
  await cancelButton.click({ force: true });
  await expect(modalTitle).toBeHidden({ timeout: 10000 });
}

test.describe("Mobile Responsiveness Smoke", () => {
  test.setTimeout(20 * 60 * 1000);

  test("critical + expanded mobile routes should keep usable layout and no overflow", async ({
    page,
  }) => {
    const permissionBlockedRoutes = new Set<string>();
    await installRateLimitBypass(page);
    await login(page);

    for (const width of FULL_BREAKPOINTS) {
      await page.setViewportSize({ width, height: 932 });

      for (const route of CRITICAL_ROUTES) {
        await test.step(`${width}px ${route}`, async () => {
          await gotoRouteWithAuthRecovery(page, route);

          const currentUrl = page.url();
          expect
            .soft(
              currentUrl.includes("/login"),
              `${width}px ${route}: redirected to login unexpectedly`,
            )
            .toBeFalsy();

          const permissionDenied = await isPermissionDeniedPage(page);
          if (permissionDenied) {
            permissionBlockedRoutes.add(route);
            test.info().annotations.push({
              type: "warning",
              description: `${width}px ${route}: blocked by permission guard; responsive checks skipped`,
            });
            return;
          }

          const overflow = await hasHorizontalOverflow(page);
          expect.soft(overflow, `${width}px ${route}: horizontal overflow detected`).toBeFalsy();

          if (route === "/atendimento/inbox") {
            const listCtaVisible = await page
              .getByRole("button", { name: /Novo Atendimento/i })
              .isVisible()
              .catch(() => false);
            const backToListVisible = await page
              .getByRole("button", { name: /Voltar para lista/i })
              .isVisible()
              .catch(() => false);
            const blockingEmptyStateVisible = await page
              .getByText("Nenhum atendimento selecionado", { exact: false })
              .isVisible()
              .catch(() => false);

            const hasMobileNavigationPath =
              listCtaVisible || backToListVisible || !blockingEmptyStateVisible;

            expect
              .soft(
                hasMobileNavigationPath,
                `${width}px /atendimento/inbox: no clear list/chat navigation path`,
              )
              .toBeTruthy();
          }

          if (route === "/vendas/propostas") {
            const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
            const canSelect = await rowCheckbox.isVisible().catch(() => false);

            if (canSelect) {
              await rowCheckbox.click({ force: true });
              await page.waitForTimeout(300);

              const overflowAfterSelection = await hasHorizontalOverflow(page);
              expect
                .soft(
                  overflowAfterSelection,
                  `${width}px /vendas/propostas: overflow after showing bulk selection bar`,
                )
                .toBeFalsy();
            }
          }

          if (route === "/agenda") {
            await assertAgendaCoreActions(page);
          }
        });
      }
    }

    for (const width of SAMPLE_BREAKPOINTS) {
      await page.setViewportSize({ width, height: 932 });

      for (const route of EXPANDED_ROUTES) {
        await test.step(`${width}px ${route}`, async () => {
          await gotoRouteWithAuthRecovery(page, route);

          const currentUrl = page.url();
          expect
            .soft(
              currentUrl.includes("/login"),
              `${width}px ${route}: redirected to login unexpectedly`,
            )
            .toBeFalsy();

          const permissionDenied = await isPermissionDeniedPage(page);
          if (permissionDenied) {
            permissionBlockedRoutes.add(route);
            test.info().annotations.push({
              type: "warning",
              description: `${width}px ${route}: blocked by permission guard; responsive checks skipped`,
            });
            return;
          }

          const overflow = await hasHorizontalOverflow(page);
          expect.soft(overflow, `${width}px ${route}: horizontal overflow detected`).toBeFalsy();

          if (route === "/dashboard" && width === 360) {
            await assertMobileDrawerAndProfileInteraction(page);
          }
        });
      }
    }

    if (permissionBlockedRoutes.size > 0) {
      console.warn(
        `[mobile-smoke] skipped responsive checks on permission-blocked routes: ${Array.from(permissionBlockedRoutes).join(", ")}`,
      );
    }
  });
});
