/**
 * Script para adicionar etapa de confirmação de atalho nos fluxos
 * 
 * Executar: node adicionar-etapa-atalho.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://conectcrm:conectcrm123@localhost:5434/conectcrm_db',
});

async function adicionarEtapaConfirmacaoAtalho() {
  const client = await pool.connect();

  try {
    console.log('🔍 Verificando fluxos existentes...\n');

    const result = await client.query(`
      SELECT id, nome, codigo, estrutura 
      FROM fluxos_triagem 
      WHERE ativo = true
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT 10
    `);

    console.log(`✅ Encontrados ${result.rows.length} fluxos ativos\n`);

    let atualizados = 0;
    let jaExistentes = 0;

    for (const fluxo of result.rows) {
      const estrutura = fluxo.estrutura || {};
      const etapas = estrutura.etapas || {};

      // Adicionar etapa confirmar-atalho se não existir
      if (!etapas['confirmar-atalho']) {
        console.log(`📝 Adicionando etapa 'confirmar-atalho' no fluxo: ${fluxo.nome}`);

        etapas['confirmar-atalho'] = {
          id: 'confirmar-atalho',
          tipo: 'mensagem_menu',
          mensagem: 'Posso te encaminhar agora para nossa equipe?',
          opcoes: [
            {
              valor: '1',
              texto: 'Sim, pode encaminhar',
              acao: 'transferir_nucleo',
              nucleoContextKey: 'destinoNucleoId'
            },
            {
              valor: '2',
              texto: 'Não, quero escolher outra opção',
              acao: 'proximo_passo',
              proximaEtapa: 'boas-vindas',
              salvarContexto: {
                destinoNucleoId: null,
                areaTitulo: null
              }
            },
            {
              valor: 'sair',
              texto: 'Cancelar atendimento',
              acao: 'finalizar',
              salvarContexto: {
                __mensagemFinal: '👋 Atendimento cancelado. Até logo!'
              }
            }
          ]
        };

        estrutura.etapas = etapas;

        await client.query(
          'UPDATE fluxos_triagem SET estrutura = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(estrutura), fluxo.id]
        );

        console.log(`   ✅ Etapa adicionada com sucesso!\n`);
        atualizados++;
      } else {
        console.log(`   ℹ️  Etapa 'confirmar-atalho' já existe no fluxo: ${fluxo.nome}\n`);
        jaExistentes++;
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log('📊 RESUMO:');
    console.log(`   • Fluxos analisados: ${result.rows.length}`);
    console.log(`   • Fluxos atualizados: ${atualizados}`);
    console.log(`   • Já existentes: ${jaExistentes}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('✅ Processo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
adicionarEtapaConfirmacaoAtalho();
