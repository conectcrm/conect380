const { DataSource } = require('typeorm');
const { config } = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
config({ path: path.resolve(__dirname, '.env') });

// Permitir rodar TypeORM CLI direto em TS (útil em dev quando o dist não está atualizado)
const useTsMigrations = String(process.env.TYPEORM_USE_TS || '').toLowerCase() === 'true';
if (useTsMigrations) {
  // eslint-disable-next-line global-require
  require('ts-node/register/transpile-only');
  // eslint-disable-next-line global-require
  require('tsconfig-paths/register');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'conectcrm',
  entities: useTsMigrations ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'],
  // Ajustado caminho das migrations (compilam para dist/migrations)
  migrations: useTsMigrations ? ['src/migrations/*.ts'] : ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: false, // Desabilitar logs verbosos em produção
  ssl: process.env.APP_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

module.exports = { AppDataSource };
