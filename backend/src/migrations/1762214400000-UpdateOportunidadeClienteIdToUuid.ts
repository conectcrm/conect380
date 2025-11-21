import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOportunidadeClienteIdToUuid1762214400000 implements MigrationInterface {
  name = 'UpdateOportunidadeClienteIdToUuid1762214400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "cliente_id"');
    await queryRunner.query('ALTER TABLE "oportunidades" ADD "cliente_id" uuid');
    await queryRunner.query(
      'ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_oportunidades_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "oportunidades" DROP CONSTRAINT IF EXISTS "FK_oportunidades_cliente"',
    );
    await queryRunner.query('ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "cliente_id"');
    await queryRunner.query('ALTER TABLE "oportunidades" ADD "cliente_id" integer');
  }
}
