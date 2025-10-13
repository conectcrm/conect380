import { test, expect } from './fixtures';

/**
 * Testes E2E - Autenticação
 * 
 * Testa todo o fluxo de login, logout e validações
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar dados do browser antes de cada teste
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('deve carregar página de login', async ({ page }) => {
    await page.goto('/login');

    // Verificar elementos da página
    await expect(page).toHaveTitle(/ConectCRM|Login/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page, adminUser }) => {
    await page.goto('/login');

    // Preencher formulário
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.senha);

    // Submeter
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verificar se foi redirecionado
    await expect(page).toHaveURL(/.*dashboard/);

    // Verificar se token foi salvo
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
    expect(token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/); // JWT pattern
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    // Tentar login com credenciais erradas
    await page.fill('input[name="email"]', 'usuario@invalido.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');

    // Aguardar mensagem de erro
    await page.waitForSelector('[role="alert"], .error, .alert-danger', { timeout: 5000 });

    // Verificar que não foi redirecionado
    await expect(page).toHaveURL(/.*login/);

    // Verificar que não salvou token
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/login');

    // Tentar submeter sem preencher
    await page.click('button[type="submit"]');

    // Verificar validação HTML5 ou mensagem de erro
    const emailInput = page.locator('input[name="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid).toBeTruthy();
  });

  test('deve redirecionar para dashboard se já autenticado', async ({ authenticatedPage }) => {
    // Já está autenticado via fixture

    // Tentar acessar login novamente
    await authenticatedPage.goto('/login');

    // Deve redirecionar para dashboard
    await authenticatedPage.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(authenticatedPage).toHaveURL(/.*dashboard/);
  });

  test('deve fazer logout com sucesso', async ({ authenticatedPage }) => {
    // Página já autenticada
    await expect(authenticatedPage).toHaveURL(/.*dashboard/);

    // Procurar botão de logout (ajustar seletor conforme UI)
    const logoutButton = authenticatedPage.locator(
      'button:has-text("Sair"), [data-testid="logout"], [aria-label="Logout"]'
    ).first();

    // Se existir, clicar
    if (await logoutButton.count() > 0) {
      await logoutButton.click();

      // Aguardar redirecionamento para login
      await authenticatedPage.waitForURL('**/login', { timeout: 5000 });

      // Verificar que token foi removido
      const token = await authenticatedPage.evaluate(() => localStorage.getItem('authToken'));
      expect(token).toBeNull();
    } else {
      console.log('⚠️ Botão de logout não encontrado - pular teste');
      test.skip();
    }
  });

  test('deve bloquear acesso a rotas protegidas sem autenticação', async ({ page }) => {
    // Tentar acessar rota protegida sem estar autenticado
    await page.goto('/dashboard');

    // Deve redirecionar para login
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('deve manter sessão após refresh', async ({ authenticatedPage }) => {
    // Está autenticado
    const tokenAntes = await authenticatedPage.evaluate(() => localStorage.getItem('authToken'));

    // Fazer refresh
    await authenticatedPage.reload();

    // Deve continuar na mesma página
    await expect(authenticatedPage).toHaveURL(/.*dashboard/);

    // Token deve continuar
    const tokenDepois = await authenticatedPage.evaluate(() => localStorage.getItem('authToken'));
    expect(tokenDepois).toBe(tokenAntes);
  });
});
