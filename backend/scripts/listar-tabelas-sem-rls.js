// Script para listar tabelas com empresa_id mas SEM RLS ativo
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: process.env.DATABASE_NAME || 'conectcrm',
});

async function listarTabelasSemRls() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Buscando tabelas com empresa_id mas SEM RLS...\n');

    // Query: tabelas que TÊM empresa_id MAS rowsecurity = false
    const result = await client.query(`
      SELECT 
        t.tablename,
        c.column_name as empresa_id_column,
        t.rowsecurity
      FROM pg_tables t
      JOIN information_schema.columns c 
        ON c.table_name = t.tablename
      WHERE t.schemaname = 'public'
        AND c.column_name = 'empresa_id'
        AND t.rowsecurity = false
      ORDER BY t.tablename
    `);

    if (result.rows.length === 0) {
      console.log('✅ TODAS as tabelas com empresa_id têm RLS ativo!');
      return;
    }

    console.log(`❌ ${result.rows.length} tabelas SEM RLS:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tablename}`);
    });

    console.log('\n📋 Lista para migration:');
    const lista = result.rows.map(r => `'${r.tablename}'`).join(', ');
    console.log(`const tabelas = [${lista}];`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listarTabelasSemRls();
