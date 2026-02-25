import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendedorIdToPropostasForDashboardScope1802875000000
  implements MigrationInterface
{
  name = 'AddVendedorIdToPropostasForDashboardScope1802875000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('propostas'))) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "propostas"
      ADD COLUMN IF NOT EXISTS "vendedor_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_vendedor_id"
      ON "propostas" ("vendedor_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.propostas') IS NOT NULL
          AND to_regclass('public.users') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_propostas_vendedor_user')
        THEN
          ALTER TABLE "propostas"
            ADD CONSTRAINT "FK_propostas_vendedor_user"
            FOREIGN KEY ("vendedor_id") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Safe no-op: corrective baseline migration.
  }
}
