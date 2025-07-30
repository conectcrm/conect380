/**
 * Simular apenas a aprovação da PROP-2025-045 e ver exatamente onde falha
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001';
const PROP_NUMERO = 'PROP-2025-045';

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: parsedData,
            text: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: null,
            text: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testarAprovacao() {
  console.log('🧪 Teste de Aprovação - PROP-2025-045');
  console.log('====================================\n');

  // 1. Primeiro, resetar para "enviada" para simular o cenário real
  console.log('1️⃣ Primeiro, verificando status atual...');

  try {
    const listResponse = await makeRequest(`${BASE_URL}/propostas`);
    if (listResponse.ok) {
      const propostas = listResponse.data.propostas;
      const prop045 = propostas.find(p => p.numero === PROP_NUMERO);

      if (prop045) {
        console.log(`   Status atual: ${prop045.status}`);
        console.log(`   ID: ${prop045.id}`);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao verificar status:', error.message);
  }

  // 2. Tentar aprovação
  console.log('\n2️⃣ Executando aprovação via portal...');

  const acaoData = {
    acao: 'aprovada',
    metadata: {
      timestamp: new Date().toISOString(),
      userAgent: 'Teste de Debug',
      ip: '127.0.0.1'
    }
  };

  try {
    console.log(`   Enviando para: ${BASE_URL}/api/portal/proposta/${PROP_NUMERO}/acao`);
    console.log(`   Dados:`, JSON.stringify(acaoData, null, 2));

    const response = await makeRequest(
      `${BASE_URL}/api/portal/proposta/${PROP_NUMERO}/acao`,
      'POST',
      acaoData
    );

    console.log(`   Resposta: HTTP ${response.status}`);
    console.log(`   Sucesso: ${response.ok}`);

    if (response.data) {
      console.log(`   Dados de resposta:`, JSON.stringify(response.data, null, 2));
    } else {
      console.log(`   Texto de resposta: ${response.text}`);
    }

  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // 3. Verificar status após a tentativa
  console.log('\n3️⃣ Verificando status após tentativa...');

  try {
    const listResponse = await makeRequest(`${BASE_URL}/propostas`);
    if (listResponse.ok) {
      const propostas = listResponse.data.propostas;
      const prop045 = propostas.find(p => p.numero === PROP_NUMERO);

      if (prop045) {
        console.log(`   Status final: ${prop045.status}`);
        console.log(`   Última atualização: ${prop045.updatedAt}`);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao verificar status final:', error.message);
  }

  console.log('\n====================================');
  console.log('🏁 Teste finalizado');
}

testarAprovacao().then(() => {
  console.log('\n✅ Processo concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
