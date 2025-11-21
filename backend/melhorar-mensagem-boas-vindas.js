/**
 * Script para melhorar a mensagem de boas-vindas do bot
 * Adiciona dicas de uso livre e emojis
 * 
 * Executar: node melhorar-mensagem-boas-vindas.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://conectcrm:conectcrm123@localhost:5434/conectcrm_db',
});

const NOVA_MENSAGEM_BOAS_VINDAS = `👋 Olá! Eu sou a assistente virtual da ConectCRM.

Como posso te ajudar hoje?

1️⃣ 🔧 Suporte Técnico
2️⃣ 💰 Financeiro
3️⃣ 📊 Comercial
4️⃣ 📋 Acompanhar atendimento
0️⃣ 👤 Falar com humano

❌ Digite SAIR para cancelar`;

async function melhorarMensagemBoasVindas() {
  const client = await pool.connect();

  try {
    console.log('🔍 Buscando fluxos ativos...\n');

    const result = await client.query(`
      SELECT id, nome, codigo, estrutura 
      FROM fluxos_triagem 
      WHERE ativo = true
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    `);

    console.log(`✅ Encontrados ${result.rows.length} fluxos ativos\n`);

    let atualizados = 0;

    for (const fluxo of result.rows) {
      const estrutura = fluxo.estrutura || {};
      const etapas = estrutura.etapas || {};

      if (etapas['boas-vindas']) {
        console.log(`📝 Atualizando mensagem de boas-vindas no fluxo: ${fluxo.nome}`);

        const mensagemAtual = etapas['boas-vindas'].mensagem || '';

        // Atualizar sempre (forçar nova versão)
        if (mensagemAtual !== NOVA_MENSAGEM_BOAS_VINDAS) {
          etapas['boas-vindas'].mensagem = NOVA_MENSAGEM_BOAS_VINDAS;
          estrutura.etapas = etapas;

          await client.query(
            'UPDATE fluxos_triagem SET estrutura = $1, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(estrutura), fluxo.id]
          );

          console.log(`   ✅ Mensagem atualizada com sucesso!\n`);
          atualizados++;
        } else {
          console.log(`   ℹ️  Mensagem já está atualizada\n`);
        }
      } else {
        console.log(`   ⚠️  Etapa 'boas-vindas' não encontrada no fluxo: ${fluxo.nome}\n`);
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log('📊 RESUMO:');
    console.log(`   • Fluxos analisados: ${result.rows.length}`);
    console.log(`   • Fluxos atualizados: ${atualizados}`);
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
melhorarMensagemBoasVindas();
