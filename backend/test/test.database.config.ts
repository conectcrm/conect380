import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * 🧪 Configuração de Banco de Dados para Testes E2E
 *
 * Usa banco separado para isolar testes de dados de desenvolvimento
 * Database: conectcrm_test (criado automaticamente se não existir)
 */
export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5434', 10), // ✅ Usar porta 5434 do Docker
  username: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: 'conectcrm_test', // Database separado para testes
  entities: ['src/**/*.entity.ts'],
  synchronize: true, // ⚠️ Apenas em testes! Recria schema a cada run
  dropSchema: true, // ⚠️ Limpa dados entre test suites
  logging: false, // Desabilitar logs SQL nos testes (menos ruído)
  autoLoadEntities: true,
};

/**
 * DataSource para migrations de teste (se necessário)
 */
export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5434', 10), // ✅ Usar porta 5434 do Docker
  username: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: 'conectcrm_test',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Usar migrations no DataSource
});
