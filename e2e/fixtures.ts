import { test as base, expect } from '@playwright/test';

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
  email: process.env.TEST_ADMIN_EMAIL || 'admin@conectcrm.com',
  senha: process.env.TEST_ADMIN_PASSWORD || 'admin123',
};

const ATENDENTE_USER = {
  email: process.env.TEST_ATENDENTE_EMAIL || 'atendente@conectcrm.com',
  senha: process.env.TEST_ATENDENTE_PASSWORD || 'atendente123',
};

// Estender test com fixtures
export const test = base.extend<CustomFixtures>({
  // Fixture: usuário admin
  adminUser: async ({ }, use) => {
    await use(ADMIN_USER);
  },

  // Fixture: usuário atendente
  atendenteUser: async ({ }, use) => {
    await use(ATENDENTE_USER);
  },

  // Fixture: página autenticada
  authenticatedPage: async ({ page }, use) => {
    // Navegar para login
    await page.goto('/login');

    // Fazer login
    await page.fill('input[name="email"]', ADMIN_USER.email);
    await page.fill('input[type="password"]', ADMIN_USER.senha);
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard', { timeout: 10000 });

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
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[type="password"]', senha);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Helper: Aguardar elemento com retry
 */
export async function waitForElementWithRetry(
  page: any,
  selector: string,
  maxRetries = 3,
  timeout = 5000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
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
    { timeout }
  );
}

/**
 * Helper: Criar ticket de teste
 */
export async function createTestTicket(page: any, ticketData: any) {
  await page.goto('/atendimento');
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
  return page.evaluate(() => localStorage.getItem('authToken'));
}

/**
 * Helper: Fazer requisição HTTP autenticada
 */
export async function makeAuthenticatedRequest(
  page: any,
  url: string,
  method = 'GET',
  body?: any
) {
  const token = await getAuthToken(page);

  return page.evaluate(
    async ({ url, method, body, token }) => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      return {
        status: response.status,
        data: await response.json().catch(() => null),
      };
    },
    { url, method, body, token }
  );
}
