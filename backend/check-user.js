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

  const result = await client.query(`
    SELECT 
      u.id,
      u.nome,
      u.email,
      u.role,
      u.ativo,
      u.deve_trocar_senha,
      u.empresa_id,
      e.nome as empresa_nome
    FROM users u
    LEFT JOIN empresas e ON e.id = u.empresa_id
    WHERE u.email = 'admin@conectsuite.com.br'
  `);

  if (result.rows.length > 0) {
    console.log('Dados do usuário:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  } else {
    console.log('❌ Usuário não encontrado!');
  }

  await client.end();
})();
