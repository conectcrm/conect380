const { Client } = require('pg');

async function checkUserStatus() {
  console.log('🔍 Verificando status do usuário admin@conectcrm.com...\n');

  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Verificar dados completos do usuário
    const query = `
      SELECT id, nome, email, ativo, role, empresa_id, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;

    const result = await client.query(query, ['admin@conectcrm.com']);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const user = result.rows[0];
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ativo: ${user.ativo ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Empresa ID: ${user.empresa_id}`);
    console.log(`   Criado em: ${user.created_at}`);
    console.log(`   Atualizado em: ${user.updated_at}`);

    if (!user.ativo) {
      console.log('\n🚨 PROBLEMA ENCONTRADO: Usuário está INATIVO!');
      console.log('   Esta é a causa do erro 401.');

      // Ativar o usuário
      console.log('\n🔧 Ativando o usuário...');
      const updateQuery = 'UPDATE users SET ativo = true WHERE email = $1';
      await client.query(updateQuery, ['admin@conectcrm.com']);
      console.log('✅ Usuário ativado com sucesso!');
    } else {
      console.log('\n✅ Usuário está ATIVO');
      console.log('❓ Outras possíveis causas do erro 401:');
      console.log('   - Request body malformado');
      console.log('   - Headers incorretos');
      console.log('   - Problema no passport local strategy');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkUserStatus().catch(console.error);
