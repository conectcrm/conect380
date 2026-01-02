const { Client } = require('pg');
require('dotenv').config({ path: 'C:\\Projetos\\conectcrm\\backend\\.env' });

async function checkColumns() {
  const c = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USERNAME,
    password: String(process.env.DATABASE_PASSWORD)
  });

  await c.connect();

  const tables = ['niveis_atendimento', 'tipos_servico', 'status_customizados', 'metas', 'assinaturas_empresas'];

  for (const t of tables) {
    const r = await c.query(SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \ AND column_name LIKE '%empresa%', [t]);
    console.log(\n\:);
    r.rows.forEach(row => console.log(  - \ (\)));
  }

  await c.end();
}

checkColumns();
