import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CriarTabelaConfiguracaoInatividade1730854800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'atendimento_configuracao_inatividade',
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
            name: 'timeout_minutos',
            type: 'integer',
            default: 1440,
            comment: 'Tempo em minutos sem interação do cliente para fechar automaticamente',
          },
          {
            name: 'enviar_aviso',
            type: 'boolean',
            default: true,
            comment: 'Enviar mensagem avisando que ticket será fechado por inatividade',
          },
          {
            name: 'aviso_minutos_antes',
            type: 'integer',
            default: 60,
            comment: 'Quantos minutos antes do fechamento enviar o aviso',
          },
          {
            name: 'mensagem_aviso',
            type: 'text',
            isNullable: true,
            comment: 'Mensagem enviada como aviso de fechamento iminente',
          },
          {
            name: 'mensagem_fechamento',
            type: 'text',
            isNullable: true,
            comment: 'Mensagem enviada ao fechar por inatividade',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            comment: 'Se o fechamento automático está ativo',
          },
          {
            name: 'status_aplicaveis',
            type: 'jsonb',
            isNullable: true,
            comment: 'Lista de status onde aplicar fechamento automático. Null = todos',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índice único por empresa
    await queryRunner.createIndex(
      'atendimento_configuracao_inatividade',
      new TableIndex({
        name: 'IDX_configuracao_inatividade_empresa',
        columnNames: ['empresa_id'],
        isUnique: true,
      }),
    );

    // Índice para buscar apenas configs ativas
    await queryRunner.createIndex(
      'atendimento_configuracao_inatividade',
      new TableIndex({
        name: 'IDX_configuracao_inatividade_ativo',
        columnNames: ['ativo'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('atendimento_configuracao_inatividade');
  }
}
