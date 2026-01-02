import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterLogoUrlToText1733155200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar coluna logo_url de varchar para text
    await queryRunner.changeColumn(
      'empresa_configuracoes',
      'logo_url',
      new TableColumn({
        name: 'logo_url',
        type: 'text',
        isNullable: true,
      }),
    );

    console.log('✅ Migration: logo_url alterado para TEXT (suporta base64)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para varchar (pode causar perda de dados se base64 for muito grande)
    await queryRunner.changeColumn(
      'empresa_configuracoes',
      'logo_url',
      new TableColumn({
        name: 'logo_url',
        type: 'varchar',
        isNullable: true,
      }),
    );

    console.log('⚠️  Migration revertida: logo_url voltou para VARCHAR');
  }
}
