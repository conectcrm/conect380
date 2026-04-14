import { test as base, expect } from '@playwright/test';

/**
 * Helpers de Autenticação para Testes E2E
 * 
 * Fornece fixtures para login automático e contexto autenticado
 */

type AuthFixtures = {
  authenticatedPage: any;
};

/**
 * Credenciais de teste padrão
 * Referência: docs/CREDENCIAIS_PADRAO.md
 */
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@conect360.com.br',
    password: 'admin123',
  },
  atendente: {
    email: 'atendente@conectsuite.com.br',
    password: 'senha123',
  },
  atendente2: {
    email: 'atendente2@conectsuite.com.br',
    password: 'senha123',
  },
};

/**
 * Helper: Realizar login
 */
export async function login(page: any, credentials: { email: string; password: string }) {
  await page.goto('/login');

  // Aguardar página carregar
  await page.waitForLoadState('networkidle');

  // Preencher formulário (sem atributos name)
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);

  // Submeter (botão "Entrar")
  await page.click('button:has-text("Entrar")');

  // Aguardar redirecionamento
  await page.waitForURL(/.*dashboard|atendimento/, { timeout: 10000 });

  // Aguardar token ser salvo
  await page.waitForTimeout(500);
}

/**
 * Helper: Verificar se está autenticado
 */
export async function isAuthenticated(page: any): Promise<boolean> {
  const token = await page.evaluate(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });
  return !!token;
}

/**
 * Helper: Fazer logout
 */
export async function logout(page: any) {
  // Tentar clicar no menu de usuário
  const userMenu = page.locator('[data-testid="user-menu"], [class*="UserMenu"]').first();
  if (await userMenu.count() > 0) {
    await userMenu.click();
    await page.click('text=/Sair|Logout/i');
  } else {
    // Fallback: limpar storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  await page.waitForURL(/.*login/, { timeout: 5000 });
}

/**
 * Fixture: Página autenticada como atendente
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Fazer login antes de cada teste
    await login(page, TEST_CREDENTIALS.atendente);

    // Fornecer página autenticada para o teste
    await use(page);

    // Cleanup: fazer logout após teste (opcional)
    // await logout(page);
  },
});

export { expect };

/**
 * Helper: Criar múltiplos contextos autenticados
 * Útil para testes multi-usuário
 */
export async function createAuthenticatedContext(browser: any, role: 'admin' | 'atendente' | 'atendente2') {
  const context = await browser.newContext();
  const page = await context.newPage();

  const credentials = TEST_CREDENTIALS[role];
  await login(page, credentials);

  return { context, page };
}

/**
 * Helper: Aguardar elemento com retry
 */
export async function waitForElementWithRetry(
  page: any,
  selector: string,
  options?: { timeout?: number; retries?: number }
) {
  const timeout = options?.timeout || 5000;
  const retries = options?.retries || 3;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

/**
 * Helper: Aguardar WebSocket conectar
 */
export async function waitForWebSocketConnection(page: any, timeout = 10000) {
  try {
    await page.waitForFunction(
      () => (window as any).wsConnected === true,
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Obter mensagens WebSocket capturadas
 */
export async function getWebSocketMessages(page: any): Promise<string[]> {
  return await page.evaluate(() => {
    return (window as any).wsMessages || [];
  });
}

/**
 * Helper: Limpar mensagens WebSocket capturadas
 */
export async function clearWebSocketMessages(page: any) {
  await page.evaluate(() => {
    (window as any).wsMessages = [];
  });
}
