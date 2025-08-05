/**
 * Debug simples para verificar o retorno da API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function debugSimples() {
  console.log('🔍 Debug simples da API...\n');

  const token = 'PROP-2025-043';

  try {
    console.log(`Fazendo requisição para: ${BASE_URL}/api/portal/proposta/${token}`);

    const response = await axios.get(`${BASE_URL}/api/portal/proposta/${token}`);

    console.log('Status:', response.status);
    console.log('Dados completos:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugSimples();
