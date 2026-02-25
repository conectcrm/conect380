import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlignMetasVendedorIdToUuid1802700000000 implements MigrationInterface {
  name = 'AlignMetasVendedorIdToUuid1802700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasMetas = await queryRunner.hasTable('metas');
    if (!hasMetas) {
      return;
    }

    const metasTable = await queryRunner.getTable('metas');
    if (!metasTable) {
      return;
    }

    const vendedorColumn = metasTable.findColumnByName('vendedor_id');
    const legacyColumn = metasTable.findColumnByName('vendedor_id_legacy_int');

    if (vendedorColumn && vendedorColumn.type !== 'uuid' && !legacyColumn) {
      await queryRunner.renameColumn('metas', 'vendedor_id', 'vendedor_id_legacy_int');
    }

    const refreshedTable = await queryRunner.getTable('metas');
    if (!refreshedTable) {
      return;
    }

    const refreshedVendedor = refreshedTable.findColumnByName('vendedor_id');
    if (!refreshedVendedor) {
      await queryRunner.addColumn(
        'metas',
        new TableColumn({
          name: 'vendedor_id',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_metas_vendedor_id" ON "metas" ("vendedor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasMetas = await queryRunner.hasTable('metas');
    if (!hasMetas) {
      return;
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_metas_vendedor_id"`);

    const metasTable = await queryRunner.getTable('metas');
    if (!metasTable) {
      return;
    }

    const vendedorColumn = metasTable.findColumnByName('vendedor_id');
    const legacyColumn = metasTable.findColumnByName('vendedor_id_legacy_int');

    if (legacyColumn) {
      if (vendedorColumn && vendedorColumn.type === 'uuid') {
        await queryRunner.dropColumn('metas', 'vendedor_id');
      }
      await queryRunner.renameColumn('metas', 'vendedor_id_legacy_int', 'vendedor_id');
      return;
    }

    if (vendedorColumn && vendedorColumn.type === 'uuid') {
      await queryRunner.dropColumn('metas', 'vendedor_id');
      await queryRunner.addColumn(
        'metas',
        new TableColumn({
          name: 'vendedor_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }
  }
}
