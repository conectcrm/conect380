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

const TOTAL_CLIENTES = 24;
const CLIENTES_PAGE_STATE_STORAGE_KEY = "conectcrm_clientes_page_state_v1";
const CLIENTES_SAVED_VIEWS_STORAGE_KEY = "conectcrm_clientes_saved_views_v1";

const STATUS_CYCLE: ClienteStatus[] = ["lead", "prospect", "cliente", "inativo"];
const TIPO_CYCLE: ClienteTipo[] = ["pessoa_fisica", "pessoa_juridica"];

const MOCK_CLIENTES: ClienteMock[] = Array.from({ length: TOTAL_CLIENTES }, (_, index) => {
  const idSuffix = String(index + 1).padStart(12, "0");
  const createdDay = String((index % 28) + 1).padStart(2, "0");

  return {
    id: `00000000-0000-4000-8000-${idSuffix}`,
    nome: `Acme Cliente ${index + 1}`,
    email: `acme.cliente.${index + 1}@teste.com`,
    telefone: `1199999${String(index + 1).padStart(4, "0")}`,
    empresa: "Acme Corp",
    status: STATUS_CYCLE[index % STATUS_CYCLE.length],
    tipo: TIPO_CYCLE[index % TIPO_CYCLE.length],
    created_at: `2026-02-${createdDay}T10:00:00.000Z`,
    updated_at: `2026-02-${createdDay}T10:00:00.000Z`,
  };
});

function sortClientes(
  clientes: ClienteMock[],
  sortBy: string,
  sortOrder: "ASC" | "DESC",
): ClienteMock[] {
  const ordered = [...clientes];

  ordered.sort((left, right) => {
    if (sortBy === "nome") {
      return left.nome.localeCompare(right.nome);
    }

    if (sortBy === "status") {
      return left.status.localeCompare(right.status);
    }

    const leftTime = Date.parse(left.created_at);
    const rightTime = Date.parse(right.created_at);
    return leftTime - rightTime;
  });

  if (sortOrder === "DESC") {
    ordered.reverse();
  }

  return ordered;
}

function resolvePaginatedClientes(url: URL) {
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim();
  const tipo = (url.searchParams.get("tipo") ?? "").trim();
  const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
  const limit = Math.max(Number(url.searchParams.get("limit") ?? "10") || 10, 1);
  const sortBy = (url.searchParams.get("sortBy") ?? "created_at").trim();
  const sortOrder = (url.searchParams.get("sortOrder") ?? "DESC").toUpperCase() as "ASC" | "DESC";

  const filtered = MOCK_CLIENTES.filter((cliente) => {
    const matchesSearch =
      !search ||
      cliente.nome.toLowerCase().includes(search) ||
      cliente.email.toLowerCase().includes(search) ||
      cliente.empresa.toLowerCase().includes(search);
    const matchesStatus = !status || cliente.status === status;
    const matchesTipo = !tipo || cliente.tipo === tipo;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const sorted = sortClientes(filtered, sortBy, sortOrder === "ASC" ? "ASC" : "DESC");
  const totalPages = Math.max(Math.ceil(sorted.length / limit), 1);
  const startIndex = (page - 1) * limit;
  const data = sorted.slice(startIndex, startIndex + limit);

  return {
    data,
    total: sorted.length,
    page,
    limit,
    totalPages,
  };
}

async function mockClientesEndpoints(authenticatedPage: any) {
  await authenticatedPage.route("**/clientes/estatisticas**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: MOCK_CLIENTES.length,
        ativos: MOCK_CLIENTES.filter((cliente) => cliente.status === "cliente").length,
        prospects: MOCK_CLIENTES.filter((cliente) => cliente.status === "prospect").length,
        leads: MOCK_CLIENTES.filter((cliente) => cliente.status === "lead").length,
      }),
    });
  });

  await authenticatedPage.route(/\/clientes(\?.*)?$/, async (route: any) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    const isApiRequest = url.port === "3001" || url.origin.includes("3001");
    if (!isApiRequest) {
      await route.fallback();
      return;
    }

    const payload = resolvePaginatedClientes(url);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function resetClientesLocalState(authenticatedPage: any) {
  await authenticatedPage.evaluate(
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

async function suppressDevServerOverlay(authenticatedPage: any) {
  await authenticatedPage.evaluate(() => {
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

test.describe("Clientes - filtros e selecao em lote", () => {
  test("aplica filtro de busca e seleciona todos os resultados filtrados", async ({
    authenticatedPage,
  }) => {
    await mockClientesEndpoints(authenticatedPage);

    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    const searchInput = authenticatedPage.getByPlaceholder("Buscar por nome, email, empresa...");
    await expect(searchInput).toBeVisible();

    await Promise.all([
      authenticatedPage.waitForResponse((response) => {
        return (
          response.url().includes("/clientes") &&
          response.url().includes("search=acme") &&
          response.request().method() === "GET"
        );
      }),
      searchInput.fill("acme"),
    ]);

    await expect(
      authenticatedPage
        .locator("span")
        .filter({ hasText: /Busca:\s*acme/i })
        .first(),
    ).toBeVisible();

    const headerCheckbox = authenticatedPage.locator('thead input[type="checkbox"]').first();
    await expect(headerCheckbox).toBeVisible();
    await headerCheckbox.check();

    const selectAllFilteredButton = authenticatedPage.getByRole("button", {
      name: /Selecionar todos os 24 resultados/i,
    });
    await expect(selectAllFilteredButton).toBeVisible();
    await selectAllFilteredButton.click();

    const clearSelectionButton = authenticatedPage.getByRole("button", {
      name: /Limpar selecao total/i,
    });
    await expect(clearSelectionButton).toBeVisible();
    await expect(
      authenticatedPage.getByRole("button", { name: /^Exportar \(24\)$/ }),
    ).toBeVisible();

    const firstRowCheckbox = authenticatedPage.locator('tbody input[type="checkbox"]').first();
    await firstRowCheckbox.uncheck();
    await expect(
      authenticatedPage.getByRole("button", { name: /^Exportar \(23\)$/ }),
    ).toBeVisible();

    await clearSelectionButton.click();
    await expect(authenticatedPage.getByRole("button", { name: /^Exportar \(\d+\)$/ })).toHaveCount(
      0,
    );
  });

  test("salva e renomeia uma view com modal inline", async ({ authenticatedPage }) => {
    await mockClientesEndpoints(authenticatedPage);

    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    const saveViewButton = authenticatedPage.getByTestId("clientes-save-view-button");
    await expect(saveViewButton).toBeVisible();
    await saveViewButton.click();

    const saveViewDialog = authenticatedPage.getByRole("dialog", { name: /Salvar view/i });
    await expect(saveViewDialog).toBeVisible();
    await expect(saveViewDialog.getByRole("heading", { name: /Salvar view atual/i })).toBeVisible();

    const saveViewInput = authenticatedPage.getByTestId("clientes-save-view-input");
    await saveViewInput.fill("Leads quentes");
    await authenticatedPage.getByTestId("clientes-save-view-submit").click();

    await expect(
      authenticatedPage
        .locator("span")
        .filter({ hasText: /View:\s*Leads quentes/i })
        .first(),
    ).toBeVisible();

    const savedViewsSelect = authenticatedPage.getByTestId("clientes-saved-views-select");
    await savedViewsSelect.selectOption({ label: "Leads quentes" });

    await saveViewButton.click();
    const renameViewDialog = authenticatedPage.getByRole("dialog", { name: /Salvar view/i });
    await expect(renameViewDialog).toBeVisible();
    await expect(
      renameViewDialog.getByRole("heading", { name: /Atualizar view atual|Salvar view atual/i }),
    ).toBeVisible();
    await saveViewInput.fill("Leads enterprise");
    await authenticatedPage.getByTestId("clientes-save-view-submit").click();

    await expect(
      authenticatedPage
        .locator("span")
        .filter({ hasText: /View:\s*Leads enterprise/i })
        .first(),
    ).toBeVisible();
  });

  test("aplica view padrao automaticamente ao abrir a tela", async ({ authenticatedPage }) => {
    await mockClientesEndpoints(authenticatedPage);

    await authenticatedPage.goto("/dashboard");
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    await authenticatedPage.evaluate(
      ({ pageStateKey, savedViewsKey }) => {
        window.localStorage.removeItem(pageStateKey);

        const savedViews = [
          {
            id: "view-padrao-e2e",
            name: "Padrao E2E",
            searchTerm: "acme",
            status: "cliente",
            tipo: "",
            viewMode: "table",
            limit: 10,
            sortBy: "created_at",
            sortOrder: "DESC",
            createdAt: "2026-02-22T10:00:00.000Z",
            isDefault: true,
          },
        ];

        window.localStorage.setItem(savedViewsKey, JSON.stringify(savedViews));
      },
      {
        pageStateKey: CLIENTES_PAGE_STATE_STORAGE_KEY,
        savedViewsKey: CLIENTES_SAVED_VIEWS_STORAGE_KEY,
      },
    );

    await authenticatedPage.goto("/clientes");
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    await expect(
      authenticatedPage
        .locator("span")
        .filter({ hasText: /View:\s*Padrao E2E/i })
        .first(),
    ).toBeVisible();

    await expect(
      authenticatedPage.getByPlaceholder("Buscar por nome, email, empresa..."),
    ).toHaveValue("acme");

    await expect(authenticatedPage).toHaveURL(/savedView=view-padrao-e2e/);
  });
});
