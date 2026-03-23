import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BACKEND_PERMISSIONS_PATH = path.join(
  ROOT,
  'backend',
  'src',
  'common',
  'permissions',
  'permissions.constants.ts',
);
const FRONTEND_MENU_PATH = path.join(ROOT, 'frontend-web', 'src', 'config', 'menuConfig.ts');
const FRONTEND_GESTAO_PATH = path.join(
  ROOT,
  'frontend-web',
  'src',
  'features',
  'gestao',
  'pages',
  'GestaoUsuariosPage.tsx',
);

const BACKEND_PERMISSION_REGEX = /\b[A-Z0-9_]+\s*=\s*'([^']+)'/g;
const STRING_LITERAL_REGEX = /'([^']+)'/g;
const FALLBACK_OPTION_REGEX = /value:\s*'([^']+)'/g;

const readFile = (targetPath) => fs.readFileSync(targetPath, 'utf8');

const unique = (values) => Array.from(new Set(values));

const extractBackendPermissions = (source) =>
  unique(
    [...source.matchAll(BACKEND_PERMISSION_REGEX)]
      .map((match) => match[1])
      .filter((value) => value.includes('.')),
  );

const extractArrayValuesByConst = (source, constName) => {
  const blockRegex = new RegExp(
    `const\\s+${constName}\\s*:[^=]*=\\s*\\[(?<values>[\\s\\S]*?)\\];`,
    'm',
  );
  const block = source.match(blockRegex)?.groups?.values ?? '';
  return unique([...block.matchAll(STRING_LITERAL_REGEX)].map((match) => match[1]));
};

const extractFallbackPermissions = (source) => {
  const blockRegex =
    /const\s+PERMISSOES_MODAL_GROUPS_FALLBACK:[\s\S]*?=\s*\[(?<values>[\s\S]*?)\];\n\nconst ensureAtendimentoAnalyticsPermission/m;
  const block = source.match(blockRegex)?.groups?.values ?? '';
  return unique([...block.matchAll(FALLBACK_OPTION_REGEX)].map((match) => match[1]));
};

const backendSource = readFile(BACKEND_PERMISSIONS_PATH);
const frontendMenuSource = readFile(FRONTEND_MENU_PATH);
const frontendGestaoSource = readFile(FRONTEND_GESTAO_PATH);

const backendPermissions = extractBackendPermissions(backendSource);
const frontendAllPermissions = extractArrayValuesByConst(frontendMenuSource, 'ALL_PERMISSION_VALUES');
const fallbackPermissions = extractFallbackPermissions(frontendGestaoSource);

const legacyAllowed = new Set(['ATENDIMENTO']);

const missingInFrontendAll = backendPermissions.filter(
  (permission) => !frontendAllPermissions.includes(permission),
);
const missingInFallback = backendPermissions.filter(
  (permission) => !fallbackPermissions.includes(permission),
);
const unknownInFallback = fallbackPermissions.filter(
  (permission) => !backendPermissions.includes(permission) && !legacyAllowed.has(permission),
);

const printList = (title, values) => {
  if (values.length === 0) {
    return;
  }

  console.error(`\n${title} (${values.length})`);
  values.sort().forEach((value) => console.error(` - ${value}`));
};

if (
  missingInFrontendAll.length > 0 ||
  missingInFallback.length > 0 ||
  unknownInFallback.length > 0
) {
  console.error('❌ Falha de paridade de permissões entre backend e frontend.');
  printList('Permissões faltando em ALL_PERMISSION_VALUES', missingInFrontendAll);
  printList('Permissões faltando no fallback de gestão de usuários', missingInFallback);
  printList('Permissões desconhecidas no fallback de gestão de usuários', unknownInFallback);
  process.exit(1);
}

console.log('✅ Paridade de permissões backend/frontend validada com sucesso.');
