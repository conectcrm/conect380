import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PERMISSIONS_PATH = path.join(
  ROOT,
  'backend',
  'src',
  'common',
  'permissions',
  'permissions.constants.ts',
);
const PLAN_DEFAULTS_PATH = path.join(ROOT, 'backend', 'src', 'modules', 'planos', 'planos.defaults.ts');
const DOC_OUTPUT_PATH = path.join(
  ROOT,
  'docs',
  'runbooks',
  'MATRIZ_MODULO_PERMISSAO_PLANO_2026-03.md',
);
const JSON_OUTPUT_PATH = path.join(ROOT, 'docs', 'runbooks', 'matriz-modulo-permissao-plano.json');

const readFile = (targetPath) => fs.readFileSync(targetPath, 'utf8');
const unique = (items) => Array.from(new Set(items));

const normalizeModuleCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase();

const normalizePlanCode = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const extractPermissions = (source) => {
  const enumBlockMatch = source.match(/export enum Permission\s*\{([\s\S]*?)\n\}/m);
  if (!enumBlockMatch) {
    throw new Error('Nao foi possivel localizar enum Permission.');
  }

  return unique(
    [...enumBlockMatch[1].matchAll(/=\s*'([^']+)'/g)]
      .map((match) => String(match[1] || '').trim())
      .filter(Boolean),
  );
};

const extractDefaultModules = (source) => {
  const modulesBlockMatch = source.match(/export const DEFAULT_MODULOS_SISTEMA:[\s\S]*?=\s*\[([\s\S]*?)\];/m);
  if (!modulesBlockMatch) {
    throw new Error('Nao foi possivel localizar DEFAULT_MODULOS_SISTEMA.');
  }

  const entries = [...modulesBlockMatch[1].matchAll(/\{([\s\S]*?)\}/g)];
  return entries
    .map((entry) => {
      const body = entry[1];
      const code = body.match(/codigo:\s*'([^']+)'/)?.[1] || '';
      const name = body.match(/nome:\s*'([^']+)'/)?.[1] || code;
      const essentialRaw = body.match(/essencial:\s*(true|false)/)?.[1];
      return {
        code: normalizeModuleCode(code),
        name: String(name || code).trim(),
        essential: essentialRaw === 'true',
      };
    })
    .filter((moduleItem) => Boolean(moduleItem.code));
};

const parseStringArray = (raw) =>
  unique(
    [...String(raw || '').matchAll(/'([^']+)'/g)]
      .map((match) => String(match[1] || '').trim())
      .filter(Boolean),
  );

const extractDefaultPlans = (source) => {
  const plansBlockMatch = source.match(/export const DEFAULT_PLANOS_SISTEMA:[\s\S]*?=\s*\[([\s\S]*?)\];/m);
  if (!plansBlockMatch) {
    throw new Error('Nao foi possivel localizar DEFAULT_PLANOS_SISTEMA.');
  }

  const entries = [...plansBlockMatch[1].matchAll(/\{([\s\S]*?)\}/g)];
  return entries
    .map((entry) => {
      const body = entry[1];
      const code = body.match(/codigo:\s*'([^']+)'/)?.[1] || '';
      const name = body.match(/nome:\s*'([^']+)'/)?.[1] || code;
      const modulesRaw = body.match(/modulosCodigos:\s*\[([\s\S]*?)\]/)?.[1] || '';
      const moduleCodes = parseStringArray(modulesRaw).map(normalizeModuleCode);
      return {
        code: normalizePlanCode(code),
        name: String(name || code).trim(),
        moduleCodes,
      };
    })
    .filter((planItem) => Boolean(planItem.code));
};

const classifyPermissionModule = (permission) => {
  if (permission.startsWith('crm.')) return 'CRM';
  if (permission.startsWith('comercial.')) return 'VENDAS';
  if (permission.startsWith('atendimento.')) return 'ATENDIMENTO';
  if (permission.startsWith('financeiro.')) return 'FINANCEIRO';
  if (permission.startsWith('compras.')) return 'COMPRAS';

  if (
    permission.startsWith('users.') ||
    permission.startsWith('config.') ||
    permission === 'planos.manage' ||
    permission === 'admin.empresas.manage' ||
    permission === 'dashboard.read' ||
    permission === 'relatorios.read'
  ) {
    return 'ADMINISTRACAO';
  }

  return 'ADMINISTRACAO';
};

const buildModulePermissionMatrix = (modules, permissions) => {
  const existingModuleCodes = new Set(modules.map((moduleItem) => moduleItem.code));
  const matrix = {};

  modules.forEach((moduleItem) => {
    matrix[moduleItem.code] = [];
  });

  permissions.forEach((permission) => {
    const moduleCode = classifyPermissionModule(permission);
    if (!existingModuleCodes.has(moduleCode)) {
      return;
    }
    matrix[moduleCode].push(permission);
  });

  Object.keys(matrix).forEach((moduleCode) => {
    matrix[moduleCode] = unique(matrix[moduleCode]).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  });

  return matrix;
};

const buildPlanModuleTable = (plans, modules) => {
  const moduleCodes = modules.map((moduleItem) => moduleItem.code);
  return plans.map((plan) => ({
    code: plan.code,
    name: plan.name,
    modules: Object.fromEntries(
      moduleCodes.map((moduleCode) => [moduleCode, plan.moduleCodes.includes(moduleCode)]),
    ),
  }));
};

const buildMarkdown = ({ generatedAt, modules, plans, modulePermissionMatrix, planModuleTable }) => {
  const lines = [];
  lines.push('# Matriz Modulo x Permissao x Plano');
  lines.push('');
  lines.push(`Gerado automaticamente em: ${generatedAt}`);
  lines.push('Fontes:');
  lines.push('- `backend/src/common/permissions/permissions.constants.ts`');
  lines.push('- `backend/src/modules/planos/planos.defaults.ts`');
  lines.push('');

  lines.push('## 1) Modulos canonicos');
  lines.push('');
  lines.push('| Modulo | Nome | Essencial |');
  lines.push('| --- | --- | --- |');
  modules.forEach((moduleItem) => {
    lines.push(
      `| \`${moduleItem.code}\` | ${moduleItem.name} | ${moduleItem.essential ? 'Sim' : 'Nao'} |`,
    );
  });
  lines.push('');

  lines.push('## 2) Modulo x Permissoes');
  lines.push('');
  modules.forEach((moduleItem) => {
    const permissions = modulePermissionMatrix[moduleItem.code] || [];
    lines.push(`### ${moduleItem.code}`);
    lines.push('');
    lines.push(`Total de permissoes: **${permissions.length}**`);
    lines.push('');
    permissions.forEach((permission) => {
      lines.push(`- \`${permission}\``);
    });
    lines.push('');
  });

  lines.push('## 3) Plano x Modulo');
  lines.push('');
  lines.push('| Plano | Codigo | ' + modules.map((moduleItem) => moduleItem.code).join(' | ') + ' |');
  lines.push('| --- | --- | ' + modules.map(() => '---').join(' | ') + ' |');
  planModuleTable.forEach((planRow) => {
    const rowCells = modules.map((moduleItem) => (planRow.modules[moduleItem.code] ? 'Sim' : 'Nao'));
    lines.push(`| ${planRow.name} | \`${planRow.code}\` | ${rowCells.join(' | ')} |`);
  });
  lines.push('');

  lines.push('## 4) Observacoes operacionais');
  lines.push('');
  lines.push('- O modulo `BILLING` nao possui namespace proprio de permissao no backend hoje.');
  lines.push('- Rotas de billing usam principalmente `planos.manage`, classificado em `ADMINISTRACAO`.');
  lines.push('- `dashboard.read` e `relatorios.read` foram mantidas em `ADMINISTRACAO` por serem transversais.');
  lines.push('');

  return lines.join('\n');
};

const main = () => {
  const permissionSource = readFile(PERMISSIONS_PATH);
  const planDefaultsSource = readFile(PLAN_DEFAULTS_PATH);

  const permissions = extractPermissions(permissionSource);
  const modules = extractDefaultModules(planDefaultsSource);
  const plans = extractDefaultPlans(planDefaultsSource);
  const modulePermissionMatrix = buildModulePermissionMatrix(modules, permissions);
  const planModuleTable = buildPlanModuleTable(plans, modules);
  const generatedAt = new Date().toISOString();

  const payload = {
    generatedAt,
    sources: {
      permissions: path.relative(ROOT, PERMISSIONS_PATH).replace(/\\/g, '/'),
      plans: path.relative(ROOT, PLAN_DEFAULTS_PATH).replace(/\\/g, '/'),
    },
    modules,
    plans,
    modulePermissionMatrix,
    planModuleTable,
  };

  fs.mkdirSync(path.dirname(JSON_OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(JSON_OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const markdown = buildMarkdown({
    generatedAt,
    modules,
    plans,
    modulePermissionMatrix,
    planModuleTable,
  });
  fs.writeFileSync(DOC_OUTPUT_PATH, `${markdown}\n`, 'utf8');

  console.log(`Matriz JSON gerada em ${path.relative(ROOT, JSON_OUTPUT_PATH)}`);
  console.log(`Matriz Markdown gerada em ${path.relative(ROOT, DOC_OUTPUT_PATH)}`);
};

main();
