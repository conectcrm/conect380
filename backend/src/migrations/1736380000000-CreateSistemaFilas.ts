import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migration: Sistema de Filas - ETAPA 5
 *
 * Cria:
 * 1. Tabela filas_atendentes (junction table Fila ↔ User)
 * 2. Adiciona novas colunas na tabela filas:
 *    - estrategia_distribuicao (enum: ROUND_ROBIN | MENOR_CARGA | PRIORIDADE)
 *    - capacidade_maxima (int, default 10)
 *    - distribuicao_automatica (boolean, default false)
 *    - configuracoes (jsonb)
 *
 * Data: Janeiro 2025
 */
export class CreateSistemaFilas1736380000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 [Migration] Criando Sistema de Filas (ETAPA 5)...');

    // 1. Criar ENUM para estratégia de distribuição
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estrategia_distribuicao_enum') THEN
          CREATE TYPE estrategia_distribuicao_enum AS ENUM (
            'ROUND_ROBIN',
            'MENOR_CARGA',
            'PRIORIDADE'
          );
        END IF;
      END $$;
    `);
    console.log('✅ ENUM estrategia_distribuicao_enum criado');

    // 2. Garantir que a tabela filas exista (em alguns históricos ela não é criada antes)
    const filasExists = await queryRunner.hasTable('filas');
    if (!filasExists) {
      console.warn(
        '⚠️  Migration: tabela "filas" não existe - criando estrutura mínima para desbloquear migrations posteriores',
      );

      await queryRunner.createTable(
        new Table({
          name: 'filas',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'empresaId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'nome',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'descricao',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'ativo',
              type: 'boolean',
              default: true,
            },
            {
              name: 'ordem',
              type: 'integer',
              default: 0,
            },
            {
              name: 'horarioAtendimento',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'deletedAt',
              type: 'timestamp',
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // FK empresaId -> empresas(id) (se existir)
      const empresasExists = await queryRunner.hasTable('empresas');
      if (empresasExists) {
        await queryRunner.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_filas_empresa') THEN
              ALTER TABLE "filas"
              ADD CONSTRAINT "FK_filas_empresa" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
          END $$;
        `);
      }

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_filas_empresaId" ON "filas" ("empresaId")`,
      );
    }

    // 3. Adicionar novas colunas na tabela filas (idempotente)
    await queryRunner.query(`
      ALTER TABLE "filas" ADD COLUMN IF NOT EXISTS "estrategia_distribuicao" estrategia_distribuicao_enum NOT NULL DEFAULT 'ROUND_ROBIN';
      COMMENT ON COLUMN "filas"."estrategia_distribuicao" IS 'Estratégia de distribuição de tickets';
    `);
    console.log('✅ Coluna estrategia_distribuicao adicionada em filas');

    await queryRunner.query(`
      ALTER TABLE "filas" ADD COLUMN IF NOT EXISTS "capacidade_maxima" integer NOT NULL DEFAULT 10;
      COMMENT ON COLUMN "filas"."capacidade_maxima" IS 'Capacidade máxima de tickets por atendente';
    `);
    console.log('✅ Coluna capacidade_maxima adicionada em filas');

    await queryRunner.query(`
      ALTER TABLE "filas" ADD COLUMN IF NOT EXISTS "distribuicao_automatica" boolean NOT NULL DEFAULT false;
      COMMENT ON COLUMN "filas"."distribuicao_automatica" IS 'Se true, tickets são distribuídos automaticamente';
    `);
    console.log('✅ Coluna distribuicao_automatica adicionada em filas');

    await queryRunner.query(`
      ALTER TABLE "filas" ADD COLUMN IF NOT EXISTS "configuracoes" jsonb;
      COMMENT ON COLUMN "filas"."configuracoes" IS 'Configurações adicionais (tempoMaximoEspera, prioridadePadrao, notificarAposMinutos)';
    `);
    console.log('✅ Coluna configuracoes adicionada em filas');

    // 4. Criar tabela filas_atendentes (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'filas_atendentes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'filaId',
            type: 'uuid',
            isNullable: false,
            comment: 'ID da fila',
          },
          {
            name: 'atendenteId',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do atendente (User)',
          },
          {
            name: 'capacidade',
            type: 'integer',
            default: 10,
            comment: 'Capacidade do atendente nesta fila específica (1-50)',
          },
          {
            name: 'prioridade',
            type: 'integer',
            default: 5,
            comment: 'Prioridade do atendente nesta fila (1=alta, 10=baixa)',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            comment: 'Se atendente está ativo nesta fila',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
    console.log('✅ Tabela filas_atendentes criada');

    // 5. Criar índices (idempotente)
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_filas_atendentes_fila_atendente" ON "filas_atendentes" ("filaId", "atendenteId")`,
    );
    console.log('✅ Índice único (filaId, atendenteId) criado');

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_filas_atendentes_filaId" ON "filas_atendentes" ("filaId")`,
    );
    console.log('✅ Índice filaId criado');

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_filas_atendentes_atendenteId" ON "filas_atendentes" ("atendenteId")`,
    );
    console.log('✅ Índice atendenteId criado');

    // 6. Criar foreign keys (condicional)
    const usersExists = await queryRunner.hasTable('users');
    const filasNowExists = await queryRunner.hasTable('filas');

    if (filasNowExists) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_filas_atendentes_fila') THEN
            ALTER TABLE "filas_atendentes"
            ADD CONSTRAINT "FK_filas_atendentes_fila" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } else {
      console.warn('⚠️  Migration: tabela "filas" ainda não existe - pulando FK filas_atendentes.filaId');
    }
    console.log('✅ Foreign key para filas criada');

    if (usersExists) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_filas_atendentes_user') THEN
            ALTER TABLE "filas_atendentes"
            ADD CONSTRAINT "FK_filas_atendentes_user" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } else {
      console.warn('⚠️  Migration: tabela "users" não existe - pulando FK filas_atendentes.atendenteId');
    }
    console.log('✅ Foreign key para users criada');

    console.log('🎉 [Migration] Sistema de Filas criado com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏪ [Migration] Revertendo Sistema de Filas...');

    // Remover FKs/índices/tabela (tudo defensivo)
    await queryRunner.query(`ALTER TABLE IF EXISTS "filas_atendentes" DROP CONSTRAINT IF EXISTS "FK_filas_atendentes_user";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "filas_atendentes" DROP CONSTRAINT IF EXISTS "FK_filas_atendentes_fila";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filas_atendentes_atendenteId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filas_atendentes_filaId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_filas_atendentes_fila_atendente";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "filas_atendentes";`);

    // Remover colunas adicionadas na tabela filas
    await queryRunner.query(`ALTER TABLE IF EXISTS "filas" DROP COLUMN IF EXISTS "configuracoes";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "filas" DROP COLUMN IF EXISTS "distribuicao_automatica";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "filas" DROP COLUMN IF EXISTS "capacidade_maxima";`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "filas" DROP COLUMN IF EXISTS "estrategia_distribuicao";`);

    // Remover ENUM
    await queryRunner.query('DROP TYPE IF EXISTS estrategia_distribuicao_enum;');
    console.log('✅ Estruturas removidas');

    console.log('✅ [Migration] Sistema de Filas revertido com sucesso!');
  }
}
