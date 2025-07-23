// Script para testar diretamente o banco via TypeORM
const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');

async function testDirectDB() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5434,
    username: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco');

    // Buscar usuário diretamente
    const query = `SELECT id, nome, email, senha, ativo, empresa_id FROM users WHERE email = $1`;
    const result = await dataSource.query(query, ['admin@conectcrm.com']);
    
    if (result.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = result[0];
    console.log('👤 Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Nome:', user.nome);
    console.log('   Email:', user.email);
    console.log('   Ativo:', user.ativo);
    console.log('   Empresa ID:', user.empresa_id);
    console.log('   Senha hash length:', user.senha.length);

    // Testar senha
    const passwordMatch = await bcrypt.compare('password123', user.senha);
    console.log('🔐 Senha confere:', passwordMatch);

    // Verificar se empresa existe
    const empresaQuery = `SELECT id, nome FROM empresas WHERE id = $1`;
    const empresaResult = await dataSource.query(empresaQuery, [user.empresa_id]);
    console.log('🏢 Empresa encontrada:', empresaResult.length > 0 ? empresaResult[0].nome : 'NÃO');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

testDirectDB();
