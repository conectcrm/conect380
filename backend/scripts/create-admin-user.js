/**
 * Script para criar usuario superadmin em producao
 * Uso: node scripts/create-admin-user.js
 */

const bcrypt = require('bcryptjs');
const { DataSource } = require('typeorm');
const path = require('path');
const readline = require('readline');

const envPath = process.env.ENV_FILE || path.resolve(__dirname, '../.env.production');
require('dotenv').config({ path: envPath });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function normalizeBooleanAnswer(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ['s', 'sim', 'y', 'yes', '1', 'true'].includes(normalized);
}

const config = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number.parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function listEmpresas(dataSource) {
  const empresas = await dataSource.query(
    `
      SELECT id, nome, email, ativo, status
      FROM empresas
      ORDER BY created_at DESC
      LIMIT 10
    `,
  );

  if (!empresas.length) {
    console.log('\nNenhuma empresa encontrada em "empresas".');
    return;
  }

  console.log('\nEmpresas recentes (use o UUID no prompt abaixo):');
  for (const empresa of empresas) {
    const status = String(empresa.status || '').trim() || '-';
    const ativo = empresa.ativo ? 'ativa' : 'inativa';
    console.log(`- ${empresa.id} | ${empresa.nome} | ${empresa.email} | ${ativo} | status=${status}`);
  }
}

async function resolveEmpresa(dataSource, empresaId) {
  const rows = await dataSource.query(
    `
      SELECT id, nome, email, ativo, status
      FROM empresas
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [empresaId],
  );

  return rows[0] || null;
}

async function markTenantAsOwner(dataSource, empresaId) {
  await dataSource.query(
    `
      UPDATE empresas
      SET
        ativo = true,
        status = 'ativa',
        trial_end_date = NULL,
        data_expiracao = NULL,
        configuracoes = (
          jsonb_strip_nulls(
            COALESCE(configuracoes::jsonb, '{}'::jsonb)
            || jsonb_build_object(
              'isPlatformOwner', true,
              'billingExempt', true,
              'billingMonitorOnly', true,
              'fullModuleAccess', true,
              'allowCheckout', false,
              'allowPlanMutation', false,
              'enforceLifecycleTransitions', false,
              'billing', jsonb_build_object(
                'isPlatformOwner', true,
                'exempt', true,
                'monitorOnly', true,
                'fullModuleAccess', true,
                'allowCheckout', false,
                'allowPlanMutation', false,
                'enforceLifecycleTransitions', false
              )
            )
          )
        )::json
      WHERE id = $1::uuid
    `,
    [empresaId],
  );
}

async function createAdmin() {
  console.log('\nCriacao de usuario superadmin em PRODUCAO\n');
  console.log(`Arquivo de ambiente: ${envPath}\n`);

  const appDataSource = new DataSource(config);

  try {
    console.log('Conectando ao banco...');
    await appDataSource.initialize();
    console.log('Conectado.\n');

    await listEmpresas(appDataSource);

    const empresaId = (await question('\nUUID da empresa para vincular ao superadmin: ')).trim();
    if (!empresaId) {
      throw new Error('empresa_id e obrigatorio.');
    }

    const empresa = await resolveEmpresa(appDataSource, empresaId);
    if (!empresa) {
      throw new Error(`Empresa ${empresaId} nao encontrada.`);
    }

    console.log(`Empresa selecionada: ${empresa.nome} (${empresa.id})`);

    const nome = (await question('Nome do superadmin: ')).trim() || 'Admin Sistema';
    const email =
      (await question('Email do superadmin: ')).trim().toLowerCase() ||
      'admin@conectsuite.com.br';
    let senha = await question('Senha (min. 8 caracteres): ');

    if (!senha || senha.length < 8) {
      console.log('\nSenha muito curta. Usando senha padrao: Admin@123');
      console.log('Troque essa senha no primeiro login.\n');
      senha = 'Admin@123';
    }

    const marcarComoOwner = normalizeBooleanAnswer(
      await question('Marcar esta empresa como tenant proprietario (owner)? [s/N]: '),
    );

    rl.close();

    console.log('\nGerando hash da senha...');
    const senhaHash = await bcrypt.hash(senha, 10);

    console.log('Criando/atualizando superadmin...');
    await appDataSource.query(
      `
        INSERT INTO users (
          id,
          nome,
          email,
          senha,
          role,
          empresa_id,
          ativo,
          deve_trocar_senha,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'superadmin',
          $4::uuid,
          true,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          nome = EXCLUDED.nome,
          senha = EXCLUDED.senha,
          role = 'superadmin',
          empresa_id = EXCLUDED.empresa_id,
          ativo = true,
          deve_trocar_senha = true,
          updated_at = NOW()
      `,
      [nome, email, senhaHash, empresa.id],
    );

    if (marcarComoOwner) {
      console.log('Aplicando politica de tenant proprietario...');
      await markTenantAsOwner(appDataSource, empresa.id);
    }

    console.log('\nSuperadmin configurado com sucesso.\n');
    console.log('Resumo:');
    console.log(`- Email: ${email}`);
    console.log(`- Empresa: ${empresa.nome} (${empresa.id})`);
    console.log('- Role: superadmin');
    console.log(`- Owner tenant: ${marcarComoOwner ? 'sim' : 'nao'}`);
    console.log(
      `- Senha: ${senha === 'Admin@123' ? 'Admin@123 (padrao, trocar imediatamente)' : 'definida no prompt'}`,
    );
    console.log('\nImportante: em producao, superadmin exige MFA quando AUTH_ADMIN_MFA_REQUIRED=true.\n');

    await appDataSource.destroy();
    process.exit(0);
  } catch (error) {
    rl.close();
    console.error('\nErro ao criar usuario:\n');
    console.error(`  ${error.message}\n`);

    if (String(error.message || '').includes('relation "users" does not exist')) {
      console.log('A tabela "users" nao existe.');
      console.log('Execute migrations antes: npm run migration:run\n');
    }

    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
    process.exit(1);
  }
}

createAdmin().catch((error) => {
  rl.close();
  console.error(error);
  process.exit(1);
});

