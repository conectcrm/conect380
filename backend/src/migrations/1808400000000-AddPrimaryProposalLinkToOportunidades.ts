import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrimaryProposalLinkToOportunidades1808400000000 implements MigrationInterface {
  name = 'AddPrimaryProposalLinkToOportunidades1808400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oportunidades"
      ADD COLUMN IF NOT EXISTS "proposta_principal_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_oportunidades_proposta_principal'
        ) THEN
          ALTER TABLE "oportunidades"
          ADD CONSTRAINT "FK_oportunidades_proposta_principal"
          FOREIGN KEY ("proposta_principal_id")
          REFERENCES "propostas"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_proposta_principal_id"
      ON "oportunidades" ("proposta_principal_id")
      WHERE "proposta_principal_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_oportunidades_proposta_principal_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "oportunidades"
      DROP CONSTRAINT IF EXISTS "FK_oportunidades_proposta_principal"
    `);

    await queryRunner.query(`
      ALTER TABLE "oportunidades"
      DROP COLUMN IF EXISTS "proposta_principal_id"
    `);
  }
}
