const axios = require('axios');

// Configuração base
const API_BASE = 'http://localhost:3001';

// Vamos primeiro verificar se a API está respondendo
async function testarConexaoAPI() {
  try {
    console.log('🔍 Verificando se a API está rodando...');
    
    // Testar um endpoint público para ver se o servidor está ativo
    const response = await axios.get(`${API_BASE}/api-docs`);
    console.log('✅ API está respondendo');
    
    // Agora vamos tentar acessar o endpoint de eventos sem autenticação para ver o erro
    console.log('📅 Testando endpoint de eventos...');
    
    try {
      await axios.get(`${API_BASE}/eventos`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint de eventos existe (retornou 401 - precisa autenticação)');
        console.log('🔐 Endpoint protegido conforme esperado');
        return true;
      } else {
        console.log('❌ Erro inesperado:', error.response?.status, error.response?.data);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  }
}

// Agora vamos testar se conseguimos criar dados direto no banco via SQL
async function verificarBancoDeDados() {
  console.log('\n📊 Vamos verificar se a tabela eventos foi criada...');
  
  // Podemos usar o TypeORM para fazer uma query simples
  try {
    const { createConnection } = require('typeorm');
    
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'conectcrm_user',
      password: 'conectcrm_password',
      database: 'conectcrm_db',
      synchronize: false,
      logging: true
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se a tabela eventos existe
    const result = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'evento'
    `);
    
    if (result.length > 0) {
      console.log('✅ Tabela "evento" encontrada no banco');
      
      // Verificar estrutura da tabela
      const columns = await connection.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'evento'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Colunas da tabela evento:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
      });
      
      // Contar registros existentes
      const count = await connection.query('SELECT COUNT(*) as total FROM evento');
      console.log(`📊 Total de eventos no banco: ${count[0].total}`);
      
    } else {
      console.log('❌ Tabela "evento" não encontrada');
    }
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error.message);
  }
}

// Executar testes
async function executarTestes() {
  console.log('🚀 Iniciando testes de integração...\n');
  
  const apiOk = await testarConexaoAPI();
  
  if (apiOk) {
    await verificarBancoDeDados();
  }
  
  console.log('\n✅ Testes concluídos!');
}

executarTestes();
