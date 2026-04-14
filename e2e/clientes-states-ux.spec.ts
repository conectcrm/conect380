import { expect, test } from "./fixtures";

type ClienteStatus = "lead" | "prospect" | "cliente" | "inativo";
type ClienteTipo = "pessoa_fisica" | "pessoa_juridica";

type ClienteMock = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  status: ClienteStatus;
  tipo: ClienteTipo;
  created_at: string;
  updated_at: string;
};

const CLIENTES_PAGE_STATE_STORAGE_KEY = "conectcrm_clientes_page_state_v1";
const CLIENTES_SAVED_VIEWS_STORAGE_KEY = "conectcrm_clientes_saved_views_v1";

const MOCK_CLIENTES: ClienteMock[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    nome: "Cliente UX Alpha",
    email: "cliente.ux.alpha@conect360.com.br",
    telefone: "11990000001",
    empresa: "Empresa Alpha",
    status: "cliente",
    tipo: "pessoa_fisica",
    created_at: "2026-03-01T10:00:00.000Z",
    updated_at: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    nome: "Cliente UX Beta",
    email: "cliente.ux.beta@conect360.com.br",
    telefone: "11990000002",
    empresa: "Empresa Beta",
    status: "lead",
    tipo: "pessoa_juridica",
    created_at: "2026-03-02T11:00:00.000Z",
    updated_at: "2026-03-02T11:00:00.000Z",
  },
];

function isApiRequest(url: URL): boolean {
  return url.port === "3001" || url.origin.includes("3001");
}

async function suppressDevServerOverlay(page: any) {
  await page.evaluate(() => {
    const styleId = "pw-hide-wds-overlay";
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #webpack-dev-server-client-overlay {
        display: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  });
}

async function resetClientesLocalState(page: any) {
  await page.evaluate(
    ({ savedViewsKey, pageStateKey }) => {
      window.localStorage.removeItem(savedViewsKey);
      window.localStorage.removeItem(pageStateKey);
    },
    {
      savedViewsKey: CLIENTES_SAVED_VIEWS_STORAGE_KEY,
      pageStateKey: CLIENTES_PAGE_STATE_STORAGE_KEY,
    },
  );
}

async function mockClientesSuccess(page: any, options?: { clientes?: ClienteMock[] }) {
  const clientes = options?.clientes ?? MOCK_CLIENTES;

  await page.route("**/clientes/estatisticas**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: clientes.length,
        ativos: clientes.filter((cliente) => cliente.status === "cliente").length,
        prospects: clientes.filter((cliente) => cliente.status === "prospect").length,
        leads: clientes.filter((cliente) => cliente.status === "lead").length,
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
        data: clientes,
        total: clientes.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    });
  });
}

async function mockClientesSuccessWithDelay(page: any, delayMs: number) {
  const clientes = MOCK_CLIENTES;

  await page.route("**/clientes/estatisticas**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: clientes.length,
        ativos: clientes.filter((cliente) => cliente.status === "cliente").length,
        prospects: clientes.filter((cliente) => cliente.status === "prospect").length,
        leads: clientes.filter((cliente) => cliente.status === "lead").length,
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

    await page.waitForTimeout(delayMs);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: clientes,
        total: clientes.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    });
  });
}

async function mockClientesFailure(page: any) {
  await page.route("**/clientes/estatisticas**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 0, ativos: 0, prospects: 0, leads: 0 }),
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
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 500,
        message: "Erro interno",
      }),
    });
  });
}

test.describe("Clientes - estados e UX", () => {
  test("exibe estado de loading durante carregamento inicial", async ({ authenticatedPage }) => {
    await mockClientesSuccessWithDelay(authenticatedPage, 1200);

    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    await expect(authenticatedPage.getByText(/Carregando clientes\.\.\./i)).toBeVisible();
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(2);
  });

  test("exibe estado vazio amigavel para busca sem resultados", async ({ authenticatedPage }) => {
    await mockClientesSuccess(authenticatedPage);

    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    const searchInput = authenticatedPage.getByPlaceholder(/Buscar por nome/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill("cliente inexistente xyz");

    await expect(authenticatedPage.getByText(/Nenhum cliente encontrado/i)).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: /Limpar filtros/i })).toBeVisible();
  });

  test("exibe mensagem amigavel quando API falha", async ({ authenticatedPage }) => {
    await mockClientesFailure(authenticatedPage);

    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    await expect(
      authenticatedPage.getByText(/Erro ao carregar clientes do servidor\. Verifique sua conexao\./i),
    ).toBeVisible();
    await expect(authenticatedPage.getByText(/Nenhum cliente cadastrado/i)).toBeVisible();
  });

  test("mantem experiencia responsiva em desktop e mobile", async ({ authenticatedPage }) => {
    await mockClientesSuccess(authenticatedPage);

    await authenticatedPage.setViewportSize({ width: 1366, height: 900 });
    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    await expect(authenticatedPage.locator("table")).toHaveCount(1);
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(2);

    await authenticatedPage.setViewportSize({ width: 390, height: 844 });
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");

    await expect(authenticatedPage.locator("table")).toHaveCount(0);
    await expect(authenticatedPage.locator('button[title="Abrir perfil"]').first()).toBeVisible();
  });
});
