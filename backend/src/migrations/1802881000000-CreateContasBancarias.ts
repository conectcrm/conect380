import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContasBancarias1802881000000 implements MigrationInterface {
  name = 'CreateContasBancarias1802881000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'contas_bancarias_tipo_conta_enum'
        ) THEN
          CREATE TYPE "public"."contas_bancarias_tipo_conta_enum" AS ENUM('corrente', 'poupanca');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contas_bancarias" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "nome" character varying(120) NOT NULL,
        "banco" character varying(120) NOT NULL,
        "agencia" character varying(20) NOT NULL,
        "conta" character varying(30) NOT NULL,
        "tipo_conta" "public"."contas_bancarias_tipo_conta_enum" NOT NULL DEFAULT 'corrente',
        "saldo" numeric(15,2) NOT NULL DEFAULT '0',
        "chave_pix" character varying(160),
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_por" character varying,
        "atualizado_por" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contas_bancarias_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contas_bancarias_empresa"
      ON "contas_bancarias" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contas_bancarias_empresa_ativo"
      ON "contas_bancarias" ("empresa_id", "ativo")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_contas_bancarias_empresa'
            AND table_name = 'contas_bancarias'
        ) THEN
          ALTER TABLE "contas_bancarias"
            ADD CONSTRAINT "fk_contas_bancarias_empresa"
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
      ALTER TABLE "contas_bancarias"
      DROP CONSTRAINT IF EXISTS "fk_contas_bancarias_empresa"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contas_bancarias_empresa_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contas_bancarias_empresa"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contas_bancarias"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'contas_bancarias_tipo_conta_enum'
        ) THEN
          DROP TYPE "public"."contas_bancarias_tipo_conta_enum";
        END IF;
      END$$;
    `);
  }
}
