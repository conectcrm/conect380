// Script para atualizar senha de usuário existente
const { Pool } = require('pg');

async function updateUserPassword() {
  const pool = new Pool({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    console.log('🔐 Atualizando senha do usuário...');

    // Hash simples da senha '123456' (normalmente seria com bcrypt, mas vamos usar um hash conhecido)
    // Vou usar o hash que provavelmente já está sendo usado no sistema
    const knownHash = '$2b$10$B8Q8X2fIxMQjR4qJL5YCg.A3fJfEeQpZ1kDwEoEjK7GlL3mM2YEuO'; // hash de '123456'

    // Atualizar usuário admin@conectsuite.com.br
    const result = await pool.query(`
      UPDATE users 
      SET senha = $1, ativo = true
      WHERE email = $2
      RETURNING id, nome, email, ativo
    `, ['$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@conectsuite.com.br']); // Hash de 'password'

    if (result.rows.length > 0) {
      console.log('✅ Senha atualizada com sucesso:');
      const user = result.rows[0];
      console.log(`  📋 Nome: ${user.nome}`);
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  🔑 Nova senha: password`);
      console.log(`  ✅ Ativo: ${user.ativo}`);
    } else {
      console.log('❌ Usuário não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
updateUserPassword();
