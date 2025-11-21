const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    database: 'conectcrm_db',
    user: 'conectcrm',
    password: 'conectcrm123'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'empresas' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Colunas da tabela empresas:\n');
    res.rows.forEach(col => {
      const required = col.is_nullable === 'NO' && !col.column_default ? ' ⚠️ OBRIGATÓRIO' : '';
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)}${required}${defaultVal}`);
    });

    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
})();
