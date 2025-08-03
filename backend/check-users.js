// Script para verificar usuários no banco
const { Pool } = require('pg');

async function checkUsers() {
  const pool = new Pool({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    console.log('🔍 Verificando usuários existentes...');

    const users = await pool.query(`
      SELECT id, nome, email, empresa_id, ativo 
      FROM users 
      ORDER BY nome
    `);

    console.log('👥 Usuários encontrados:');
    users.rows.forEach(user => {
      console.log(`  📋 ${user.nome} - ${user.email} (${user.ativo ? 'Ativo' : 'Inativo'})`);
      console.log(`     🏢 Empresa ID: ${user.empresa_id}`);
    });

    console.log(`\n✅ Total: ${users.rows.length} usuários`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
checkUsers();
