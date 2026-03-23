import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignEmpresasSelfSignupColumns1809004000000 implements MigrationInterface {
  name = 'AlignEmpresasSelfSignupColumns1809004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresas';

    const tableExists = await queryRunner.hasTable(tableName);
    if (!tableExists) {
      return;
    }

    const ensureColumn = async (columnName: string, definition: string): Promise<void> => {
      const exists = await queryRunner.hasColumn(tableName, columnName);
      if (!exists) {
        await queryRunner.query(
          `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`,
        );
      }
    };

    await ensureColumn('data_expiracao', 'timestamp');
    await ensureColumn('email_verificado', 'boolean NOT NULL DEFAULT true');
    await ensureColumn('token_verificacao', 'character varying');
    await ensureColumn('configuracoes', 'json');
    await ensureColumn('limites', 'json');

    await queryRunner.query(`
      UPDATE "${tableName}"
      SET "data_expiracao" = "trial_end_date"
      WHERE "data_expiracao" IS NULL
        AND "trial_end_date" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresas';

    const tableExists = await queryRunner.hasTable(tableName);
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "limites"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "configuracoes"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "token_verificacao"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "email_verificado"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "data_expiracao"`);
  }
}
