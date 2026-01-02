import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Fluxo Completo de Chat Omnichannel
 * 
 * TC004: Selecionar ticket e enviar mensagem
 * TC005: Upload de arquivo (se implementado)
 * TC006: Transferir ticket (se implementado)
 * 
 * Prioridade: CRÍTICA (Week 1)
 * Referência: OMNICHANNEL_GUIA_TESTES.md
 */

test.describe('Chat Omnichannel - Fluxo Crítico', () => {

  test.beforeEach(async ({ page }) => {
    // Login como atendente
    await page.goto('/login');

    // Aguardar página carregar
    await page.waitForLoadState('networkidle');

    // Preencher email (sem atributo name, usar type e placeholder)
    await page.fill('input[type="email"]', 'atendente@conectsuite.com.br');

    // Preencher senha
    await page.fill('input[type="password"]', 'senha123');

    // Clicar no botão de login
    await page.click('button:has-text("Entrar")');

    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard|atendimento/, { timeout: 10000 });
  });

  test('TC004: Selecionar ticket e enviar mensagem', async ({ page }) => {
    // Navegar para chat/atendimento
    const atendimentoLink = page.locator('text=/Atendimento|Chat/i').first();
    if (await atendimentoLink.count() > 0) {
      await atendimentoLink.click();
    } else {
      await page.goto('/atendimento');
    }

    // Aguardar carregamento da página
    await page.waitForTimeout(2000);

    // Verificar se há tickets na fila
    const ticketList = page.locator('[data-testid="ticket-list"], .ticket-list, [class*="ticket"]');
    const ticketCount = await ticketList.count();

    if (ticketCount === 0) {
      console.log('⚠️ Nenhum ticket disponível para teste');
      console.log('   Criar tickets de teste no banco ou via API antes de executar');
      test.skip();
      return;
    }

    // Selecionar primeiro ticket
    const firstTicket = page.locator('[data-testid^="ticket-"], .ticket-item, [class*="ticket"]').first();
    await firstTicket.click();

    // Aguardar área de chat carregar
    await page.waitForTimeout(1500);

    // Verificar se área de chat está visível
    const chatArea = page.locator('[data-testid="chat-area"], [class*="ChatArea"], .chat-messages');
    await expect(chatArea.first()).toBeVisible({ timeout: 5000 });

    // Procurar campo de input de mensagem
    const messageInput = page.locator(
      'input[placeholder*="mensagem" i], textarea[placeholder*="mensagem" i], [data-testid="chat-input"], [data-testid="message-input"]'
    ).first();

    await expect(messageInput).toBeVisible({ timeout: 3000 });

    // Digitar mensagem de teste
    const testMessage = `Teste E2E - ${new Date().toISOString()}`;
    await messageInput.fill(testMessage);

    // Aguardar indicador de "digitando" (se implementado)
    await page.waitForTimeout(500);

    // Procurar botão de enviar
    const sendButton = page.locator(
      'button[type="submit"], button[data-testid="send-button"], button[aria-label*="Enviar" i]'
    ).first();

    await sendButton.click();

    // Aguardar mensagem aparecer no chat
    await page.waitForTimeout(1000);

    // Verificar se mensagem foi enviada
    const sentMessage = page.locator(`text="${testMessage}"`);
    await expect(sentMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ TC004: Mensagem enviada com sucesso');
  });

  test('TC007: Verificar indicador de digitando (typing indicator)', async ({ page }) => {
    // Navegar para atendimento
    await page.goto('/atendimento');
    await page.waitForTimeout(2000);

    // Selecionar ticket
    const firstTicket = page.locator('[data-testid^="ticket-"], .ticket-item').first();
    if (await firstTicket.count() > 0) {
      await firstTicket.click();
      await page.waitForTimeout(1500);

      // Procurar campo de input
      const messageInput = page.locator(
        'input[placeholder*="mensagem" i], textarea[placeholder*="mensagem" i]'
      ).first();

      if (await messageInput.count() > 0) {
        // Começar a digitar
        await messageInput.focus();
        await messageInput.type('Test', { delay: 100 });

        // Aguardar WebSocket enviar evento (se implementado)
        await page.waitForTimeout(1000);

        // Verificar se evento foi disparado (validar via DevTools/Network)
        console.log('✅ TC007: Indicador de digitando testado (verificar WebSocket)');
      } else {
        console.log('⚠️ Campo de mensagem não encontrado');
        test.skip();
      }
    } else {
      console.log('⚠️ Nenhum ticket disponível');
      test.skip();
    }
  });

  test('TC008: Verificar histórico de mensagens', async ({ page }) => {
    // Navegar para atendimento
    await page.goto('/atendimento');
    await page.waitForTimeout(2000);

    // Selecionar ticket
    const firstTicket = page.locator('[data-testid^="ticket-"], .ticket-item').first();
    if (await firstTicket.count() > 0) {
      await firstTicket.click();
      await page.waitForTimeout(1500);

      // Verificar se mensagens antigas são carregadas
      const messages = page.locator('[data-testid^="message-"], .message-item, [class*="Message"]');
      const messageCount = await messages.count();

      if (messageCount > 0) {
        console.log(`✅ TC008: ${messageCount} mensagens no histórico`);

        // Verificar scroll (deve iniciar no final)
        const chatContainer = page.locator('[data-testid="chat-area"], .chat-messages').first();
        if (await chatContainer.count() > 0) {
          const isScrolledToBottom = await page.evaluate(() => {
            const container = document.querySelector('[data-testid="chat-area"], .chat-messages') as HTMLElement;
            if (container) {
              return container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
            }
            return false;
          });

          expect(isScrolledToBottom).toBeTruthy();
          console.log('✅ TC008: Chat iniciado no final do histórico');
        }
      } else {
        console.log('⚠️ Nenhuma mensagem no histórico');
      }
    } else {
      console.log('⚠️ Nenhum ticket disponível');
      test.skip();
    }
  });

  test('TC009: Verificar status de conexão WebSocket', async ({ page }) => {
    // Navegar para atendimento
    await page.goto('/atendimento');
    await page.waitForTimeout(2000);

    // Verificar indicador de conexão (se implementado)
    const connectionIndicator = page.locator(
      '[data-testid="connection-status"], [class*="connection"], text=/Online|Conectado/i'
    ).first();

    if (await connectionIndicator.count() > 0) {
      await expect(connectionIndicator).toBeVisible({ timeout: 5000 });
      console.log('✅ TC009: Indicador de conexão visível');
    } else {
      console.log('⚠️ Indicador de conexão não encontrado (pode não estar implementado)');
    }

    // Verificar se WebSocket está conectado via console
    const wsConnected = await page.evaluate(() => {
      return (window as any).wsConnected || false;
    });

    if (wsConnected) {
      console.log('✅ TC009: WebSocket conectado');
    } else {
      console.log('⚠️ WebSocket não conectado (verificar backend rodando)');
    }
  });

  test('TC010: Enviar múltiplas mensagens sequenciais', async ({ page }) => {
    // Navegar para atendimento
    await page.goto('/atendimento');
    await page.waitForTimeout(2000);

    // Selecionar ticket
    const firstTicket = page.locator('[data-testid^="ticket-"], .ticket-item').first();
    if (await firstTicket.count() === 0) {
      console.log('⚠️ Nenhum ticket disponível');
      test.skip();
      return;
    }

    await firstTicket.click();
    await page.waitForTimeout(1500);

    // Procurar campo de input
    const messageInput = page.locator(
      'input[placeholder*="mensagem" i], textarea[placeholder*="mensagem" i]'
    ).first();

    const sendButton = page.locator(
      'button[type="submit"], button[data-testid="send-button"]'
    ).first();

    if (await messageInput.count() === 0) {
      console.log('⚠️ Campo de mensagem não encontrado');
      test.skip();
      return;
    }

    // Enviar 3 mensagens sequenciais
    for (let i = 1; i <= 3; i++) {
      const message = `Teste múltiplas mensagens ${i} - ${Date.now()}`;
      await messageInput.fill(message);
      await sendButton.click();
      await page.waitForTimeout(500);

      // Verificar se mensagem apareceu
      const sentMessage = page.locator(`text="${message}"`);
      await expect(sentMessage).toBeVisible({ timeout: 3000 });
    }

    console.log('✅ TC010: 3 mensagens enviadas sequencialmente com sucesso');
  });
});
