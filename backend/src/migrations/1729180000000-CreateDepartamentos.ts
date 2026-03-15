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
      `CREATE INDEX IF NOT EXISTS idx_departamentos_empresa ON departamentos(empresa_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_departamentos_nucleo ON departamentos(nucleo_id)`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_departamentos_ativo ON departamentos(ativo)`);

    // Criar foreign keys (idempotente para permitir reexecuÃ§Ã£o segura)
    const table = await queryRunner.getTable('departamentos');
    const hasFk = (name: string) => table?.foreignKeys?.some((fk) => fk.name === name);

    if (!hasFk('fk_departamentos_empresa')) {
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
    }

    // Nem sempre a tabela `nucleos_atendimento` existe nesta etapa do histórico.
    // Se ela ainda não existir, pulamos a FK aqui e ela será criada por migrations posteriores.
    const hasNucleosTable = await queryRunner.hasTable('nucleos_atendimento');
    if (hasNucleosTable && !hasFk('fk_departamentos_nucleo')) {
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
    }

    if (!hasFk('fk_departamentos_supervisor')) {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys (de forma segura, pois algumas podem não existir)
    const table = await queryRunner.getTable('departamentos');
    if (table) {
      const fkSupervisor = table.foreignKeys.find((fk) => fk.name === 'fk_departamentos_supervisor');
      if (fkSupervisor) {
        await queryRunner.dropForeignKey('departamentos', fkSupervisor);
      }

      const fkNucleo = table.foreignKeys.find((fk) => fk.name === 'fk_departamentos_nucleo');
      if (fkNucleo) {
        await queryRunner.dropForeignKey('departamentos', fkNucleo);
      }

      const fkEmpresa = table.foreignKeys.find((fk) => fk.name === 'fk_departamentos_empresa');
      if (fkEmpresa) {
        await queryRunner.dropForeignKey('departamentos', fkEmpresa);
      }
    }

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_departamentos_ativo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_departamentos_nucleo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_departamentos_empresa`);

    // Remover tabela
    await queryRunner.dropTable('departamentos');
  }
}
