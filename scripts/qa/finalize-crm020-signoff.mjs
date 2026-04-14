import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_INPUT_PREP = "docs/features/CRM-020_SIGNOFF_RESULTADOS_20260312_homolog-prep.csv";
const DEFAULT_ENVIRONMENT = "homolog";
const DEFAULT_CHECKLIST = "docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md";
const DEFAULT_EXECUTOR = "qa.manual";

const pad2 = (value) => String(value).padStart(2, "0");
const compactDateFromNow = () => {
  const now = new Date();
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
};

const parseArgs = (argv) => {
  const args = {
    input: DEFAULT_INPUT_PREP,
    output: "",
    environment: DEFAULT_ENVIRONMENT,
    summaryOutput: "",
    checklist: DEFAULT_CHECKLIST,
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
    if (token === "--environment" && argv[index + 1]) {
      args.environment = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--summary-output" && argv[index + 1]) {
      args.summaryOutput = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--checklist" && argv[index + 1]) {
      args.checklist = argv[index + 1];
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

  if (positional[0] && args.input === DEFAULT_INPUT_PREP) {
    args.input = positional[0];
  }
  if (positional[1] && !args.output) {
    args.output = positional[1];
  }
  if (positional[2] && args.environment === DEFAULT_ENVIRONMENT) {
    args.environment = positional[2];
  }
  if (positional[3] && !args.summaryOutput) {
    args.summaryOutput = positional[3];
  }
  if (positional[4] && args.checklist === DEFAULT_CHECKLIST) {
    args.checklist = positional[4];
  }
  if (positional[5] && args.executor === DEFAULT_EXECUTOR) {
    args.executor = positional[5];
  }
  if (positional[6] && !args.date) {
    args.date = positional[6];
  }
  if (positional[7] && !args.preflightEvidence) {
    args.preflightEvidence = positional[7];
  }
  if (positional[8] && !args.bugsEvidence) {
    args.bugsEvidence = positional[8];
  }
  if (positional[9] && !args.approvalEvidence) {
    args.approvalEvidence = positional[9];
  }

  return args;
};

const inferOutputFinalPath = (inputPath, explicitOutput) => {
  if (explicitOutput) {
    return path.resolve(explicitOutput);
  }

  const inputAbsolute = path.resolve(inputPath);
  const directory = path.dirname(inputAbsolute);
  const fileName = path.basename(inputAbsolute);

  if (fileName.endsWith("-prep.csv")) {
    return path.join(directory, fileName.replace(/-prep\.csv$/, "-final.csv"));
  }

  if (fileName.endsWith(".csv")) {
    return path.join(directory, fileName.replace(/\.csv$/, "-final.csv"));
  }

  return path.join(directory, `${fileName}-final.csv`);
};

const inferSummaryOutputPath = (explicitOutput, environment) => {
  if (explicitOutput) {
    return path.resolve(explicitOutput);
  }

  const dateTag = compactDateFromNow();
  return path.resolve(
    "docs/features/evidencias",
    `CRM020_SIGNOFF_MANUAL_SUMMARY_${dateTag}_${environment}.md`,
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
  const outputFinalPath = inferOutputFinalPath(args.input, args.output);
  const summaryOutputPath = inferSummaryOutputPath(args.summaryOutput, args.environment);

  console.log("[crm020-signoff] Etapa 1/2: completando pendencias finais no CSV.");
  const completeArgs = [
    "--input",
    args.input,
    "--output",
    outputFinalPath,
    "--executor",
    args.executor,
    "--preflight-evidence",
    args.preflightEvidence,
    "--bugs-evidence",
    args.bugsEvidence,
    "--approval-evidence",
    args.approvalEvidence,
    "--bugs-status",
    args.bugsStatus,
    "--approval-status",
    args.approvalStatus,
  ];

  if (args.date) {
    completeArgs.push("--date", args.date);
  }
  if (args.allowPlaceholderEvidence) {
    completeArgs.push("--allow-placeholder-evidence");
  }
  if (args.dryRun) {
    completeArgs.push("--dry-run");
  }

  const completeOk = runNodeScript("scripts/qa/complete-crm020-signoff-pendings.mjs", completeArgs);
  if (!completeOk) {
    console.log("[crm020-signoff] Finalizacao interrompida: falha ao completar pendencias.");
    return;
  }

  if (args.dryRun) {
    console.log("[crm020-signoff] Dry-run concluido. Etapa 2/2 nao executada.");
    return;
  }

  console.log("[crm020-signoff] Etapa 2/2: fechamento estrito + aplicacao no checklist.");
  const closeArgs = [
    "--apply-checklist",
    outputFinalPath,
    args.environment,
    summaryOutputPath,
    args.checklist,
  ];
  if (args.date) {
    closeArgs.push("--date", args.date);
  }

  const closeOk = runNodeScript("scripts/qa/close-crm020-signoff.mjs", closeArgs);
  if (!closeOk) {
    console.log("[crm020-signoff] Finalizacao interrompida: falha no fechamento estrito.");
    return;
  }

  console.log(`[crm020-signoff] Finalizacao concluida. CSV final: ${outputFinalPath}`);
};

main();
