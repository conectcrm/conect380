/**
 * Teste com token inexistente
 */

const axios = require('axios');

async function testarTokenInexistente() {
  console.log('🧪 Testando token inexistente...\n');

  try {
    const response = await axios.get('http://localhost:3001/api/portal/proposta/TOKEN-INEXISTENTE-123');

    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testarTokenInexistente();
