import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Habilitar Row Level Security (RLS) em todas as tabelas multi-tenant
 * 
 * OBJETIVO: Garantir isolamento total de dados entre empresas no nível do banco de dados
 * 
 * IMPORTANTE: Esta migration adiciona uma camada CRÍTICA de segurança.
 * Após executá-la, queries sem empresaId correto NÃO retornarão dados de outras empresas.
 */
export class EnableRowLevelSecurity1730476887000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔒 Iniciando habilitação de Row Level Security...');

    // 1. Criar função para definir o tenant atual
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ Função set_current_tenant criada');

    // 2. Criar função para obter o tenant atual
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_current_tenant()
      RETURNS uuid AS $$
      BEGIN
        RETURN current_setting('app.current_tenant_id', true)::uuid;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);
    console.log('✅ Função get_current_tenant criada');

    // Lista de tabelas com empresaId (verificaremos tipos no banco)
    const tabelasComTenant = [
      { tabela: 'clientes', coluna: 'empresa_id' },
      { tabela: 'atendentes', coluna: 'empresaId' },
      { tabela: 'equipes', coluna: 'empresa_id' },
      { tabela: 'departamentos', coluna: 'empresa_id' },
      { tabela: 'fluxos_triagem', coluna: 'empresa_id' },
      { tabela: 'sessoes_triagem', coluna: 'empresa_id' },
      { tabela: 'demandas', coluna: 'empresa_id' },
      { tabela: 'fornecedores', coluna: 'empresa_id' },
      { tabela: 'contas_pagar', coluna: 'empresa_id' },
      { tabela: 'canais_simples', coluna: 'empresaId' },
      { tabela: 'nucleos_atendimento', coluna: 'empresa_id' },
      { tabela: 'triagem_logs', coluna: 'empresa_id' },
      { tabela: 'user_activities', coluna: 'empresa_id' },
      { tabela: 'atendimento_tickets', coluna: 'empresa_id' },
      { tabela: 'notas_cliente', coluna: 'empresa_id' },
      { tabela: 'integracoes_config', coluna: 'empresa_id' },
    ];

    // 3. Habilitar RLS e criar políticas para cada tabela
    for (const { tabela, coluna } of tabelasComTenant) {
      try {
        // Verificar se a tabela existe
        const tabelaExiste = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tabela}'
          );
        `);

        if (!tabelaExiste[0].exists) {
          console.log(`⚠️  Tabela "${tabela}" não existe - pulando...`);
          continue;
        }

        // Verificar se a coluna existe
        const colunaInfo = await queryRunner.query(`
          SELECT 
            column_name, 
            data_type,
            udt_name
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tabela}'
          AND column_name = '${coluna}';
        `);

        if (!colunaInfo || colunaInfo.length === 0) {
          console.log(`⚠️  Coluna "${coluna}" não existe na tabela "${tabela}" - pulando...`);
          continue;
        }

        const tipoDado = colunaInfo[0].udt_name; // Ex: 'uuid', 'varchar', 'int4'

        // Habilitar RLS
        await queryRunner.query(`ALTER TABLE ${tabela} ENABLE ROW LEVEL SECURITY;`);

        // Criar política de isolamento
        const nomePolitica = `tenant_isolation_${tabela}`;

        // Dropar política se já existir (para permitir re-execução)
        await queryRunner.query(`DROP POLICY IF EXISTS ${nomePolitica} ON ${tabela};`);

        // ✅ IMPORTANTE: Usar aspas duplas para colunas camelCase (case-sensitive no PostgreSQL)
        const colunaQuotada = coluna.includes('_') ? coluna : `"${coluna}"`;

        // ✅ CONVERSÃO DE TIPO: Se coluna não é UUID, converter
        const comparacao = tipoDado === 'uuid'
          ? `${colunaQuotada} = get_current_tenant()`
          : `${colunaQuotada}::uuid = get_current_tenant()`;

        // Criar política
        await queryRunner.query(`
          CREATE POLICY ${nomePolitica} ON ${tabela}
          USING (${comparacao});
        `);

        console.log(`✅ RLS habilitado em: ${tabela} (coluna: ${coluna}, tipo: ${tipoDado})`);

      } catch (error) {
        console.error(`❌ Erro ao processar tabela "${tabela}":`, error.message);
        // Continuar para próxima tabela mesmo se houver erro
      }
    }

    // 4. Criar política especial para tabela empresas (sempre visível)
    try {
      const empresasExiste = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'empresas'
        );
      `);

      if (empresasExiste[0].exists) {
        await queryRunner.query(`ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_empresas ON empresas;`);

        // Política: usuário pode ver apenas sua própria empresa
        await queryRunner.query(`
          CREATE POLICY tenant_isolation_empresas ON empresas
          USING (id = get_current_tenant());
        `);

        console.log('✅ RLS habilitado em: empresas');
      }
    } catch (error) {
      console.error('❌ Erro ao processar tabela empresas:', error.message);
    }

    // 5. Criar tabela de auditoria (NOVA)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        usuario_id UUID,
        entidade VARCHAR(50) NOT NULL,
        entidade_id UUID,
        acao VARCHAR(20) NOT NULL,
        dados_anteriores JSONB,
        dados_novos JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Índices para performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON audit_logs(empresa_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs(entidade);`);

    // Habilitar RLS na tabela de auditoria
    await queryRunner.query(`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_audit_logs ON audit_logs
      USING (empresa_id = get_current_tenant());
    `);

    console.log('✅ Tabela audit_logs criada com RLS');

    console.log('');
    console.log('🎉 Row Level Security habilitado com sucesso!');
    console.log('');
    console.log('📝 IMPORTANTE:');
    console.log('   - TODAS as queries agora respeitam o tenant context');
    console.log('   - Use set_current_tenant(uuid) antes de queries');
    console.log('   - Middleware TenantContext fará isso automaticamente');
    console.log('');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔓 Revertendo Row Level Security...');

    const tabelas = [
      'clientes', 'propostas', 'usuarios', 'produtos', 'faturas',
      'atendentes', 'equipes', 'departamentos', 'fluxos_triagem',
      'sessoes_triagem', 'demandas', 'fornecedores', 'contas_pagar',
      'eventos', 'canais_simples', 'nucleos_atendimento', 'triagem_logs',
      'user_activities', 'empresas', 'audit_logs'
    ];

    for (const tabela of tabelas) {
      try {
        const tabelaExiste = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tabela}'
          );
        `);

        if (tabelaExiste[0].exists) {
          // Dropar política
          await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_${tabela} ON ${tabela};`);

          // Desabilitar RLS
          await queryRunner.query(`ALTER TABLE ${tabela} DISABLE ROW LEVEL SECURITY;`);

          console.log(`✅ RLS desabilitado em: ${tabela}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao reverter tabela "${tabela}":`, error.message);
      }
    }

    // Dropar funções
    await queryRunner.query(`DROP FUNCTION IF EXISTS get_current_tenant();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_current_tenant(uuid);`);

    // Dropar tabela de auditoria (opcional - descomentar se quiser remover)
    // await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);

    console.log('✅ Row Level Security revertido');
  }
}
