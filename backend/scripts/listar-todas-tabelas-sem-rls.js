// Script para listar TODAS as tabelas SEM RLS (incluindo sem empresa_id)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: process.env.DATABASE_NAME || 'conectcrm',
});

async function listarTodasTabelasSemRls() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Listando TODAS as tabelas SEM RLS no database...\n');

    // 1. Tabelas SEM RLS ativo
    const semRls = await client.query(`
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = false
        AND tablename NOT IN ('migrations')
      ORDER BY tablename
    `);

    console.log(`❌ ${semRls.rows.length} tabelas SEM RLS ativo:\n`);
    
    for (const row of semRls.rows) {
      // Verificar se tem empresa_id
      const hasEmpresaId = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
          AND column_name = 'empresa_id'
      `, [row.tablename]);

      const marker = hasEmpresaId.rows.length > 0 ? '⚠️ TEM empresa_id' : '⚪ SEM empresa_id';
      console.log(`${marker} - ${row.tablename}`);
    }

    console.log('\n📊 Análise:');
    console.log(`- Total SEM RLS: ${semRls.rows.length}`);
    
    // Contar quantas têm empresa_id
    let comEmpresaId = 0;
    for (const row of semRls.rows) {
      const check = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'empresa_id'
      `, [row.tablename]);
      if (check.rows.length > 0) comEmpresaId++;
    }
    
    console.log(`- Com empresa_id: ${comEmpresaId} ⚠️ (precisam RLS urgente!)`);
    console.log(`- Sem empresa_id: ${semRls.rows.length - comEmpresaId} ⚪ (podem ser globais)`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listarTodasTabelasSemRls();
