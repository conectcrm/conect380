const { DataSource } = require('typeorm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5434'),
  username: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: process.env.DATABASE_NAME || 'conectcrm_db',
  entities: ['dist/**/*.entity.js'],
  // Migrations compilam para dist/migrations (não dist/src/migrations)
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: true, // ⚠️ TEMPORARIAMENTE habilitado para criar tabelas base
  logging: true, // Temporariamente ativado para debug
  // SSL apenas se DATABASE_SSL=true (para RDS)
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
});

module.exports = { AppDataSource };
