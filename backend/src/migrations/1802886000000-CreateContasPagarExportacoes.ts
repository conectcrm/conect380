import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContasPagarExportacoes1802886000000 implements MigrationInterface {
  name = 'CreateContasPagarExportacoes1802886000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'contas_pagar_exportacoes_formato_enum'
        ) THEN
          CREATE TYPE "public"."contas_pagar_exportacoes_formato_enum" AS ENUM('csv', 'xlsx');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'contas_pagar_exportacoes_status_enum'
        ) THEN
          CREATE TYPE "public"."contas_pagar_exportacoes_status_enum" AS ENUM('processando', 'sucesso', 'falha');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contas_pagar_exportacoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "usuario_id" character varying(120),
        "formato" "public"."contas_pagar_exportacoes_formato_enum" NOT NULL,
        "status" "public"."contas_pagar_exportacoes_status_enum" NOT NULL DEFAULT 'processando',
        "filtros" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "nome_arquivo" character varying(180),
        "total_registros" integer NOT NULL DEFAULT 0,
        "erro" text,
        "iniciado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "finalizado_em" TIMESTAMP NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contas_pagar_exportacoes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contas_pagar_exportacoes_empresa_created_at"
      ON "contas_pagar_exportacoes" ("empresa_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contas_pagar_exportacoes_empresa_status"
      ON "contas_pagar_exportacoes" ("empresa_id", "status")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_contas_pagar_exportacoes_empresa'
            AND table_name = 'contas_pagar_exportacoes'
        ) THEN
          ALTER TABLE "contas_pagar_exportacoes"
            ADD CONSTRAINT "fk_contas_pagar_exportacoes_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contas_pagar_exportacoes"
      DROP CONSTRAINT IF EXISTS "fk_contas_pagar_exportacoes_empresa"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contas_pagar_exportacoes_empresa_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contas_pagar_exportacoes_empresa_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contas_pagar_exportacoes"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'contas_pagar_exportacoes_status_enum'
        ) THEN
          DROP TYPE "public"."contas_pagar_exportacoes_status_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'contas_pagar_exportacoes_formato_enum'
        ) THEN
          DROP TYPE "public"."contas_pagar_exportacoes_formato_enum";
        END IF;
      END$$;
    `);
  }
}
