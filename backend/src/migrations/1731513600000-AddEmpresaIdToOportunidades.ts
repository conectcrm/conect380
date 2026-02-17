import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToOportunidades1731513600000 implements MigrationInterface {
  name = 'AddEmpresaIdToOportunidades1731513600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Observação: esta migration foi escrita numa época em que o schema de oportunidades
    // ainda variava bastante. Aqui a gente garante compatibilidade/idempotência.

    // 1) Garantir empresa_id (se não existir)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='empresa_id'
        ) THEN
          EXECUTE 'ALTER TABLE "oportunidades" ADD COLUMN "empresa_id" uuid';
        END IF;
      END $$;
    `);

    // 2) Backfill empresa_id (somente para linhas nulas)
    await queryRunner.query(`
      UPDATE "oportunidades"
      SET "empresa_id" = (SELECT id FROM empresas LIMIT 1)
      WHERE "empresa_id" IS NULL;
    `);

    // 3) Garantir NOT NULL (vai falhar apenas se houver nulos remanescentes)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='empresa_id'
        ) THEN
          EXECUTE 'ALTER TABLE "oportunidades" ALTER COLUMN "empresa_id" SET NOT NULL';
        END IF;
      END $$;
    `);

    // 4) Garantir coluna estagio (renomeia status->estagio quando aplicável)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='status'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='estagio'
        ) THEN
          EXECUTE 'ALTER TABLE "oportunidades" RENAME COLUMN "status" TO "estagio"';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='estagio'
        ) THEN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'oportunidades_status_enum') THEN
            EXECUTE 'ALTER TABLE "oportunidades" ADD COLUMN "estagio" "public"."oportunidades_status_enum" NOT NULL DEFAULT ''lead''';
          ELSE
            EXECUTE 'ALTER TABLE "oportunidades" ADD COLUMN "estagio" varchar(50) NOT NULL DEFAULT ''lead''';
          END IF;
        END IF;
      END $$;
    `);

    // 5) Garantir timestamps esperados por migrations posteriores
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='createdAt'
        ) THEN
          EXECUTE 'ALTER TABLE "oportunidades" ADD COLUMN "createdAt" timestamp NOT NULL DEFAULT now()';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='updatedAt'
        ) THEN
          EXECUTE 'ALTER TABLE "oportunidades" ADD COLUMN "updatedAt" timestamp NOT NULL DEFAULT now()';
        END IF;
      END $$;
    `);

    // 6) Foreign key empresa (se não existir)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_oportunidades_empresa'
        ) THEN
          EXECUTE '
            ALTER TABLE "oportunidades"
            ADD CONSTRAINT "FK_oportunidades_empresa"
            FOREIGN KEY ("empresa_id")
            REFERENCES "empresas"("id")
            ON DELETE RESTRICT
            ON UPDATE CASCADE
          ';
        END IF;
      END $$;
    `);

    // 7) Índices (somente se colunas existirem)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='empresa_id'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "IDX_oportunidades_empresa_id" ON "oportunidades"("empresa_id")';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='empresa_id'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='oportunidades' AND column_name='estagio'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "IDX_oportunidades_empresa_estagio" ON "oportunidades"("empresa_id", "estagio")';
        END IF;
      END $$;
    `);

    console.log('✅ Migration AddEmpresaIdToOportunidades executada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter em ordem inversa
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oportunidades_empresa_estagio";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oportunidades_empresa_id";`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT IF EXISTS "FK_oportunidades_empresa";`,
    );
    // Não removemos estagio/createdAt/updatedAt aqui pois podem ter sido
    // introduzidos por outras migrations posteriores.
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "empresa_id";`);

    console.log('✅ Migration AddEmpresaIdToOportunidades revertida com sucesso');
  }
}
