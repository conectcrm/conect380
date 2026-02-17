import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignClientesSchemaToEntity1802400000000 implements MigrationInterface {
  name = 'AlignClientesSchemaToEntity1802400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasClientes = await queryRunner.hasTable('clientes');
    if (!hasClientes) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "clientes"
      ADD COLUMN IF NOT EXISTS "documento" character varying(20)
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'cpf_cnpj'
        ) THEN
          EXECUTE '
            UPDATE "clientes"
            SET "documento" = COALESCE("documento", "cpf_cnpj")
            WHERE "documento" IS NULL
          ';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "clientes"
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'criado_em'
        ) THEN
          EXECUTE '
            UPDATE "clientes"
            SET "created_at" = COALESCE("created_at", "criado_em", NOW())
            WHERE "created_at" IS NULL
          ';
        ELSE
          EXECUTE '
            UPDATE "clientes"
            SET "created_at" = COALESCE("created_at", NOW())
            WHERE "created_at" IS NULL
          ';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "clientes"
      ALTER COLUMN "created_at" SET DEFAULT NOW()
    `);
    await queryRunner.query(`
      ALTER TABLE "clientes"
      ALTER COLUMN "created_at" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "clientes"
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'atualizado_em'
        ) THEN
          EXECUTE '
            UPDATE "clientes"
            SET "updated_at" = COALESCE("updated_at", "atualizado_em", "created_at", NOW())
            WHERE "updated_at" IS NULL
          ';
        ELSE
          EXECUTE '
            UPDATE "clientes"
            SET "updated_at" = COALESCE("updated_at", "created_at", NOW())
            WHERE "updated_at" IS NULL
          ';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "clientes"
      ALTER COLUMN "updated_at" SET DEFAULT NOW()
    `);
    await queryRunner.query(`
      ALTER TABLE "clientes"
      ALTER COLUMN "updated_at" SET NOT NULL
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: migration de alinhamento de schema legado.
  }
}

