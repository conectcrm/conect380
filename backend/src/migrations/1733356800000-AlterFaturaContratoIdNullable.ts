import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterFaturaContratoIdNullable1733356800000 implements MigrationInterface {
  name = 'AlterFaturaContratoIdNullable1733356800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Histórico pode não ter a tabela/coluna neste ponto.
    // Tornar a migration resiliente e compatível com variações de nome de coluna.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'faturas'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'faturas' AND column_name = 'contratoId'
          ) THEN
            EXECUTE 'ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL';
          ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'faturas' AND column_name = 'contrato_id'
          ) THEN
            EXECUTE 'ALTER TABLE "faturas" ALTER COLUMN "contrato_id" DROP NOT NULL';
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para NOT NULL (somente se a tabela/coluna existir e não houver NULLs)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'faturas'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'faturas' AND column_name = 'contratoId'
          ) THEN
            IF NOT EXISTS (SELECT 1 FROM "faturas" WHERE "contratoId" IS NULL) THEN
              EXECUTE 'ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL';
            ELSE
              RAISE NOTICE 'Migration down: existem faturas sem contratoId; mantendo coluna nullable.';
            END IF;
          ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'faturas' AND column_name = 'contrato_id'
          ) THEN
            IF NOT EXISTS (SELECT 1 FROM "faturas" WHERE "contrato_id" IS NULL) THEN
              EXECUTE 'ALTER TABLE "faturas" ALTER COLUMN "contrato_id" SET NOT NULL';
            ELSE
              RAISE NOTICE 'Migration down: existem faturas sem contrato_id; mantendo coluna nullable.';
            END IF;
          END IF;
        END IF;
      END $$;
    `);
  }
}
