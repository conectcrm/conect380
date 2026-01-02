/**
 * Script: Habilitar RLS em 23 tabelas via Node.js
 * Usa as credenciais do .env do backend
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function enableRLS() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME || 'conectcrm',
    user: process.env.DATABASE_USERNAME || 'conectcrm',
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    console.log('🔒 Conectando ao banco de dados...');
    const client = await pool.connect();
    
    console.log('✅ Conectado! Habilitando RLS em 23 tabelas...\n');

    // GRUPO 1: Atendimento (14 tabelas)
    const tabelasAtendimento = [
      'atendimento_canais', 'atendimento_filas', 'atendimento_atendentes',
      'atendimento_atendentes_filas', 'atendimento_tickets', 'atendimento_mensagens',
      'atendimento_templates', 'atendimento_tags', 'atendimento_historico',
      'atendimento_integracoes_config', 'atendimento_ai_insights',
      'atendimento_base_conhecimento', 'atendimento_ai_respostas', 'atendimento_ai_metricas'
    ];

    // GRUPO 2: Triagem (5 tabelas)
    const tabelasTriagem = [
      'nucleos_atendimento', 'fluxos_triagem', 'sessoes_triagem',
      'templates_mensagem_triagem', 'metricas_nucleo'
    ];

    // GRUPO 3: Equipes (4 tabelas)
    const tabelasEquipes = [
      'equipes', 'atendente_equipes', 'atendente_atribuicoes', 'equipe_atribuicoes'
    ];

    const todasTabelas = [...tabelasAtendimento, ...tabelasTriagem, ...tabelasEquipes];

    for (const tabela of todasTabelas) {
      try {
        // 1. Habilitar RLS
        await client.query(`ALTER TABLE ${tabela} ENABLE ROW LEVEL SECURITY;`);
        
        // 2. Criar política (se já existir, ignora)
        await client.query(`
          CREATE POLICY tenant_isolation_${tabela} ON ${tabela}
          FOR ALL USING (empresa_id = get_current_tenant());
        `).catch(err => {
          if (err.message.includes('already exists')) {
            console.log(`   ⚠️  Política já existe em ${tabela}`);
          } else {
            throw err;
          }
        });
        
        console.log(`✅ RLS habilitado: ${tabela}`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('already enabled')) {
          console.log(`   ⚠️  RLS já ativo em ${tabela}`);
        } else {
          console.error(`❌ Erro em ${tabela}:`, error.message);
        }
      }
    }

    // Verificação final
    console.log('\n🔍 Verificando status RLS...\n');
    const result = await client.query(`
      SELECT 
        tablename,
        CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as rls_status
      FROM pg_tables 
      WHERE tablename = ANY($1)
      ORDER BY tablename
    `, [todasTabelas]);

    console.table(result.rows);

    const habilitadas = result.rows.filter(r => r.rls_status === '✅').length;
    console.log(`\n🎉 RLS habilitado em ${habilitadas}/${todasTabelas.length} tabelas!`);

    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

enableRLS();
