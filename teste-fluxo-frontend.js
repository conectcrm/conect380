// Teste completo do fluxo frontend → backend

console.log('🧪 Iniciando teste completo do fluxo de envio de email');

// Simular o que acontece no PropostaActions
async function testeFluxoCompleto() {
  try {
    // 1. Dados da proposta (simulando dados do frontend)
    const proposta = {
      id: 'bde80b1d-02a2-4532-a868-bc8e7b59a715',
      numero: 'PROP-2025-009',
      titulo: 'Propostas Dhon',
      status: 'rascunho' // Status inicial
    };

    console.log('📋 Estado inicial da proposta:');
    console.log(`  ID: ${proposta.id}`);
    console.log(`  Status: ${proposta.status}`);

    // 2. Verificar status atual no backend
    console.log('\n🔍 Verificando status atual no backend...');
    const fetch = require('node-fetch');

    const response = await fetch(`http://localhost:3001/propostas/${proposta.id}`);
    const currentData = await response.json();

    console.log('📊 Status atual no backend:', currentData.proposta.status);

    // 3. Simular envio de email (sem realmente enviar)
    console.log('\n📧 Simulando envio de email...');

    // 4. Atualizar status via API
    console.log('🔄 Atualizando status para "enviada"...');

    const updateResponse = await fetch(`http://localhost:3001/propostas/${proposta.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'enviada' })
    });

    const updateResult = await updateResponse.json();
    console.log('✅ Resultado da atualização:', updateResult);

    // 5. Verificar se status foi atualizado
    console.log('\n🔍 Verificando status após atualização...');

    const verifyResponse = await fetch(`http://localhost:3001/propostas/${proposta.id}`);
    const verifyData = await verifyResponse.json();

    console.log('📊 Status após atualização:', verifyData.proposta.status);

    // 6. Simular recarregamento da lista (que carregarPropostas faz)
    console.log('\n📋 Simulando carregamento da lista...');

    const listResponse = await fetch('http://localhost:3001/propostas');
    const listData = await listResponse.json();

    const propostaAtualizada = listData.propostas.find(p => p.id === proposta.id);
    console.log('📊 Status na lista:', propostaAtualizada?.status);

    // 7. Comparar timestamps
    console.log('\n⏰ Comparando timestamps:');
    console.log('  Individual endpoint updatedAt:', verifyData.proposta.updatedAt);
    console.log('  Lista endpoint updatedAt:', propostaAtualizada?.updatedAt);

    // 8. Verificar se há diferenças
    if (verifyData.proposta.status === propostaAtualizada?.status) {
      console.log('✅ Status consistente entre endpoints!');
    } else {
      console.log('❌ INCONSISTÊNCIA detectada:');
      console.log(`  Individual: ${verifyData.proposta.status}`);
      console.log(`  Lista: ${propostaAtualizada?.status}`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testeFluxoCompleto().catch(console.error);
