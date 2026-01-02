/**
 * Script para criar usuário admin em produção
 * Uso: node scripts/create-admin-user.js
 */

const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');
const path = require('path');
const readline = require('readline');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.production') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const config = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function createAdmin() {
  console.log('\n🔐 Criação de Usuário Admin em PRODUÇÃO\n');
  console.log('═════════════════════════════════════════\n');

  // Coletar dados do admin
  const nome = await question('Nome do Admin: ') || 'Admin Sistema';
  const email = await question('Email do Admin: ') || 'admin@conectsuite.com.br';
  let senha = await question('Senha (mín. 8 caracteres): ');

  // Validar senha
  if (!senha || senha.length < 8) {
    console.log('\n⚠️  Senha muito curta! Usando senha padrão: Admin@123');
    console.log('⚠️  LEMBRE-SE DE TROCAR NO PRIMEIRO LOGIN!\n');
    senha = 'Admin@123';
  }

  rl.close();

  console.log('\n🔄 Conectando ao banco...');

  const AppDataSource = new DataSource(config);

  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado!\n');

    console.log('🔒 Gerando hash da senha...');
    const senhaHash = await bcrypt.hash(senha, 10);

    console.log('💾 Criando usuário...');

    await AppDataSource.query(`
      INSERT INTO users (id, nome, email, senha, role, ativo, deve_trocar_senha, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        'superadmin',
        true,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        senha = EXCLUDED.senha,
        role = 'superadmin',
        deve_trocar_senha = true,
        updated_at = NOW()
    `, [nome, email, senhaHash]);

    console.log('\n✅ Usuário admin criado com sucesso!\n');
    console.log('═════════════════════════════════════════');
    console.log('📋 Credenciais de Acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${senha === 'Admin@123' ? senha + ' (PADRÃO - TROCAR!)' : '****** (fornecida)'}`);
    console.log('═════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   • Guarde estas credenciais em local seguro');
    console.log('   • Troque a senha no primeiro login');
    console.log('   • Use senhas fortes em produção\n');

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:\n');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('relation "users" does not exist')) {
      console.log('💡 A tabela "users" não existe.');
      console.log('   Execute as migrations primeiro: npm run migration:run\n');
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

createAdmin().catch(console.error);
