import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDepartamentos1729180000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela departamentos
    await queryRunner.createTable(
      new Table({
        name: 'departamentos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'empresa_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'nucleo_id',
            type: 'uuid',
            isNullable: false,
          },
          // Identificação
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'codigo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'cor',
            type: 'varchar',
            length: '7',
            default: "'#6366F1'",
          },
          {
            name: 'icone',
            type: 'varchar',
            length: '50',
            default: "'briefcase'",
          },
          // Status
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'ordem',
            type: 'integer',
            default: 0,
          },
          // Equipe
          {
            name: 'atendentes_ids',
            type: 'uuid[]',
            default: "'{}'",
          },
          {
            name: 'supervisor_id',
            type: 'uuid',
            isNullable: true,
          },
          // Horário (opcional - herda do núcleo se null)
          {
            name: 'horario_funcionamento',
            type: 'jsonb',
            isNullable: true,
          },
          // SLA (opcional - herda do núcleo se null)
          {
            name: 'sla_resposta_minutos',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'sla_resolucao_horas',
            type: 'integer',
            isNullable: true,
          },
          // Mensagens Personalizadas
          {
            name: 'mensagem_boas_vindas',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mensagem_transferencia',
            type: 'text',
            isNullable: true,
          },
          // Roteamento
          {
            name: 'tipo_distribuicao',
            type: 'varchar',
            length: '30',
            default: "'round_robin'",
          },
          {
            name: 'capacidade_maxima_tickets',
            type: 'integer',
            default: 30,
          },
          // Skills para roteamento inteligente
          {
            name: 'skills',
            type: 'jsonb',
            isNullable: true,
          },
          // Auditoria
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
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.query(
      `CREATE INDEX idx_departamentos_empresa ON departamentos(empresa_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_departamentos_nucleo ON departamentos(nucleo_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_departamentos_ativo ON departamentos(ativo)`,
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'departamentos',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'empresas',
        onDelete: 'CASCADE',
        name: 'fk_departamentos_empresa',
      }),
    );

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

    await queryRunner.createForeignKey(
      'departamentos',
      new TableForeignKey({
        columnNames: ['supervisor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        name: 'fk_departamentos_supervisor',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('departamentos', 'fk_departamentos_supervisor');
    await queryRunner.dropForeignKey('departamentos', 'fk_departamentos_nucleo');
    await queryRunner.dropForeignKey('departamentos', 'fk_departamentos_empresa');

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_departamentos_ativo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_departamentos_nucleo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_departamentos_empresa`);

    // Remover tabela
    await queryRunner.dropTable('departamentos');
  }
}
