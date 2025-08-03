// Script para testar conexão com banco e verificar tabelas de assinatura
const { Pool } = require('pg');

async function testDatabaseConnection() {
  const pool = new Pool({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    console.log('🔍 Testando conexão com banco de dados...');

    // Verificar se as tabelas existem
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('planos', 'modulos_sistema', 'assinaturas_empresa', 'plano_modulos')
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas de assinatura encontradas:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    if (tables.rows.length === 0) {
      console.log('❌ Nenhuma tabela de assinatura encontrada!');
      console.log('🔧 Precisamos executar o migration...');

      // Executar migration manual
      console.log('📝 Executando migration de tabelas de assinatura...');

      // Módulos do sistema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "modulos_sistema" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "nome" VARCHAR(100) NOT NULL,
          "codigo" VARCHAR(50) NOT NULL UNIQUE,
          "descricao" TEXT,
          "icone" VARCHAR(50),
          "ativo" BOOLEAN NOT NULL DEFAULT true,
          "ordem" INTEGER NOT NULL DEFAULT 0,
          "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
          "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_modulos_sistema" PRIMARY KEY ("id")
        )
      `);

      // Planos
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "planos" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "nome" VARCHAR(100) NOT NULL,
          "codigo" VARCHAR(50) NOT NULL UNIQUE,
          "descricao" TEXT,
          "preco" DECIMAL(10,2) NOT NULL,
          "limite_usuarios" INTEGER NOT NULL,
          "limite_clientes" INTEGER NOT NULL,
          "limite_storage" BIGINT NOT NULL,
          "limite_api_calls" INTEGER NOT NULL DEFAULT 10000,
          "permite_whitelabel" BOOLEAN NOT NULL DEFAULT false,
          "permite_api" BOOLEAN NOT NULL DEFAULT true,
          "permite_integracao" BOOLEAN NOT NULL DEFAULT true,
          "suporte_prioridade" VARCHAR(20) NOT NULL DEFAULT 'basico',
          "ativo" BOOLEAN NOT NULL DEFAULT true,
          "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
          "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_planos" PRIMARY KEY ("id")
        )
      `);

      // Plano Módulos
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "plano_modulos" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "plano_id" UUID NOT NULL,
          "modulo_id" UUID NOT NULL,
          "incluido" BOOLEAN NOT NULL DEFAULT true,
          "limite_personalizado" INTEGER,
          "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
          "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_plano_modulos" PRIMARY KEY ("id"),
          CONSTRAINT "FK_plano_modulos_plano" FOREIGN KEY ("plano_id") REFERENCES "planos"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_plano_modulos_modulo" FOREIGN KEY ("modulo_id") REFERENCES "modulos_sistema"("id") ON DELETE CASCADE
        )
      `);

      // Assinaturas
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "assinaturas_empresa" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "empresa_id" UUID NOT NULL,
          "plano_id" UUID NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'ativa',
          "data_inicio" TIMESTAMP NOT NULL DEFAULT now(),
          "data_fim" TIMESTAMP,
          "data_cancelamento" TIMESTAMP,
          "valor_pago" DECIMAL(10,2),
          "contador_usuarios" INTEGER NOT NULL DEFAULT 0,
          "contador_clientes" INTEGER NOT NULL DEFAULT 0,
          "contador_storage" BIGINT NOT NULL DEFAULT 0,
          "contador_api_calls" INTEGER NOT NULL DEFAULT 0,
          "ultimo_reset_api" TIMESTAMP NOT NULL DEFAULT now(),
          "configuracoes_personalizadas" JSONB,
          "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
          "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_assinaturas_empresa" PRIMARY KEY ("id"),
          CONSTRAINT "FK_assinaturas_empresa_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_assinaturas_empresa_plano" FOREIGN KEY ("plano_id") REFERENCES "planos"("id") ON DELETE RESTRICT
        )
      `);

      console.log('✅ Tabelas criadas com sucesso!');

      // Inserir dados iniciais
      console.log('📝 Inserindo dados iniciais...');

      // Módulos do sistema
      await pool.query(`
        INSERT INTO "modulos_sistema" ("nome", "codigo", "descricao", "icone", "ordem") VALUES
        ('Dashboard', 'dashboard', 'Painel principal com métricas e KPIs', 'dashboard', 1),
        ('Clientes', 'clientes', 'Gestão de clientes e prospects', 'users', 2),
        ('Propostas', 'propostas', 'Criação e acompanhamento de propostas comerciais', 'file-text', 3),
        ('Contatos', 'contatos', 'Agenda de contatos e relacionamentos', 'phone', 4),
        ('Produtos', 'produtos', 'Catálogo de produtos e serviços', 'package', 5),
        ('Financeiro', 'financeiro', 'Controle financeiro e faturamento', 'dollar-sign', 6),
        ('Configurações', 'configuracoes', 'Configurações do sistema e empresa', 'settings', 7),
        ('Oportunidades', 'oportunidades', 'Pipeline de vendas e oportunidades', 'target', 8),
        ('Agenda', 'agenda', 'Agendamento de reuniões e atividades', 'calendar', 9),
        ('Relatórios', 'relatorios', 'Relatórios e analytics avançados', 'bar-chart', 10)
        ON CONFLICT (codigo) DO NOTHING
      `);

      // Planos
      await pool.query(`
        INSERT INTO "planos" ("nome", "codigo", "descricao", "preco", "limite_usuarios", "limite_clientes", "limite_storage") VALUES
        ('Starter', 'starter', 'Plano ideal para pequenas empresas iniciando no CRM', 99.90, 3, 100, 1073741824),
        ('Professional', 'professional', 'Plano completo para empresas em crescimento', 299.90, 10, 1000, 5368709120),
        ('Enterprise', 'enterprise', 'Solução robusta para grandes empresas', 599.90, 50, 10000, 21474836480)
        ON CONFLICT (codigo) DO NOTHING
      `);

      console.log('✅ Dados iniciais inseridos!');

      // Verificar novamente
      const newTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('planos', 'modulos_sistema', 'assinaturas_empresa', 'plano_modulos')
        ORDER BY table_name;
      `);

      console.log('📊 Tabelas criadas:');
      newTables.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }

    // Verificar dados nos planos
    const planos = await pool.query('SELECT * FROM planos ORDER BY preco');
    console.log('\n📋 Planos disponíveis:');
    planos.rows.forEach(plano => {
      console.log(`  💰 ${plano.nome} (${plano.codigo}) - R$ ${plano.preco}`);
    });

    // Verificar módulos
    const modulos = await pool.query('SELECT * FROM modulos_sistema ORDER BY ordem');
    console.log('\n🧩 Módulos do sistema:');
    modulos.rows.forEach(modulo => {
      console.log(`  📋 ${modulo.nome} (${modulo.codigo})`);
    });

    console.log('\n✅ Database check concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar teste
testDatabaseConnection();
