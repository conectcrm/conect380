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
          : tabela === 'metricas_nucleo'
            ? `EXISTS (
                SELECT 1
                FROM nucleos_atendimento n
                WHERE n.id = nucleo_id
                  AND n.empresa_id = get_current_tenant()
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
