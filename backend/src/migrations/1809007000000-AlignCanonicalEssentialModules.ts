import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignCanonicalEssentialModules1809007000000 implements MigrationInterface {
  name = 'AlignCanonicalEssentialModules1809007000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "modulos_sistema"
      SET
        "essencial" = true,
        "ativo" = true,
        "atualizadoEm" = now()
      WHERE UPPER("codigo") IN ('CRM', 'BILLING')
    `);

    await queryRunner.query(`
      UPDATE "modulos_sistema"
      SET
        "essencial" = false,
        "atualizadoEm" = now()
      WHERE UPPER("codigo") = 'ATENDIMENTO'
    `);
  }

  public async down(): Promise<void> {
    // no-op intencional: evita reintroduzir atendimento como essencial.
  }
}

