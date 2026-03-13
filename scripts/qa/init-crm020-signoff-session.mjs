import fs from "node:fs";
import path from "node:path";

const TEMPLATE_PATH = "docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv";
const OUTPUT_DIR = "docs/features";

const pad2 = (value) => String(value).padStart(2, "0");
const compactDate = (date) =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;

const parseArgs = (argv) => {
  const args = {
    environment: "homolog",
    date: "",
    output: "",
    force: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
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
    if (token === "--output" && argv[index + 1]) {
      args.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--force") {
      args.force = true;
      continue;
    }

    if (!token.startsWith("--")) {
      positional.push(token);
    }
  }

  if (positional[0] && args.environment === "homolog") {
    args.environment = positional[0];
  }
  if (positional[1] && !args.date) {
    args.date = positional[1];
  }
  if (positional[2] && !args.output) {
    args.output = positional[2];
  }

  return args;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();
  const dateToken = args.date || compactDate(now);
  const environmentToken = String(args.environment || "homolog")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  const templatePath = path.resolve(TEMPLATE_PATH);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template nao encontrado: ${templatePath}`);
  }

  const outputPath = args.output
    ? path.resolve(args.output)
    : path.resolve(
        OUTPUT_DIR,
        `CRM-020_SIGNOFF_RESULTADOS_${dateToken}_${environmentToken}.csv`,
      );

  if (fs.existsSync(outputPath) && !args.force) {
    throw new Error(
      `Arquivo ja existe: ${outputPath}. Use --force para sobrescrever ou --output para novo caminho.`,
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.copyFileSync(templatePath, outputPath);

  console.log(`[crm020-signoff] Sessao criada: ${outputPath}`);
};

main();
