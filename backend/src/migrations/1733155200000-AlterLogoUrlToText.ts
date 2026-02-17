import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterLogoUrlToText1733155200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresa_configuracoes';
    const columnName = 'logo_url';

    // Histórico do schema pode não ter essa tabela/coluna nesta etapa.
    // Tornamos a migration resiliente: aplica apenas se existir.
    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) {
      console.log(`⚠️  Migration: tabela "${tableName}" não existe - pulando`);
      return;
    }

    const hasColumn = await queryRunner.hasColumn(tableName, columnName);
    if (!hasColumn) {
      console.log(`⚠️  Migration: coluna "${columnName}" não existe em "${tableName}" - pulando`);
      return;
    }

    // Alterar coluna logo_url de varchar para text
    await queryRunner.changeColumn(
      tableName,
      columnName,
      new TableColumn({
        name: columnName,
        type: 'text',
        isNullable: true,
      }),
    );

    console.log('✅ Migration: logo_url alterado para TEXT (suporta base64)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresa_configuracoes';
    const columnName = 'logo_url';

    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) {
      return;
    }

    const hasColumn = await queryRunner.hasColumn(tableName, columnName);
    if (!hasColumn) {
      return;
    }

    // Reverter para varchar (pode causar perda de dados se base64 for muito grande)
    await queryRunner.changeColumn(
      tableName,
      columnName,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: true,
      }),
    );

    console.log('⚠️  Migration revertida: logo_url voltou para VARCHAR');
  }
}
