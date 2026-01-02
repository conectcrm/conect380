import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function listColumns() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'conectcrm',
    entities: [],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado');

    const cols = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interacoes' 
      ORDER BY ordinal_position
    `);

    console.log('Colunas da tabela interacoes:');
    cols.forEach((c: any) => console.log(' -', c.column_name, ':', c.data_type));

    await dataSource.destroy();
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

listColumns();
