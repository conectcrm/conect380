const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: 'localhost',
  port: 5434,
  username: 'conectcrm',
  password: 'conectcrm123',
  database: 'conectcrm_db'
});

async function migrateDomains() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração de domínios Fênix → Conect CRM...');
    
    // 1. Atualizar empresa padrão
    const empresaResult = await client.query(`
      UPDATE empresas 
      SET 
        nome = 'Conect Tecnologia',
        slug = 'conect-tecnologia',
        email = 'contato@conectcrm.com.br',
        updated_at = NOW()
      WHERE cnpj = '12.345.678/0001-99' AND nome = 'Fênix Tecnologia'
      RETURNING *;
    `);
    
    console.log('📊 Empresa atualizada:', empresaResult.rowCount, 'linhas afetadas');
    
    // 2. Atualizar usuários
    const usuariosUpdates = [
      { old: 'admin@fenixcrm.com', new: 'admin@conectcrm.com' },
      { old: 'maria@fenixcrm.com', new: 'maria@conectcrm.com' },
      { old: 'joao@fenixcrm.com', new: 'joao@conectcrm.com' }
    ];
    
    for (const update of usuariosUpdates) {
      const result = await client.query(`
        UPDATE users 
        SET 
          email = $1,
          updated_at = NOW()
        WHERE email = $2
        RETURNING nome, email, role;
      `, [update.new, update.old]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Usuário atualizado: ${result.rows[0].nome} (${result.rows[0].email})`);
      }
    }
    
    // 3. Verificar resultados
    console.log('\n📋 VERIFICANDO DADOS ATUALIZADOS:');
    console.log('==========================================');
    
    const empresaFinal = await client.query(`
      SELECT nome, email, slug 
      FROM empresas 
      WHERE cnpj = '12.345.678/0001-99'
    `);
    
    if (empresaFinal.rows.length > 0) {
      const empresa = empresaFinal.rows[0];
      console.log(`🏢 Empresa: ${empresa.nome}`);
      console.log(`📧 Email: ${empresa.email}`);
      console.log(`🔗 Slug: ${empresa.slug}`);
    }
    
    const usuariosFinal = await client.query(`
      SELECT u.nome, u.email, u.role
      FROM users u
      JOIN empresas e ON u.empresa_id = e.id
      WHERE e.cnpj = '12.345.678/0001-99'
      ORDER BY u.role, u.nome
    `);
    
    console.log('\n👥 USUÁRIOS:');
    usuariosFinal.rows.forEach(user => {
      console.log(`👤 ${user.nome} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\n📋 CREDENCIAIS ATUALIZADAS:');
    console.log('==========================================');
    console.log('Email: admin@conectcrm.com     | Senha: admin123');
    console.log('Email: maria@conectcrm.com     | Senha: manager123');
    console.log('Email: joao@conectcrm.com      | Senha: vendedor123');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateDomains();
