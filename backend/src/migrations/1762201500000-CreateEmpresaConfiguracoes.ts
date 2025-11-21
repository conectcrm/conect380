import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmpresaConfiguracoes1762201500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tabelaExiste = await queryRunner.hasTable('empresa_configuracoes');

    if (tabelaExiste) {
      console.log(
        '⚠️  Tabela "empresa_configuracoes" já existe. Migration 1762201500000 será ignorada.',
      );
      return;
    }

    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "empresa_configuracoes_senha_complexidade_enum" AS ENUM('baixa', 'media', 'alta')
    `);

    await queryRunner.query(`
      CREATE TYPE "empresa_configuracoes_backup_frequencia_enum" AS ENUM('diario', 'semanal', 'mensal')
    `);

    // Criar tabela empresa_configuracoes
    await queryRunner.createTable(
      new Table({
        name: 'empresa_configuracoes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'empresa_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'descricao',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'site',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'cor_primaria',
            type: 'varchar',
            isNullable: false,
            default: "'#159A9C'",
          },
          {
            name: 'cor_secundaria',
            type: 'varchar',
            isNullable: false,
            default: "'#002333'",
          },
          {
            name: 'autenticacao_2fa',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'sessao_expiracao_minutos',
            type: 'integer',
            isNullable: false,
            default: 30,
          },
          {
            name: 'senha_complexidade',
            type: 'enum',
            enum: ['baixa', 'media', 'alta'],
            isNullable: false,
            default: "'media'",
          },
          {
            name: 'auditoria',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'limite_usuarios',
            type: 'integer',
            isNullable: false,
            default: 10,
          },
          {
            name: 'aprovacao_novo_usuario',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'emails_habilitados',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'servidor_smtp',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'porta_smtp',
            type: 'integer',
            isNullable: false,
            default: 587,
          },
          {
            name: 'smtp_usuario',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'smtp_senha',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'api_habilitada',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'webhooks_ativos',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'backup_automatico',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'backup_frequencia',
            type: 'enum',
            enum: ['diario', 'semanal', 'mensal'],
            isNullable: false,
            default: "'diario'",
          },
          {
            name: 'backup_retencao_dias',
            type: 'integer',
            isNullable: false,
            default: 30,
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
        foreignKeys: [
          {
            columnNames: ['empresa_id'],
            referencedTableName: 'empresas',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Criar índice
    await queryRunner.createIndex(
      'empresa_configuracoes',
      new TableIndex({
        name: 'IDX_empresa_configuracoes_empresa_id',
        columnNames: ['empresa_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tabelaExiste = await queryRunner.hasTable('empresa_configuracoes');

    if (!tabelaExiste) {
      console.log(
        'ℹ️  Tabela "empresa_configuracoes" não existe. Reversão 1762201500000 ignorada.',
      );
      return;
    }

    // Dropar índice
    await queryRunner.dropIndex('empresa_configuracoes', 'IDX_empresa_configuracoes_empresa_id');

    // Dropar tabela
    await queryRunner.dropTable('empresa_configuracoes');

    // Dropar enums
    await queryRunner.query(`DROP TYPE "empresa_configuracoes_backup_frequencia_enum"`);
    await queryRunner.query(`DROP TYPE "empresa_configuracoes_senha_complexidade_enum"`);
  }
}
