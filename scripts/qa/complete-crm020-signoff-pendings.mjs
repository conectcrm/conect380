import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = "docs/features/CRM-020_SIGNOFF_RESULTADOS_20260312_homolog-prep.csv";
const DEFAULT_EXECUTOR = "qa.manual";

const PRECONDITION_BLOCK = "Pre-condicoes";
const SIGNOFF_BLOCK = "Sign-off";
const SIGNOFF_BUGS_ITEM = "Nenhum bug critico ou bloqueante aberto";
const SIGNOFF_APPROVAL_ITEM = "Aprovacao final de QA registrada no card CRM-020";

const pad2 = (value) => String(value).padStart(2, "0");
const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const looksLikeUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const normalizeStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (!normalized) return "PASS";
  if (normalized === "PASS") return "PASS";
  if (normalized === "FAIL") return "FAIL";
  if (normalized === "BLOQUEADO" || normalized === "BLOCKED") return "BLOQUEADO";
  throw new Error(`Status invalido: ${value}. Use PASS, FAIL ou BLOQUEADO.`);
};

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT,
    output: "",
    executor: DEFAULT_EXECUTOR,
    date: "",
    preflightEvidence: "",
    bugsEvidence: "",
    approvalEvidence: "",
    bugsStatus: "PASS",
    approvalStatus: "PASS",
    allowPlaceholderEvidence: false,
    dryRun: false,
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
    if (token === "--executor" && argv[index + 1]) {
      args.executor = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--date" && argv[index + 1]) {
      args.date = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--preflight-evidence" && argv[index + 1]) {
      args.preflightEvidence = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--bugs-evidence" && argv[index + 1]) {
      args.bugsEvidence = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--approval-evidence" && argv[index + 1]) {
      args.approvalEvidence = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--bugs-status" && argv[index + 1]) {
      args.bugsStatus = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--approval-status" && argv[index + 1]) {
      args.approvalStatus = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--allow-placeholder-evidence") {
      args.allowPlaceholderEvidence = true;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
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

const ensureEvidenceExists = (value, label) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(`Evidencia obrigatoria nao informada: ${label}`);
  }
  if (looksLikeUrl(normalized)) {
    return normalized;
  }
  const resolved = path.resolve(normalized);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Evidencia nao encontrada (${label}): ${normalized}`);
  }
  return normalized;
};

const evidenceLooksLikeTemplate = (content) => {
  const checks = [
    /\(Template\)/i,
    /\bTODO\b/i,
    /^- \[ \]/m,
    /^- Data:\s*$/m,
    /^- Ambiente:\s*$/m,
    /^- Responsavel QA:\s*$/m,
    /^- Fonte CSV:\s*$/m,
    /^- Consulta realizada em:\s*$/m,
    /^- Filtro utilizado:\s*$/m,
    /^- Card\/ticket:\s*$/m,
    /^- Responsaveis aprovadores:\s*$/m,
  ];
  return checks.some((regex) => regex.test(content));
};

const ensureEvidenceIsFilled = (value, label, options) => {
  if (options.allowPlaceholderEvidence || looksLikeUrl(value)) {
    return;
  }

  const resolved = path.resolve(value);
  const content = fs.readFileSync(resolved, "utf8");
  if (evidenceLooksLikeTemplate(content)) {
    throw new Error(
      `Evidencia (${label}) ainda parece template incompleto: ${value}. Preencha o arquivo antes de concluir.`,
    );
  }
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

const toCsvContent = (rows) => {
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
  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output || args.input);
  const executionDate = args.date || toIsoDate(new Date());
  const bugsStatus = normalizeStatus(args.bugsStatus);
  const approvalStatus = normalizeStatus(args.approvalStatus);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV nao encontrado: ${inputPath}`);
  }

  const preflightEvidence = ensureEvidenceExists(args.preflightEvidence, "preflight");
  const bugsEvidence = ensureEvidenceExists(args.bugsEvidence, "bugs");
  const approvalEvidence = ensureEvidenceExists(args.approvalEvidence, "approval");

  ensureEvidenceIsFilled(preflightEvidence, "preflight", {
    allowPlaceholderEvidence: args.allowPlaceholderEvidence,
  });
  ensureEvidenceIsFilled(bugsEvidence, "bugs", {
    allowPlaceholderEvidence: args.allowPlaceholderEvidence,
  });
  ensureEvidenceIsFilled(approvalEvidence, "approval", {
    allowPlaceholderEvidence: args.allowPlaceholderEvidence,
  });

  const rows = readCsvRows(inputPath);
  let updatedPreconditions = 0;
  let updatedBugs = 0;
  let updatedApproval = 0;

  const updatedRows = rows.map((row) => {
    if (row.bloco === PRECONDITION_BLOCK) {
      updatedPreconditions += 1;
      return {
        ...row,
        resultado: "PASS",
        evidencia: preflightEvidence,
        observacoes: "Pre-condicoes validadas manualmente em ambiente alvo.",
        executadoPor: args.executor,
        executadoEm: executionDate,
      };
    }

    if (row.bloco === SIGNOFF_BLOCK && row.item === SIGNOFF_BUGS_ITEM) {
      updatedBugs += 1;
      return {
        ...row,
        resultado: bugsStatus,
        evidencia: bugsEvidence,
        observacoes:
          bugsStatus === "PASS"
            ? "Nenhum bug critico ou bloqueante aberto para o modulo."
            : "Existe bug critico/bloqueante aberto. Nao aprovar ate tratativa.",
        executadoPor: args.executor,
        executadoEm: executionDate,
      };
    }

    if (row.bloco === SIGNOFF_BLOCK && row.item === SIGNOFF_APPROVAL_ITEM) {
      updatedApproval += 1;
      return {
        ...row,
        resultado: approvalStatus,
        evidencia: approvalEvidence,
        observacoes:
          approvalStatus === "PASS"
            ? "Aprovacao final registrada no card CRM-020."
            : "Aprovacao final ainda nao registrada no card CRM-020.",
        executadoPor: args.executor,
        executadoEm: executionDate,
      };
    }

    return row;
  });

  if (updatedPreconditions !== 5) {
    throw new Error(`Esperado atualizar 5 pre-condicoes, mas atualizou ${updatedPreconditions}.`);
  }
  if (updatedBugs !== 1) {
    throw new Error(`Esperado atualizar 1 item de bug no sign-off, mas atualizou ${updatedBugs}.`);
  }
  if (updatedApproval !== 1) {
    throw new Error(`Esperado atualizar 1 item de aprovacao no sign-off, mas atualizou ${updatedApproval}.`);
  }

  if (args.dryRun) {
    console.log(`[crm020-signoff] Dry-run: pronto para atualizar ${inputPath}`);
    console.log("[crm020-signoff] Itens alvo -> pre-condicoes=5, sign-off(bugs)=1, sign-off(aprovacao)=1");
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, toCsvContent(updatedRows), "utf8");

  console.log(`[crm020-signoff] CSV atualizado: ${outputPath}`);
  console.log(
    `[crm020-signoff] Aplicado por=${args.executor}, data=${executionDate}, bugs=${bugsStatus}, aprovacao=${approvalStatus}`,
  );
};

try {
  main();
} catch (error) {
  console.error(`[crm020-signoff] Erro: ${error.message}`);
  process.exitCode = 1;
}
