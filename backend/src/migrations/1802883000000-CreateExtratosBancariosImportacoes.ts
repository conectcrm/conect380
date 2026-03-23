import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExtratosBancariosImportacoes1802883000000 implements MigrationInterface {
  name = 'CreateExtratosBancariosImportacoes1802883000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'extratos_bancarios_importacoes_tipo_arquivo_enum'
        ) THEN
          CREATE TYPE "public"."extratos_bancarios_importacoes_tipo_arquivo_enum" AS ENUM('csv', 'ofx');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'extratos_bancarios_itens_tipo_enum'
        ) THEN
          CREATE TYPE "public"."extratos_bancarios_itens_tipo_enum" AS ENUM('credito', 'debito');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "extratos_bancarios_importacoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "conta_bancaria_id" uuid NOT NULL,
        "nome_arquivo" character varying(255) NOT NULL,
        "tipo_arquivo" "public"."extratos_bancarios_importacoes_tipo_arquivo_enum" NOT NULL,
        "total_lancamentos" integer NOT NULL DEFAULT 0,
        "total_entradas" numeric(15,2) NOT NULL DEFAULT '0',
        "total_saidas" numeric(15,2) NOT NULL DEFAULT '0',
        "periodo_inicio" date,
        "periodo_fim" date,
        "status" character varying(20) NOT NULL DEFAULT 'processado',
        "erros_importacao" jsonb DEFAULT '[]'::jsonb,
        "criado_por" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_extratos_bancarios_importacoes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "extratos_bancarios_itens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "importacao_id" uuid NOT NULL,
        "empresa_id" uuid NOT NULL,
        "conta_bancaria_id" uuid NOT NULL,
        "data_lancamento" date NOT NULL,
        "descricao" character varying(500) NOT NULL,
        "documento" character varying(120),
        "referencia_externa" character varying(120),
        "tipo" "public"."extratos_bancarios_itens_tipo_enum" NOT NULL,
        "valor" numeric(15,2) NOT NULL,
        "saldo_pos_lancamento" numeric(15,2),
        "conciliado" boolean NOT NULL DEFAULT false,
        "conta_pagar_id" uuid,
        "dados_originais" jsonb DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_extratos_bancarios_itens_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_extratos_importacoes_empresa_created_at"
      ON "extratos_bancarios_importacoes" ("empresa_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_extratos_importacoes_conta_bancaria_created_at"
      ON "extratos_bancarios_importacoes" ("conta_bancaria_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_extratos_itens_importacao_id"
      ON "extratos_bancarios_itens" ("importacao_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_extratos_itens_empresa_data_lancamento"
      ON "extratos_bancarios_itens" ("empresa_id", "data_lancamento")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_extratos_itens_empresa_conciliado"
      ON "extratos_bancarios_itens" ("empresa_id", "conciliado")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_extratos_importacoes_empresa'
            AND table_name = 'extratos_bancarios_importacoes'
        ) THEN
          ALTER TABLE "extratos_bancarios_importacoes"
            ADD CONSTRAINT "fk_extratos_importacoes_empresa"
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
          WHERE constraint_name = 'fk_extratos_importacoes_conta_bancaria'
            AND table_name = 'extratos_bancarios_importacoes'
        ) THEN
          ALTER TABLE "extratos_bancarios_importacoes"
            ADD CONSTRAINT "fk_extratos_importacoes_conta_bancaria"
            FOREIGN KEY ("conta_bancaria_id")
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
          WHERE constraint_name = 'fk_extratos_itens_importacao'
            AND table_name = 'extratos_bancarios_itens'
        ) THEN
          ALTER TABLE "extratos_bancarios_itens"
            ADD CONSTRAINT "fk_extratos_itens_importacao"
            FOREIGN KEY ("importacao_id")
            REFERENCES "extratos_bancarios_importacoes"("id")
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
          WHERE constraint_name = 'fk_extratos_itens_empresa'
            AND table_name = 'extratos_bancarios_itens'
        ) THEN
          ALTER TABLE "extratos_bancarios_itens"
            ADD CONSTRAINT "fk_extratos_itens_empresa"
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
          WHERE constraint_name = 'fk_extratos_itens_conta_bancaria'
            AND table_name = 'extratos_bancarios_itens'
        ) THEN
          ALTER TABLE "extratos_bancarios_itens"
            ADD CONSTRAINT "fk_extratos_itens_conta_bancaria"
            FOREIGN KEY ("conta_bancaria_id")
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
          WHERE constraint_name = 'fk_extratos_itens_conta_pagar'
            AND table_name = 'extratos_bancarios_itens'
        ) THEN
          ALTER TABLE "extratos_bancarios_itens"
            ADD CONSTRAINT "fk_extratos_itens_conta_pagar"
            FOREIGN KEY ("conta_pagar_id")
            REFERENCES "contas_pagar"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP CONSTRAINT IF EXISTS "fk_extratos_itens_conta_pagar"
    `);
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP CONSTRAINT IF EXISTS "fk_extratos_itens_conta_bancaria"
    `);
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP CONSTRAINT IF EXISTS "fk_extratos_itens_empresa"
    `);
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_itens"
      DROP CONSTRAINT IF EXISTS "fk_extratos_itens_importacao"
    `);
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_importacoes"
      DROP CONSTRAINT IF EXISTS "fk_extratos_importacoes_conta_bancaria"
    `);
    await queryRunner.query(`
      ALTER TABLE "extratos_bancarios_importacoes"
      DROP CONSTRAINT IF EXISTS "fk_extratos_importacoes_empresa"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_extratos_itens_empresa_conciliado"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_extratos_itens_empresa_data_lancamento"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_extratos_itens_importacao_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_extratos_importacoes_conta_bancaria_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_extratos_importacoes_empresa_created_at"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "extratos_bancarios_itens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "extratos_bancarios_importacoes"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'extratos_bancarios_itens_tipo_enum'
        ) THEN
          DROP TYPE "public"."extratos_bancarios_itens_tipo_enum";
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'extratos_bancarios_importacoes_tipo_arquivo_enum'
        ) THEN
          DROP TYPE "public"."extratos_bancarios_importacoes_tipo_arquivo_enum";
        END IF;
      END$$;
    `);
  }
}
