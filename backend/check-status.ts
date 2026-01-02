import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkStatus() {
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

    // Verificar status únicos
    const status = await dataSource.query(`
      SELECT DISTINCT status, COUNT(*) as total
      FROM atendimento_tickets
      GROUP BY status
      ORDER BY status
    `);

    console.log('\nStatus encontrados em atendimento_tickets:');
    status.forEach((s: any) => console.log(` - ${s.status}: ${s.total} tickets`));

    // Verificar se enum ainda existe
    const enumCheck = await dataSource.query(`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'atendimento_tickets_status_enum'
      ORDER BY enumlabel
    `);

    console.log('\nValores do enum atendimento_tickets_status_enum:');
    enumCheck.forEach((e: any) => console.log(` - ${e.enumlabel}`));

    await dataSource.destroy();
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

checkStatus();
