import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { testDatabaseConfig } from './test.database.config';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '../src/config/logger.config';
import { AtendimentoModule } from '../src/modules/atendimento/atendimento.module';
import { TriagemModule } from '../src/modules/triagem/triagem.module';
import { EmpresasModule } from '../src/empresas/empresas.module';
import { UsersModule } from '../src/modules/users/users.module';
import { ClientesModule } from '../src/modules/clientes/clientes.module';
import { getMockProviders } from './mocks/external-services.mock';

// Importar todas as entities necessárias para os testes
import { Empresa } from '../src/empresas/entities/empresa.entity';
import { User } from '../src/modules/users/user.entity';
import { Cliente } from '../src/modules/clientes/cliente.entity';
import { Contato } from '../src/modules/clientes/contato.entity';
import { Canal } from '../src/modules/atendimento/entities/canal.entity';
import { Ticket } from '../src/modules/atendimento/entities/ticket.entity';
import { Mensagem } from '../src/modules/atendimento/entities/mensagem.entity';
import { Equipe } from '../src/modules/triagem/entities/equipe.entity';
import { Atendente } from '../src/modules/atendimento/entities/atendente.entity';
import { createE2EApp, withE2EBootstrapLock } from './_support/e2e-app.helper';

/**
 * 🧪 Helper para criar aplicação de teste E2E
 *
 * Inicializa app NestJS completo com:
 * - Database de teste (PostgreSQL test)
 * - Validation pipes
 * - Logger Winston
 * - Módulos essenciais (Atendimento, Triagem, Empresas, Users, Clientes)
 * - Repositories registrados para factories
 * - Mocks de serviços externos (WhatsApp, OpenAI, etc.)
 *
 * Uso:
 * ```typescript
 * let app: INestApplication;
 *
 * beforeAll(async () => {
 *   app = await createTestApp();
 * });
 *
 * afterAll(async () => {
 *   await app.close();
 * });
 * ```
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
    imports: [
      // Database de teste
      TypeOrmModule.forRoot(testDatabaseConfig),

      // Registrar entities explicitamente para factories
      TypeOrmModule.forFeature([
        Empresa,
        User,
        Cliente,
        Contato,
        Canal,
        Ticket,
        Mensagem,
        Equipe,
        Atendente,
      ]),

      // Logger Winston (silencioso em testes)
      WinstonModule.forRoot({
        ...winstonConfig,
        silent: true, // ⚠️ Desabilitar output de logs nos testes
      }),

      // Módulos essenciais para testes de triagem/atendimento
      EmpresasModule, // Empresas (multi-tenant)
      UsersModule, // Usuários e autenticação
      ClientesModule, // Clientes e contatos
      TriagemModule, // Triagem de tickets
      AtendimentoModule, // Atendimento e distribuição
    ],
    providers: [
      // Mocks de serviços externos
      ...getMockProviders(),
    ],
  }).compile());

  const app = await createE2EApp(moduleFixture, {
    validationPipeOptions: {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    },
  });

  return app;
}

/**
 * 🧹 Helper para limpar dados de teste
 *
 * Trunca todas as tabelas relevantes para testes isolados
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const entities = [
    'mensagens',
    'tickets',
    'distribuicoes',
    'atribuicoes',
    'atendentes',
    'equipes',
    'contatos',
    'usuarios',
    'empresas',
  ];

  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Desabilitar foreign key checks temporariamente
    await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');

    for (const entity of entities) {
      await queryRunner.query(`TRUNCATE TABLE "${entity}" CASCADE`);
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}



