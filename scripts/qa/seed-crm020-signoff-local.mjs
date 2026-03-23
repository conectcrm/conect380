import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = "docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv";
const DEFAULT_EVIDENCE_DATE = "20260312";
const DEFAULT_EXECUTOR = "qa.automacao";

const pad2 = (value) => String(value).padStart(2, "0");
const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const toCompactDate = (date) =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT,
    output: "",
    date: "",
    evidenceDate: DEFAULT_EVIDENCE_DATE,
    executor: DEFAULT_EXECUTOR,
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
    if (token === "--date" && argv[index + 1]) {
      args.date = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--evidence-date" && argv[index + 1]) {
      args.evidenceDate = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--executor" && argv[index + 1]) {
      args.executor = argv[index + 1];
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
  if (positional[1] && !args.output) {
    args.output = positional[1];
  }
  if (positional[2] && !args.date) {
    args.date = positional[2];
  }

  return args;
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

const escapeCsv = (value) => {
  const normalized = String(value ?? "");
  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }
  return `"${normalized.replace(/"/g, "\"\"")}"`;
};

const buildEvidenceMap = (evidenceDate) => {
  const base = `docs/features/evidencias/CRM020_QA_CLIENTES_360_${evidenceDate}`;
  return {
    "Bloco 1 - Listagem e filtros": [
      `${base}_listagem_filtros.png`,
      `${base}_listagem_limpa.png`,
      `${base}.md`,
    ],
    "Bloco 2 - Cadastro e edicao": [
      `${base}_cadastro_sucesso.png`,
      `${base}_edicao_sucesso.png`,
      `${base}.md`,
    ],
    "Bloco 3 - Perfil do cliente": [
      `${base}_perfil_dados_basicos.png`,
      `${base}_perfil_integracoes.png`,
      `${base}.md`,
    ],
    "Bloco 4 - Integracoes do perfil": [
      `${base}_perfil_integracoes.png`,
      `${base}.md`,
    ],
    "Bloco 5 - Exportacao e consistencia": [
      `${base}_export_sem_filtros.csv`,
      `${base}_export_com_filtros.csv`,
      `${base}.md`,
    ],
    "Bloco 6 - Estados e UX": [`${base}.md`],
  };
};

const readCsvRows = (csvPath) => {
  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("CSV sem dados suficientes.");
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
      resultado: values[2],
      evidencia: values[3],
      observacoes: values[4],
      executadoPor: values[5],
      executadoEm: values[6],
    };
  });
};

const toOutputCsv = (rows) => {
  const header = [
    "bloco",
    "item",
    "resultado",
    "evidencia",
    "observacoes",
    "executado_por",
    "executado_em",
  ];
  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.bloco,
        row.item,
        row.resultado,
        row.evidencia,
        row.observacoes,
        row.executadoPor,
        row.executadoEm,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();
  const executionDate = args.date || toIsoDate(now);
  const compactDate = toCompactDate(now);
  const inputPath = path.resolve(args.input);
  const outputPath = args.output
    ? path.resolve(args.output)
    : path.resolve("docs/features", `CRM-020_SIGNOFF_RESULTADOS_${compactDate}_local-mock.csv`);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV de entrada nao encontrado: ${inputPath}`);
  }

  const evidenceMap = buildEvidenceMap(args.evidenceDate);
  const rows = readCsvRows(inputPath);
  const updatedRows = rows.map((row) => {
    if (row.bloco in evidenceMap) {
      const evidenceValues = evidenceMap[row.bloco];
      return {
        ...row,
        resultado: "PASS",
        evidencia: evidenceValues.join("|"),
        observacoes:
          "Preenchimento automatico por rodada local em mock. Revalidar manualmente em homolog/producao.",
        executadoPor: args.executor,
        executadoEm: executionDate,
      };
    }

    if (row.bloco === "Pre-condicoes" || row.bloco === "Sign-off") {
      return {
        ...row,
        resultado: "PENDENTE",
        evidencia: "",
        observacoes: "Pendente de validacao manual em ambiente alvo.",
        executadoPor: "",
        executadoEm: "",
      };
    }

    return row;
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, toOutputCsv(updatedRows), "utf8");

  const passCount = updatedRows.filter((row) => row.resultado === "PASS").length;
  const pendingCount = updatedRows.filter((row) => row.resultado === "PENDENTE").length;

  console.log(`[crm020-signoff] CSV local pre-preenchido: ${outputPath}`);
  console.log(`[crm020-signoff] Totais -> PASS=${passCount}, PENDENTE=${pendingCount}`);
};

try {
  main();
} catch (error) {
  console.error(`[crm020-signoff] Erro: ${error.message}`);
  process.exitCode = 1;
}
