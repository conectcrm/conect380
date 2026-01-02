const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function criarUsuarioAdmin() {
  const senha = 'admin123';
  const hash = await bcrypt.hash(senha, 10);

  console.log('🔐 Hash gerado para senha "admin123"');
  console.log('📊 Conectando ao banco de dados...');

  // Configuração do banco (pegar do .env ou usar padrões)
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5434,
    database: process.env.DATABASE_NAME || 'conectcrm_db',
    user: process.env.DATABASE_USERNAME || 'conectcrm',
    password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar/criar empresa
    console.log('📝 Verificando empresa...');
    let empresaResult = await client.query('SELECT id FROM empresas LIMIT 1');
    let empresaId;

    if (empresaResult.rows.length === 0) {
      console.log('📝 Criando empresa padrão...');
      const insertEmpresa = await client.query(`
        INSERT INTO empresas (nome, cnpj, email, ativo)
        VALUES ('ConectCRM', '00000000000000', 'contato@conectcrm.com.br', true)
        RETURNING id
      `);
      empresaId = insertEmpresa.rows[0].id;
      console.log('✅ Empresa criada:', empresaId);
    } else {
      empresaId = empresaResult.rows[0].id;
      console.log('✅ Empresa existente:', empresaId);
    }

    // Verificar se usuário já existe
    console.log('🔍 Verificando se usuário admin já existe...');
    const userCheck = await client.query("SELECT id FROM users WHERE email = 'admin@conectsuite.com.br'");

    if (userCheck.rows.length > 0) {
      // Atualizar senha do usuário existente
      console.log('📝 Usuário já existe, atualizando senha...');
      await client.query("UPDATE users SET senha = $1, ativo = true, role = 'superadmin' WHERE email = 'admin@conectsuite.com.br'", [hash]);
      console.log('✅ Senha do usuário admin atualizada!');
    } else {
      // Criar novo usuário
      console.log('👤 Criando novo usuário admin...');
      await client.query(`
        INSERT INTO users (
          id,
          nome,
          email,
          senha,
          role,
          empresa_id,
          ativo,
          deve_trocar_senha
        ) VALUES (
          gen_random_uuid(),
          'Administrador',
          'admin@conectsuite.com.br',
          $1,
          'superadmin',
          $2,
          true,
          false
        )
      `, [hash, empresaId]);
      console.log('✅ Usuário admin criado!');
    }

    console.log('');
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('');
    console.log('📧 Email: admin@conectsuite.com.br');
    console.log('🔑 Senha: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

criarUsuarioAdmin();
