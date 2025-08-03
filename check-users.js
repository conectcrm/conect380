const { Client } = require('pg');

async function checkUserCredentials() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    await client.connect();
    console.log('🔍 Verificando usuários no banco...');

    const result = await client.query('SELECT id, nome, email, senha FROM users LIMIT 5');

    console.log('👥 Usuários encontrados:');
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Nome: ${user.nome}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Senha (hash): ${user.senha.substring(0, 20)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkUserCredentials();
