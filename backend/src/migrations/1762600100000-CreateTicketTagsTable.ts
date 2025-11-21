import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTicketTagsTable1762600100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de junção ticket_tags (Many-to-Many)
    await queryRunner.createTable(
      new Table({
        name: 'ticket_tags',
        columns: [
          {
            name: 'ticketId',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'tagId',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar foreign key para atendimento_tickets
    await queryRunner.createForeignKey(
      'ticket_tags',
      new TableForeignKey({
        name: 'FK_TICKET_TAGS_TICKET',
        columnNames: ['ticketId'],
        referencedTableName: 'atendimento_tickets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Se ticket for deletado, remove as associações
        onUpdate: 'CASCADE',
      }),
    );

    // Criar foreign key para tags
    await queryRunner.createForeignKey(
      'ticket_tags',
      new TableForeignKey({
        name: 'FK_TICKET_TAGS_TAG',
        columnNames: ['tagId'],
        referencedTableName: 'tags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Se tag for deletada, remove as associações
        onUpdate: 'CASCADE',
      }),
    );

    // Criar índice para busca eficiente de tickets por tag
    await queryRunner.createIndex(
      'ticket_tags',
      new TableIndex({
        name: 'IDX_TICKET_TAGS_TAG',
        columnNames: ['tagId'],
      }),
    );

    // Criar índice para busca eficiente de tags por ticket
    await queryRunner.createIndex(
      'ticket_tags',
      new TableIndex({
        name: 'IDX_TICKET_TAGS_TICKET',
        columnNames: ['ticketId'],
      }),
    );

    // Criar índice composto para queries otimizadas
    await queryRunner.createIndex(
      'ticket_tags',
      new TableIndex({
        name: 'IDX_TICKET_TAGS_COMPOSITE',
        columnNames: ['ticketId', 'tagId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('ticket_tags', 'IDX_TICKET_TAGS_COMPOSITE');
    await queryRunner.dropIndex('ticket_tags', 'IDX_TICKET_TAGS_TICKET');
    await queryRunner.dropIndex('ticket_tags', 'IDX_TICKET_TAGS_TAG');

    // Remover foreign keys
    await queryRunner.dropForeignKey('ticket_tags', 'FK_TICKET_TAGS_TAG');
    await queryRunner.dropForeignKey('ticket_tags', 'FK_TICKET_TAGS_TICKET');

    // Remover tabela
    await queryRunner.dropTable('ticket_tags', true);
  }
}
