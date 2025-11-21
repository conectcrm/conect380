const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  await client.connect();
  try {
    const res = await client.query("SELECT id, empresa_id, email FROM users WHERE email = 'admin@conectcrm.com'");
    console.log(res.rows[0]);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Query error:', err);
});
