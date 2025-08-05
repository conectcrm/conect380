/**
 * Teste direto usando o UUID da PROP-2025-045
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001';
const PROP_UUID = '90f744bc-6404-4de4-a109-5486d6d59ec6'; // UUID real da PROP-2025-045
const PROP_NUMERO = 'PROP-2025-045'; // Número da proposta

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

async function testeCompletoFIXED() {
  console.log('🔧 Teste Completo - PROP-2025-045 com UUID Correto');
  console.log('='.repeat(60));

  console.log(`📋 UUID: ${PROP_UUID}`);
  console.log(`📋 Número: ${PROP_NUMERO}\n`);

  // 1. Testar ação de aprovação diretamente
  console.log('1️⃣ Testando ação de APROVAÇÃO com número da proposta...');

  const acaoData = {
    acao: 'aprovada',
    metadata: {
      timestamp: new Date().toISOString(),
      userAgent: 'Debug UUID Fix',
      ip: '127.0.0.1',
      observacoes: 'Teste com UUID correto'
    }
  };

  try {
    const response = await makeRequest(
      `${BASE_URL}/api/portal/proposta/${PROP_NUMERO}/acao`,
      'POST',
      acaoData
    );

    if (response.ok && response.data.success) {
      console.log('✅ SUCESSO! Ação de aprovação executada');
      console.log(`   Status retornado: ${response.data.status}`);
    } else {
      console.log('❌ FALHA na ação de aprovação');
      console.log(`   Erro: ${response.data.message}`);
    }
  } catch (error) {
    console.log('❌ ERRO na requisição:', error.message);
  }

  // 2. Verificar status atual via API de propostas
  console.log('\n2️⃣ Verificando status atual via API...');

  try {
    const statusResponse = await makeRequest(`${BASE_URL}/propostas`);

    if (statusResponse.ok) {
      const propostas = statusResponse.data.propostas;
      const prop045 = propostas.find(p => p.numero === PROP_NUMERO);

      if (prop045) {
        console.log(`✅ Proposta encontrada na API`);
        console.log(`   Status atual: ${prop045.status}`);
        console.log(`   Última atualização: ${prop045.updatedAt}`);
      } else {
        console.log('❌ Proposta não encontrada na lista');
      }
    }
  } catch (error) {
    console.log('❌ Erro ao verificar status:', error.message);
  }

  // 3. Testar visualização via portal
  console.log('\n3️⃣ Testando acesso via portal...');

  try {
    const portalResponse = await makeRequest(`${BASE_URL}/api/portal/proposta/${PROP_NUMERO}`);

    if (portalResponse.ok) {
      console.log('✅ Portal acessível');
      console.log(`   Status via portal: ${portalResponse.data.proposta?.status}`);
    } else {
      console.log('❌ Portal inacessível');
      console.log(`   Erro: ${portalResponse.data.message}`);
    }
  } catch (error) {
    console.log('❌ Erro no portal:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Teste finalizado');
}

testeCompletoFIXED().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
