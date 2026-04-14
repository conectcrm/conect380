import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTesourariaMovimentacoes1802891100000 implements MigrationInterface {
  name = 'CreateTesourariaMovimentacoes1802891100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'tesouraria_movimentacoes_status_enum'
        ) THEN
          CREATE TYPE "public"."tesouraria_movimentacoes_status_enum" AS ENUM('pendente', 'aprovada', 'cancelada');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tesouraria_movimentacoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "conta_origem_id" uuid NOT NULL,
        "conta_destino_id" uuid NOT NULL,
        "status" "public"."tesouraria_movimentacoes_status_enum" NOT NULL DEFAULT 'pendente',
        "valor" numeric(15,2) NOT NULL,
        "descricao" character varying(255),
        "correlation_id" character varying(120) NOT NULL,
        "origem_id" character varying(160),
        "auditoria" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "criado_por" character varying,
        "atualizado_por" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tesouraria_movimentacoes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimentacoes_tesouraria_empresa"
      ON "tesouraria_movimentacoes" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimentacoes_tesouraria_empresa_status"
      ON "tesouraria_movimentacoes" ("empresa_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimentacoes_tesouraria_conta_origem"
      ON "tesouraria_movimentacoes" ("conta_origem_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movimentacoes_tesouraria_conta_destino"
      ON "tesouraria_movimentacoes" ("conta_destino_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_movimentacoes_tesouraria_empresa_correlation"
      ON "tesouraria_movimentacoes" ("empresa_id", "correlation_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_movimentacoes_tesouraria_empresa'
            AND table_name = 'tesouraria_movimentacoes'
        ) THEN
          ALTER TABLE "tesouraria_movimentacoes"
            ADD CONSTRAINT "fk_movimentacoes_tesouraria_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_movimentacoes_tesouraria_conta_origem'
            AND table_name = 'tesouraria_movimentacoes'
        ) THEN
          ALTER TABLE "tesouraria_movimentacoes"
            ADD CONSTRAINT "fk_movimentacoes_tesouraria_conta_origem"
            FOREIGN KEY ("conta_origem_id")
            REFERENCES "contas_bancarias"("id")
            ON DELETE RESTRICT
            ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_movimentacoes_tesouraria_conta_destino'
            AND table_name = 'tesouraria_movimentacoes'
        ) THEN
          ALTER TABLE "tesouraria_movimentacoes"
            ADD CONSTRAINT "fk_movimentacoes_tesouraria_conta_destino"
            FOREIGN KEY ("conta_destino_id")
            REFERENCES "contas_bancarias"("id")
            ON DELETE RESTRICT
            ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tesouraria_movimentacoes"
      DROP CONSTRAINT IF EXISTS "fk_movimentacoes_tesouraria_conta_destino"
    `);
    await queryRunner.query(`
      ALTER TABLE "tesouraria_movimentacoes"
      DROP CONSTRAINT IF EXISTS "fk_movimentacoes_tesouraria_conta_origem"
    `);
    await queryRunner.query(`
      ALTER TABLE "tesouraria_movimentacoes"
      DROP CONSTRAINT IF EXISTS "fk_movimentacoes_tesouraria_empresa"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_movimentacoes_tesouraria_empresa_correlation"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movimentacoes_tesouraria_conta_destino"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movimentacoes_tesouraria_conta_origem"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movimentacoes_tesouraria_empresa_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movimentacoes_tesouraria_empresa"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "tesouraria_movimentacoes"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'tesouraria_movimentacoes_status_enum'
        ) THEN
          DROP TYPE "public"."tesouraria_movimentacoes_status_enum";
        END IF;
      END$$;
    `);
  }
}
