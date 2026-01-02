import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixInteracoes() {
  // Criar DataSource SEM synchronize
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'conectcrm',
    entities: [],
    synchronize: false, // ⚠️ IMPORTANTE: NÃO sincronizar
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco (SEM synchronize)');

    const query = `
      UPDATE interacoes 
      SET tipo = 'outro'
      WHERE tipo IS NULL
    `;

    const result = await dataSource.query(query);
    console.log(`✅ Correção aplicada!`);
    console.log(`   Comando: ${result[0]}`);

    // Verificar
    const check = await dataSource.query(
      'SELECT COUNT(*) as total FROM interacoes WHERE tipo IS NULL'
    );
    console.log(`📊 Registros NULL restantes: ${check[0].total}`);

    await dataSource.destroy();
    console.log('✅ Concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    try {
      await dataSource.destroy();
    } catch { }
    process.exit(1);
  }
}

fixInteracoes();
