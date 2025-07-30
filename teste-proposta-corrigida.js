const testData = {
  titulo: "Teste - Correção UUID Vendedor",
  cliente: "Dhonleno Freitas",
  valor: 2464,
  observacoes: "Teste para verificar conversão nome -> UUID vendedor",
  vendedor: "Bruno Pereira", // Enviando nome do vendedor
  formaPagamento: "avista",
  validadeDias: 15
};

async function testarCriacaoProposta() {
  try {
    console.log('🧪 Testando criação de proposta com correção UUID...');
    console.log('📤 Dados enviados:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3001/propostas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log(`📨 Status: ${response.status}`);
    console.log(`📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Proposta criada com sucesso!');
        console.log('📦 Resposta:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('✅ Resposta recebida (não JSON):', responseText);
      }
    } else {
      console.log('❌ Erro na criação da proposta');
      console.log('📄 Resposta completa:', responseText);
    }
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

// Executar teste
testarCriacaoProposta();
