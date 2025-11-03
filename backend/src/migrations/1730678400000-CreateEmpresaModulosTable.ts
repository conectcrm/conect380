import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEmpresaModulosTable1730678400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela empresa_modulos
    await queryRunner.createTable(
      new Table({
        name: 'empresa_modulos',
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
            name: 'modulo',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'ATENDIMENTO, CRM, VENDAS, FINANCEIRO, BILLING, ADMINISTRACAO',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'data_ativacao',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'data_expiracao',
            type: 'timestamp',
            isNullable: true,
            comment: 'Null = sem expiração',
          },
          {
            name: 'plano',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'STARTER, BUSINESS, ENTERPRISE',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Criar foreign key para empresas
    await queryRunner.createForeignKey(
      'empresa_modulos',
      new TableForeignKey({
        columnNames: ['empresa_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'empresas',
        onDelete: 'CASCADE',
        name: 'fk_empresa_modulos_empresa',
      }),
    );

    // Criar índice único para empresa_id + modulo
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_empresa_modulo_unique 
      ON empresa_modulos (empresa_id, modulo);
    `);

    // Criar índice para consultas por empresa
    await queryRunner.query(`
      CREATE INDEX idx_empresa_modulos_empresa_id 
      ON empresa_modulos (empresa_id);
    `);

    // Criar índice para consultas por módulo ativo
    await queryRunner.query(`
      CREATE INDEX idx_empresa_modulos_ativo 
      ON empresa_modulos (empresa_id, ativo);
    `);

    // Popular com dados iniciais: todas empresas existentes recebem TODOS os módulos
    // (para compatibilidade - empresas antigas continuam com acesso completo)
    await queryRunner.query(`
      INSERT INTO empresa_modulos (empresa_id, modulo, ativo, plano)
      SELECT e.id, 'ATENDIMENTO', true, 'ENTERPRISE' FROM empresas e
      UNION ALL
      SELECT e.id, 'CRM', true, 'ENTERPRISE' FROM empresas e
      UNION ALL
      SELECT e.id, 'VENDAS', true, 'ENTERPRISE' FROM empresas e
      UNION ALL
      SELECT e.id, 'FINANCEIRO', true, 'ENTERPRISE' FROM empresas e
      UNION ALL
      SELECT e.id, 'BILLING', true, 'ENTERPRISE' FROM empresas e
      UNION ALL
      SELECT e.id, 'ADMINISTRACAO', true, 'ENTERPRISE' FROM empresas e;
    `);

    console.log('✅ Tabela empresa_modulos criada com sucesso');
    console.log('✅ Empresas existentes configuradas com plano ENTERPRISE (todos módulos)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key
    await queryRunner.dropForeignKey('empresa_modulos', 'fk_empresa_modulos_empresa');

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_empresa_modulo_unique;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_empresa_modulos_empresa_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_empresa_modulos_ativo;`);

    // Remover tabela
    await queryRunner.dropTable('empresa_modulos');

    console.log('✅ Tabela empresa_modulos removida');
  }
}
