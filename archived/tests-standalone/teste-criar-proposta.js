async function testarCriacaoProposta() {
  try {
    console.log('🧪 Testando criação de proposta...');

    const dadosMinimos = {
      titulo: "Proposta Teste API",
      cliente: {
        id: "cliente-teste-001",
        nome: "Cliente de Teste",
        email: "teste@exemplo.com",
        telefone: "(11) 99999-9999"
      },
      produtos: [
        {
          id: "produto-001",
          nome: "Produto Teste",
          precoUnitario: 100.00,
          quantidade: 1,
          desconto: 0,
          subtotal: 100.00
        }
      ],
      subtotal: 100.00,
      descontoGlobal: 0,
      impostos: 0,
      total: 100.00,
      valor: 100.00,
      formaPagamento: "avista",
      validadeDias: 30,
      observacoes: "Proposta criada via teste API",
      incluirImpostosPDF: false
    };

    console.log('📤 Enviando dados:', JSON.stringify(dadosMinimos, null, 2));

    const response = await fetch('http://localhost:3001/propostas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosMinimos)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro HTTP ${response.status}:`, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Resposta:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarCriacaoProposta();
