import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const configService = new ConfigService();
const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: parseInt(configService.get('DATABASE_PORT', '5434')),
  username: configService.get('DATABASE_USERNAME', 'conectcrm'),
  password: configService.get('DATABASE_PASSWORD', 'conectcrm123'),
  database: configService.get('DATABASE_NAME', 'conectcrm_db'),
  entities: isCompiled ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isCompiled ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Desabilitar para usar migrações
  logging: configService.get('APP_ENV') === 'development',
  ssl:
    configService.get('APP_ENV') === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
