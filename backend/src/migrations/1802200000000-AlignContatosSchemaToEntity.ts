import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignContatosSchemaToEntity1802200000000 implements MigrationInterface {
  name = 'AlignContatosSchemaToEntity1802200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasContatos = await queryRunner.hasTable('contatos');
    if (!hasContatos) {
      return;
    }

    // Compatibilidade entre schemas legados (cliente_id) e schema atual (clienteId)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'contatos'
            AND column_name = 'cliente_id'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'contatos'
            AND column_name = 'clienteId'
        ) THEN
          EXECUTE 'ALTER TABLE "contatos" RENAME COLUMN "cliente_id" TO "clienteId"';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "contatos"
      ADD COLUMN IF NOT EXISTS "clienteId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "contatos"
      ADD COLUMN IF NOT EXISTS "ativo" boolean
    `);
    await queryRunner.query(`
      UPDATE "contatos"
      SET "ativo" = true
      WHERE "ativo" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "ativo" SET DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "ativo" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "contatos"
      ADD COLUMN IF NOT EXISTS "observacoes" text
    `);

    await queryRunner.query(`
      ALTER TABLE "contatos"
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'contatos'
            AND column_name = 'criado_em'
        ) THEN
          EXECUTE '
            UPDATE "contatos"
            SET "createdAt" = COALESCE("createdAt", "criado_em", NOW())
            WHERE "createdAt" IS NULL
          ';
        ELSE
          EXECUTE '
            UPDATE "contatos"
            SET "createdAt" = COALESCE("createdAt", NOW())
            WHERE "createdAt" IS NULL
          ';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "createdAt" SET DEFAULT NOW()
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "createdAt" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "contatos"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'contatos'
            AND column_name = 'atualizado_em'
        ) THEN
          EXECUTE '
            UPDATE "contatos"
            SET "updatedAt" = COALESCE("updatedAt", "atualizado_em", NOW())
            WHERE "updatedAt" IS NULL
          ';
        ELSE
          EXECUTE '
            UPDATE "contatos"
            SET "updatedAt" = COALESCE("updatedAt", NOW())
            WHERE "updatedAt" IS NULL
          ';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "updatedAt" SET DEFAULT NOW()
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "updatedAt" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "contatos"
      ADD COLUMN IF NOT EXISTS "principal" boolean
    `);
    await queryRunner.query(`
      UPDATE "contatos"
      SET "principal" = false
      WHERE "principal" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "principal" SET DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "contatos"
      ALTER COLUMN "principal" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_contatos_clienteid"
      ON "contatos" ("clienteId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_contatos_empresa_id"
      ON "contatos" ("empresa_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_contatos_ativo"
      ON "contatos" ("ativo")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_contatos_principal"
      ON "contatos" ("principal")
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: esta migration faz alinhamento de schema legado para evitar perda de dados em rollback.
  }
}
