import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToPagamentos1763275000000 implements MigrationInterface {
  name = 'AddEmpresaIdToPagamentos1763275000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna empresa_id como nullable para evitar falha em dados existentes
    await queryRunner.query(`
      ALTER TABLE "pagamentos"
      ADD COLUMN "empresa_id" uuid
    `);

    // 2. Popular empresa_id derivando da fatura associada (faturas já possuem empresa_id)
    await queryRunner.query(`
      UPDATE "pagamentos" p
      SET empresa_id = f.empresa_id
      FROM faturas f
      WHERE p."faturaId" = f.id
    `);

    // 3. Garantir fallback para registros órfãos usando empresa padrão (mesmo valor usado nas demais migrations)
    await queryRunner.query(`
      UPDATE "pagamentos"
      SET empresa_id = '11111111-1111-1111-1111-111111111111'
      WHERE empresa_id IS NULL
    `);

    // 4. Tornar coluna obrigatória
    await queryRunner.query(`
      ALTER TABLE "pagamentos"
      ALTER COLUMN "empresa_id" SET NOT NULL
    `);

    // 5. Criar relacionamento e índice para consultas multi-tenant
    await queryRunner.query(`
      ALTER TABLE "pagamentos"
      ADD CONSTRAINT "FK_pagamentos_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_pagamentos_empresa_id"
      ON "pagamentos" ("empresa_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_pagamentos_empresa_id"`);
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP CONSTRAINT "FK_pagamentos_empresa"`);
    await queryRunner.query(`ALTER TABLE "pagamentos" DROP COLUMN "empresa_id"`);
  }
}
