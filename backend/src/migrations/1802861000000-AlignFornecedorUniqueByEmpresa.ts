import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignFornecedorUniqueByEmpresa1802861000000 implements MigrationInterface {
  name = 'AlignFornecedorUniqueByEmpresa1802861000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fornecedores"
      DROP CONSTRAINT IF EXISTS "UQ_36915b17f08ccc3ce20a2f1d37a"
    `);

    await queryRunner.query(`
      ALTER TABLE "fornecedores"
      DROP CONSTRAINT IF EXISTS "uk_fornecedores_cnpj_cpf_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "fornecedores"
      ADD CONSTRAINT "uk_fornecedores_cnpj_cpf_empresa" UNIQUE ("cnpj_cpf", "empresa_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fornecedores"
      DROP CONSTRAINT IF EXISTS "uk_fornecedores_cnpj_cpf_empresa"
    `);

    await queryRunner.query(`
      ALTER TABLE "fornecedores"
      ADD CONSTRAINT "UQ_36915b17f08ccc3ce20a2f1d37a" UNIQUE ("cnpj_cpf")
    `);
  }
}
