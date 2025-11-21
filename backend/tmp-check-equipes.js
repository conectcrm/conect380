const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    await client.connect();
    const exists = await client.query("SELECT to_regclass('public.equipes') AS table_name");
    console.log('Tabela equipes existe?:', exists.rows[0].table_name !== null);
    if (exists.rows[0].table_name) {
      const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='equipes'");
      console.log('Colunas:', columns.rows.map((r) => r.column_name));
      const sample = await client.query('SELECT id, nome, empresa_id, ativo FROM equipes LIMIT 5');
      console.log('Amostra de registros:', sample.rows);
    }
  } catch (error) {
    console.error('Erro na verificação da tabela equipes:', error.message);
  } finally {
    await client.end();
  }
}

main();
