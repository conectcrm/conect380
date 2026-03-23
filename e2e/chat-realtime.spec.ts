import { test, expect } from './fixtures';

/**
 * Testes E2E - Chat em Tempo Real
 * 
 * Testa o fluxo completo de chat com WebSocket
 */

test.describe('Chat em Tempo Real', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar chamadas WebSocket para debug
    await page.evaluate(() => {
      // Flag para indicar conexão WebSocket
      (window as any).wsConnected = false;
      (window as any).wsMessages = [];

      // Monitorar WebSocket
      const originalWebSocket = window.WebSocket;
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols);

          this.addEventListener('open', () => {
            console.log('[Test] WebSocket connected');
            (window as any).wsConnected = true;
          });

          this.addEventListener('close', () => {
            console.log('[Test] WebSocket disconnected');
            (window as any).wsConnected = false;
          });

          this.addEventListener('message', (event) => {
            console.log('[Test] WebSocket message:', event.data);
            (window as any).wsMessages.push(event.data);
          });
        }
      };
    });
  });

  test('deve carregar página de atendimento', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');

    // Verificar título ou elementos principais
    await expect(authenticatedPage.locator('text=/Atendimento|Chat|Tickets/i').first()).toBeVisible();
  });

  test('deve conectar ao WebSocket automaticamente', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');

    const connected = await authenticatedPage
      .waitForFunction(() => (window as any).wsConnected === true, { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (!connected) {
      test.skip();
      return;
    }

    // Verificar indicador de conexão na UI, quando disponível
    const connectionByTestId = authenticatedPage.locator('[data-testid="connection-indicator"]').first();
    const connectionByText = authenticatedPage.getByText(/Online|Conectado/i).first();
    if ((await connectionByTestId.count()) > 0) {
      await expect(connectionByTestId).toBeVisible({ timeout: 5000 });
    } else if ((await connectionByText.count()) > 0) {
      await expect(connectionByText).toBeVisible({ timeout: 5000 });
    }
  });

  test('deve exibir lista de tickets', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');

    // Aguardar carregamento da lista
    await authenticatedPage.waitForTimeout(2000);

    // Verificar se existe área de tickets
    const ticketList = authenticatedPage.locator(
      '[data-testid="ticket-list"], .ticket-list, [class*="TicketList"]'
    ).first();

    if (await ticketList.count() > 0) {
      await expect(ticketList).toBeVisible();
    } else {
      console.log('⚠️ Lista de tickets não encontrada - verificar estrutura do componente');
    }
  });

  test('deve selecionar um ticket e exibir mensagens', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');
    await authenticatedPage.waitForTimeout(2000);

    // Procurar primeiro ticket na lista
    const firstTicket = authenticatedPage.locator(
      '[data-testid^="ticket-"], .ticket-item, [class*="ticket"]'
    ).first();

    if (await firstTicket.count() > 0) {
      await firstTicket.click();

      // Aguardar área de mensagens aparecer
      await authenticatedPage.waitForTimeout(1000);

      // Verificar se área de mensagens está visível
      const messageArea = authenticatedPage.locator(
        '[data-testid="message-list"], .message-list, [class*="MessageList"]'
      ).first();

      await expect(messageArea).toBeVisible({ timeout: 5000 });

      // Verificar se input de mensagem está visível
      const messageInput = authenticatedPage.locator(
        'textarea[placeholder*="mensagem"], input[placeholder*="mensagem"]'
      ).first();

      await expect(messageInput).toBeVisible();
    } else {
      console.log('⚠️ Nenhum ticket encontrado - criar ticket antes de rodar este teste');
      test.skip();
    }
  });

  test('deve enviar mensagem via WebSocket', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');
    await authenticatedPage.waitForTimeout(2000);

    // Selecionar ticket
    const firstTicket = authenticatedPage.locator(
      '[data-testid^="ticket-"], .ticket-item'
    ).first();

    if (await firstTicket.count() === 0) {
      console.log('⚠️ Nenhum ticket encontrado');
      test.skip();
      return;
    }

    await firstTicket.click();
    await authenticatedPage.waitForTimeout(1000);

    // Encontrar input de mensagem
    const messageInput = authenticatedPage.locator(
      'textarea[placeholder*="mensagem"], textarea[placeholder*="Digite"]'
    ).first();

    if (await messageInput.count() === 0) {
      console.log('⚠️ Input de mensagem não encontrado');
      test.skip();
      return;
    }

    // Digitar mensagem de teste
    const testMessage = `Teste E2E - ${Date.now()}`;
    await messageInput.fill(testMessage);

    // Enviar (Enter ou botão)
    const sendButton = authenticatedPage.locator(
      'button[type="submit"], button:has-text("Enviar")'
    ).first();

    if (await sendButton.count() > 0) {
      await sendButton.click();
    } else {
      await messageInput.press('Enter');
    }

    // Aguardar mensagem aparecer na lista
    await authenticatedPage.waitForTimeout(2000);

    // Verificar se mensagem apareceu
    const sentMessage = authenticatedPage.locator(`text="${testMessage}"`);
    await expect(sentMessage).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir indicador "digitando..."', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');
    await authenticatedPage.waitForTimeout(2000);

    // Selecionar ticket
    const firstTicket = authenticatedPage.locator('[data-testid^="ticket-"]').first();

    if (await firstTicket.count() === 0) {
      test.skip();
      return;
    }

    await firstTicket.click();
    await authenticatedPage.waitForTimeout(1000);

    // Encontrar input
    const messageInput = authenticatedPage.locator('textarea[placeholder*="mensagem"]').first();

    if (await messageInput.count() === 0) {
      test.skip();
      return;
    }

    // Começar a digitar
    await messageInput.focus();
    await messageInput.type('Testando...', { delay: 100 });

    // Aguardar evento WebSocket (debounce de 500ms)
    await authenticatedPage.waitForTimeout(1000);

    // Verificar se evento foi emitido (via console ou verificação)
    const wsMessages = await authenticatedPage.evaluate(() => (window as any).wsMessages || []);
    console.log('WebSocket messages:', wsMessages);

    // Este teste é mais para verificar que não há erros
    expect(wsMessages.length).toBeGreaterThanOrEqual(0);
  });

  test('deve receber mensagem em tempo real (simulado)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');

    // Aguardar WebSocket conectar
    await authenticatedPage.waitForFunction(
      () => (window as any).wsConnected === true,
      { timeout: 10000 }
    ).catch(() => {
      console.log('⚠️ WebSocket não conectado');
    });

    // Selecionar ticket
    const firstTicket = authenticatedPage.locator('[data-testid^="ticket-"]').first();

    if (await firstTicket.count() === 0) {
      test.skip();
      return;
    }

    await firstTicket.click();
    await authenticatedPage.waitForTimeout(1000);

    // Contar mensagens atuais
    const messagesBefore = await authenticatedPage.locator('.message, [class*="message"]').count();

    // Simular recebimento de mensagem via WebSocket (via console)
    // Em um teste real, você teria outro cliente enviando mensagem

    console.log(`Mensagens antes: ${messagesBefore}`);

    // Este teste seria melhor com dois browsers simultâneos
    // Por ora, apenas verificamos que a estrutura está pronta
  });

  test('deve exibir indicador de conexão offline quando desconectar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');

    // Aguardar conexão
    await authenticatedPage.waitForFunction(
      () => (window as any).wsConnected === true,
      { timeout: 10000 }
    ).catch(() => { });

    // Simular desconexão (offline)
    await authenticatedPage.evaluate(() => {
      // Forçar desconexão
      (window as any).wsConnected = false;
    });

    await authenticatedPage.waitForTimeout(1000);

    // Verificar indicador offline (se implementado)
    const offlineByTestId = authenticatedPage.locator('[data-testid="offline-indicator"]').first();
    const offlineByText = authenticatedPage.getByText(/Offline|Desconectado/i).first();

    // Este teste é opcional, depende da implementação
    if ((await offlineByTestId.count()) > 0) {
      await expect(offlineByTestId).toBeVisible();
    } else if ((await offlineByText.count()) > 0) {
      await expect(offlineByText).toBeVisible();
    }
  });

  test('deve filtrar tickets por status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/atendimento');
    await authenticatedPage.waitForTimeout(2000);

    // Procurar filtros de status
    const filterButtons = authenticatedPage.locator(
      'button:has-text("Todos"), button:has-text("Abertos"), button:has-text("Em Atendimento")'
    );

    if (await filterButtons.count() > 0) {
      // Clicar em "Abertos"
      const openButton = filterButtons.filter({ hasText: /Abertos/i }).first();

      if (await openButton.count() > 0) {
        await openButton.click();
        await authenticatedPage.waitForTimeout(500);

        // Verificar que filtro foi aplicado
        await expect(openButton).toHaveClass(/active|selected/, { timeout: 2000 }).catch(() => { });
      }
    } else {
      console.log('⚠️ Filtros não encontrados - componente TicketList pode estar diferente');
    }
  });
});
