import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Sistema de Filas - ETAPA 5
 * 
 * Cria:
 * 1. Tabela filas_atendentes (junction table Fila ↔ User)
 * 2. Adiciona novas colunas na tabela filas:
 *    - estrategia_distribuicao (enum: ROUND_ROBIN | MENOR_CARGA | PRIORIDADE)
 *    - capacidade_maxima (int, default 10)
 *    - distribuicao_automatica (boolean, default false)
 *    - configuracoes (jsonb)
 * 
 * Data: Janeiro 2025
 */
export class CreateSistemaFilas1736380000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 [Migration] Criando Sistema de Filas (ETAPA 5)...');

    // 1. Criar ENUM para estratégia de distribuição
    await queryRunner.query(`
      CREATE TYPE estrategia_distribuicao_enum AS ENUM (
        'ROUND_ROBIN',
        'MENOR_CARGA',
        'PRIORIDADE'
      );
    `);
    console.log('✅ ENUM estrategia_distribuicao_enum criado');

    // 2. Adicionar novas colunas na tabela filas
    await queryRunner.addColumn(
      'filas',
      new TableColumn({
        name: 'estrategia_distribuicao',
        type: 'estrategia_distribuicao_enum',
        default: "'ROUND_ROBIN'",
        comment: 'Estratégia de distribuição de tickets',
      }),
    );
    console.log('✅ Coluna estrategia_distribuicao adicionada em filas');

    await queryRunner.addColumn(
      'filas',
      new TableColumn({
        name: 'capacidade_maxima',
        type: 'integer',
        default: 10,
        comment: 'Capacidade máxima de tickets por atendente',
      }),
    );
    console.log('✅ Coluna capacidade_maxima adicionada em filas');

    await queryRunner.addColumn(
      'filas',
      new TableColumn({
        name: 'distribuicao_automatica',
        type: 'boolean',
        default: false,
        comment: 'Se true, tickets são distribuídos automaticamente',
      }),
    );
    console.log('✅ Coluna distribuicao_automatica adicionada em filas');

    await queryRunner.addColumn(
      'filas',
      new TableColumn({
        name: 'configuracoes',
        type: 'jsonb',
        isNullable: true,
        comment: 'Configurações adicionais (tempoMaximoEspera, prioridadePadrao, notificarAposMinutos)',
      }),
    );
    console.log('✅ Coluna configuracoes adicionada em filas');

    // 3. Criar tabela filas_atendentes (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'filas_atendentes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'filaId',
            type: 'uuid',
            comment: 'ID da fila',
          },
          {
            name: 'atendenteId',
            type: 'uuid',
            comment: 'ID do atendente (User)',
          },
          {
            name: 'capacidade',
            type: 'integer',
            default: 10,
            comment: 'Capacidade do atendente nesta fila específica (1-50)',
          },
          {
            name: 'prioridade',
            type: 'integer',
            default: 5,
            comment: 'Prioridade do atendente nesta fila (1=alta, 10=baixa)',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            comment: 'Se atendente está ativo nesta fila',
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
      }),
      true,
    );
    console.log('✅ Tabela filas_atendentes criada');

    // 4. Criar índice único composto (filaId, atendenteId)
    await queryRunner.createIndex(
      'filas_atendentes',
      new TableIndex({
        name: 'IDX_filas_atendentes_fila_atendente',
        columnNames: ['filaId', 'atendenteId'],
        isUnique: true,
      }),
    );
    console.log('✅ Índice único (filaId, atendenteId) criado');

    // 5. Criar índices individuais para performance
    await queryRunner.createIndex(
      'filas_atendentes',
      new TableIndex({
        name: 'IDX_filas_atendentes_filaId',
        columnNames: ['filaId'],
      }),
    );
    console.log('✅ Índice filaId criado');

    await queryRunner.createIndex(
      'filas_atendentes',
      new TableIndex({
        name: 'IDX_filas_atendentes_atendenteId',
        columnNames: ['atendenteId'],
      }),
    );
    console.log('✅ Índice atendenteId criado');

    // 6. Criar foreign keys
    await queryRunner.createForeignKey(
      'filas_atendentes',
      new TableForeignKey({
        name: 'FK_filas_atendentes_fila',
        columnNames: ['filaId'],
        referencedTableName: 'filas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
    console.log('✅ Foreign key para filas criada');

    await queryRunner.createForeignKey(
      'filas_atendentes',
      new TableForeignKey({
        name: 'FK_filas_atendentes_user',
        columnNames: ['atendenteId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
    console.log('✅ Foreign key para users criada');

    console.log('🎉 [Migration] Sistema de Filas criado com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏪ [Migration] Revertendo Sistema de Filas...');

    // Remover foreign keys
    await queryRunner.dropForeignKey('filas_atendentes', 'FK_filas_atendentes_user');
    await queryRunner.dropForeignKey('filas_atendentes', 'FK_filas_atendentes_fila');
    console.log('✅ Foreign keys removidas');

    // Remover índices
    await queryRunner.dropIndex('filas_atendentes', 'IDX_filas_atendentes_atendenteId');
    await queryRunner.dropIndex('filas_atendentes', 'IDX_filas_atendentes_filaId');
    await queryRunner.dropIndex('filas_atendentes', 'IDX_filas_atendentes_fila_atendente');
    console.log('✅ Índices removidos');

    // Remover tabela filas_atendentes
    await queryRunner.dropTable('filas_atendentes');
    console.log('✅ Tabela filas_atendentes removida');

    // Remover colunas da tabela filas
    await queryRunner.dropColumn('filas', 'configuracoes');
    await queryRunner.dropColumn('filas', 'distribuicao_automatica');
    await queryRunner.dropColumn('filas', 'capacidade_maxima');
    await queryRunner.dropColumn('filas', 'estrategia_distribuicao');
    console.log('✅ Colunas removidas de filas');

    // Remover ENUM
    await queryRunner.query('DROP TYPE estrategia_distribuicao_enum;');
    console.log('✅ ENUM estrategia_distribuicao_enum removido');

    console.log('✅ [Migration] Sistema de Filas revertido com sucesso!');
  }
}
