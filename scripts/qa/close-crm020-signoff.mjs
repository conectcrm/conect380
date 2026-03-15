import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_INPUT = "docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv";
const DEFAULT_OUTPUT_DIR = "docs/features/evidencias";
const DEFAULT_CHECKLIST = "docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md";

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT,
    environment: "homolog",
    output: "",
    checklist: DEFAULT_CHECKLIST,
    date: "",
    allowPending: false,
    applyChecklist: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--input" && argv[index + 1]) {
      args.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--environment" && argv[index + 1]) {
      args.environment = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--output" && argv[index + 1]) {
      args.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--checklist" && argv[index + 1]) {
      args.checklist = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--date" && argv[index + 1]) {
      args.date = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--allow-pending") {
      args.allowPending = true;
      continue;
    }
    if (token === "--apply-checklist") {
      args.applyChecklist = true;
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
  if (positional[3] && args.checklist === DEFAULT_CHECKLIST) {
    args.checklist = positional[3];
  }

  return args;
};

const pad2 = (value) => String(value).padStart(2, "0");
const formatCompactDate = (date) =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
const sanitizeDateToCompact = (value) => String(value || "").replace(/\D/g, "").slice(0, 8);

const resolveSummaryOutputPath = (args) => {
  if (args.output) {
    return path.resolve(args.output);
  }

  const compactDate = sanitizeDateToCompact(args.date) || formatCompactDate(new Date());
  return path.resolve(
    DEFAULT_OUTPUT_DIR,
    `CRM020_SIGNOFF_MANUAL_SUMMARY_${compactDate}.md`,
  );
};

const runNodeScript = (scriptRelativePath, scriptArgs) => {
  const scriptPath = path.resolve(scriptRelativePath);
  try {
    execFileSync(process.execPath, [scriptPath, ...scriptArgs], { stdio: "inherit" });
    return true;
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 1;
    process.exitCode = status;
    return false;
  }
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const summaryOutputPath = resolveSummaryOutputPath(args);

  const reportArgs = [args.input, args.environment, summaryOutputPath];
  if (args.date) {
    reportArgs.push("--date", args.date);
  }

  console.log("[crm020-signoff] Etapa 1/3: gerando resumo consolidado.");
  const reportOk = runNodeScript("scripts/qa/generate-crm020-signoff-report.mjs", reportArgs);
  if (!reportOk) {
    console.log("[crm020-signoff] Fechamento interrompido: erro na geracao do relatorio.");
    return;
  }

  console.log("[crm020-signoff] Etapa 2/3: validando gate final.");
  const validateArgs = [args.input];
  if (args.allowPending) {
    validateArgs.push("--allow-pending");
  }
  const validateOk = runNodeScript("scripts/qa/validate-crm020-signoff.mjs", validateArgs);
  if (!validateOk) {
    console.log("[crm020-signoff] Fechamento interrompido: gate de validacao reprovado.");
    return;
  }

  if (args.applyChecklist && args.allowPending) {
    console.log(
      "[crm020-signoff] Fechamento interrompido: --apply-checklist requer validacao estrita (remova --allow-pending).",
    );
    process.exitCode = 1;
    return;
  }

  if (args.applyChecklist) {
    console.log("[crm020-signoff] Etapa 3/3: aplicando sign-off no checklist.");
    const applyArgs = [args.input, args.environment, summaryOutputPath];
    if (args.checklist) {
      applyArgs.push(args.checklist);
    }
    if (args.date) {
      applyArgs.push("--date", args.date);
    }
    const applyOk = runNodeScript("scripts/qa/apply-crm020-signoff.mjs", applyArgs);
    if (!applyOk) {
      console.log("[crm020-signoff] Fechamento interrompido: falha ao aplicar checklist.");
      return;
    }
  } else {
    console.log("[crm020-signoff] Etapa 3/3: aplicacao de checklist nao solicitada.");
  }

  console.log("[crm020-signoff] Fechamento concluido.");
};

main();
