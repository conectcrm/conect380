import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureAssinaturasEmpresasTable1809005000000 implements MigrationInterface {
  name = 'EnsureAssinaturasEmpresasTable1809005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'assinaturas_empresas_status_enum'
        ) THEN
          CREATE TYPE "public"."assinaturas_empresas_status_enum" AS ENUM (
            'ativa',
            'cancelada',
            'suspensa',
            'pendente'
          );
        END IF;
      END
      $$;
    `);

    const enumValues = [
      'trial',
      'active',
      'past_due',
      'suspended',
      'canceled',
      'pendente',
      'ativa',
      'suspensa',
      'cancelada',
    ];

    for (const enumValue of enumValues) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM pg_type
            WHERE typname = 'assinaturas_empresas_status_enum'
          ) AND NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'assinaturas_empresas_status_enum'
              AND e.enumlabel = '${enumValue}'
          ) THEN
            ALTER TYPE "public"."assinaturas_empresas_status_enum" ADD VALUE '${enumValue}';
          END IF;
        END
        $$;
      `);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assinaturas_empresas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "status" "public"."assinaturas_empresas_status_enum" NOT NULL DEFAULT 'ativa',
        "dataInicio" date NOT NULL,
        "dataFim" date,
        "proximoVencimento" date NOT NULL,
        "valorMensal" numeric(10,2) NOT NULL,
        "usuariosAtivos" integer NOT NULL DEFAULT 0,
        "clientesCadastrados" integer NOT NULL DEFAULT 0,
        "storageUtilizado" bigint NOT NULL DEFAULT 0,
        "apiCallsHoje" integer NOT NULL DEFAULT 0,
        "ultimaContabilizacaoApi" date NOT NULL DEFAULT CURRENT_DATE,
        "renovacaoAutomatica" boolean NOT NULL DEFAULT true,
        "observacoes" text,
        "criadoEm" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(),
        "plano_id" uuid,
        CONSTRAINT "PK_assinaturas_empresas_id" PRIMARY KEY ("id")
      )
    `);

    const ensureColumn = async (columnName: string, definition: string): Promise<void> => {
      const exists = await queryRunner.hasColumn('assinaturas_empresas', columnName);
      if (!exists) {
        await queryRunner.query(
          `ALTER TABLE "assinaturas_empresas" ADD COLUMN "${columnName}" ${definition}`,
        );
      }
    };

    await ensureColumn('empresa_id', 'uuid');
    await ensureColumn('status', `"public"."assinaturas_empresas_status_enum" NOT NULL DEFAULT 'ativa'`);
    await ensureColumn('dataInicio', 'date');
    await ensureColumn('dataFim', 'date');
    await ensureColumn('proximoVencimento', 'date');
    await ensureColumn('valorMensal', 'numeric(10,2) NOT NULL DEFAULT 0');
    await ensureColumn('usuariosAtivos', 'integer NOT NULL DEFAULT 0');
    await ensureColumn('clientesCadastrados', 'integer NOT NULL DEFAULT 0');
    await ensureColumn('storageUtilizado', 'bigint NOT NULL DEFAULT 0');
    await ensureColumn('apiCallsHoje', 'integer NOT NULL DEFAULT 0');
    await ensureColumn('ultimaContabilizacaoApi', 'date NOT NULL DEFAULT CURRENT_DATE');
    await ensureColumn('renovacaoAutomatica', 'boolean NOT NULL DEFAULT true');
    await ensureColumn('observacoes', 'text');
    await ensureColumn('criadoEm', 'timestamp NOT NULL DEFAULT now()');
    await ensureColumn('atualizadoEm', 'timestamp NOT NULL DEFAULT now()');
    await ensureColumn('plano_id', 'uuid');

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_assinaturas_empresas_empresa'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'assinaturas_empresas'
            AND column_name = 'empresa_id'
            AND data_type = 'uuid'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'empresas'
            AND column_name = 'id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "assinaturas_empresas"
            ADD CONSTRAINT "FK_assinaturas_empresas_empresa"
            FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_assinaturas_empresas_plano'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'assinaturas_empresas'
            AND column_name = 'plano_id'
            AND data_type = 'uuid'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'planos'
            AND column_name = 'id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "assinaturas_empresas"
            ADD CONSTRAINT "FK_assinaturas_empresas_plano"
            FOREIGN KEY ("plano_id") REFERENCES "planos"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assinaturas_empresas_empresa_id"
      ON "assinaturas_empresas" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assinaturas_empresas_status"
      ON "assinaturas_empresas" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assinaturas_empresas_plano_id"
      ON "assinaturas_empresas" ("plano_id")
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op intencional: migration de compatibilidade para ambientes legados.
  }
}
