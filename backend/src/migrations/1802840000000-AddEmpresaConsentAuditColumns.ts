import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresaConsentAuditColumns1802840000000 implements MigrationInterface {
  name = 'AddEmpresaConsentAuditColumns1802840000000';

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

    await ensureColumn('termos_aceitos_em', 'timestamp');
    await ensureColumn('termos_aceitos_ip', 'character varying(64)');
    await ensureColumn('termos_aceitos_user_agent', 'text');
    await ensureColumn('termos_aceitos_versao', 'character varying(50)');
    await ensureColumn('privacidade_aceita_versao', 'character varying(50)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresas';

    const tableExists = await queryRunner.hasTable(tableName);
    if (!tableExists) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "privacidade_aceita_versao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "termos_aceitos_versao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "termos_aceitos_user_agent"`,
    );
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "termos_aceitos_ip"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "termos_aceitos_em"`);
  }
}
