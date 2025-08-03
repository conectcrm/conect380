const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function debugLogin() {
  console.log('=== DEBUG LOGIN COMPLETO ===\n');

  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    await client.connect();
    console.log('🔍 Verificando usuário admin@conectcrm.com...');

    const result = await client.query('SELECT * FROM users WHERE email = $1', ['admin@conectcrm.com']);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = result.rows[0];
    console.log('👤 Usuário encontrado:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Nome: ${user.nome}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Ativo: ${user.ativo}`);
    console.log(`- Hash da senha: ${user.senha.substring(0, 30)}...`);

    // Testar a senha
    console.log('\n🔐 Testando senha "password"...');
    const isValid = await bcrypt.compare('password', user.senha);
    console.log(`✅ Senha válida: ${isValid}`);

    if (!isValid) {
      console.log('\n🔧 Atualizando senha para "password"...');
      const hashedPassword = await bcrypt.hash('password', 10);
      await client.query('UPDATE users SET senha = $1 WHERE email = $2', [hashedPassword, 'admin@conectcrm.com']);
      console.log('✅ Senha atualizada!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

debugLogin();
