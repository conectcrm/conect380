import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMetasTable1775000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "metas_tipo_enum" AS ENUM ('mensal', 'trimestral', 'anual')
    `);

    await queryRunner.createTable(
      new Table({
        name: 'metas',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tipo',
            type: 'metas_tipo_enum',
            default: "'mensal'",
          },
          {
            name: 'periodo',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'valor',
            type: 'numeric',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'vendedor_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'regiao',
            type: 'varchar',
            length: '120',
            isNullable: true,
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ativa',
            type: 'boolean',
            default: true,
          },
          {
            name: 'empresa_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'criada_em',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'atualizada_em',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'metas',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'empresas',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`CREATE INDEX "IDX_metas_periodo_tipo" ON "metas" ("periodo", "tipo")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_metas_empresa_periodo" ON "metas" ("empresa_id", "periodo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_metas_ativos" ON "metas" ("ativa") WHERE ativa = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_metas_ativos"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_metas_empresa_periodo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_metas_periodo_tipo"`);

    const metasTable = await queryRunner.getTable('metas');
    if (metasTable) {
      const empresaForeignKey = metasTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('empresa_id'),
      );
      if (empresaForeignKey) {
        await queryRunner.dropForeignKey('metas', empresaForeignKey);
      }
    }

    await queryRunner.dropTable('metas');
    await queryRunner.query(`DROP TYPE IF EXISTS "metas_tipo_enum"`);
  }
}
