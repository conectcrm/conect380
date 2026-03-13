import { expect, test } from "./fixtures";

const CLIENTE_ID = "11111111-1111-4111-8111-111111111111";

const CLIENTE_FIXTURE = {
  id: CLIENTE_ID,
  nome: "Cliente E2E Perfil",
  email: "cliente.e2e@conect360.com.br",
  telefone: "11999990000",
  tipo: "pessoa_fisica" as const,
  status: "cliente" as const,
  endereco: "Rua das Flores, 100",
  cidade: "Sao Paulo",
  estado: "SP",
  cep: "01001000",
  empresa: "Conect360",
  cargo: "Diretor de Operacoes",
  documento: "12345678909",
  created_at: "2026-02-24T12:00:00.000Z",
  updated_at: "2026-02-24T12:00:00.000Z",
};

function isApiRequest(url: URL): boolean {
  return url.port === "3001" || url.origin.includes("3001");
}

async function mockClientesModalToProfileFlow(page: any) {
  await page.route("**/clientes/estatisticas**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 1,
        ativos: 1,
        prospects: 0,
        leads: 0,
      }),
    });
  });

  await page.route(/\/clientes(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [CLIENTE_FIXTURE],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    });
  });

  await page.route(/\/clientes\/[^/]+$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CLIENTE_FIXTURE),
    });
  });

  await page.route(/\/clientes\/[^/]+\/tickets\/resumo(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 0,
        abertos: 0,
        resolvidos: 0,
        ultimoAtendimentoEm: null,
        tickets: [],
      }),
    });
  });

  await page.route(/\/clientes\/[^/]+\/propostas\/resumo(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 0,
        aprovadas: 0,
        pendentes: 0,
        rejeitadas: 0,
        ultimoRegistroEm: null,
        propostas: [],
      }),
    });
  });

  await page.route(/\/clientes\/[^/]+\/contratos\/resumo(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 0,
        pendentes: 0,
        assinados: 0,
        encerrados: 0,
        ultimoRegistroEm: null,
        contratos: [],
      }),
    });
  });

  await page.route(/\/clientes\/[^/]+\/faturas\/resumo(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 0,
        pagas: 0,
        pendentes: 0,
        vencidas: 0,
        ultimoRegistroEm: null,
        faturas: [],
      }),
    });
  });

  await page.route(/\/api\/atendimento\/clientes\/[^/]+\/contexto$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cliente: {
          id: CLIENTE_ID,
          nome: CLIENTE_FIXTURE.nome,
          email: CLIENTE_FIXTURE.email,
          telefone: CLIENTE_FIXTURE.telefone,
          segmento: "geral",
          primeiroContato: "2026-02-20T10:00:00.000Z",
          ultimoContato: "2026-02-24T10:00:00.000Z",
          tags: [],
        },
        estatisticas: {
          valorTotalGasto: 0,
          totalTickets: 0,
          ticketsResolvidos: 0,
          ticketsAbertos: 0,
          avaliacaoMedia: 0,
          tempoMedioResposta: "0m",
        },
        historico: {
          propostas: [],
          faturas: [],
          tickets: [],
        },
      }),
    });
  });

  await page.route(/\/clientes\/[^/]+\/anexos(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(/\/notas\/cliente\/[^/]+\/count(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 0, importantes: 0 }),
    });
  });

  await page.route(/\/demandas\/cliente\/[^/]+\/count(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 0, abertas: 0, urgentes: 0 }),
    });
  });
}

test.describe("Clientes - navegacao para perfil completo", () => {
  async function assertModalNavigation(
    authenticatedPage: any,
    listPath: "/clientes" | "/crm/clientes",
    detailPath: string,
  ) {
    await mockClientesModalToProfileFlow(authenticatedPage);

    await authenticatedPage.goto(listPath);
    await authenticatedPage.waitForLoadState("domcontentloaded");

    await expect(authenticatedPage.getByRole("heading", { name: /Clientes/i })).toBeVisible();

    const detailsButton = authenticatedPage.locator('button[title="Abrir perfil"]').first();
    await expect(detailsButton).toBeVisible();
    await detailsButton.click();

    await authenticatedPage.waitForURL(`**${detailPath}`);
    await expect(authenticatedPage).toHaveURL(new RegExp(`${detailPath.replace(/\//g, "\\/")}$`));

    await expect(
      authenticatedPage.getByRole("heading", { name: /Perfil do Cliente/i }),
    ).toBeVisible();
    await expect(authenticatedPage.getByRole("heading", { name: CLIENTE_FIXTURE.nome })).toBeVisible();
    await expect(
      authenticatedPage.getByRole("link", { name: CLIENTE_FIXTURE.email }),
    ).toBeVisible();
    await expect(authenticatedPage.getByRole("heading", { name: /Contato/i })).toBeVisible();
  }

  test("abre perfil completo a partir de /clientes", async ({
    authenticatedPage,
  }) => {
    await assertModalNavigation(authenticatedPage, "/clientes", `/clientes/${CLIENTE_ID}`);
  });

  test("abre perfil completo a partir de /crm/clientes", async ({
    authenticatedPage,
  }) => {
    await assertModalNavigation(authenticatedPage, "/crm/clientes", `/crm/clientes/${CLIENTE_ID}`);
  });
});
