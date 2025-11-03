import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateDemandasClean1761180100000 implements MigrationInterface {
  name = 'CreateDemandasClean1761180100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela atendimento_demandas
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_demandas',
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
            name: 'titulo',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '50',
            default: "'outros'",
            comment: 'Tipo da demanda: tecnica, comercial, financeira, suporte, reclamacao, solicitacao, outros',
          },
          {
            name: 'prioridade',
            type: 'varchar',
            length: '20',
            default: "'media'",
            comment: 'Prioridade: baixa, media, alta, urgente',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'aberta'",
            comment: 'Status: aberta, em_andamento, aguardando, concluida, cancelada',
          },
          {
            name: 'data_vencimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'data_conclusao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'responsavel_id',
            type: 'uuid',
            isNullable: true,
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

    // Foreign key para responsável (users)
    await queryRunner.createForeignKey(
      'atendimento_demandas',
      new TableForeignKey({
        columnNames: ['responsavel_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Foreign key para autor (users)
    await queryRunner.createForeignKey(
      'atendimento_demandas',
      new TableForeignKey({
        columnNames: ['autor_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índices para performance
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_cliente_id" ON "atendimento_demandas" ("cliente_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_ticket_id" ON "atendimento_demandas" ("ticket_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_telefone" ON "atendimento_demandas" ("contato_telefone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_empresa_id" ON "atendimento_demandas" ("empresa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_status" ON "atendimento_demandas" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_prioridade" ON "atendimento_demandas" ("prioridade")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_tipo" ON "atendimento_demandas" ("tipo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_responsavel_id" ON "atendimento_demandas" ("responsavel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_data_vencimento" ON "atendimento_demandas" ("data_vencimento")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_demandas_created_at" ON "atendimento_demandas" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('atendimento_demandas');
  }
}
