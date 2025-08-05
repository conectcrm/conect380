const testData = {
  titulo: 'Teste Modal Avançado',
  descricao: 'Teste do modal avançado',
  valor: 15000.00,
  probabilidade: 75,
  estagio: 'leads',
  prioridade: 'high', // Corrigido para inglês
  origem: 'website',
  tags: ['teste', 'modal'],
  dataFechamentoEsperado: '2025-01-31T00:00:00.000Z',
  responsavel_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // UUID válido do usuário criado
  nomeContato: 'Maria Silva',
  emailContato: 'maria@teste.com',
  telefoneContato: '11987654321',
  empresaContato: 'Empresa Teste'
};

console.log('=== DADOS ENVIADOS ===');
console.log(JSON.stringify(testData, null, 2));

fetch('http://localhost:3001/oportunidades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(async response => {
  const responseText = await response.text();
  console.log('\n=== RESPOSTA ===');
  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);
  console.log('Response:', responseText);
  
  if (response.ok) {
    console.log('✅ SUCESSO! Oportunidade criada');
    try {
      const data = JSON.parse(responseText);
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Resposta não é JSON válido');
    }
  } else {
    console.log('❌ ERRO na requisição');
  }
})
.catch(error => {
  console.log('\n❌ ERRO DE REDE:');
  console.log(error.message);
});
