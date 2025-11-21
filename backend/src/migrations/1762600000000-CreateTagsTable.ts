import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTagsTable1762600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela tags
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'cor',
            type: 'varchar',
            length: '7',
            isNullable: false,
            comment: 'Cor em formato hexadecimal #RRGGBB',
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'empresaId',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID da empresa (multi-tenant)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar índice para busca por nome (case-insensitive)
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_TAGS_NOME',
        columnNames: ['nome'],
      }),
    );

    // Criar índice composto para garantir unicidade de nome por empresa
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_TAGS_NOME_EMPRESA',
        columnNames: ['nome', 'empresaId'],
        isUnique: true,
      }),
    );

    // Criar índice para busca de tags ativas
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_TAGS_ATIVO',
        columnNames: ['ativo'],
      }),
    );

    // Criar índice para busca por empresa
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'IDX_TAGS_EMPRESA',
        columnNames: ['empresaId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('tags', 'IDX_TAGS_EMPRESA');
    await queryRunner.dropIndex('tags', 'IDX_TAGS_ATIVO');
    await queryRunner.dropIndex('tags', 'IDX_TAGS_NOME_EMPRESA');
    await queryRunner.dropIndex('tags', 'IDX_TAGS_NOME');

    // Remover tabela
    await queryRunner.dropTable('tags', true);
  }
}
