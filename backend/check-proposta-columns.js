const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'conectcrm_db',
  user: 'conectcrm',
  password: 'conectcrm123'
});

async function checkColumns() {
  try {
    await client.connect();

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'propostas'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Colunas da tabela propostas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, ${row.is_nullable})`);
    });

    const hasOportunidadeId = result.rows.some(r => r.column_name === 'oportunidade_id');
    console.log(`\n${hasOportunidadeId ? '✅' : '❌'} Campo oportunidade_id ${hasOportunidadeId ? 'EXISTE' : 'NÃO EXISTE'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
