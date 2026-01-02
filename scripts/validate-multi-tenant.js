/**
 * 🔍 VALIDAÇÃO MULTI-TENANT
 * 
 * Script que valida se todas as entities e migrations seguem padrão multi-tenant:
 * - Entities com empresaId (exceto globais)
 * - Migrations habilitam RLS
 * - Policies criadas
 * - Índices criados
 * 
 * Uso: node scripts/validate-multi-tenant.js
 * 
 * Exit codes:
 * - 0: Tudo OK
 * - 1: Erros encontrados (bloqueia CI/CD)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 VALIDAÇÃO MULTI-TENANT\n');
console.log('═══════════════════════════════════════════════\n');

let totalErrors = 0;
let totalWarnings = 0;

// ============================================
// CONFIGURAÇÕES
// ============================================

const BACKEND_PATH = path.join(__dirname, '..', 'backend');
const ENTITIES_PATH = path.join(BACKEND_PATH, 'src', 'modules');
const MIGRATIONS_PATH = path.join(BACKEND_PATH, 'src', 'migrations');

// Entities globais (não precisam de empresa_id nem RLS)
const GLOBAL_ENTITIES = [
  'empresas',
  'planos',
  'modulos_sistema',
  'password_reset_tokens',
];

// ============================================
// UTILITÁRIOS
// ============================================

function getAllFiles(dirPath, arrayOfFiles, extension) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, extension);
    } else {
      if (file.endsWith(extension)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function isGlobalEntity(filePath) {
  const fileName = path.basename(filePath, '.entity.ts');
  return GLOBAL_ENTITIES.some(global => fileName.includes(global));
}

// ============================================
// VALIDAÇÃO 1: ENTITIES
// ============================================

console.log('1️⃣  VALIDANDO ENTITIES...\n');

const entityFiles = getAllFiles(ENTITIES_PATH, [], '.entity.ts');
let entitiesChecked = 0;
let entitiesOK = 0;
let entitiesWithErrors = 0;

entityFiles.forEach((file) => {
  const relativePath = path.relative(BACKEND_PATH, file);
  const content = fs.readFileSync(file, 'utf-8');

  // Verificar se é entity TypeORM
  if (!content.includes('@Entity(')) {
    return; // Não é entity
  }

  entitiesChecked++;

  // Skip entities globais
  if (isGlobalEntity(file)) {
    console.log(`   ⚪ ${relativePath} (global, skip)`);
    entitiesOK++;
    return;
  }

  // Verificar empresa_id OU empresaId
  const hasEmpresaId = content.includes('empresaId') || content.includes('empresa_id');
  const hasEmpresaRelation = content.includes('@ManyToOne(() => Empresa)');

  if (!hasEmpresaId) {
    console.log(`   ❌ ${relativePath}`);
    console.log(`      → FALTA empresaId ou empresa_id!`);
    totalErrors++;
    entitiesWithErrors++;
  } else if (!hasEmpresaRelation) {
    console.log(`   ⚠️  ${relativePath}`);
    console.log(`      → TEM empresaId mas FALTA @ManyToOne(() => Empresa)`);
    totalWarnings++;
    entitiesWithErrors++;
  } else {
    console.log(`   ✅ ${relativePath}`);
    entitiesOK++;
  }
});

console.log(`\n   Resumo: ${entitiesOK}/${entitiesChecked} OK`);
if (entitiesWithErrors > 0) {
  console.log(`   ⚠️  ${entitiesWithErrors} entities com problemas!\n`);
} else {
  console.log(`   ✅ Todas as entities estão corretas!\n`);
}

// ============================================
// VALIDAÇÃO 2: MIGRATIONS
// ============================================

console.log('2️⃣  VALIDANDO MIGRATIONS...\n');

if (!fs.existsSync(MIGRATIONS_PATH)) {
  console.log('   ⚠️  Pasta de migrations não encontrada\n');
  totalWarnings++;
} else {
  const migrationFiles = getAllFiles(MIGRATIONS_PATH, [], '.ts');
  let migrationsChecked = 0;
  let migrationsOK = 0;
  let migrationsWithErrors = 0;

  migrationFiles.forEach((file) => {
    const relativePath = path.relative(BACKEND_PATH, file);
    const content = fs.readFileSync(file, 'utf-8');

    // Verificar se migration cria tabela com empresa_id
    const createTableMatch = content.match(/CREATE TABLE (\w+)/);
    if (!createTableMatch) {
      return; // Não cria tabela
    }

    const tableName = createTableMatch[1];

    // Skip tabelas globais
    if (GLOBAL_ENTITIES.some(global => tableName.includes(global))) {
      console.log(`   ⚪ ${relativePath} (${tableName}, global, skip)`);
      return;
    }

    migrationsChecked++;

    // Verificar se tem empresa_id na criação
    const hasEmpresaIdColumn = content.includes('empresa_id') || content.includes('empresaId');

    if (!hasEmpresaIdColumn) {
      console.log(`   ⚪ ${relativePath} (${tableName}, sem empresa_id)`);
      return; // Pode ser tabela auxiliar
    }

    // Verificar se habilita RLS
    const hasEnableRLS = content.includes('ENABLE ROW LEVEL SECURITY');
    const hasPolicy = content.includes('CREATE POLICY') && content.includes('tenant_isolation');
    const hasIndex = content.includes('CREATE INDEX') && content.includes('empresa_id');

    const errors = [];
    if (!hasEnableRLS) errors.push('FALTA ENABLE ROW LEVEL SECURITY');
    if (!hasPolicy) errors.push('FALTA CREATE POLICY tenant_isolation_*');
    if (!hasIndex) errors.push('FALTA CREATE INDEX em empresa_id');

    if (errors.length > 0) {
      console.log(`   ❌ ${relativePath} (${tableName})`);
      errors.forEach(err => console.log(`      → ${err}`));
      totalErrors += errors.length;
      migrationsWithErrors++;
    } else {
      console.log(`   ✅ ${relativePath} (${tableName})`);
      migrationsOK++;
    }
  });

  console.log(`\n   Resumo: ${migrationsOK}/${migrationsChecked} OK`);
  if (migrationsWithErrors > 0) {
    console.log(`   ⚠️  ${migrationsWithErrors} migrations com problemas!\n`);
  } else {
    console.log(`   ✅ Todas as migrations estão corretas!\n`);
  }
}

// ============================================
// VALIDAÇÃO 3: DATABASE (se PostgreSQL rodando)
// ============================================

console.log('3️⃣  VALIDANDO DATABASE (RLS ATIVO)...\n');

try {
  // Tentar conectar no PostgreSQL (assumindo credenciais padrão do .env)
  const result = execSync(
    `psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false AND tablename NOT IN ('empresas', 'planos', 'modulos_sistema');"`,
    { encoding: 'utf-8', env: { ...process.env, PGPASSWORD: 'conectcrm123' } }
  );

  const vulnerableTables = parseInt(result.trim());

  if (vulnerableTables > 0) {
    console.log(`   ❌ ${vulnerableTables} tabelas SEM RLS ativo no database!`);
    console.log(`      Execute: psql e rode query de verificação\n`);
    totalErrors++;
  } else {
    console.log(`   ✅ Todas as tabelas do database têm RLS ativo!\n`);
  }
} catch (err) {
  console.log(`   ⚠️  Não foi possível conectar ao database (pode estar offline)`);
  console.log(`      Skipping validação de database\n`);
  totalWarnings++;
}

// ============================================
// RELATÓRIO FINAL
// ============================================

console.log('═══════════════════════════════════════════════\n');
console.log('📊 RELATÓRIO FINAL\n');
console.log(`   Erros críticos: ${totalErrors}`);
console.log(`   Avisos: ${totalWarnings}`);

if (totalErrors > 0) {
  console.log('\n❌ VALIDAÇÃO FALHOU!\n');
  console.log('   Corrija os erros acima antes de fazer commit.\n');
  console.log('   Consulte:');
  console.log('   - backend/templates/_TemplateEntity.ts');
  console.log('   - backend/templates/_TemplateMigration.ts');
  console.log('   - docs/ARQUITETURA.md');
  console.log('');
  process.exit(1); // Bloqueia CI/CD
} else if (totalWarnings > 0) {
  console.log('\n⚠️  VALIDAÇÃO PASSOU COM AVISOS\n');
  console.log('   Revise os avisos acima (não bloqueiam commit).\n');
  process.exit(0); // Permite commit mas mostra avisos
} else {
  console.log('\n✅ VALIDAÇÃO PASSOU!\n');
  console.log('   Todas as validações multi-tenant estão OK.\n');
  process.exit(0); // Tudo OK
}
