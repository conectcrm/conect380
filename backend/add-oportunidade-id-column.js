const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'conectcrm_db',
  user: 'conectcrm',
  password: 'conectcrm123'
});

async function addColumn() {
  try {
    await client.connect();

    console.log('🔧 Adicionando coluna oportunidade_id na tabela propostas...');

    await client.query(`
      ALTER TABLE propostas 
      ADD COLUMN IF NOT EXISTS oportunidade_id integer;
    `);

    console.log('✅ Coluna oportunidade_id adicionada com sucesso!');

    // Verificar
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'propostas' AND column_name = 'oportunidade_id';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verificado: coluna existe no banco');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

addColumn();
