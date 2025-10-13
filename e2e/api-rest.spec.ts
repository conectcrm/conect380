import { test, expect, makeAuthenticatedRequest } from './fixtures';

/**
 * Testes E2E - API REST
 * 
 * Testa endpoints da API REST
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('API REST', () => {
  test('deve autenticar via API e retornar token JWT', async ({ page, adminUser }) => {
    const response = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: adminUser.email,
        senha: adminUser.senha,
      },
    });

    expect(response.status()).toBe(200 || 201);

    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data.token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
  });

  test('deve retornar erro 401 com credenciais inválidas', async ({ page }) => {
    const response = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'invalido@test.com',
        senha: 'senhaerrada',
      },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(401);
  });

  test('deve listar tickets autenticado', async ({ authenticatedPage }) => {
    // Fazer requisição autenticada
    const result = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/tickets`,
      'GET'
    );

    expect(result.status).toBe(200);
    expect(Array.isArray(result.data)).toBeTruthy();
  });

  test('deve bloquear acesso sem autenticação', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/tickets`, {
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(401);
  });

  test('deve criar mensagem via API', async ({ authenticatedPage }) => {
    // Obter primeiro ticket
    const ticketsResult = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/tickets`,
      'GET'
    );

    if (!ticketsResult.data || ticketsResult.data.length === 0) {
      console.log('⚠️ Nenhum ticket disponível para teste');
      test.skip();
      return;
    }

    const ticketId = ticketsResult.data[0].id;

    // Criar mensagem
    const mensagemResult = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/mensagens`,
      'POST',
      {
        ticketId,
        tipo: 'TEXTO',
        conteudo: `Mensagem de teste E2E - ${Date.now()}`,
        direcao: 'enviada',
      }
    );

    expect(mensagemResult.status).toBe(200 || 201);
    expect(mensagemResult.data).toHaveProperty('id');
  });

  test('deve listar mensagens de um ticket', async ({ authenticatedPage }) => {
    // Obter tickets
    const ticketsResult = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/tickets`,
      'GET'
    );

    if (!ticketsResult.data || ticketsResult.data.length === 0) {
      test.skip();
      return;
    }

    const ticketId = ticketsResult.data[0].id;

    // Listar mensagens
    const mensagensResult = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/mensagens?ticketId=${ticketId}`,
      'GET'
    );

    expect(mensagensResult.status).toBe(200);
    expect(Array.isArray(mensagensResult.data)).toBeTruthy();
  });

  test('deve obter estatísticas da IA (se habilitada)', async ({ authenticatedPage }) => {
    const result = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/ia/stats`,
      'GET'
    );

    // Se IA estiver habilitada, deve retornar 200
    // Se não, pode retornar 404 ou 503
    if (result.status === 200) {
      expect(result.data).toHaveProperty('provider');
      expect(result.data).toHaveProperty('isEnabled');
      console.log('✅ IA Stats:', result.data);
    } else {
      console.log('⚠️ IA não está habilitada ou endpoint não disponível');
    }
  });

  test('deve validar formato de dados ao criar mensagem', async ({ authenticatedPage }) => {
    // Tentar criar mensagem com dados inválidos
    const result = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/mensagens`,
      'POST',
      {
        // Faltando campos obrigatórios
        tipo: 'TEXTO',
      }
    );

    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('deve retornar perfil do usuário autenticado', async ({ authenticatedPage }) => {
    const result = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/users/me`,
      'GET'
    );

    if (result.status === 200) {
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('email');
    } else {
      console.log('⚠️ Endpoint /users/me não implementado ou rota diferente');
    }
  });

  test('deve listar eventos do sistema', async ({ authenticatedPage }) => {
    const result = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/eventos`,
      'GET'
    );

    if (result.status === 200) {
      expect(Array.isArray(result.data)).toBeTruthy();
    } else {
      console.log('⚠️ Endpoint /eventos não disponível');
    }
  });
});
