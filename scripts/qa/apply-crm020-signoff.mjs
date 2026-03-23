import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_INPUT = "docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv";
const DEFAULT_CHECKLIST = "docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md";

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT,
    checklist: DEFAULT_CHECKLIST,
    environment: "homolog",
    summary: "",
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
    if (token === "--checklist" && argv[index + 1]) {
      args.checklist = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--environment" && argv[index + 1]) {
      args.environment = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--summary" && argv[index + 1]) {
      args.summary = argv[index + 1];
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
  if (positional[2] && !args.summary) {
    args.summary = positional[2];
  }
  if (positional[3] && args.checklist === DEFAULT_CHECKLIST) {
    args.checklist = positional[3];
  }

  return args;
};

const pad2 = (value) => String(value).padStart(2, "0");
const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toPosixPath = (value) => String(value).replace(/\\/g, "/");

const toRepositoryPath = (targetPath) => {
  const absolutePath = path.resolve(targetPath);
  const relativePath = path.relative(process.cwd(), absolutePath);
  if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    return toPosixPath(relativePath);
  }
  return toPosixPath(absolutePath);
};

const runStrictValidation = (csvPath) => {
  const validatorPath = path.resolve("scripts/qa/validate-crm020-signoff.mjs");
  try {
    execFileSync(process.execPath, [validatorPath, csvPath], { stdio: "inherit" });
    return true;
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 1;
    process.exitCode = status;
    return false;
  }
};

const replaceSignoffCriteria = (content) => {
  return content
    .replace("- [ ] Todos os itens obrigatorios concluidos.", "- [x] Todos os itens obrigatorios concluidos.")
    .replace(
      "- [ ] Nenhum bug critico ou bloqueante aberto para o modulo.",
      "- [x] Nenhum bug critico ou bloqueante aberto para o modulo.",
    )
    .replace(
      "- [ ] Aprovacao final de QA registrada no card CRM-020.",
      "- [x] Aprovacao final de QA registrada no card CRM-020.",
    );
};

const upsertSignoffRecordSection = (content, payload) => {
  const section = [
    "## Registro de sign-off manual",
    "",
    `- Data: ${payload.date}`,
    `- Ambiente: ${payload.environment}`,
    `- CSV validado: ${payload.csvPath}`,
    `- Resumo consolidado: ${payload.summaryPath || "(nao informado)"}`,
    "- Aplicado por automacao: `qa:crm020:signoff:apply`",
    "",
  ].join("\n");

  const startMarker = "## Registro de sign-off manual";
  const nextSectionRegex = /^## /gm;
  const startIndex = content.indexOf(startMarker);

  if (startIndex === -1) {
    const contentWithTrailingLineBreak = content.endsWith("\n") ? content : `${content}\n`;
    return `${contentWithTrailingLineBreak}\n${section}`;
  }

  nextSectionRegex.lastIndex = startIndex + startMarker.length;
  const nextSectionMatch = nextSectionRegex.exec(content);
  const endIndex = nextSectionMatch ? nextSectionMatch.index : content.length;
  return `${content.slice(0, startIndex)}${section}${content.slice(endIndex)}`;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input);
  const checklistPath = path.resolve(args.checklist);
  const dateValue = args.date || toIsoDate(new Date());

  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV nao encontrado: ${inputPath}`);
  }
  if (!fs.existsSync(checklistPath)) {
    throw new Error(`Checklist nao encontrado: ${checklistPath}`);
  }

  console.log("[crm020-signoff] Validando CSV em modo estrito antes de aplicar checklist.");
  const validationOk = runStrictValidation(inputPath);
  if (!validationOk) {
    console.log("[crm020-signoff] Aplicacao interrompida: gate de validacao reprovado.");
    return;
  }

  if (args.summary && !fs.existsSync(path.resolve(args.summary))) {
    console.log(`[crm020-signoff] Aviso: resumo nao encontrado (sera registrado caminho informado): ${args.summary}`);
  }

  const original = fs.readFileSync(checklistPath, "utf8");
  const withCriteria = replaceSignoffCriteria(original);
  const updated = upsertSignoffRecordSection(withCriteria, {
    date: dateValue,
    environment: args.environment,
    csvPath: toRepositoryPath(inputPath),
    summaryPath: args.summary ? toRepositoryPath(args.summary) : "",
  });

  if (withCriteria === original) {
    console.log("[crm020-signoff] Aviso: criterio de sign-off nao foi encontrado para marcacao automatica.");
  }

  fs.writeFileSync(checklistPath, updated, "utf8");
  console.log(`[crm020-signoff] Checklist atualizado com sign-off: ${checklistPath}`);
};

try {
  main();
} catch (error) {
  console.error(`[crm020-signoff] Erro: ${error.message}`);
  process.exitCode = 1;
}
