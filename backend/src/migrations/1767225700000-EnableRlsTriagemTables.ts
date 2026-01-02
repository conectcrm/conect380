import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Habilitar RLS para tabelas de Triagem/Bot/Núcleos
 * 
 * OBJETIVO: Adicionar Row Level Security às 5 tabelas criadas em CreateTriagemBotNucleosTables
 * 
 * Tabelas protegidas:
 * - nucleos_atendimento
 * - fluxos_triagem
 * - sessoes_triagem
 * - templates_mensagem_triagem
 * - metricas_nucleo
 */
export class EnableRlsTriagemTables1767225700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔒 Habilitando RLS para tabelas de Triagem/Bot/Núcleos...');

    const tabelas = [
      'nucleos_atendimento',
      'fluxos_triagem',
      'sessoes_triagem',
      'templates_mensagem_triagem',
      'metricas_nucleo',
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

    console.log('🎉 RLS habilitado em todas as 5 tabelas de Triagem!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️ Removendo RLS das tabelas de Triagem...');

    const tabelas = [
      'nucleos_atendimento',
      'fluxos_triagem',
      'sessoes_triagem',
      'templates_mensagem_triagem',
      'metricas_nucleo',
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
