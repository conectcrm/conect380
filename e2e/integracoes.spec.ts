import { test, expect } from './fixtures';

async function gotoIntegracoes(authenticatedPage: any) {
  await authenticatedPage.goto('/configuracoes/integracoes');
  await authenticatedPage.waitForLoadState('domcontentloaded');
  await expect(
    authenticatedPage.getByRole('heading', { name: /Omnichannel/i }),
  ).toBeVisible({ timeout: 15000 });
}

test.describe('Configuracoes de Integracoes Omnichannel', () => {
  test('deve carregar a página com os blocos principais', async ({ authenticatedPage }) => {
    await gotoIntegracoes(authenticatedPage);

    await expect(authenticatedPage.getByText(/WhatsApp Business API/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/OpenAI/i).first()).toBeVisible();
    await expect(authenticatedPage.getByText(/Anthropic Claude/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Telegram Bot/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Twilio/i).first()).toBeVisible();
    await expect(authenticatedPage.getByRole('heading', { name: /Credenciais/i })).toBeVisible();
  });

  test('deve exibir campos essenciais de cada integração', async ({ authenticatedPage }) => {
    await gotoIntegracoes(authenticatedPage);

    await expect(authenticatedPage.getByPlaceholder('123456789012345').first()).toBeVisible();
    await expect(
      authenticatedPage.getByPlaceholder(/sk-proj-|sk-ant-|123456789:ABC/i).first(),
    ).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder('+5511999999999')).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder('whatsapp:+14155238886')).toBeVisible();
  });

  test('deve exibir acoes de salvar e testar conexao', async ({ authenticatedPage }) => {
    await gotoIntegracoes(authenticatedPage);

    const saveButtons = authenticatedPage.getByRole('button', { name: /Salvar Configura/i });
    await expect(saveButtons.first()).toBeVisible();
    expect(await saveButtons.count()).toBeGreaterThanOrEqual(5);

    const testButtons = authenticatedPage.getByRole('button', { name: /Testar Conex|Validar Token/i });
    await expect(testButtons.first()).toBeVisible();
    expect(await testButtons.count()).toBeGreaterThanOrEqual(5);
  });

  test('deve exibir links externos de documentacao', async ({ authenticatedPage }) => {
    await gotoIntegracoes(authenticatedPage);

    await expect(authenticatedPage.locator('a[href*="developers.facebook.com"]').first()).toBeVisible();
    await expect(authenticatedPage.locator('a[href*="platform.openai.com"]').first()).toBeVisible();
    await expect(authenticatedPage.locator('a[href*="console.anthropic.com"]').first()).toBeVisible();
    await expect(authenticatedPage.locator('a[href*="twilio.com"]').first()).toBeVisible();
  });

  test('deve alternar visibilidade de um campo sensivel', async ({ authenticatedPage }) => {
    await gotoIntegracoes(authenticatedPage);

    const secretField = authenticatedPage.locator('input[type="password"]').first();
    await expect(secretField).toBeVisible();

    const toggleButton = secretField.locator('xpath=following-sibling::button[1]');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    const fieldAsText = authenticatedPage.locator('input[type="text"]').first();
    await expect(fieldAsText).toBeVisible();
  });

  test('deve permanecer funcional em diferentes larguras de viewport', async ({ authenticatedPage }) => {
    await gotoIntegracoes(authenticatedPage);

    await authenticatedPage.setViewportSize({ width: 1280, height: 900 });
    await expect(
      authenticatedPage.getByRole('heading', { name: /Omnichannel/i }),
    ).toBeVisible();

    await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
    await expect(
      authenticatedPage.getByRole('heading', { name: /Omnichannel/i }),
    ).toBeVisible();

    await authenticatedPage.setViewportSize({ width: 390, height: 844 });
    await expect(
      authenticatedPage.getByRole('heading', { name: /Omnichannel/i }),
    ).toBeVisible();
  });
});
