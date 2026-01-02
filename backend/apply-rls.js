const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function applyRLS() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'conectcrm',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: String(process.env.DATABASE_PASSWORD || ''),
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const sql = fs.readFileSync(
      path.join(__dirname, 'apply-rls-complementar.sql'),
      'utf8'
    );

    // Executar o SQL completo
    await client.query(sql);

    console.log('\n🎉 RLS COMPLEMENTAR APLICADO COM SUCESSO!');
    console.log('📊 17 tabelas agora protegidas por RLS');
    console.log('🔒 Total acumulado: 32 tabelas (15 Sprint 1 + 17 complementar)');

  } catch (error) {
    console.error('❌ Erro ao aplicar RLS:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyRLS();
