import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToAtividades1773770000000 implements MigrationInterface {
  name = 'AddEmpresaIdToAtividades1773770000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD COLUMN "empresa_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "atividades" a
      SET empresa_id = o.empresa_id
      FROM oportunidades o
      WHERE a."oportunidade_id" = o.id
    `);

    await queryRunner.query(`
      UPDATE "atividades"
      SET empresa_id = '11111111-1111-1111-1111-111111111111'
      WHERE empresa_id IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ALTER COLUMN "empresa_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "atividades"
      ADD CONSTRAINT "FK_atividades_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_atividades_empresa_id"
      ON "atividades" ("empresa_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_atividades_empresa_id"`);
    await queryRunner.query(`ALTER TABLE "atividades" DROP CONSTRAINT "FK_atividades_empresa"`);
    await queryRunner.query(`ALTER TABLE "atividades" DROP COLUMN "empresa_id"`);
  }
}
