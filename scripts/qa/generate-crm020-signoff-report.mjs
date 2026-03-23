import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = "docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv";
const DEFAULT_OUTPUT_DIR = "docs/features/evidencias";

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT,
    output: "",
    environment: "homolog",
    date: "",
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--input" && argv[index + 1]) {
      args.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--output" && argv[index + 1]) {
      args.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--environment" && argv[index + 1]) {
      args.environment = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--date" && argv[index + 1]) {
      args.date = argv[index + 1];
      index += 1;
      continue;
    }

    if (!token.startsWith("--")) {
      positional.push(token);
    }
  }

  if (positional[0] && args.input === DEFAULT_INPUT) {
    args.input = positional[0];
  }
  if (positional[1] && args.environment === "homolog") {
    args.environment = positional[1];
  }
  if (positional[2] && !args.output) {
    args.output = positional[2];
  }

  return args;
};

const pad2 = (value) => String(value).padStart(2, "0");

const formatIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatCompactDate = (date) =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;

const normalizeStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (!normalized) return "PENDENTE";
  if (normalized === "PASS") return "PASS";
  if (normalized === "FAIL") return "FAIL";
  if (normalized === "BLOQUEADO" || normalized === "BLOCKED") return "BLOQUEADO";
  if (normalized === "N/A" || normalized === "NA") return "N/A";

  return normalized;
};

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const readCsvRows = (csvPath) => {
  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("CSV sem dados suficientes para gerar relatorio.");
  }

  const header = parseCsvLine(lines[0]);
  const expectedHeader = [
    "bloco",
    "item",
    "resultado",
    "evidencia",
    "observacoes",
    "executado_por",
    "executado_em",
  ];
  if (header.join("|").toLowerCase() !== expectedHeader.join("|")) {
    throw new Error(
      `Cabecalho invalido. Esperado: ${expectedHeader.join(", ")}, recebido: ${header.join(", ")}`,
    );
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== expectedHeader.length) {
      throw new Error(
        `Linha ${index + 2} invalida: esperado ${expectedHeader.length} colunas, recebido ${values.length}.`,
      );
    }

    return {
      bloco: values[0],
      item: values[1],
      resultado: normalizeStatus(values[2]),
      evidencia: values[3],
      observacoes: values[4],
      executadoPor: values[5],
      executadoEm: values[6],
    };
  });
};

const groupByBloco = (rows) => {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.bloco)) {
      grouped.set(row.bloco, []);
    }
    grouped.get(row.bloco).push(row);
  }
  return grouped;
};

const statusCounters = (rows) => {
  const counters = {
    PASS: 0,
    FAIL: 0,
    BLOQUEADO: 0,
    "N/A": 0,
    PENDENTE: 0,
    OUTROS: 0,
  };

  for (const row of rows) {
    if (row.resultado in counters) {
      counters[row.resultado] += 1;
    } else {
      counters.OUTROS += 1;
    }
  }

  return counters;
};

const resolveFinalStatus = (counters) => {
  if (counters.FAIL > 0 || counters.BLOQUEADO > 0) {
    return "REPROVADO";
  }
  if (counters.PENDENTE > 0) {
    return "PENDENTE";
  }
  return "APROVADO";
};

const buildMarkdown = ({ rows, inputPath, environment, dateIso }) => {
  const grouped = groupByBloco(rows);
  const counters = statusCounters(rows);
  const finalStatus = resolveFinalStatus(counters);

  const attentionRows = rows.filter((row) =>
    ["FAIL", "BLOQUEADO", "PENDENTE"].includes(row.resultado),
  );

  const lines = [];
  lines.push(`# CRM-020 - Resumo de Sign-off Manual (${dateIso})`);
  lines.push("");
  lines.push("## Contexto");
  lines.push("");
  lines.push(`- Ambiente: \`${environment}\``);
  lines.push(`- Origem dos resultados: \`${inputPath.replace(/\\/g, "/")}\``);
  lines.push("");
  lines.push("## Consolidado");
  lines.push("");
  lines.push(`- Total de itens: **${rows.length}**`);
  lines.push(`- PASS: **${counters.PASS}**`);
  lines.push(`- FAIL: **${counters.FAIL}**`);
  lines.push(`- BLOQUEADO: **${counters.BLOQUEADO}**`);
  lines.push(`- PENDENTE: **${counters.PENDENTE}**`);
  lines.push(`- N/A: **${counters["N/A"]}**`);
  if (counters.OUTROS > 0) {
    lines.push(`- OUTROS: **${counters.OUTROS}**`);
  }
  lines.push(`- Resultado sugerido: **${finalStatus}**`);
  lines.push("");
  lines.push("## Resultado por bloco");
  lines.push("");

  for (const [bloco, blocoRows] of grouped.entries()) {
    const blocoCounters = statusCounters(blocoRows);
    lines.push(`### ${bloco}`);
    lines.push("");
    lines.push(
      `- PASS: ${blocoCounters.PASS} | FAIL: ${blocoCounters.FAIL} | BLOQUEADO: ${blocoCounters.BLOQUEADO} | PENDENTE: ${blocoCounters.PENDENTE} | N/A: ${blocoCounters["N/A"]}`,
    );
    lines.push("");
  }

  lines.push("## Itens com atencao");
  lines.push("");
  if (attentionRows.length === 0) {
    lines.push("- Nenhum item com FAIL/BLOQUEADO/PENDENTE.");
    lines.push("");
  } else {
    for (const row of attentionRows) {
      const details = [];
      if (row.observacoes) details.push(`obs: ${row.observacoes}`);
      if (row.evidencia) details.push(`evidencia: ${row.evidencia}`);
      lines.push(
        `- [${row.resultado}] ${row.bloco} -> ${row.item}${details.length ? ` (${details.join(" | ")})` : ""}`,
      );
    }
    lines.push("");
  }

  lines.push("## Recomendacao");
  lines.push("");
  if (finalStatus === "APROVADO") {
    lines.push("- Checklist pronto para aprovacao final de QA no card CRM-020.");
  } else if (finalStatus === "PENDENTE") {
    lines.push("- Existem itens pendentes. Concluir execucao manual antes do sign-off.");
  } else {
    lines.push("- Existem itens com FAIL/BLOQUEADO. Nao aprovar producao ate tratativa.");
  }
  lines.push("");

  return lines.join("\n");
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();
  const dateIso = args.date || formatIsoDate(now);
  const compactDate = formatCompactDate(now);
  const inputPath = path.resolve(args.input);
  const outputPath = args.output
    ? path.resolve(args.output)
    : path.resolve(
        DEFAULT_OUTPUT_DIR,
        `CRM020_SIGNOFF_MANUAL_SUMMARY_${compactDate}.md`,
      );

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Arquivo CSV nao encontrado: ${inputPath}`);
  }

  const rows = readCsvRows(inputPath);
  const markdown = buildMarkdown({
    rows,
    inputPath,
    environment: args.environment,
    dateIso,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf8");

  console.log(`[crm020-signoff] Relatorio gerado: ${outputPath}`);
};

main();
