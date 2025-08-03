// Script para criar usuário de teste
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createTestUser() {
  const pool = new Pool({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    console.log('🔐 Criando usuário de teste...');

    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Criar usuário de teste
    const result = await pool.query(`
      INSERT INTO users (
        nome, 
        email, 
        senha, 
        empresa_id, 
        role, 
        ativo
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        senha = EXCLUDED.senha,
        ativo = EXCLUDED.ativo
      RETURNING id, nome, email
    `, [
      'Teste Billing',
      'teste@billing.com',
      hashedPassword,
      'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Empresa Conect CRM Demo
      'admin',
      true
    ]);

    console.log('✅ Usuário de teste criado/atualizado:');
    const user = result.rows[0];
    console.log(`  📋 Nome: ${user.nome}`);
    console.log(`  📧 Email: ${user.email}`);
    console.log(`  🔑 Senha: 123456`);
    console.log(`  🏢 Empresa: Conect CRM Demo`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
createTestUser();
