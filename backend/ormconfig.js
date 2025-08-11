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
  // Ajustado caminho das migrations (compilam para dist/src/migrations)
  migrations: ['dist/src/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.APP_ENV === 'development',
  ssl: process.env.APP_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

module.exports = { AppDataSource };
