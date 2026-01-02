import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Habilitar RLS para tabelas de Atendimento
 * 
 * OBJETIVO: Adicionar Row Level Security às 14 tabelas criadas em CreateAtendimentoTables
 * 
 * Tabelas protegidas:
 * - atendimento_canais
 * - atendimento_filas
 * - atendimento_atendentes
 * - atendimento_atendentes_filas
 * - atendimento_tickets
 * - atendimento_mensagens
 * - atendimento_templates
 * - atendimento_tags
 * - atendimento_historico
 * - atendimento_integracoes_config
 * - atendimento_ai_insights
 * - atendimento_base_conhecimento
 * - atendimento_ai_respostas
 * - atendimento_ai_metricas
 */
export class EnableRlsAtendimentoTables1767225600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔒 Habilitando RLS para tabelas de Atendimento...');

    const tabelas = [
      'atendimento_canais',
      'atendimento_filas',
      'atendimento_atendentes',
      'atendimento_atendentes_filas',
      'atendimento_tickets',
      'atendimento_mensagens',
      'atendimento_templates',
      'atendimento_tags',
      'atendimento_historico',
      'atendimento_integracoes_config',
      'atendimento_ai_insights',
      'atendimento_base_conhecimento',
      'atendimento_ai_respostas',
      'atendimento_ai_metricas',
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

    console.log('🎉 RLS habilitado em todas as 14 tabelas de Atendimento!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️ Removendo RLS das tabelas de Atendimento...');

    const tabelas = [
      'atendimento_canais',
      'atendimento_filas',
      'atendimento_atendentes',
      'atendimento_atendentes_filas',
      'atendimento_tickets',
      'atendimento_mensagens',
      'atendimento_templates',
      'atendimento_tags',
      'atendimento_historico',
      'atendimento_integracoes_config',
      'atendimento_ai_insights',
      'atendimento_base_conhecimento',
      'atendimento_ai_respostas',
      'atendimento_ai_metricas',
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
