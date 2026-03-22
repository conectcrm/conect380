import { expect, test } from "./fixtures";

type ClienteStatus = "lead" | "prospect" | "cliente" | "inativo";
type ClienteTipo = "pessoa_fisica" | "pessoa_juridica";

type ClienteMock = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo?: string;
  site?: string;
  tipo: ClienteTipo;
  status: ClienteStatus;
  documento: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  tags?: string[];
  origem?: string | null;
  responsavel_id?: string | null;
  ultimo_contato?: string | null;
  proximo_contato?: string | null;
  created_at: string;
  updated_at: string;
};

const CLIENTES_PAGE_STATE_STORAGE_KEY = "conectcrm_clientes_page_state_v1";
const CLIENTES_SAVED_VIEWS_STORAGE_KEY = "conectcrm_clientes_saved_views_v1";
const CLIENTE_COMPLETO_ID = "11111111-1111-4111-8111-111111111111";
const CLIENTE_MINIMO_ID = "22222222-2222-4222-8222-222222222222";

const CLIENTES_INICIAIS: ClienteMock[] = [
  {
    id: CLIENTE_COMPLETO_ID,
    nome: "Cliente Completo QA",
    email: "cliente.completo.qa@conect360.com.br",
    telefone: "11995557777",
    empresa: "Empresa Completa",
    cargo: "Diretoria",
    site: "https://empresa-completa.com.br",
    tipo: "pessoa_fisica",
    status: "cliente",
    documento: "52998224725",
    endereco: "Rua Completa, 100",
    cidade: "Sao Paulo",
    estado: "SP",
    cep: "01001000",
    observacoes: "Observacao original completa",
    tags: ["vip", "recorrente"],
    origem: "Indicacao",
    responsavel_id: "1b0b97e5-24ce-4f43-aecb-e8b84dc756c7",
    ultimo_contato: "2026-03-01T10:00:00.000Z",
    proximo_contato: "2026-03-25T14:30:00.000Z",
    created_at: "2026-02-15T10:00:00.000Z",
    updated_at: "2026-03-01T10:00:00.000Z",
  },
  {
    id: CLIENTE_MINIMO_ID,
    nome: "Cliente Minimo QA",
    email: "",
    telefone: "",
    empresa: "Empresa Minima",
    tipo: "pessoa_fisica",
    status: "lead",
    documento: "39053344705",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
    tags: [],
    origem: null,
    responsavel_id: null,
    ultimo_contato: null,
    proximo_contato: null,
    created_at: "2026-02-20T10:00:00.000Z",
    updated_at: "2026-02-20T10:00:00.000Z",
  },
];

function isApiRequest(url: URL): boolean {
  return url.port === "3001" || url.origin.includes("3001");
}

function serializeCliente(cliente: ClienteMock) {
  return {
    ...cliente,
    responsavelId: cliente.responsavel_id ?? null,
  };
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

async function installClientesCrudMocks(page: any) {
  const clientesStore: ClienteMock[] = CLIENTES_INICIAIS.map((cliente) => ({ ...cliente }));

  await page.route("**/clientes/estatisticas**", async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: clientesStore.length,
        ativos: clientesStore.filter((cliente) => cliente.status === "cliente").length,
        prospects: clientesStore.filter((cliente) => cliente.status === "prospect").length,
        leads: clientesStore.filter((cliente) => cliente.status === "lead").length,
      }),
    });
  });

  await page.route(/\/clientes(\/.*)?(\?.*)?$/, async (route: any) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    if (method === "GET" && url.pathname === "/clientes") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: clientesStore.map(serializeCliente),
          total: clientesStore.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/clientes") {
      const payload = (request.postDataJSON() || {}) as Record<string, unknown>;
      const documento = String(payload.documento || payload.cpf_cnpj || "");
      const nowIso = new Date().toISOString();
      const novoCliente: ClienteMock = {
        id: `90000000-0000-4000-8000-${String(clientesStore.length + 1).padStart(12, "0")}`,
        nome: String(payload.nome || ""),
        email: String(payload.email || ""),
        telefone: String(payload.telefone || ""),
        empresa: String(payload.empresa || "Empresa QA"),
        cargo: String(payload.cargo || ""),
        site: String(payload.site || ""),
        tipo: (payload.tipo as ClienteTipo) || "pessoa_fisica",
        status: (payload.status as ClienteStatus) || "lead",
        documento,
        endereco: String(payload.endereco || ""),
        cidade: String(payload.cidade || ""),
        estado: String(payload.estado || ""),
        cep: String(payload.cep || ""),
        observacoes: String(payload.observacoes || ""),
        tags: Array.isArray(payload.tags)
          ? (payload.tags as string[]).map((item) => String(item))
          : [],
        origem: payload.origem ? String(payload.origem) : null,
        responsavel_id:
          payload.responsavel_id || payload.responsavelId
            ? String(payload.responsavel_id || payload.responsavelId)
            : null,
        ultimo_contato: payload.ultimo_contato ? String(payload.ultimo_contato) : null,
        proximo_contato: payload.proximo_contato ? String(payload.proximo_contato) : null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      clientesStore.unshift(novoCliente);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(serializeCliente(novoCliente)),
      });
      return;
    }

    const byId = url.pathname.match(/^\/clientes\/([0-9a-fA-F-]+)$/);
    if (byId && method === "GET") {
      const cliente = clientesStore.find((item) => item.id === byId[1]) ?? clientesStore[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serializeCliente(cliente)),
      });
      return;
    }

    if (byId && method === "PUT") {
      const payload = (request.postDataJSON() || {}) as Record<string, unknown>;
      const index = clientesStore.findIndex((item) => item.id === byId[1]);
      if (index === -1) {
        await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
        return;
      }

      const atual = clientesStore[index];
      const atualizado: ClienteMock = {
        ...atual,
        nome: payload.nome !== undefined ? String(payload.nome || "") : atual.nome,
        email: payload.email !== undefined ? String(payload.email || "") : atual.email,
        telefone: payload.telefone !== undefined ? String(payload.telefone || "") : atual.telefone,
        tipo: (payload.tipo as ClienteTipo) || atual.tipo,
        status: (payload.status as ClienteStatus) || atual.status,
        documento:
          payload.documento !== undefined
            ? String(payload.documento || "")
            : payload.cpf_cnpj !== undefined
              ? String(payload.cpf_cnpj || "")
              : atual.documento,
        endereco: payload.endereco !== undefined ? String(payload.endereco || "") : atual.endereco,
        cidade: payload.cidade !== undefined ? String(payload.cidade || "") : atual.cidade,
        estado: payload.estado !== undefined ? String(payload.estado || "") : atual.estado,
        cep: payload.cep !== undefined ? String(payload.cep || "") : atual.cep,
        observacoes:
          payload.observacoes !== undefined ? String(payload.observacoes || "") : atual.observacoes,
        tags: Array.isArray(payload.tags)
          ? (payload.tags as string[]).map((item) => String(item))
          : atual.tags,
        origem: payload.origem !== undefined ? String(payload.origem || "") : atual.origem,
        responsavel_id:
          payload.responsavel_id !== undefined || payload.responsavelId !== undefined
            ? String(payload.responsavel_id || payload.responsavelId || "")
            : atual.responsavel_id,
        ultimo_contato:
          payload.ultimo_contato !== undefined
            ? String(payload.ultimo_contato || "")
            : atual.ultimo_contato,
        proximo_contato:
          payload.proximo_contato !== undefined
            ? String(payload.proximo_contato || "")
            : atual.proximo_contato,
        updated_at: new Date().toISOString(),
      };

      clientesStore[index] = atualizado;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serializeCliente(atualizado)),
      });
      return;
    }

    if (method === "GET" && /\/tickets\/resumo$/.test(url.pathname)) {
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
      return;
    }

    if (method === "GET" && /\/propostas\/resumo$/.test(url.pathname)) {
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
      return;
    }

    if (method === "GET" && /\/contratos\/resumo$/.test(url.pathname)) {
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
      return;
    }

    if (method === "GET" && /\/faturas\/resumo$/.test(url.pathname)) {
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
      return;
    }

    if (method === "GET" && /\/anexos$/.test(url.pathname)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }

    await route.fallback();
  });

  await page.route(/\/notas\/cliente\/[^/]+\/count(\?.*)?$/, async (route: any) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total: 0, importantes: 0 }) }),
  );
  await page.route(/\/demandas\/cliente\/[^/]+\/count(\?.*)?$/, async (route: any) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total: 0, abertas: 0, urgentes: 0 }) }),
  );
  await page.route(/\/api\/crm\/clientes\/[^/]+\/contatos(\?.*)?$/, async (route: any) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route(/\/api\/atendimento\/clientes\/[^/]+\/contexto(\?.*)?$/, async (route: any) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cliente: {
          id: CLIENTE_COMPLETO_ID,
          nome: "Cliente QA",
          email: "cliente@qa.com",
          telefone: "11995557777",
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
    }),
  );
}

test.describe("Clientes - cadastro e perfil QA complementar", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await installClientesCrudMocks(authenticatedPage);
    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);
  });

  test("ajusta label do nome para pessoa juridica", async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole("button", { name: /Novo Cliente/i }).click();

    await expect(authenticatedPage.locator("label", { hasText: "Nome completo *" })).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder("Digite o nome completo")).toBeVisible();

    await authenticatedPage.locator('select[name="tipo"]').selectOption("pessoa_juridica");

    await expect(authenticatedPage.locator("label", { hasText: "Razao social *" })).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder("00.000.000/0000-00")).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder("Digite a razao social")).toBeVisible();

    await authenticatedPage.locator('select[name="tipo"]').selectOption("pessoa_fisica");

    await expect(authenticatedPage.locator("label", { hasText: "Nome completo *" })).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder("000.000.000-00")).toBeVisible();
    await expect(authenticatedPage.getByPlaceholder("Digite o nome completo")).toBeVisible();
  });

  test("cria cliente com dados adicionais e valida sucesso", async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole("button", { name: /Novo Cliente/i }).click();
    await authenticatedPage.getByPlaceholder("000.000.000-00").fill("529.982.247-25");
    await authenticatedPage.getByPlaceholder("Digite o nome completo").fill("Cliente Dados Adicionais QA");
    await authenticatedPage.getByPlaceholder("Digite o e-mail").fill("cliente.dados.adicionais@conect360.com.br");
    await authenticatedPage.locator('input[name="logradouro"]').fill("Rua QA");
    await authenticatedPage.locator('input[name="numero"]').fill("123");
    await authenticatedPage.locator('input[name="bairro"]').fill("Centro");
    await authenticatedPage.locator('input[name="cidade"]').fill("Sao Paulo");
    await authenticatedPage.locator('input[name="estado"]').fill("SP");
    await authenticatedPage.locator('input[name="tags"]').fill("vip, qa");
    await authenticatedPage.locator('input[name="ultimo_contato"]').fill("2026-03-10");
    await authenticatedPage.locator('input[name="proximo_contato"]').fill("2026-03-25");
    await authenticatedPage.locator('textarea[name="observacoes"]').fill("Cliente criado com dados adicionais para QA.");
    await authenticatedPage.getByRole("button", { name: /^Criar cliente$/ }).click();

    await expect(authenticatedPage.getByText(/Cliente cadastrado com sucesso\./i)).toBeVisible();
    await expect(
      authenticatedPage.locator("tbody tr", { hasText: "Cliente Dados Adicionais QA" }),
    ).toHaveCount(1);
  });

  test("edita cliente e confirma persistencia dos campos alterados", async ({ authenticatedPage }) => {
    const row = authenticatedPage.locator("tbody tr", { hasText: "Cliente Completo QA" }).first();
    await row.locator('button[title="Editar"]').click();

    await authenticatedPage
      .locator('textarea[name="observacoes"]')
      .fill("Observacao atualizada via QA automatizado.");
    await authenticatedPage.locator('input[name="origem"]').fill("Meta Ads");
    await authenticatedPage
      .locator('input[name="responsavel_id"]')
      .fill("7eb6ea6a-ab8b-4f75-8f39-1ca6ecf27010");

    await authenticatedPage.getByRole("button", { name: /Salvar alteracoes/i }).click();
    await expect(authenticatedPage.getByText(/Cliente atualizado com sucesso\./i)).toBeVisible();

    await row.locator('button[title="Editar"]').click();
    await expect(authenticatedPage.locator('textarea[name="observacoes"]')).toHaveValue(
      "Observacao atualizada via QA automatizado.",
    );
    await expect(authenticatedPage.locator('input[name="origem"]')).toHaveValue("Meta Ads");
    await expect(authenticatedPage.locator('input[name="responsavel_id"]')).toHaveValue(
      "7eb6ea6a-ab8b-4f75-8f39-1ca6ecf27010",
    );
  });

  test("valida mensagem de erro para e-mail invalido no modal", async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole("button", { name: /Novo Cliente/i }).click();
    await authenticatedPage.getByPlaceholder("000.000.000-00").fill("529.982.247-25");
    await authenticatedPage.getByPlaceholder("Digite o nome completo").fill("Cliente Email Invalido QA");
    await authenticatedPage.getByPlaceholder("Digite o e-mail").fill("email-invalido");

    await expect(authenticatedPage.getByText(/E-mail invalido/i)).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: /^Criar cliente$/ })).toBeDisabled();
  });

  test("abre perfil para cliente com e sem dados opcionais", async ({ authenticatedPage }) => {
    const rowCompleto = authenticatedPage.locator("tbody tr", { hasText: "Cliente Completo QA" }).first();
    await rowCompleto.locator('button[title="Abrir perfil"]').click();
    await authenticatedPage.waitForURL(`**/clientes/${CLIENTE_COMPLETO_ID}`);

    await expect(
      authenticatedPage.getByRole("heading", { name: "Cliente Completo QA", exact: true }),
    ).toBeVisible();
    await expect(authenticatedPage.getByText("Indicacao")).toBeVisible();

    await authenticatedPage.goto("/clientes");
    await authenticatedPage.waitForLoadState("domcontentloaded");

    const rowMinimo = authenticatedPage.locator("tbody tr", { hasText: "Cliente Minimo QA" }).first();
    await rowMinimo.locator('button[title="Abrir perfil"]').click();
    await authenticatedPage.waitForURL(`**/clientes/${CLIENTE_MINIMO_ID}`);

    await expect(
      authenticatedPage.getByRole("heading", { name: "Cliente Minimo QA", exact: true }),
    ).toBeVisible();
    await expect(authenticatedPage.getByText(/Nenhuma tag cadastrada\./i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Nao informado/i).first()).toBeVisible();
  });
});
