console.log('🔍 Buscando última proposta criada...');

fetch('http://localhost:3001/propostas')
  .then(response => response.json())
  .then(result => {
    console.log('✅ Resposta da API:', JSON.stringify(result, null, 2));

    if (result.propostas && result.propostas.length > 0) {
      const ultimaProposta = result.propostas[0];
      console.log('🆔 ID da última proposta:', ultimaProposta.id);
      console.log('👤 Cliente:', ultimaProposta.cliente);
      console.log('🏷️  Tipo do cliente:', typeof ultimaProposta.cliente);

      if (typeof ultimaProposta.cliente === 'object') {
        console.log('📧 Email do cliente:', ultimaProposta.cliente.email);
      } else {
        console.log('⚠️  Cliente é string, não objeto');
      }
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
