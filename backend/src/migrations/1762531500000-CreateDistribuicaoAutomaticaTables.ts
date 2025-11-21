import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDistribuicaoAutomaticaTables1762531500000
  implements MigrationInterface {
  name = 'CreateDistribuicaoAutomaticaTables1762531500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela distribuicao_config
    await queryRunner.createTable(
      new Table({
        name: 'distribuicao_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'filaId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'algoritmo',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'round-robin'",
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'capacidadeMaxima',
            type: 'int',
            default: 10,
          },
          {
            name: 'priorizarOnline',
            type: 'boolean',
            default: true,
          },
          {
            name: 'considerarSkills',
            type: 'boolean',
            default: false,
          },
          {
            name: 'tempoTimeoutMin',
            type: 'int',
            default: 30,
          },
          {
            name: 'permitirOverflow',
            type: 'boolean',
            default: false,
          },
          {
            name: 'filaBackupId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['filaId'],
            referencedTableName: 'filas',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['filaBackupId'],
            referencedTableName: 'filas',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Criar tabela distribuicao_log
    await queryRunner.createTable(
      new Table({
        name: 'distribuicao_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticketId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'atendenteId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'filaId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'algoritmo',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'motivo',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cargaAtendente',
            type: 'int',
            default: 0,
          },
          {
            name: 'realocacao',
            type: 'boolean',
            default: false,
          },
          {
            name: 'motivoRealocacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['ticketId'],
            referencedTableName: 'atendimento_tickets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['atendenteId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['filaId'],
            referencedTableName: 'filas',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Criar tabela atendente_skills
    await queryRunner.createTable(
      new Table({
        name: 'atendente_skills',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'atendenteId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'skill',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'nivel',
            type: 'int',
            default: 1,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['atendenteId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('atendente_skills');
    await queryRunner.dropTable('distribuicao_log');
    await queryRunner.dropTable('distribuicao_config');
  }
}
