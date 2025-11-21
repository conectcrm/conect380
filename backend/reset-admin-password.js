const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5434,
    database: process.env.DATABASE_NAME || 'conectcrm_db',
    user: process.env.DATABASE_USERNAME || 'conectcrm',
    password: process.env.DATABASE_PASSWORD || 'conectcrm123'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const email = 'admin@conectcrm.com';
    const novaSenha = 'admin123';

    // Verificar se usuário existe
    const checkUser = await client.query(
      'SELECT id, nome, email, ativo FROM users WHERE email = $1',
      [email]
    );

    if (checkUser.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = checkUser.rows[0];
    console.log('👤 Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ativo: ${user.ativo}\n`);

    // Gerar novo hash
    console.log(`🔐 Gerando hash para a senha: "${novaSenha}"...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaSenha, salt);
    console.log(`   Hash gerado: ${hashedPassword.substring(0, 20)}...\n`);

    // Atualizar senha
    await client.query(
      'UPDATE users SET senha = $1, updated_at = NOW() WHERE email = $2',
      [hashedPassword, email]
    );

    console.log('✅ Senha atualizada com sucesso!\n');

    // Verificar se o hash está correto
    console.log('🧪 Testando validação da nova senha...');
    const testResult = await bcrypt.compare(novaSenha, hashedPassword);
    console.log(`   Senha válida: ${testResult ? '✅ SIM' : '❌ NÃO'}\n`);

    console.log('========================================');
    console.log('🎉 SENHA RESETADA COM SUCESSO!');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${novaSenha}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
