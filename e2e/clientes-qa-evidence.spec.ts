import fs from "node:fs/promises";
import path from "node:path";
import { expect, test } from "./fixtures";

type ClienteStatus = "lead" | "prospect" | "cliente" | "inativo";
type ClienteTipo = "pessoa_fisica" | "pessoa_juridica";

type ClienteMock = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  tipo: ClienteTipo;
  status: ClienteStatus;
  documento: string;
  tags: string[];
  origem: string;
  responsavel_id: string;
  ultimo_contato: string | null;
  proximo_contato: string | null;
  created_at: string;
  updated_at: string;
};

const CLIENTES_PAGE_STATE_STORAGE_KEY = "conectcrm_clientes_page_state_v1";
const CLIENTES_SAVED_VIEWS_STORAGE_KEY = "conectcrm_clientes_saved_views_v1";
const BASE_CLIENTE_ID = "11111111-1111-4111-8111-111111111111";
const BASE_CLIENTE_NOME = "Acme Cliente Base";
const FOLLOWUP_REFERENCE_DATE = Date.parse("2026-03-12T00:00:00.000Z");
const EVIDENCE_PREFIX = "CRM020_QA_CLIENTES_360_20260312";
const EVIDENCE_DIR = path.resolve(process.cwd(), "docs/features/evidencias");
const EVIDENCE_ARTIFACTS = {
  listagemFiltros: `${EVIDENCE_PREFIX}_listagem_filtros.png`,
  listagemLimpa: `${EVIDENCE_PREFIX}_listagem_limpa.png`,
  cadastroSucesso: `${EVIDENCE_PREFIX}_cadastro_sucesso.png`,
  edicaoSucesso: `${EVIDENCE_PREFIX}_edicao_sucesso.png`,
  perfilDadosBasicos: `${EVIDENCE_PREFIX}_perfil_dados_basicos.png`,
  perfilIntegracoes: `${EVIDENCE_PREFIX}_perfil_integracoes.png`,
  exportSemFiltros: `${EVIDENCE_PREFIX}_export_sem_filtros.csv`,
  exportComFiltros: `${EVIDENCE_PREFIX}_export_com_filtros.csv`,
} as const;

const CLIENTES_FIXTURE: ClienteMock[] = [
  {
    id: BASE_CLIENTE_ID,
    nome: BASE_CLIENTE_NOME,
    email: "acme.base@conect360.com.br",
    telefone: "11987654321",
    empresa: "Acme Holdings",
    cargo: "Diretoria",
    tipo: "pessoa_fisica",
    status: "cliente",
    documento: "52998224725",
    tags: ["vip", "recorrente"],
    origem: "Indicacao",
    responsavel_id: "1b0b97e5-24ce-4f43-aecb-e8b84dc756c7",
    ultimo_contato: "2026-03-01T10:00:00.000Z",
    proximo_contato: "2026-03-25T14:30:00.000Z",
    created_at: "2026-02-15T10:00:00.000Z",
    updated_at: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    nome: "Beta Prospect",
    email: "beta.prospect@conect360.com.br",
    telefone: "11991234567",
    empresa: "Beta Corp",
    cargo: "Compras",
    tipo: "pessoa_juridica",
    status: "prospect",
    documento: "12345678000199",
    tags: ["pipeline"],
    origem: "Outbound",
    responsavel_id: "2df5c8f5-fef7-4d6c-8c5c-4525f170a8c2",
    ultimo_contato: "2026-02-20T09:00:00.000Z",
    proximo_contato: "2026-03-15T16:00:00.000Z",
    created_at: "2026-02-10T08:30:00.000Z",
    updated_at: "2026-02-20T09:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    nome: "Gama Lead",
    email: "gama.lead@conect360.com.br",
    telefone: "11995556677",
    empresa: "Gama Labs",
    cargo: "Founder",
    tipo: "pessoa_fisica",
    status: "lead",
    documento: "39053344705",
    tags: ["inbound"],
    origem: "Meta Ads",
    responsavel_id: "3a8ba7d9-1fcb-4f8b-9bc8-2bf6efa68f1b",
    ultimo_contato: null,
    proximo_contato: "2026-03-18T11:00:00.000Z",
    created_at: "2026-03-02T11:00:00.000Z",
    updated_at: "2026-03-02T11:00:00.000Z",
  },
];

const isApiRequest = (url: URL): boolean => {
  return url.port === "3001" || url.origin.includes("3001");
};

const csvEscape = (value: unknown): string => {
  const text = String(value ?? "");
  if (/["\n,]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const toEvidencePath = (filename: string): string => path.join(EVIDENCE_DIR, filename);

const serializeCliente = (cliente: ClienteMock) => ({
  ...cliente,
  responsavelId: cliente.responsavel_id,
});

const resolveFilteredClientes = (url: URL): ClienteMock[] => {
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const status = (url.searchParams.get("status") ?? "").trim();
  const tipo = (url.searchParams.get("tipo") ?? "").trim();
  const tag = (url.searchParams.get("tag") ?? "").trim().toLowerCase();
  const origem = (url.searchParams.get("origem") ?? "").trim().toLowerCase();
  const responsavelId = (url.searchParams.get("responsavelId") ?? "").trim().toLowerCase();
  const followup = (url.searchParams.get("followup") ?? "").trim();

  return CLIENTES_FIXTURE.filter((cliente) => {
    const matchesSearch =
      !search ||
      cliente.nome.toLowerCase().includes(search) ||
      cliente.email.toLowerCase().includes(search) ||
      cliente.telefone.toLowerCase().includes(search) ||
      cliente.documento.toLowerCase().includes(search);
    const matchesStatus = !status || cliente.status === status;
    const matchesTipo = !tipo || cliente.tipo === tipo;
    const matchesTag =
      !tag || cliente.tags.some((clienteTag) => clienteTag.toLowerCase().includes(tag));
    const matchesOrigem = !origem || cliente.origem.toLowerCase().includes(origem);
    const matchesResponsavelId =
      !responsavelId || cliente.responsavel_id.toLowerCase().includes(responsavelId);

    let matchesFollowup = true;
    if (followup === "pendente" || followup === "vencido") {
      if (!cliente.proximo_contato) {
        matchesFollowup = false;
      } else {
        const proximoContatoDate = Date.parse(cliente.proximo_contato);
        if (!Number.isFinite(proximoContatoDate)) {
          matchesFollowup = false;
        } else {
          matchesFollowup =
            followup === "pendente"
              ? proximoContatoDate >= FOLLOWUP_REFERENCE_DATE
              : proximoContatoDate < FOLLOWUP_REFERENCE_DATE;
        }
      }
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesTipo &&
      matchesTag &&
      matchesOrigem &&
      matchesResponsavelId &&
      matchesFollowup
    );
  });
};

const resolvePaginatedClientes = (url: URL) => {
  const filtered = resolveFilteredClientes(url);
  const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
  const limit = Math.max(Number(url.searchParams.get("limit") ?? "10") || 10, 1);
  const startIndex = (page - 1) * limit;
  const data = filtered.slice(startIndex, startIndex + limit);

  return {
    data: data.map(serializeCliente),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.max(Math.ceil(filtered.length / limit), 1),
  };
};

const buildCsv = (clientes: ClienteMock[]): string => {
  const header = [
    "id",
    "nome",
    "email",
    "telefone",
    "empresa",
    "status",
    "tipo",
    "documento",
    "tags",
    "ultimo_contato",
    "proximo_contato",
    "origem",
    "responsavel_id",
    "created_at",
    "updated_at",
  ];

  const rows = clientes.map((cliente) => [
    cliente.id,
    cliente.nome,
    cliente.email,
    cliente.telefone,
    cliente.empresa,
    cliente.status,
    cliente.tipo,
    cliente.documento,
    cliente.tags.join("|"),
    cliente.ultimo_contato ?? "",
    cliente.proximo_contato ?? "",
    cliente.origem,
    cliente.responsavel_id,
    cliente.created_at,
    cliente.updated_at,
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
};

async function prepareArtifacts() {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await Promise.all(
    Object.values(EVIDENCE_ARTIFACTS).map((artifact) =>
      fs.rm(toEvidencePath(artifact), { force: true }),
    ),
  );
}

async function saveScreenshot(page: any, artifact: string) {
  await page.screenshot({ path: toEvidencePath(artifact), fullPage: true });
}

async function captureDownload(page: any, button: any, artifact: string) {
  const destination = toEvidencePath(artifact);
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  await download.saveAs(destination);
  return destination;
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
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = "#webpack-dev-server-client-overlay { display: none !important; pointer-events: none !important; }";
    document.head.appendChild(style);
  });
}

async function installMocks(page: any) {
  await page.route(/\/clientes(\/.*)?(\?.*)?$/, async (route: any) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    if (!isApiRequest(url)) {
      await route.fallback();
      return;
    }

    if (method === "GET" && url.pathname === "/clientes/estatisticas") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 3, ativos: 1, prospects: 1, leads: 1 }),
      });
      return;
    }

    if (method === "GET" && url.pathname === "/clientes/export") {
      await route.fulfill({
        status: 200,
        contentType: "text/csv; charset=utf-8",
        headers: { "content-disposition": 'attachment; filename="clientes.csv"' },
        body: buildCsv(resolveFilteredClientes(url)),
      });
      return;
    }

    if (method === "GET" && url.pathname === "/clientes") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(resolvePaginatedClientes(url)),
      });
      return;
    }

    if (method === "POST" && url.pathname === "/clientes") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...serializeCliente(CLIENTES_FIXTURE[0]),
          id: "90000000-0000-4000-8000-000000000001",
        }),
      });
      return;
    }

    const byId = url.pathname.match(/^\/clientes\/([0-9a-fA-F-]+)$/);
    if (byId && method === "GET") {
      const cliente = CLIENTES_FIXTURE.find((item) => item.id === byId[1]) ?? CLIENTES_FIXTURE[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serializeCliente(cliente)),
      });
      return;
    }

    if (byId && method === "PUT") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serializeCliente(CLIENTES_FIXTURE[0])),
      });
      return;
    }

    if (method === "GET" && /\/tickets\/resumo$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 2,
          abertos: 1,
          resolvidos: 1,
          ultimoAtendimentoEm: "2026-03-10T14:10:00.000Z",
          tickets: [
            { id: "ticket-100", numero: 100, status: "EM_ATENDIMENTO", prioridade: "alta", assunto: "Ticket onboarding CRM", atualizadoEm: "2026-03-10T14:10:00.000Z" },
            { id: "ticket-101", numero: 101, status: "CONCLUIDO", prioridade: "media", assunto: "Duvida sobre faturamento", atualizadoEm: "2026-03-09T09:00:00.000Z" },
          ],
        }),
      });
      return;
    }

    if (method === "GET" && /\/propostas\/resumo$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 2,
          aprovadas: 1,
          pendentes: 1,
          rejeitadas: 0,
          ultimoRegistroEm: "2026-03-09T16:00:00.000Z",
          propostas: [
            { id: "prop-001", numero: "PROP-001", titulo: "Proposta de expansao", status: "pendente", valor: 12000, atualizadaEm: "2026-03-09T16:00:00.000Z" },
            { id: "prop-002", numero: "PROP-002", titulo: "Renovacao anual", status: "aprovada", valor: 18000, atualizadaEm: "2026-03-05T12:20:00.000Z" },
          ],
        }),
      });
      return;
    }

    if (method === "GET" && /\/contratos\/resumo$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 2,
          pendentes: 1,
          assinados: 1,
          encerrados: 0,
          ultimoRegistroEm: "2026-03-08T11:00:00.000Z",
          contratos: [
            { id: 10, numero: "CT-001", status: "aguardando_assinatura", tipo: "SaaS anual", valorTotal: 24000, dataInicio: "2026-03-01T00:00:00.000Z", dataFim: "2027-03-01T00:00:00.000Z", atualizadoEm: "2026-03-08T11:00:00.000Z" },
            { id: 11, numero: "CT-000", status: "assinado", tipo: "Setup", valorTotal: 5000, dataInicio: "2026-02-01T00:00:00.000Z", dataFim: "2026-12-31T00:00:00.000Z", atualizadoEm: "2026-02-15T09:30:00.000Z" },
          ],
        }),
      });
      return;
    }

    if (method === "GET" && /\/faturas\/resumo$/.test(url.pathname)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 2,
          pagas: 1,
          pendentes: 1,
          vencidas: 0,
          ultimoRegistroEm: "2026-03-08T10:00:00.000Z",
          faturas: [
            { id: 200, numero: "FAT-001", status: "pendente", valorTotal: 3000, valorPago: 0, dataVencimento: "2026-03-20T00:00:00.000Z", atualizadoEm: "2026-03-08T10:00:00.000Z" },
            { id: 199, numero: "FAT-000", status: "paga", valorTotal: 2800, valorPago: 2800, dataVencimento: "2026-02-20T00:00:00.000Z", atualizadoEm: "2026-02-22T09:00:00.000Z" },
          ],
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

  await page.route(/\/notas\/cliente\/[^/]+\/count(\?.*)?$/, async (route: any) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total: 2, importantes: 1 }) }));
  await page.route(/\/demandas\/cliente\/[^/]+\/count(\?.*)?$/, async (route: any) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total: 3, abertas: 1, urgentes: 0 }) }));
  await page.route(/\/api\/crm\/clientes\/[^/]+\/contatos(\?.*)?$/, async (route: any) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route(/\/api\/atendimento\/clientes\/[^/]+\/contexto(\?.*)?$/, async (route: any) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      cliente: { id: BASE_CLIENTE_ID, nome: BASE_CLIENTE_NOME, email: "acme.base@conect360.com.br", telefone: "11987654321", segmento: "vip", primeiroContato: "2026-02-01T09:00:00.000Z", ultimoContato: "2026-03-10T14:10:00.000Z", tags: ["vip", "recorrente"] },
      estatisticas: { valorTotalGasto: 39000, totalTickets: 12, ticketsResolvidos: 11, ticketsAbertos: 1, avaliacaoMedia: 4.7, tempoMedioResposta: "12m" },
      historico: { propostas: [], faturas: [], tickets: [{ id: "ticket-100", numero: 100, status: "EM_ATENDIMENTO", assunto: "Ticket onboarding CRM", criadoEm: "2026-03-10T14:10:00.000Z", canalId: "whatsapp" }] },
    }),
  }));
}

test.describe("Clientes - evidencias QA CRM-020", () => {
  test.setTimeout(180_000);

  test("gera capturas e CSV do checklist", async ({ authenticatedPage }) => {
    await prepareArtifacts();
    await installMocks(authenticatedPage);

    await authenticatedPage.goto("/clientes");
    await resetClientesLocalState(authenticatedPage);
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState("domcontentloaded");
    await suppressDevServerOverlay(authenticatedPage);

    await expect(authenticatedPage.getByRole("heading", { name: /Clientes/i })).toBeVisible();
    await expect(authenticatedPage.getByText(BASE_CLIENTE_NOME)).toBeVisible();

    const exportButton = authenticatedPage.getByRole("button", { name: /^Exportar$/ }).first();
    const exportSemFiltrosPath = await captureDownload(authenticatedPage, exportButton, EVIDENCE_ARTIFACTS.exportSemFiltros);

    const searchInput = authenticatedPage.getByPlaceholder(/Buscar por nome/i);
    await searchInput.fill("52998224725");
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(1);
    await expect(authenticatedPage.locator("tbody tr")).toContainText(BASE_CLIENTE_NOME);

    const tipoFilter = authenticatedPage
      .locator("select")
      .filter({ has: authenticatedPage.locator('option[value="pessoa_fisica"]') })
      .first();
    const advancedFiltersToggle = authenticatedPage.getByTestId("clientes-advanced-filters-toggle");
    await expect(advancedFiltersToggle).toBeVisible();
    await advancedFiltersToggle.click();

    const tagFilter = authenticatedPage.getByTestId("clientes-filter-tag");
    const followupFilter = authenticatedPage.getByTestId("clientes-filter-followup");
    const origemFilter = authenticatedPage.getByTestId("clientes-filter-origem");
    await searchInput.fill("");
    await tipoFilter.selectOption("pessoa_fisica");
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(2);

    await tipoFilter.selectOption("");

    await tagFilter.fill("vip");
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(1);
    await expect(authenticatedPage.locator("tbody tr")).toContainText(BASE_CLIENTE_NOME);
    await tagFilter.fill("");

    await followupFilter.selectOption("pendente");
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(3);
    await followupFilter.selectOption("");

    await origemFilter.fill("Outbound");
    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(1);
    await expect(authenticatedPage.locator("tbody tr")).toContainText("Beta Prospect");
    await origemFilter.fill("");

    await searchInput.fill(BASE_CLIENTE_NOME);
    const statusFilter = authenticatedPage
      .locator("select")
      .filter({ has: authenticatedPage.locator('option[value="cliente"]') })
      .first();
    await statusFilter.selectOption("cliente");

    await expect(authenticatedPage.locator("tbody tr")).toHaveCount(1);
    await saveScreenshot(authenticatedPage, EVIDENCE_ARTIFACTS.listagemFiltros);
    const exportComFiltrosPath = await captureDownload(authenticatedPage, exportButton, EVIDENCE_ARTIFACTS.exportComFiltros);

    await authenticatedPage.getByRole("button", { name: /^Limpar$/ }).click();
    await expect(searchInput).toHaveValue("");
    await advancedFiltersToggle.click();
    await expect(tagFilter).toHaveValue("");
    await expect(origemFilter).toHaveValue("");
    await expect(followupFilter).toHaveValue("");
    await saveScreenshot(authenticatedPage, EVIDENCE_ARTIFACTS.listagemLimpa);

    await authenticatedPage.getByRole("button", { name: /Novo Cliente/i }).click();
    await authenticatedPage.getByPlaceholder("000.000.000-00").fill("529.982.247-25");
    await authenticatedPage.getByPlaceholder("Digite o nome completo").fill("Cliente QA Evidencia");
    await authenticatedPage.getByPlaceholder("Digite o e-mail").fill("cliente.qa.evidencia@conect360.com.br");
    await authenticatedPage.getByPlaceholder("(11) 99999-9999").fill("(11) 99999-8888");
    await authenticatedPage.getByPlaceholder("12345-678").fill("01001-000");
    await authenticatedPage.locator('input[name="logradouro"]').fill("Rua Evidencia");
    await authenticatedPage.locator('input[name="numero"]').fill("123");
    await authenticatedPage.locator('input[name="bairro"]').fill("Centro");
    await authenticatedPage.locator('input[name="cidade"]').fill("Sao Paulo");
    await authenticatedPage.locator('input[name="estado"]').fill("SP");
    const createTagInput = authenticatedPage.getByPlaceholder("Digite uma tag");
    await createTagInput.fill("vip");
    await createTagInput.press("Enter");
    await createTagInput.fill("qa");
    await createTagInput.press("Enter");
    await authenticatedPage.locator('textarea[name="observacoes"]').fill("Cliente criado para evidencia CRM-020.");
    await authenticatedPage.getByRole("button", { name: /Criar cliente/i }).click();
    await expect(authenticatedPage.getByText(/Cliente cadastrado com sucesso/i)).toBeVisible();
    await saveScreenshot(authenticatedPage, EVIDENCE_ARTIFACTS.cadastroSucesso);

    await searchInput.fill(BASE_CLIENTE_NOME);
    const baseRow = authenticatedPage.locator("tbody tr", { hasText: BASE_CLIENTE_NOME }).first();
    await baseRow.locator('button[title="Editar"]').click();
    await authenticatedPage.getByPlaceholder("(11) 99999-9999").fill("(11) 98765-4321");
    await authenticatedPage.getByPlaceholder("12345-678").fill("01001-000");
    await authenticatedPage.locator('input[name="logradouro"]').fill("Rua Base QA");
    await authenticatedPage.locator('input[name="numero"]').fill("100");
    await authenticatedPage.locator('input[name="bairro"]').fill("Centro");
    await authenticatedPage.locator('input[name="cidade"]').fill("Sao Paulo");
    await authenticatedPage.locator('input[name="estado"]').fill("SP");
    await authenticatedPage.locator('textarea[name="observacoes"]').fill("Cliente atualizado para evidencia CRM-020.");
    await authenticatedPage.getByRole("button", { name: /Salvar altera/i }).click();
    await expect(authenticatedPage.getByText(/Cliente atualizado com sucesso/i)).toBeVisible();
    await saveScreenshot(authenticatedPage, EVIDENCE_ARTIFACTS.edicaoSucesso);

    await baseRow.locator('button[title="Abrir perfil"]').click();
    await authenticatedPage.waitForURL(`**/clientes/${BASE_CLIENTE_ID}`);
    await expect(authenticatedPage.getByRole("heading", { name: /Perfil do Cliente/i })).toBeVisible();
    await expect(authenticatedPage.getByText(/^Tags$/i)).toBeVisible();
    const tagsSection = authenticatedPage
      .locator("section")
      .filter({ has: authenticatedPage.getByRole("heading", { name: /^Tags$/i }) })
      .first();
    await expect(tagsSection.getByText("vip", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText(/Ultimo contato/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Proximo contato/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/Dados comerciais/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/^Origem$/i)).toBeVisible();
    await expect(authenticatedPage.getByText("Indicacao")).toBeVisible();
    await expect(authenticatedPage.getByText(/Responsavel ID/i)).toBeVisible();
    await expect(
      authenticatedPage.getByText("1b0b97e5-24ce-4f43-aecb-e8b84dc756c7"),
    ).toBeVisible();
    await saveScreenshot(authenticatedPage, EVIDENCE_ARTIFACTS.perfilDadosBasicos);

    await authenticatedPage.getByRole("button", { name: /^Tickets/i }).first().click();
    await expect(authenticatedPage.getByText(/Ticket onboarding CRM/i)).toBeVisible();
    await expect(
      authenticatedPage.getByRole("link", { name: /Abrir atendimento/i }),
    ).toHaveAttribute("href", /clienteId=/);
    await authenticatedPage.getByRole("button", { name: /^Propostas/i }).first().click();
    await expect(authenticatedPage.getByText(/PROP-001/i)).toBeVisible();
    await expect(
      authenticatedPage.getByRole("link", { name: /Abrir propostas/i }),
    ).toHaveAttribute("href", /clienteId=/);
    await authenticatedPage.getByRole("button", { name: /^Contratos/i }).first().click();
    await expect(authenticatedPage.getByText(/CT-001/i)).toBeVisible();
    await expect(
      authenticatedPage.getByRole("link", { name: /Abrir contratos/i }),
    ).toHaveAttribute("href", /clienteId=/);
    await authenticatedPage.getByRole("button", { name: /^Faturas/i }).first().click();
    await expect(authenticatedPage.getByText(/FAT-001/i)).toBeVisible();
    await expect(
      authenticatedPage.getByRole("link", { name: /Abrir faturamento/i }),
    ).toHaveAttribute("href", /clienteId=/);
    await saveScreenshot(authenticatedPage, EVIDENCE_ARTIFACTS.perfilIntegracoes);

    const exportSemFiltrosContent = await fs.readFile(exportSemFiltrosPath, "utf8");
    const exportComFiltrosContent = await fs.readFile(exportComFiltrosPath, "utf8");
    const csvHeader = exportSemFiltrosContent.split(/\r?\n/, 1)[0] ?? "";
    expect(csvHeader).toContain("tags");
    expect(csvHeader).toContain("ultimo_contato");
    expect(csvHeader).toContain("proximo_contato");
    expect(csvHeader).toContain("origem");
    expect(csvHeader).toContain("responsavel_id");
    expect(exportComFiltrosContent).toContain(BASE_CLIENTE_NOME);
    expect(exportComFiltrosContent).not.toContain("Beta Prospect");

    await Promise.all(Object.values(EVIDENCE_ARTIFACTS).map((artifact) => fs.access(toEvidencePath(artifact))));
  });
});
