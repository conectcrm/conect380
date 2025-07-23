import { DataSource } from 'typeorm';

// Teste de conexão simples
const testConnection = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5434,
    username: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexão com PostgreSQL Docker bem-sucedida!');
    
    const result = await dataSource.query('SELECT version()');
    console.log('📊 Versão PostgreSQL:', result[0].version.split(' ')[0]);
    
    await dataSource.destroy();
    console.log('✅ Teste de conexão concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  }
};

testConnection();
