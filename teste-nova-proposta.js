console.log('🧪 Testando criação de nova proposta...');

const testData = {
  titulo: "Proposta de Teste Email",
  cliente: "João Silva", // Enviando como string (nome do cliente)
  valor: 1500.00,
  observacoes: "Teste de criação de proposta com email",
  vendedor: "Vendedor Teste",
  formaPagamento: "avista",
  validadeDias: 30
};

fetch('http://localhost:3001/propostas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
  .then(response => response.json())
  .then(result => {
    console.log('✅ Resposta da API:', JSON.stringify(result, null, 2));

    if (result.proposta?.cliente) {
      console.log('👤 Cliente processado:', result.proposta.cliente);
      console.log('📧 Email gerado:', result.proposta.cliente.email);
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
