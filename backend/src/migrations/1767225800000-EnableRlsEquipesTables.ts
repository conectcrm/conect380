import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Habilitar RLS para tabelas de Equipes e Atribuições
 * 
 * OBJETIVO: Adicionar Row Level Security às 4 tabelas criadas em CreateEquipesAtribuicoesTables
 * 
 * Tabelas protegidas:
 * - equipes
 * - atendente_equipes
 * - atendente_atribuicoes
 * - equipe_atribuicoes
 */
export class EnableRlsEquipesTables1767225800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔒 Habilitando RLS para tabelas de Equipes e Atribuições...');

    const tabelas = [
      'equipes',
      'atendente_equipes',
      'atendente_atribuicoes',
      'equipe_atribuicoes',
    ];

    for (const tabela of tabelas) {
      // 1. Habilitar RLS
      await queryRunner.query(`
        ALTER TABLE ${tabela} ENABLE ROW LEVEL SECURITY;
      `);

      // 2. Criar política de isolamento por tenant
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_${tabela} ON ${tabela}
        FOR ALL 
        USING (empresa_id = get_current_tenant());
      `);

      console.log(`✅ RLS habilitado para ${tabela}`);
    }

    console.log('🎉 RLS habilitado em todas as 4 tabelas de Equipes!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️ Removendo RLS das tabelas de Equipes...');

    const tabelas = [
      'equipes',
      'atendente_equipes',
      'atendente_atribuicoes',
      'equipe_atribuicoes',
    ];

    for (const tabela of tabelas) {
      // Remover política
      await queryRunner.query(`
        DROP POLICY IF EXISTS tenant_isolation_${tabela} ON ${tabela};
      `);

      // Desabilitar RLS
      await queryRunner.query(`
        ALTER TABLE ${tabela} DISABLE ROW LEVEL SECURITY;
      `);

      console.log(`✅ RLS removido de ${tabela}`);
    }
  }
}
