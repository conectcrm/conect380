import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToContratosEFaturas1763062900000 implements MigrationInterface {
  name = 'AddEmpresaIdToContratosEFaturas1763062900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===========================================================================
    // TABELA: contratos
    // ===========================================================================

    // 1. Adicionar coluna empresa_id como NULLABLE
    await queryRunner.query(`
      ALTER TABLE "contratos" 
      ADD COLUMN "empresa_id" uuid
    `);

    // 2. Popular empresa_id derivando do cliente (clientes JÁ têm empresa_id)
    await queryRunner.query(`
      UPDATE "contratos" c
      SET empresa_id = cl.empresa_id
      FROM clientes cl
      WHERE c."clienteId" = cl.id
    `);

    // 3. Se ainda há contratos sem empresa_id (órfãos), usar empresa padrão
    await queryRunner.query(`
      UPDATE "contratos"
      SET empresa_id = '11111111-1111-1111-1111-111111111111'
      WHERE empresa_id IS NULL
    `);

    // 4. Tornar coluna NOT NULL
    await queryRunner.query(`
      ALTER TABLE "contratos" 
      ALTER COLUMN "empresa_id" SET NOT NULL
    `);

    // 5. Adicionar FK para empresas
    await queryRunner.query(`
      ALTER TABLE "contratos"
      ADD CONSTRAINT "FK_contratos_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    // 6. Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_contratos_empresa_id" 
      ON "contratos" ("empresa_id")
    `);

    // ===========================================================================
    // TABELA: faturas
    // ===========================================================================

    // 1. Adicionar coluna empresa_id como NULLABLE
    await queryRunner.query(`
      ALTER TABLE "faturas" 
      ADD COLUMN "empresa_id" uuid
    `);

    // 2. Popular empresa_id derivando do cliente (clientes JÁ têm empresa_id)
    await queryRunner.query(`
      UPDATE "faturas" f
      SET empresa_id = cl.empresa_id
      FROM clientes cl
      WHERE f."clienteId" = cl.id
    `);

    // 3. Se ainda há faturas sem empresa_id (órfãos), usar empresa padrão
    await queryRunner.query(`
      UPDATE "faturas"
      SET empresa_id = '11111111-1111-1111-1111-111111111111'
      WHERE empresa_id IS NULL
    `);

    // 4. Tornar coluna NOT NULL
    await queryRunner.query(`
      ALTER TABLE "faturas" 
      ALTER COLUMN "empresa_id" SET NOT NULL
    `);

    // 5. Adicionar FK para empresas
    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD CONSTRAINT "FK_faturas_empresa"
      FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    // 6. Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_faturas_empresa_id" 
      ON "faturas" ("empresa_id")
    `);

    console.log('✅ empresa_id adicionado a contratos e faturas com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ===========================================================================
    // REVERTER TABELA: faturas
    // ===========================================================================

    await queryRunner.query(`DROP INDEX "public"."IDX_faturas_empresa_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP CONSTRAINT "FK_faturas_empresa"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "empresa_id"`);

    // ===========================================================================
    // REVERTER TABELA: contratos
    // ===========================================================================

    await queryRunner.query(`DROP INDEX "public"."IDX_contratos_empresa_id"`);
    await queryRunner.query(`ALTER TABLE "contratos" DROP CONSTRAINT "FK_contratos_empresa"`);
    await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "empresa_id"`);

    console.log('✅ empresa_id removido de contratos e faturas (rollback)');
  }
}
