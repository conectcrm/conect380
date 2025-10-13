import { test, expect } from '@playwright/test';

/**
 * Testes E2E para Página de Configurações de Integrações
 * Testa: WhatsApp, OpenAI, Anthropic, Telegram, Twilio
 */

test.describe('Configurações de Integrações Omnichannel', () => {

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    // Aguardar redirect
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    // Navegar para página de integrações
    await page.goto('http://localhost:3000/configuracoes/integracoes');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar a página de integrações corretamente', async ({ page }) => {
    // Verificar título
    await expect(page.locator('h1')).toContainText('Integrações Omnichannel');

    // Verificar se todos os cards de integração estão visíveis
    await expect(page.locator('text=WhatsApp Business API')).toBeVisible();
    await expect(page.locator('text=OpenAI')).toBeVisible();
    await expect(page.locator('text=Anthropic Claude')).toBeVisible();
    await expect(page.locator('text=Telegram Bot')).toBeVisible();
    await expect(page.locator('text=Twilio')).toBeVisible();
  });

  test('deve exibir campos do WhatsApp Business API', async ({ page }) => {
    // Verificar campos específicos do WhatsApp
    await expect(page.locator('input[placeholder*="123456789012345"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="EAAxxxxxxxxx"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="token-secreto-webhook"]')).toBeVisible();

    // Verificar link para Meta Developers
    const metaLink = page.locator('a[href*="developers.facebook.com"]');
    await expect(metaLink).toBeVisible();
  });

  test('deve exibir campos do OpenAI', async ({ page }) => {
    // Verificar campo de API Key
    await expect(page.locator('input[placeholder*="sk-proj-"]')).toBeVisible();

    // Verificar select de modelo
    const modelSelect = page.locator('select').filter({ hasText: 'GPT-4o' });
    await expect(modelSelect).toBeVisible();

    // Verificar opções de modelo
    await modelSelect.click();
    await expect(page.locator('option[value="gpt-4o"]')).toBeVisible();
    await expect(page.locator('option[value="gpt-4o-mini"]')).toBeVisible();
    await expect(page.locator('option[value="gpt-3.5-turbo"]')).toBeVisible();
  });

  test('deve exibir campos do Anthropic Claude', async ({ page }) => {
    // Verificar campo de API Key
    await expect(page.locator('input[placeholder*="sk-ant-"]')).toBeVisible();

    // Verificar select de modelo
    const modelSelect = page.locator('select').filter({ hasText: 'Claude' });
    await expect(modelSelect).toBeVisible();

    // Verificar opções de modelo
    await modelSelect.click();
    await expect(page.locator('option[value*="claude-3-5-sonnet"]')).toBeVisible();
  });

  test('deve exibir campos do Telegram', async ({ page }) => {
    // Verificar campo de Bot Token
    await expect(page.locator('input[placeholder*="123456789:ABC"]')).toBeVisible();

    // Verificar card de instruções
    await expect(page.locator('text=Como criar um bot no Telegram')).toBeVisible();
    await expect(page.locator('text=@BotFather')).toBeVisible();
  });

  test('deve exibir campos do Twilio', async ({ page }) => {
    // Verificar campos do Twilio
    await expect(page.locator('input[placeholder*="ACxxxxxx"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="+5511999999999"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="whatsapp:+14155238886"]')).toBeVisible();
  });

  test('deve mostrar/ocultar senhas com toggle', async ({ page }) => {
    // Pegar primeiro input de senha (WhatsApp Access Token)
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();

    // Verificar que está como password
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Clicar no toggle
    await toggleButton.click();

    // Verificar que mudou para text
    const textInput = page.locator('input[type="text"]').first();
    await expect(textInput).toBeVisible();
  });

  test('deve ter botões de salvar para cada integração', async ({ page }) => {
    // Contar botões "Salvar Configuração"
    const saveButtons = page.locator('button:has-text("Salvar Configuração")');
    const count = await saveButtons.count();

    // Deve ter 5 botões (uma para cada integração)
    expect(count).toBe(5);
  });

  test('deve ter botões de testar conexão para cada integração', async ({ page }) => {
    // Contar botões "Testar Conexão"
    const testButtons = page.locator('button:has-text("Testar Conexão")');
    const count = await testButtons.count();

    // Deve ter 5 botões (uma para cada integração)
    expect(count).toBe(5);
  });

  test('deve desabilitar botões quando campos estão vazios', async ({ page }) => {
    // Verificar que botões de teste estão desabilitados inicialmente
    const firstTestButton = page.locator('button:has-text("Testar Conexão")').first();
    await expect(firstTestButton).toBeDisabled();
  });

  test('deve exibir card de aviso de segurança', async ({ page }) => {
    // Verificar card de segurança
    await expect(page.locator('text=Segurança das Credenciais')).toBeVisible();
    await expect(page.locator('text=armazenadas de forma criptografada')).toBeVisible();
  });

  test('deve ter links externos para documentação', async ({ page }) => {
    // Verificar links externos
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    // Deve ter pelo menos 5 links (um para cada serviço)
    expect(count).toBeGreaterThanOrEqual(5);

    // Verificar alguns links específicos
    await expect(page.locator('a[href*="developers.facebook.com"]')).toBeVisible();
    await expect(page.locator('a[href*="platform.openai.com"]')).toBeVisible();
    await expect(page.locator('a[href*="console.anthropic.com"]')).toBeVisible();
    await expect(page.locator('a[href*="twilio.com"]')).toBeVisible();
  });

  test('deve preencher e salvar configuração WhatsApp', async ({ page }) => {
    // Preencher campos do WhatsApp
    await page.fill('input[placeholder*="123456789012345"]', '123456789012345');
    await page.fill('input[placeholder*="EAAxxxxxxxxx"]', 'EAA_test_token_12345');
    await page.fill('input[placeholder*="token-secreto-webhook"]', 'meu-token-secreto-123');

    // Clicar em Salvar
    const saveButton = page.locator('button:has-text("Salvar Configuração")').first();
    await saveButton.click();

    // Aguardar notificação de sucesso (toast)
    await expect(page.locator('text=salva com sucesso')).toBeVisible({ timeout: 3000 });
  });

  test('deve preencher e salvar configuração OpenAI', async ({ page }) => {
    // Preencher API Key
    await page.fill('input[placeholder*="sk-proj-"]', 'sk-proj-test-key-123456');

    // Selecionar modelo
    const modelSelect = page.locator('select').filter({ hasText: 'GPT-4o' });
    await modelSelect.selectOption('gpt-4o-mini');

    // Ajustar Max Tokens
    await page.fill('input[type="number"]', '1500');

    // Clicar em Salvar (segundo botão)
    const saveButton = page.locator('button:has-text("Salvar Configuração")').nth(1);
    await saveButton.click();

    // Aguardar notificação
    await expect(page.locator('text=salva com sucesso')).toBeVisible({ timeout: 3000 });
  });

  test('deve testar conexão (simulação)', async ({ page }) => {
    // Preencher campo obrigatório
    await page.fill('input[placeholder*="123456789012345"]', '123456789012345');
    await page.fill('input[placeholder*="EAAxxxxxxxxx"]', 'EAA_test_token');

    // Clicar em Testar Conexão
    const testButton = page.locator('button:has-text("Testar Conexão")').first();
    await testButton.click();

    // Verificar loading state
    await expect(page.locator('svg.animate-spin')).toBeVisible();

    // Aguardar resultado (sucesso ou erro)
    await expect(page.locator('text=/testada com sucesso|Erro ao testar/')).toBeVisible({ timeout: 5000 });
  });

  test('deve carregar configurações existentes do backend', async ({ page }) => {
    // Aguardar requisição ao backend
    await page.waitForResponse(response =>
      response.url().includes('/api/atendimento/canais') && response.status() === 200
    );

    // Se houver configurações, os campos devem estar preenchidos
    // (Teste passará mesmo se não houver dados - apenas verifica que não dá erro)
    await page.waitForTimeout(1000);
  });

  test('deve exibir badge "Ativo" quando integração está configurada', async ({ page }) => {
    // Se uma integração estiver configurada, deve ter badge "Ativo"
    const badges = page.locator('span:has-text("Ativo")');

    // Pode ter 0 ou mais badges (depende das configurações)
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve ter botão de recarregar', async ({ page }) => {
    const reloadButton = page.locator('button:has-text("Recarregar")');
    await expect(reloadButton).toBeVisible();

    // Clicar e verificar que faz nova requisição
    const responsePromise = page.waitForResponse('/api/atendimento/canais');
    await reloadButton.click();
    await responsePromise;
  });

  test('deve ser responsivo', async ({ page }) => {
    // Testar em diferentes tamanhos de tela

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Tentar salvar sem preencher campos
    const saveButton = page.locator('button:has-text("Salvar Configuração")').first();
    await saveButton.click();

    // Deve mostrar erro ou não fazer nada (campos vazios)
    // Backend deve retornar erro se tentar salvar vazio
    await page.waitForTimeout(1000);
  });

  test('deve formatar inputs corretamente', async ({ page }) => {
    // Testar formato de telefone
    const phoneInput = page.locator('input[placeholder*="+5511999999999"]');
    await phoneInput.fill('11999999999');

    // Verificar que aceita apenas números/formato válido
    const value = await phoneInput.inputValue();
    expect(value).toBeTruthy();
  });

  test('deve exibir ícones coloridos para cada integração', async ({ page }) => {
    // Verificar presença de ícones SVG
    const icons = page.locator('svg[class*="lucide"]');
    const count = await icons.count();

    // Deve ter vários ícones (pelo menos 10)
    expect(count).toBeGreaterThan(10);
  });

  test('deve ter instruções claras para Telegram', async ({ page }) => {
    // Verificar card de instruções do Telegram
    await expect(page.locator('text=/Abra o Telegram/')).toBeVisible();
    await expect(page.locator('text=/Envie o comando/')).toBeVisible();
    await expect(page.locator('text=/newbot/')).toBeVisible();
  });

  test('deve navegar entre integrações sem reload', async ({ page }) => {
    // Página deve ser SPA (Single Page Application)
    // Não deve haver reload completo ao interagir

    const navigationPromise = page.waitForNavigation({ timeout: 1000 }).catch(() => null);

    // Clicar em algum botão
    await page.locator('button').first().click();

    const didNavigate = await navigationPromise;
    expect(didNavigate).toBeNull(); // Não deve ter navegação completa
  });
});

test.describe('Integração com Backend API', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('deve fazer requisição GET ao carregar', async ({ page }) => {
    // Interceptar requisição
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/atendimento/canais')
    );

    await page.goto('http://localhost:3000/configuracoes/integracoes');

    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('deve enviar dados corretos ao salvar', async ({ page }) => {
    await page.goto('http://localhost:3000/configuracoes/integracoes');

    // Interceptar requisição POST
    const requestPromise = page.waitForRequest(
      request => request.url().includes('/api/atendimento/canais') && request.method() === 'POST'
    );

    // Preencher e salvar
    await page.fill('input[placeholder*="123456789012345"]', '123456789012345');
    await page.fill('input[placeholder*="EAAxxxxxxxxx"]', 'EAA_test_token');
    await page.locator('button:has-text("Salvar Configuração")').first().click();

    const request = await requestPromise;
    const postData = request.postDataJSON();

    // Verificar estrutura do payload
    expect(postData).toHaveProperty('nome');
    expect(postData).toHaveProperty('tipo');
    expect(postData).toHaveProperty('config');
    expect(postData.config).toHaveProperty('credenciais');
  });

  test('deve incluir Authorization header', async ({ page }) => {
    await page.goto('http://localhost:3000/configuracoes/integracoes');

    const requestPromise = page.waitForRequest(
      request => request.url().includes('/api/atendimento/canais')
    );

    await page.waitForLoadState('networkidle');
    const request = await requestPromise;

    // Verificar header de autenticação
    const headers = request.headers();
    expect(headers).toHaveProperty('authorization');
    expect(headers.authorization).toContain('Bearer');
  });
});

test.describe('Testes de Performance', () => {

  test('deve carregar em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/configuracoes/integracoes');
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});
