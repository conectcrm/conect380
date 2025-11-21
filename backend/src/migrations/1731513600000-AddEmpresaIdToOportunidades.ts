import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaIdToOportunidades1731513600000 implements MigrationInterface {
  name = 'AddEmpresaIdToOportunidades1731513600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna empresa_id como nullable temporariamente
    await queryRunner.query(`
      ALTER TABLE "oportunidades" 
      ADD COLUMN "empresa_id" UUID;
    `);

    // 2. Preencher empresa_id com dados existentes
    // Assume que todas as oportunidades pertencem à primeira empresa (ajustar conforme necessário)
    await queryRunner.query(`
      UPDATE "oportunidades" 
      SET "empresa_id" = (SELECT id FROM empresas LIMIT 1)
      WHERE "empresa_id" IS NULL;
    `);

    // 3. Tornar empresa_id NOT NULL
    await queryRunner.query(`
      ALTER TABLE "oportunidades" 
      ALTER COLUMN "empresa_id" SET NOT NULL;
    `);

    // 4. Adicionar foreign key
    await queryRunner.query(`
      ALTER TABLE "oportunidades" 
      ADD CONSTRAINT "FK_oportunidades_empresa" 
      FOREIGN KEY ("empresa_id") 
      REFERENCES "empresas"("id") 
      ON DELETE RESTRICT 
      ON UPDATE CASCADE;
    `);

    // 5. Criar índice para performance
    await queryRunner.query(`
      CREATE INDEX "IDX_oportunidades_empresa_id" 
      ON "oportunidades"("empresa_id");
    `);

    // 6. Criar índice composto para queries comuns (empresa + estágio)
    await queryRunner.query(`
      CREATE INDEX "IDX_oportunidades_empresa_estagio" 
      ON "oportunidades"("empresa_id", "estagio");
    `);

    console.log('✅ Migration AddEmpresaIdToOportunidades executada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter em ordem inversa
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oportunidades_empresa_estagio";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_oportunidades_empresa_id";`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP CONSTRAINT IF EXISTS "FK_oportunidades_empresa";`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN IF EXISTS "empresa_id";`);

    console.log('✅ Migration AddEmpresaIdToOportunidades revertida com sucesso');
  }
}
