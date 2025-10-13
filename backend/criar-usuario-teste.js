const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  user: 'conectcrm',
  password: 'conectcrm123',
  database: 'conectcrm_db'
});

async function criarUsuarioTeste() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    const senha = await bcrypt.hash('teste123', 10);

    const query = `
      INSERT INTO users (id, nome, email, senha, role, ativo, empresa_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET senha = $4, updated_at = NOW()
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

    console.log('✅ Usuário criado/atualizado com sucesso!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Nome:', result.rows[0].nome);
    console.log('   Email:', result.rows[0].email);
    console.log('   Role:', result.rows[0].role);

    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

criarUsuarioTeste();
