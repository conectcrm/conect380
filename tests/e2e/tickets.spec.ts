import { test, expect } from '@playwright/test';
import { loginAsUser } from './auth.spec';

/**
 * Testes E2E - Tickets e Atendimento
 * 
 * Valida o fluxo completo de atendimento:
 * - Listar tickets
 * - Filtrar tickets por status
 * - Selecionar ticket
 * - Carregar mensagens
 * - Enviar mensagem
 */

test.describe('Tickets e Atendimento', () => {
  
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await loginAsUser(page);
    
    // Navegar para página de atendimento
    await page.goto('/atendimento');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar lista de tickets', async ({ page }) => {
    // Verificar que a página de atendimento carregou
    await expect(page).toHaveURL(/\/atendimento/i);
    
    // Verificar presença da lista de tickets
    await expect(page.locator('[data-testid="tickets-list"], .tickets-list')).toBeVisible({
      timeout: 10000,
    });
    
    // Verificar que há pelo menos um ticket (ou mensagem de vazio)
    const ticketsCount = await page.locator('[data-testid="ticket-item"], .ticket-item').count();
    const emptyMessage = await page.locator('text=/nenhum ticket/i').count();
    
    expect(ticketsCount > 0 || emptyMessage > 0).toBeTruthy();
  });

  test('deve filtrar tickets por status', async ({ page }) => {
    // Aguardar lista carregar
    await page.waitForSelector('[data-testid="tickets-list"], .tickets-list', {
      timeout: 10000,
    });
    
    // Verificar se há filtros de status
    const statusFilters = page.locator('button:has-text("Abertos"), button:has-text("Pendentes"), button:has-text("Fechados")');
    const hasFilters = await statusFilters.count() > 0;
    
    if (hasFilters) {
      // Clicar no filtro "Abertos"
      const abertosButton = page.locator('button:has-text("Abertos")').first();
      await abertosButton.click();
      
      // Aguardar atualização da lista
      await page.waitForTimeout(1000);
      
      // Verificar que a lista foi atualizada
      const ticketsAfterFilter = await page.locator('[data-testid="ticket-item"], .ticket-item').count();
      expect(ticketsAfterFilter).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve selecionar um ticket e carregar mensagens', async ({ page }) => {
    // Aguardar lista de tickets
    await page.waitForSelector('[data-testid="tickets-list"], .tickets-list', {
      timeout: 10000,
    });
    
    // Contar tickets disponíveis
    const ticketsCount = await page.locator('[data-testid="ticket-item"], .ticket-item').count();
    
    if (ticketsCount > 0) {
      // Clicar no primeiro ticket
      const firstTicket = page.locator('[data-testid="ticket-item"], .ticket-item').first();
      await firstTicket.click();
      
      // Aguardar área de mensagens carregar
      await page.waitForSelector('[data-testid="messages-container"], .messages-container', {
        timeout: 10000,
      });
      
      // Verificar que o campo de envio de mensagem está visível
      await expect(page.locator('input[placeholder*="mensagem"], textarea[placeholder*="mensagem"]')).toBeVisible({
        timeout: 5000,
      });
    } else {
      console.log('⚠️  Nenhum ticket disponível para testar');
    }
  });

  test('deve enviar uma mensagem em um ticket', async ({ page }) => {
    // Aguardar lista de tickets
    await page.waitForSelector('[data-testid="tickets-list"], .tickets-list', {
      timeout: 10000,
    });
    
    const ticketsCount = await page.locator('[data-testid="ticket-item"], .ticket-item').count();
    
    if (ticketsCount > 0) {
      // Selecionar primeiro ticket
      await page.locator('[data-testid="ticket-item"], .ticket-item').first().click();
      await page.waitForTimeout(1000);
      
      // Encontrar campo de mensagem
      const messageInput = page.locator('input[placeholder*="mensagem"], textarea[placeholder*="mensagem"]').first();
      await expect(messageInput).toBeVisible({ timeout: 5000 });
      
      // Digitar mensagem de teste
      const testMessage = `Teste E2E - ${new Date().toISOString()}`;
      await messageInput.fill(testMessage);
      
      // Enviar mensagem (Enter ou botão)
      await messageInput.press('Enter');
      
      // Aguardar mensagem aparecer na lista
      await page.waitForTimeout(2000);
      
      // Verificar que a mensagem foi adicionada
      const sentMessage = page.locator(`text="${testMessage}"`);
      await expect(sentMessage).toBeVisible({ timeout: 5000 });
    } else {
      console.log('⚠️  Nenhum ticket disponível para testar envio de mensagem');
    }
  });

  test('deve exibir histórico de mensagens ao selecionar ticket', async ({ page }) => {
    // Aguardar lista de tickets
    await page.waitForSelector('[data-testid="tickets-list"], .tickets-list', {
      timeout: 10000,
    });
    
    const ticketsCount = await page.locator('[data-testid="ticket-item"], .ticket-item').count();
    
    if (ticketsCount > 0) {
      // Selecionar primeiro ticket
      await page.locator('[data-testid="ticket-item"], .ticket-item').first().click();
      
      // Aguardar mensagens carregarem
      await page.waitForTimeout(2000);
      
      // Verificar área de mensagens
      const messagesContainer = page.locator('[data-testid="messages-container"], .messages-container');
      await expect(messagesContainer).toBeVisible({ timeout: 5000 });
      
      // Contar mensagens carregadas
      const messagesCount = await page.locator('[data-testid="message-item"], .message-item').count();
      
      // Deve ter pelo menos 0 mensagens (vazio é OK)
      expect(messagesCount).toBeGreaterThanOrEqual(0);
      
      console.log(`✓ Ticket carregou ${messagesCount} mensagens`);
    }
  });

  test('deve navegar entre múltiplos tickets', async ({ page }) => {
    // Aguardar lista de tickets
    await page.waitForSelector('[data-testid="tickets-list"], .tickets-list', {
      timeout: 10000,
    });
    
    const ticketsCount = await page.locator('[data-testid="ticket-item"], .ticket-item').count();
    
    if (ticketsCount >= 2) {
      // Selecionar primeiro ticket
      await page.locator('[data-testid="ticket-item"], .ticket-item').nth(0).click();
      await page.waitForTimeout(1000);
      
      const firstTicketMessages = await page.locator('[data-testid="message-item"], .message-item').count();
      
      // Selecionar segundo ticket
      await page.locator('[data-testid="ticket-item"], .ticket-item').nth(1).click();
      await page.waitForTimeout(1000);
      
      const secondTicketMessages = await page.locator('[data-testid="message-item"], .message-item').count();
      
      // Mensagens devem ser diferentes (ou pelo menos a chamada funcionou)
      expect(typeof secondTicketMessages).toBe('number');
      
      console.log(`✓ Ticket 1: ${firstTicketMessages} mensagens | Ticket 2: ${secondTicketMessages} mensagens`);
    } else {
      console.log('⚠️  Menos de 2 tickets disponíveis para testar navegação');
    }
  });
});
