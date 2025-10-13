import { test, expect, Page } from '@playwright/test';

/**
 * Testes E2E - Autenticação e Login
 * 
 * Valida o fluxo completo de autenticação:
 * - Acessar página de login
 * - Preencher credenciais
 * - Fazer login
 * - Verificar redirecionamento
 * - Validar token no localStorage
 */

// Credenciais de teste
const TEST_USER = {
  email: 'admin@teste.com',
  senha: 'senha123',
};

test.describe('Autenticação e Login', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpar localStorage antes de cada teste
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve carregar a página de login', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar que a página carregou
    await expect(page).toHaveTitle(/Conect CRM/i);
    
    // Verificar presença dos campos
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de erro
    await expect(page.locator('text=/credenciais inválidas/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    await page.goto('/login');
    
    // Preencher credenciais válidas
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.senha);
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento para dashboard
    await page.waitForURL(/\/(dashboard|atendimento|home)/i, {
      timeout: 10000,
    });
    
    // Verificar que o token foi salvo no localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
  });

  test('deve persistir autenticação após reload', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.senha);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|atendimento|home)/i);
    
    // Recarregar a página
    await page.reload();
    
    // Verificar que ainda está autenticado (não voltou para /login)
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/login');
    
    // Token ainda deve estar no localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.senha);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|atendimento|home)/i);
    
    // Procurar e clicar no botão de logout
    const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout")').first();
    await logoutButton.click();
    
    // Deve redirecionar para login
    await page.waitForURL(/\/login/i, { timeout: 5000 });
    
    // Token deve ser removido do localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('deve bloquear acesso sem autenticação', async ({ page }) => {
    // Tentar acessar página protegida sem login
    await page.goto('/atendimento');
    
    // Deve redirecionar para login
    await page.waitForURL(/\/login/i, { timeout: 5000 });
    
    // Não deve ter token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

/**
 * Helper: Fazer login e retornar page autenticada
 */
export async function loginAsUser(page: Page, user = TEST_USER) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.senha);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|atendimento|home)/i, { timeout: 10000 });
  return page;
}
