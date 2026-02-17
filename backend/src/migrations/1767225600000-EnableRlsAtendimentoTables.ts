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
      const hasTable = await queryRunner.hasTable(tabela);
      if (!hasTable) {
        console.log(`⚠️ Tabela ${tabela} não existe. Pulando...`);
        continue;
      }

      // 1. Habilitar RLS (idempotente)
      await queryRunner.query(`ALTER TABLE "${tabela}" ENABLE ROW LEVEL SECURITY;`);

      // 2. Remover policy antiga (se existir) e recriar de forma segura
      await queryRunner.query(
        `DROP POLICY IF EXISTS "tenant_isolation_${tabela}" ON "${tabela}";`,
      );

      const hasEmpresaIdColumn = await queryRunner.query(
        `
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = 'empresa_id'
          LIMIT 1;
        `,
        [tabela],
      );

      const usingExpr =
        hasEmpresaIdColumn?.length > 0
          ? 'empresa_id = get_current_tenant()'
          : tabela === 'atendimento_atendentes_filas'
            ? `EXISTS (
                SELECT 1
                FROM atendimento_atendentes a
                WHERE a.id = atendente_id
                  AND a.empresa_id = get_current_tenant()
              )`
            : null;

      if (!usingExpr) {
        console.log(
          `⚠️ Tabela ${tabela} não possui empresa_id e não há policy alternativa configurada. Pulando policy...`,
        );
        continue;
      }

      await queryRunner.query(
        `
          CREATE POLICY "tenant_isolation_${tabela}" ON "${tabela}"
          FOR ALL
          USING (${usingExpr})
          WITH CHECK (${usingExpr});
        `,
      );

      console.log(`✅ RLS/policy habilitados para ${tabela}`);
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
      const hasTable = await queryRunner.hasTable(tabela);
      if (!hasTable) {
        console.log(`⚠️ Tabela ${tabela} não existe. Pulando...`);
        continue;
      }

      // Remover política
      await queryRunner.query(`
        DROP POLICY IF EXISTS "tenant_isolation_${tabela}" ON "${tabela}";
      `);

      // Desabilitar RLS
      await queryRunner.query(`
        ALTER TABLE "${tabela}" DISABLE ROW LEVEL SECURITY;
      `);

      console.log(`✅ RLS removido de ${tabela}`);
    }
  }
}
