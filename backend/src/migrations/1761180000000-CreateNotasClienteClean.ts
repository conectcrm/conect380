import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNotasClienteClean1761180000000 implements MigrationInterface {
  name = 'CreateNotasClienteClean1761180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela atendimento_notas_cliente
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_notas_cliente',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cliente_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ticket_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'contato_telefone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'empresa_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'conteudo',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'importante',
            type: 'boolean',
            default: false,
          },
          {
            name: 'autor_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Foreign key para autor (users)
    await queryRunner.createForeignKey(
      'atendimento_notas_cliente',
      new TableForeignKey({
        columnNames: ['autor_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índices para performance
    await queryRunner.query(
      `CREATE INDEX "idx_notas_cliente_id" ON "atendimento_notas_cliente" ("cliente_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_ticket_id" ON "atendimento_notas_cliente" ("ticket_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_telefone" ON "atendimento_notas_cliente" ("contato_telefone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_empresa_id" ON "atendimento_notas_cliente" ("empresa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_importante" ON "atendimento_notas_cliente" ("importante")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notas_created_at" ON "atendimento_notas_cliente" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('atendimento_notas_cliente');
  }
}
