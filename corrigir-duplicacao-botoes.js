/**
 * 🔧 Script de Correção: Remover emojis de número duplicados
 * 
 * PROBLEMA:
 * - Mensagem de boas-vindas tem: "1️⃣ 🔧 Suporte Técnico"
 * - Código do flow-engine adiciona emoji de novo na linha 314
 * - Resultado: "1️⃣1️⃣ Suporte Técnico" (duplicado!)
 * 
 * SOLUÇÃO:
 * - Remover emojis de número (1️⃣, 2️⃣, etc.) da mensagem estática
 * - Deixar apenas ícones categóricos (🔧, 💰, 📊)
 * - O código do flow-engine adiciona os números dinamicamente
 * 
 * RESULTADO ESPERADO:
 * - Mensagem: "🔧 Suporte Técnico\n💰 Financeiro\n📊 Comercial"
 * - Flow-engine adiciona: "1️⃣ 🔧 Suporte Técnico" (correto!)
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'conectcrm_db',
  user: 'conectcrm',
  password: 'conectcrm123',
});

// Nova mensagem SEM emojis de número
const NOVA_MENSAGEM_BOAS_VINDAS = `👋 Olá! Eu sou a assistente virtual da ConectCRM.

Como posso te ajudar hoje?

🔧 Suporte Técnico
💰 Financeiro
📊 Comercial
📋 Acompanhar atendimento
👤 Falar com humano

❌ Digite SAIR para cancelar`;

async function corrigirMensagemBoasVindas() {
  try {
    console.log('🔧 Iniciando correção da mensagem de boas-vindas...\n');

    // 1. Buscar fluxos ativos
    const result = await pool.query(`
      SELECT 
        id, 
        nome, 
        estrutura 
      FROM fluxos_triagem 
      WHERE ativo = true
    `);

    console.log(`✅ Encontrados ${result.rows.length} fluxos ativos\n`);

    let fluxosAtualizados = 0;

    // 2. Atualizar cada fluxo
    for (const fluxo of result.rows) {
      const estrutura = fluxo.estrutura;

      if (!estrutura?.etapas?.['boas-vindas']) {
        console.log(`⏭️  Pulando fluxo "${fluxo.nome}" (sem etapa boas-vindas)\n`);
        continue;
      }

      const etapaBoasVindas = estrutura.etapas['boas-vindas'];
      const mensagemAtual = etapaBoasVindas.mensagem || '';

      // Verifica se tem os emojis de número para corrigir
      const temEmojisNumero = mensagemAtual.includes('1️⃣') ||
        mensagemAtual.includes('2️⃣') ||
        mensagemAtual.includes('3️⃣') ||
        mensagemAtual.includes('4️⃣') ||
        mensagemAtual.includes('0️⃣');

      if (!temEmojisNumero) {
        console.log(`✅ Fluxo "${fluxo.nome}" já está correto (sem emojis de número)\n`);
        continue;
      }

      console.log(`📝 Atualizando fluxo: ${fluxo.nome}`);
      console.log(`   Mensagem atual (primeiras linhas):`);
      console.log(`   ${mensagemAtual.substring(0, 100)}...`);
      console.log('');

      // Atualizar mensagem
      etapaBoasVindas.mensagem = NOVA_MENSAGEM_BOAS_VINDAS;

      // Salvar no banco
      await pool.query(
        `UPDATE fluxos_triagem 
         SET estrutura = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(estrutura), fluxo.id]
      );

      fluxosAtualizados++;
      console.log(`   ✅ Mensagem atualizada com sucesso!\n`);
    }

    // 3. Resumo
    console.log('═'.repeat(80));
    console.log('📊 RESUMO:');
    console.log(`   • Fluxos analisados: ${result.rows.length}`);
    console.log(`   • Fluxos atualizados: ${fluxosAtualizados}`);
    console.log(`   • Fluxos que já estavam corretos: ${result.rows.length - fluxosAtualizados}`);
    console.log('═'.repeat(80));
    console.log('');
    console.log('✅ Processo concluído!');
    console.log('');
    console.log('📌 PRÓXIMO PASSO:');
    console.log('   1. Reiniciar o backend: cd backend && npm run start:dev');
    console.log('   2. Testar no WhatsApp');
    console.log('   3. Verificar se os botões aparecem como: "1️⃣ 🔧 Suporte Técnico"');
    console.log('');

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

// Executar
corrigirMensagemBoasVindas();
