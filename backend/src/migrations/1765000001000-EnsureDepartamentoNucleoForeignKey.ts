import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class EnsureDepartamentoNucleoForeignKey1765000001000 implements MigrationInterface {
  name = 'EnsureDepartamentoNucleoForeignKey1765000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const departamentosExists = await queryRunner.hasTable('departamentos');
    const nucleosExists = await queryRunner.hasTable('nucleos_atendimento');

    if (!departamentosExists || !nucleosExists) {
      console.log('ℹ️ [Migration] departamentos ou nucleos_atendimento ausentes. Nenhuma FK criada.');
      return;
    }

    const table = await queryRunner.getTable('departamentos');
    const hasFk = table?.foreignKeys.some((fk) => fk.name === 'fk_departamentos_nucleo');

    if (!hasFk) {
      await queryRunner.createForeignKey(
        'departamentos',
        new TableForeignKey({
          columnNames: ['nucleo_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'nucleos_atendimento',
          onDelete: 'CASCADE',
          name: 'fk_departamentos_nucleo',
        }),
      );
      console.log('✅ [Migration] FK fk_departamentos_nucleo criada.');
    } else {
      console.log('ℹ️ [Migration] FK fk_departamentos_nucleo já existe.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const departamentosExists = await queryRunner.hasTable('departamentos');
    if (!departamentosExists) {
      return;
    }

    const table = await queryRunner.getTable('departamentos');
    const fk = table?.foreignKeys.find((foreignKey) => foreignKey.name === 'fk_departamentos_nucleo');

    if (fk) {
      await queryRunner.dropForeignKey('departamentos', fk);
      console.log('✅ [Migration] FK fk_departamentos_nucleo removida.');
    }
  }
}
