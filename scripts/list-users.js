/**
 * Script para listar usuários do banco de dados
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'conectcrm_db',
  user: 'conectcrm',
  password: 'conectcrm123',
});

async function listarUsuarios() {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, role FROM users WHERE ativo = true LIMIT 5'
    );
    
    console.log('📋 Usuários disponíveis:\n');
    
    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado!');
      console.log('\n💡 Crie um usuário de teste:');
      console.log('   INSERT INTO users (nome, email, senha, role, ativo)');
      console.log('   VALUES (\'Admin\', \'admin@test.com\', \'$2b$10$hash\', \'admin\', true);');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome} (${user.email}) - ${user.role}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error.message);
    process.exit(1);
  }
}

listarUsuarios();
