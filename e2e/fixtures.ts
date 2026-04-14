import { test as base, expect } from "@playwright/test";

/**
 * Fixtures customizadas para testes E2E do ConectCRM
 */

export interface CustomFixtures {
  authenticatedPage: any;
  adminUser: { email: string; senha: string };
  atendenteUser: { email: string; senha: string };
}

// Dados de usuários de teste
const ADMIN_USER = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@conect360.com.br",
  senha: process.env.TEST_ADMIN_PASSWORD || "admin123",
};

const ATENDENTE_USER = {
  email: process.env.TEST_ATENDENTE_EMAIL || "atendente@conectcrm.com",
  senha: process.env.TEST_ATENDENTE_PASSWORD || "atendente123",
};

const E2E_AUTH_MODE = String(process.env.TEST_E2E_AUTH_MODE || "")
  .trim()
  .toLowerCase();
const USE_MOCK_AUTH = E2E_AUTH_MODE === "mock";

type MockUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  roles: string[];
  permissoes: string[];
  permissions: string[];
  empresa: {
    id: string;
    nome: string;
  };
};

const DEFAULT_MOCK_PERMISSIONS = [
  "dashboard.read",
  "planos.manage",
  "financeiro.faturamento.read",
  "crm.clientes.read",
];

const createMockUser = (email: string): MockUser => ({
  id: "user-e2e-billing-1",
  nome: "Billing E2E User",
  email,
  role: "superadmin",
  roles: ["superadmin"],
  permissoes: [...DEFAULT_MOCK_PERMISSIONS],
  permissions: [...DEFAULT_MOCK_PERMISSIONS],
  empresa: {
    id: "empresa-e2e-billing-1",
    nome: "Empresa Billing E2E",
  },
});

const jsonResponse = (status: number, body: unknown) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const getMockPlanos = () => [
  {
    id: "plano-starter",
    nome: "Starter",
    codigo: "starter",
    descricao: "Plano de entrada",
    preco: 99,
    limiteUsuarios: 5,
    limiteClientes: 500,
    limiteStorage: 10737418240,
    limiteApiCalls: 5000,
    whiteLabel: false,
    suportePrioritario: false,
    ativo: true,
    ordem: 1,
    modulosInclusos: [
      {
        id: "mod-crm",
        nome: "CRM",
        codigo: "CRM",
        descricao: "Modulo CRM",
        icone: "users",
        ativo: true,
        essencial: true,
        ordem: 1,
      },
    ],
  },
  {
    id: "plano-pro",
    nome: "Professional",
    codigo: "professional",
    descricao: "Plano profissional",
    preco: 199,
    limiteUsuarios: 20,
    limiteClientes: 5000,
    limiteStorage: 53687091200,
    limiteApiCalls: 25000,
    whiteLabel: true,
    suportePrioritario: true,
    ativo: true,
    ordem: 2,
    modulosInclusos: [
      {
        id: "mod-crm",
        nome: "CRM",
        codigo: "CRM",
        descricao: "Modulo CRM",
        icone: "users",
        ativo: true,
        essencial: true,
        ordem: 1,
      },
      {
        id: "mod-api",
        nome: "API",
        codigo: "API",
        descricao: "Modulo API",
        icone: "zap",
        ativo: true,
        essencial: false,
        ordem: 2,
      },
    ],
  },
];

const getMockAssinatura = (empresaId: string) => ({
  id: "assinatura-e2e-1",
  empresaId,
  plano: getMockPlanos()[1],
  status: "active",
  dataInicio: new Date(Date.now() - 86400000 * 15).toISOString(),
  proximoVencimento: new Date(Date.now() + 86400000 * 15).toISOString(),
  valorMensal: 199,
  renovacaoAutomatica: true,
  usuariosAtivos: 4,
  clientesCadastrados: 120,
  storageUtilizado: 2147483648,
  apiCallsHoje: 340,
});

const getMockLimites = () => ({
  usuariosAtivos: 4,
  limiteUsuarios: 20,
  clientesCadastrados: 120,
  limiteClientes: 5000,
  storageUtilizado: 2147483648,
  limiteStorage: 53687091200,
  podeAdicionarUsuario: true,
  podeAdicionarCliente: true,
  storageDisponivel: 51539607552,
});

async function setupMockAuthRoutes(page: any, user: MockUser) {
  await page.route("**/*", async (route: any) => {
    const request = route.request();
    const method = request.method();
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(request.url());
    } catch {
      return route.continue();
    }

    const { hostname, port, pathname } = parsedUrl;
    if (hostname !== "localhost" || port !== "3001") {
      return route.continue();
    }

    if (method === "GET" && pathname.endsWith("/users/profile")) {
      return route.fulfill(
        jsonResponse(200, {
          success: true,
          data: user,
        }),
      );
    }

    if (method === "GET" && pathname.endsWith("/minhas-empresas")) {
      return route.fulfill(
        jsonResponse(200, {
          empresas: [
            {
              id: user.empresa.id,
              nome: user.empresa.nome,
              status: "ativa",
              isActive: true,
            },
          ],
        }),
      );
    }

    if (method === "GET" && pathname.endsWith("/empresas/modulos/ativos")) {
      return route.fulfill(
        jsonResponse(200, {
          data: ["CRM", "VENDAS", "FINANCEIRO", "BILLING"],
        }),
      );
    }

    if (method === "GET" && pathname.includes("/empresas/modulos/verificar/")) {
      return route.fulfill(
        jsonResponse(200, {
          data: {
            ativo: true,
          },
        }),
      );
    }

    if (method === "GET" && pathname.endsWith("/planos")) {
      return route.fulfill(jsonResponse(200, getMockPlanos()));
    }

    if (method === "GET" && /\/assinaturas\/empresa\/[^/]+\/limites$/.test(pathname)) {
      return route.fulfill(jsonResponse(200, getMockLimites()));
    }

    if (method === "GET" && /\/assinaturas\/empresa\/[^/]+$/.test(pathname)) {
      return route.fulfill(jsonResponse(200, getMockAssinatura(user.empresa.id)));
    }

    if (method === "PATCH" && /\/assinaturas\/empresa\/[^/]+\/plano$/.test(pathname)) {
      let novoPlanoId = "";
      try {
        const body = request.postDataJSON() as { novoPlanoId?: string };
        novoPlanoId = String(body?.novoPlanoId || "");
      } catch {
        novoPlanoId = "";
      }

      const plano = getMockPlanos().find((item) => item.id === novoPlanoId) || getMockPlanos()[1];
      return route.fulfill(
        jsonResponse(200, {
          ...getMockAssinatura(user.empresa.id),
          plano,
          valorMensal: plano.preco,
        }),
      );
    }

    if (method === "POST" && pathname.endsWith("/auth/refresh")) {
      return route.fulfill(
        jsonResponse(200, {
          success: true,
          data: {
            access_token: "token-e2e-mock-refreshed",
            refresh_token: "refresh-e2e-mock-refreshed",
          },
        }),
      );
    }

    if (method === "POST" && pathname.endsWith("/auth/logout")) {
      return route.fulfill(jsonResponse(200, { success: true }));
    }

    if (method === "GET") {
      return route.fulfill(jsonResponse(200, {}));
    }

    return route.fulfill(jsonResponse(200, { success: true, data: {} }));
  });
}

async function bootstrapMockSession(page: any, email: string) {
  const user = createMockUser(email);
  await setupMockAuthRoutes(page, user);

  await page.addInitScript(
    (sessionData) => {
      if (window.sessionStorage.getItem("__pw_mock_session_initialized") === "true") {
        return;
      }

      window.localStorage.setItem("authToken", sessionData.authToken);
      window.localStorage.setItem("refreshToken", sessionData.refreshToken);
      window.localStorage.setItem("empresaAtiva", sessionData.empresaId);
      window.localStorage.setItem("user_data", JSON.stringify(sessionData.user));
      window.sessionStorage.setItem("__pw_mock_session_initialized", "true");
    },
    {
      authToken: "token-e2e-mock",
      refreshToken: "refresh-e2e-mock",
      empresaId: user.empresa.id,
      user,
    },
  );
}

async function performLogin(page: any, email: string, senha: string) {
  await page.evaluate(() => {
    const styleId = "pw-hide-wds-overlay";
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

  const emailInput = page
    .locator('input[name="email"], input[type="email"], input[placeholder*="empresa" i]')
    .first();
  const passwordInput = page
    .locator('input[name="password"], input[type="password"], input[placeholder*="senha" i]')
    .first();
  const submitButton = page.locator('button[type="submit"], button:has-text("Entrar")').first();

  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await expect(submitButton).toBeVisible({ timeout: 15000 });

  await emailInput.fill(email);
  await passwordInput.fill(senha);
  await submitButton.click({ force: true });
}

async function completeMfaIfRequired(page: any) {
  const mfaHeading = page.getByRole('heading', { name: /seguran/i }).first();
  const mfaVisible = await mfaHeading.waitFor({ state: 'visible', timeout: 12000 })
    .then(() => true)
    .catch(() => false);

  if (!mfaVisible) {
    return;
  }

  const readDevMfaCode = async (): Promise<string> => {
    const envCode = (process.env.TEST_MFA_CODE || '').trim();
    if (envCode) {
      return envCode;
    }

    const codeText = await page
      .locator('p:has-text("MFA") strong')
      .first()
      .textContent()
      .catch(() => null);

    return String(codeText || '')
      .replace(/\D/g, '')
      .trim();
  };

  const codeInput = page
    .locator(
      'input[placeholder*="000"], input[autocomplete="one-time-code"], input[inputmode="numeric"], input[type="text"]',
    )
    .first();

  await expect(codeInput).toBeVisible({ timeout: 5000 });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const code = await readDevMfaCode();
    if (!code) {
      throw new Error('MFA requerido, mas codigo nao encontrado na tela nem em TEST_MFA_CODE.');
    }

    await codeInput.fill(code);
    await page.getByRole('button', { name: /validar/i }).first().click();

    const reachedDashboard = await page
      .waitForURL('**/dashboard', { timeout: 12000 })
      .then(() => true)
      .catch(() => false);

    if (reachedDashboard) {
      return;
    }

    const stillOnMfa = await mfaHeading.isVisible().catch(() => false);
    if (!stillOnMfa) {
      return;
    }

    if (attempt === 1) {
      const resendButton = page.getByRole('button', { name: /reenviar/i }).first();
      const visibleResend = await resendButton
        .waitFor({ state: 'visible', timeout: 15000 })
        .then(() => true)
        .catch(() => false);

      if (visibleResend) {
        const enabled = await resendButton
          .isEnabled()
          .then((value: boolean) => value)
          .catch(() => false);

        if (!enabled) {
          await expect(resendButton).toBeEnabled({ timeout: 30000 }).catch(() => undefined);
        }

        const canClickResend = await resendButton
          .isEnabled()
          .then((value: boolean) => value)
          .catch(() => false);
        if (canClickResend) {
          await resendButton.click();
          await page.waitForTimeout(300);
        }
      }
    }
  }

  throw new Error('Falha ao concluir MFA automaticamente no fluxo E2E.');
}

// Estender test com fixtures
export const test = base.extend<CustomFixtures>({
  // Fixture: usuário admin
  adminUser: async ({}, use) => {
    await use(ADMIN_USER);
  },

  // Fixture: usuário atendente
  atendenteUser: async ({}, use) => {
    await use(ATENDENTE_USER);
  },

  // Fixture: página autenticada
  authenticatedPage: async ({ page }, use) => {
    if (USE_MOCK_AUTH) {
      await bootstrapMockSession(page, ADMIN_USER.email);
      await page.goto("/dashboard");
      await page.waitForURL("**/dashboard", { timeout: 10000 });
      await use(page);
      return;
    }

    // Navegar para login
    await page.goto("/login");

    // Fazer login
    await performLogin(page, ADMIN_USER.email, ADMIN_USER.senha);
    await completeMfaIfRequired(page);

    // Aguardar redirecionamento
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Verificar se está autenticado
    await expect(page).toHaveURL(/.*dashboard/);

    // Passar página autenticada para o teste
    await use(page);

    // Cleanup: fazer logout
    // await page.click('[data-testid="logout-button"]');
  },
});

export { expect };

/**
 * Helper: Fazer login manual
 */
export async function login(page: any, email: string, senha: string) {
  if (USE_MOCK_AUTH) {
    await bootstrapMockSession(page, email);
    await page.goto("/dashboard");
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    return;
  }

  await page.goto("/login");
  await performLogin(page, email, senha);
  await completeMfaIfRequired(page);
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}

/**
 * Helper: Aguardar elemento com retry
 */
export async function waitForElementWithRetry(
  page: any,
  selector: string,
  maxRetries = 3,
  timeout = 5000,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { timeout, state: "visible" });
      return true;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

/**
 * Helper: Verificar WebSocket conectado
 */
export async function waitForWebSocketConnection(page: any, timeout = 10000) {
  return page.waitForFunction(
    () => {
      // Verificar se existe alguma conexão WebSocket ativa
      return (window as any).wsConnected === true;
    },
    { timeout },
  );
}

/**
 * Helper: Criar ticket de teste
 */
export async function createTestTicket(page: any, ticketData: any) {
  await page.goto("/atendimento");
  await page.click('[data-testid="new-ticket-button"]');

  await page.fill('[name="assunto"]', ticketData.assunto);
  await page.fill('[name="descricao"]', ticketData.descricao);

  if (ticketData.prioridade) {
    await page.selectOption('[name="prioridade"]', ticketData.prioridade);
  }

  await page.click('[data-testid="submit-ticket"]');
  await page.waitForSelector('[data-testid="ticket-created"]', { timeout: 5000 });
}

/**
 * Helper: Limpar cookies e storage
 */
export async function clearBrowserData(page: any) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Helper: Obter token JWT do localStorage
 */
export async function getAuthToken(page: any): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem("authToken"));
}

/**
 * Helper: Fazer requisição HTTP autenticada
 */
export async function makeAuthenticatedRequest(page: any, url: string, method = "GET", body?: any) {
  const token = await getAuthToken(page);

  return page.evaluate(
    async ({ url, method, body, token }) => {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      return {
        status: response.status,
        data: await response.json().catch(() => null),
      };
    },
    { url, method, body, token },
  );
}
