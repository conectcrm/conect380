const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    database: 'conectcrm_db',
    user: 'conectcrm',
    password: 'conectcrm123'
  });

  await client.connect();

  // Buscar todas as tabelas
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);

  console.log('Tabelas no banco:');
  result.rows.forEach(row => console.log('  -', row.table_name));

  await client.end();
})();
