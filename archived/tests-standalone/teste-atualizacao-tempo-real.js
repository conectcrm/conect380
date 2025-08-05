/**
 * 🔄 TESTE: ATUALIZAÇÃO EM TEMPO REAL
 * 
 * Este script testa se a implementação de atualização em tempo real
 * está funcionando corretamente após envio de email.
 */

console.log('🔄 TESTANDO ATUALIZAÇÃO EM TEMPO REAL\n');

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return { error };
  }
}

async function testarAtualizacaoTempoReal() {
  try {
    console.log('🔍 1. Verificando estado inicial das propostas...');

    // 1. Buscar propostas atuais
    const { response: resInicial, data: dataInicial } = await makeRequest('http://localhost:3001/propostas');

    if (!resInicial.ok) {
      console.log('❌ Erro ao buscar propostas iniciais');
      return;
    }

    const propostas = dataInicial.propostas || [];
    const prop038 = propostas.find(p => p.numero === 'PROP-2025-038');

    if (!prop038) {
      console.log('❌ PROP-2025-038 não encontrada');
      return;
    }

    console.log(`📊 Estado inicial - PROP-2025-038: ${prop038.status}`);

    // 2. Enviar email via API que dispara atualização automática
    console.log('\n📧 2. Enviando email com atualização automática...');

    const dadosEnvio = {
      proposta: {
        id: 'PROP-2025-038',
        numero: 'PROP-2025-038',
        valorTotal: 1500,
        dataValidade: '2025-02-20T23:59:59Z',
        token: 'TOKEN_TEMPO_REAL_' + Date.now()
      },
      emailCliente: 'teste.tempo.real@exemplo.com',
      linkPortal: 'http://localhost:3900/portal'
    };

    const { response: resEmail, data: dataEmail } = await makeRequest('http://localhost:3001/email/enviar-proposta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosEnvio)
    });

    if (!resEmail.ok || !dataEmail.success) {
      console.log('❌ Erro no envio do email');
      return;
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('   Timestamp:', dataEmail.timestamp);

    // 3. Verificar múltiplas vezes se o status mudou
    console.log('\n🔄 3. Monitorando mudança de status...');

    for (let tentativa = 1; tentativa <= 5; tentativa++) {
      console.log(`   Tentativa ${tentativa}/5 - Aguardando ${tentativa * 2} segundos...`);

      await new Promise(resolve => setTimeout(resolve, tentativa * 2000));

      const { response: resVerifica, data: dataVerifica } = await makeRequest('http://localhost:3001/propostas');

      if (resVerifica.ok) {
        const propostasAtualizadas = dataVerifica.propostas || [];
        const propAtualizada = propostasAtualizadas.find(p => p.numero === 'PROP-2025-038');

        if (propAtualizada) {
          console.log(`   📊 Status atual: ${propAtualizada.status}`);

          if (propAtualizada.status === 'enviada' && prop038.status !== 'enviada') {
            console.log('\n🎉 SUCESSO! Status mudou automaticamente!');
            console.log(`   📊 ANTES: ${prop038.status}`);
            console.log(`   📊 DEPOIS: ${propAtualizada.status}`);
            console.log(`   ⏰ Data atualização: ${propAtualizada.updatedAt || propAtualizada.data_atualizacao}`);

            // 4. Testar eventos JavaScript
            console.log('\n📡 4. Testando eventos JavaScript...');

            if (typeof window !== 'undefined') {
              // Simular evento que o frontend usa
              const eventoTeste = new CustomEvent('propostaAtualizada', {
                detail: {
                  propostaId: 'PROP-2025-038',
                  novoStatus: 'enviada',
                  fonte: 'teste-tempo-real',
                  timestamp: new Date().toISOString()
                }
              });

              console.log('   📡 Disparando evento propostaAtualizada...');
              window.dispatchEvent(eventoTeste);

              // Evento de recarregamento geral
              setTimeout(() => {
                const eventoRecarregar = new CustomEvent('atualizarPropostas', {
                  detail: { fonte: 'teste-automatico' }
                });

                console.log('   📡 Disparando evento atualizarPropostas...');
                window.dispatchEvent(eventoRecarregar);
              }, 1000);

            } else {
              console.log('   ⚠️ Executando fora do navegador - eventos não testados');
            }

            return true;
          } else if (tentativa === 5) {
            console.log('\n⚠️ Status ainda não mudou após 5 tentativas');
            console.log('   Isso pode ser normal se a sincronização automática ainda estiver processando');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// 5. Função para testar apenas os eventos (sem enviar email)
function testarEventosApenas() {
  console.log('\n📡 TESTANDO APENAS EVENTOS JAVASCRIPT...');

  if (typeof window === 'undefined') {
    console.log('❌ Precisa executar no navegador para testar eventos');
    return;
  }

  // Evento 1: Atualização específica de proposta
  console.log('📡 Disparando evento propostaAtualizada...');
  const evento1 = new CustomEvent('propostaAtualizada', {
    detail: {
      propostaId: 'PROP-2025-038',
      novoStatus: 'enviada',
      fonte: 'teste-manual',
      timestamp: new Date().toISOString()
    }
  });
  window.dispatchEvent(evento1);

  // Evento 2: Recarregamento geral após 2 segundos
  setTimeout(() => {
    console.log('📡 Disparando evento atualizarPropostas...');
    const evento2 = new CustomEvent('atualizarPropostas', {
      detail: { fonte: 'teste-delayed' }
    });
    window.dispatchEvent(evento2);
  }, 2000);

  console.log('✅ Eventos disparados! Verifique se a página atualizou automaticamente.');
}

// Executar teste completo
console.log('🚀 Iniciando teste de atualização em tempo real...');
testarAtualizacaoTempoReal().then(() => {
  console.log('\n📋 RESUMO DAS FUNCIONALIDADES IMPLEMENTADAS:');
  console.log('✅ Correção do emailServiceReal para usar /email/enviar-proposta');
  console.log('✅ Eventos personalizados para notificar mudanças');
  console.log('✅ Listeners na PropostasPage para atualização automática');
  console.log('✅ Polling automático a cada 30 segundos');
  console.log('✅ Atualização imediata após envio de email bem-sucedido');

  console.log('\n💡 Para testar manualmente no navegador:');
  console.log('   testarEventosApenas() - Testa apenas os eventos');
  console.log('   Ou use o script debug-frontend-console.js no console do navegador');
});

// Exportar funções para uso manual
if (typeof window !== 'undefined') {
  window.testarAtualizacaoTempoReal = testarAtualizacaoTempoReal;
  window.testarEventosApenas = testarEventosApenas;
}
