const { DataSource } = require('typeorm');
const { config } = require('dotenv');

// Carregar variáveis de ambiente
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'conectcrm',
  entities: ['dist/**/*.entity.js'],
  // Ajustado caminho das migrations (compilam para dist/src/migrations)
  migrations: ['dist/src/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: true, // ⚠️ TEMPORÁRIO - criar schema automaticamente
  logging: false, // Desabilitar logs verbosos em produção
  ssl: process.env.APP_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

module.exports = { AppDataSource };
