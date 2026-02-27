import { test, expect, makeAuthenticatedRequest } from './fixtures';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getFirstTicketId(authenticatedPage: any): Promise<string | null> {
  const result = await makeAuthenticatedRequest(
    authenticatedPage,
    `${API_URL}/api/atendimento/tickets`,
    'GET',
  );

  if (result.status !== 200 || !result.data) {
    return null;
  }

  const payload = result.data;
  const tickets = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return null;
  }

  return tickets[0]?.id ?? null;
}

test.describe('API REST', () => {
  test('deve autenticar via API e retornar JWT', async ({ page, adminUser }) => {
    const response = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: adminUser.email,
        senha: adminUser.senha,
      },
    });

    expect([200, 201]).toContain(response.status());

    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data?.data?.access_token).toMatch(
      /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
    );
  });

  test('deve retornar erro com credenciais inválidas', async ({ page }) => {
    const response = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'invalido@test.com',
        senha: 'senhaerrada',
      },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(401);
  });

  test('deve responder em endpoint protegido com autenticação', async ({ authenticatedPage }) => {
    const result = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/api/atendimento/tickets`,
      'GET',
    );

    expect([200, 403]).toContain(result.status);
  });

  test('deve bloquear endpoint protegido sem autenticação', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/atendimento/tickets`, {
      failOnStatusCode: false,
    });

    expect([401, 403]).toContain(response.status());
  });

  test('deve listar mensagens de um ticket quando houver ticket disponível', async ({
    authenticatedPage,
  }) => {
    const ticketId = await getFirstTicketId(authenticatedPage);
    if (!ticketId) {
      test.skip();
      return;
    }

    const mensagensResult = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/api/atendimento/mensagens?ticketId=${ticketId}`,
      'GET',
    );

    expect([200, 403]).toContain(mensagensResult.status);
  });

  test('deve criar mensagem quando houver ticket e permissão', async ({ authenticatedPage }) => {
    const ticketId = await getFirstTicketId(authenticatedPage);
    if (!ticketId) {
      test.skip();
      return;
    }

    const mensagemResult = await makeAuthenticatedRequest(
      authenticatedPage,
      `${API_URL}/atendimento/mensagens`,
      'POST',
      {
        ticketId,
        tipo: 'TEXTO',
        conteudo: `Mensagem de teste E2E - ${Date.now()}`,
        remetente: 'ATENDENTE',
      },
    );

    if (mensagemResult.status === 403) {
      test.skip();
      return;
    }

    expect([200, 201]).toContain(mensagemResult.status);
    expect(mensagemResult.data?.success).toBeTruthy();
  });

  test('deve consultar estatísticas da IA quando o endpoint estiver disponível', async ({
    authenticatedPage,
  }) => {
    const result = await makeAuthenticatedRequest(authenticatedPage, `${API_URL}/ia/stats`, 'GET');

    expect([200, 403, 404]).toContain(result.status);
    if (result.status === 200) {
      expect(result.data).toBeTruthy();
    }
  });
});
