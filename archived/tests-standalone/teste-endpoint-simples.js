/**
 * Teste simples para verificar se o endpoint existe
 */

const http = require('http');

function testarEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/portal/proposta/TESTE/acao',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Request Error:', error);
  });

  const data = JSON.stringify({
    acao: 'teste',
    timestamp: new Date().toISOString()
  });

  req.write(data);
  req.end();
}

console.log('🔧 Testando endpoint do portal...');
testarEndpoint();
