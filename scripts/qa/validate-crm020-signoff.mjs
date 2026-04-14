import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = "docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv";

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT,
    allowPending: false,
    skipEvidenceCheck: false,
    skipMetadataCheck: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--input" && argv[index + 1]) {
      args.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--allow-pending") {
      args.allowPending = true;
      continue;
    }
    if (token === "--skip-evidence-check") {
      args.skipEvidenceCheck = true;
      continue;
    }
    if (token === "--skip-metadata-check") {
      args.skipMetadataCheck = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
    }
  }

  if (positional[0] && args.input === DEFAULT_INPUT) {
    args.input = positional[0];
  }

  return args;
};

const normalizeStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (!normalized) return "PENDENTE";
  if (normalized === "PASS") return "PASS";
  if (normalized === "FAIL") return "FAIL";
  if (normalized === "BLOQUEADO" || normalized === "BLOCKED") return "BLOQUEADO";
  if (normalized === "N/A" || normalized === "NA") return "N/A";
  if (normalized === "PENDENTE" || normalized === "PENDING") return "PENDENTE";
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
    throw new Error("CSV sem dados suficientes para validacao.");
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

const countByStatus = (rows) => {
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

const looksLikeUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());

const splitEvidenceValues = (value) =>
  String(value || "")
    .split(/[|;,]/)
    .map((token) => token.trim())
    .filter(Boolean);

const normalizeDateValue = (value) => String(value || "").trim();

const isValidExecutionDate = (value) => {
  const normalized = normalizeDateValue(value);
  if (!normalized) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return true;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/.test(normalized)) return true;
  return false;
};

const validateCompletedRows = (rows, options) => {
  const issues = [];
  const completedRows = rows.filter((row) => ["PASS", "FAIL", "BLOQUEADO"].includes(row.resultado));

  for (const row of completedRows) {
    if (!options.skipMetadataCheck) {
      if (!String(row.executadoPor || "").trim()) {
        issues.push({
          type: "METADATA",
          row,
          message: "executado_por obrigatorio para itens concluidos",
        });
      }

      if (!isValidExecutionDate(row.executadoEm)) {
        issues.push({
          type: "METADATA",
          row,
          message: "executado_em invalido (use YYYY-MM-DD ou ISO datetime)",
        });
      }
    }

    if (!options.skipEvidenceCheck) {
      const evidences = splitEvidenceValues(row.evidencia);
      if (evidences.length === 0) {
        issues.push({
          type: "EVIDENCE",
          row,
          message: "evidencia obrigatoria para itens concluidos",
        });
      } else {
        for (const evidence of evidences) {
          if (looksLikeUrl(evidence)) {
            continue;
          }

          const resolvedPath = path.resolve(evidence);
          if (!fs.existsSync(resolvedPath)) {
            issues.push({
              type: "EVIDENCE",
              row,
              message: `evidencia nao encontrada: ${evidence}`,
            });
          }
        }
      }
    }
  }

  return issues;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Arquivo CSV nao encontrado: ${inputPath}`);
  }

  const rows = readCsvRows(inputPath);
  const counters = countByStatus(rows);
  const knownStatuses = new Set(["PASS", "FAIL", "BLOQUEADO", "PENDENTE", "N/A"]);
  const failureRows = rows.filter((row) => row.resultado === "FAIL" || row.resultado === "BLOQUEADO");
  const pendingRows = rows.filter((row) => row.resultado === "PENDENTE");
  const unknownRows = rows.filter((row) => !knownStatuses.has(row.resultado));
  const allIssues = args.allowPending
    ? [...failureRows, ...unknownRows]
    : [...failureRows, ...pendingRows, ...unknownRows];
  const completedRowsIssues = validateCompletedRows(rows, {
    skipEvidenceCheck: args.skipEvidenceCheck,
    skipMetadataCheck: args.skipMetadataCheck,
  });
  const signoffRows = rows.filter((row) => row.bloco === "Sign-off");
  const signoffIssues =
    args.allowPending
      ? []
      : signoffRows
          .filter((row) => row.resultado !== "PASS")
          .map((row) => ({
            type: "SIGNOFF",
            row,
            message: "itens do bloco Sign-off devem estar como PASS para aprovacao final",
          }));
  const issues = [
    ...allIssues.map((row) => ({ type: "STATUS", row, message: `status invalido para gate: ${row.resultado}` })),
    ...completedRowsIssues,
    ...signoffIssues,
  ];

  console.log(`[crm020-signoff] Arquivo: ${inputPath}`);
  console.log(
    `[crm020-signoff] Totais -> PASS=${counters.PASS}, FAIL=${counters.FAIL}, BLOQUEADO=${counters.BLOQUEADO}, PENDENTE=${counters.PENDENTE}, N/A=${counters["N/A"]}, OUTROS=${counters.OUTROS}`,
  );

  if (issues.length > 0) {
    console.log("[crm020-signoff] Itens pendentes/reprovados:");
    for (const issue of issues.slice(0, 80)) {
      console.log(
        `- [${issue.type}] [${issue.row.resultado}] ${issue.row.bloco} -> ${issue.row.item} (${issue.message})`,
      );
    }
    if (issues.length > 80) {
      console.log(`... e mais ${issues.length - 80} item(ns).`);
    }
    process.exitCode = 1;
    return;
  }

  if (args.allowPending && counters.PENDENTE > 0) {
    console.log("[crm020-signoff] Validacao tecnica concluida com pendencias permitidas.");
    return;
  }

  console.log("[crm020-signoff] Validacao concluida: pronto para aprovacao final.");
};

main();
