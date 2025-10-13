const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  user: 'conectcrm',
  password: 'conectcrm123',
  database: 'conectcrm_db'
});

async function resetarUsuarioTeste() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Deletar usuário existente
    await client.query("DELETE FROM users WHERE email = 'teste@omnichannel.com'");
    console.log('🗑️  Usuário anterior deletado');

    // Criar novo usuário com senha correta
    const senha = await bcrypt.hash('teste123', 10);
    console.log('🔐 Senha hash gerada:', senha);

    const query = `
      INSERT INTO users (id, nome, email, senha, role, ativo, empresa_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, nome, email, role
    `;

    const values = [
      '99999999-9999-9999-9999-999999999999',
      'Usuario Teste Omnichannel',
      'teste@omnichannel.com',
      senha,
      'admin',
      true,
      'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    ];

    const result = await client.query(query, values);

    console.log('✅ Novo usuário criado com sucesso!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Nome:', result.rows[0].nome);
    console.log('   Email:', result.rows[0].email);
    console.log('   Role:', result.rows[0].role);
    console.log('   Senha: teste123');

    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

resetarUsuarioTeste();
