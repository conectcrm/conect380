console.log('🔄 Testando funcionamento do PropostaActions com a nova proposta...');

// Simular a lógica do PropostaActions
function getClienteData(proposta) {
  console.log('🔍 Analisando proposta:', proposta.numero);
  console.log('👤 Dados do cliente:', proposta.cliente);
  console.log('🏷️  Tipo do cliente:', typeof proposta.cliente);

  if (typeof proposta.cliente === 'object' && proposta.cliente?.email) {
    console.log('✅ Cliente é objeto com email:', proposta.cliente.email);
    return {
      nome: proposta.cliente.nome,
      email: proposta.cliente.email
    };
  } else if (typeof proposta.cliente === 'string') {
    console.log('⚠️  Cliente é string, tentando extrair email...');
    // Lógica fallback para string
    return {
      nome: proposta.cliente,
      email: null // Não há email disponível
    };
  } else {
    console.log('❌ Formato de cliente não reconhecido');
    return null;
  }
}

// Buscar dados da API
fetch('http://localhost:3001/propostas')
  .then(response => response.json())
  .then(result => {
    if (result.propostas && result.propostas.length > 0) {
      const ultimaProposta = result.propostas[0];
      console.log('\n=== TESTE COM ÚLTIMA PROPOSTA ===');
      const clienteData = getClienteData(ultimaProposta);

      if (clienteData && clienteData.email) {
        console.log('🎉 EMAIL ENCONTRADO! Proposta pode ser enviada para:', clienteData.email);
      } else {
        console.log('❌ Email não encontrado. Envio não é possível.');
      }

      // Testar também com uma proposta mais antiga que tem cliente como string
      const propostaString = result.propostas.find(p => typeof p.cliente === 'string');
      if (propostaString) {
        console.log('\n=== TESTE COM PROPOSTA STRING ===');
        const clienteDataString = getClienteData(propostaString);
        console.log('Resultado para proposta com cliente string:', clienteDataString);
      }
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
