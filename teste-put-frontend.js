const axios = require('axios');

// Simular exatamente a requisição do frontend
async function testarPUTFrontend() {
  try {
    console.log('🔬 Testando PUT com dados do frontend...');

    const url = 'http://localhost:3001/planos/c6a051cc-562b-4835-8953-d9f9da0bde43';
    const dados = {
      nome: 'Teste Atualizado',
      codigo: 'teste-updated',
      descricao: 'Plano especial para startups com recursos limitados mas essenciais',
      preco: 149.99,
      limiteUsuarios: 2,
      limiteClientes: 50,
      limiteStorage: 1024,
      limiteApiCalls: 5000
    };

    console.log('📤 Dados a serem enviados:', dados);

    const config = {
      method: 'PUT',
      url: url,
      data: dados,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGNvbmVjdGNybS5jb20iLCJzdWIiOiJhNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0ODAiLCJlbXByZXNhX2lkIjoiZjQ3YWMxMGItNThjYy00MzcyLWE1NjctMGUwMmIyYzNkNDc5Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU0MDY3OTI0LCJleHAiOjE3NTQxNTQzMjR9.a800zGZni-NDxjh-UYdRyvyfzYtdBcad-38ArY4XpYQ'
      }
    };

    console.log('🚀 Enviando requisição...');

    const response = await axios(config);

    console.log('✅ Sucesso!');
    console.log('📊 Status:', response.status);
    console.log('📄 Resposta:', response.data);

  } catch (error) {
    console.log('❌ Erro capturado:');
    console.log('📊 Status:', error.response?.status);
    console.log('📄 Status Text:', error.response?.statusText);
    console.log('🔍 Dados do erro:', error.response?.data);
    console.log('🌍 Headers de resposta:', error.response?.headers);
    console.log('⚠️ Mensagem completa:', error.message);
  }
}

testarPUTFrontend();
