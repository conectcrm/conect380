const { Client } = require('pg');

const client = new Client({ 
  host: 'localhost', 
  port: 5434, 
  user: 'conectcrm',
  password: 'conectcrm123',
  database: 'conectcrm_db'
});

async function reativarFaturas() {
  try {
    await client.connect();
    const result = await client.query('UPDATE faturas SET ativo = true WHERE ativo = false');
    console.log(`✅ ${result.rowCount} faturas reativadas`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

reativarFaturas();
