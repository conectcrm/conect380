/**
 * Script para listar todas as propostas disponíveis no sistema
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001';

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

async function listarPropostas() {
  console.log('🔍 Listando todas as propostas no sistema...\n');

  try {
    const response = await makeRequest(`${BASE_URL}/api/propostas`);

    if (response.ok) {
      const propostas = response.data;

      if (Array.isArray(propostas) && propostas.length > 0) {
        console.log(`✅ Encontradas ${propostas.length} propostas:\n`);

        propostas.forEach((proposta, index) => {
          console.log(`${index + 1}. ${proposta.numero || proposta.id} - Status: ${proposta.status}`);
          if (proposta.titulo) console.log(`   Título: ${proposta.titulo}`);
          if (proposta.cliente) console.log(`   Cliente: ${proposta.cliente}`);
          if (proposta.dataUltimaAtualizacao) console.log(`   Última atualização: ${proposta.dataUltimaAtualizacao}`);
          console.log('');
        });

        // Verificar se PROP-2025-045 está na lista
        const prop045 = propostas.find(p => p.numero === 'PROP-2025-045' || p.id === 'PROP-2025-045');

        if (prop045) {
          console.log('🎯 PROP-2025-045 ENCONTRADA!');
          console.log(`   Status atual: ${prop045.status}`);
          console.log(`   Dados completos:`, JSON.stringify(prop045, null, 2));
        } else {
          console.log('❌ PROP-2025-045 NÃO encontrada na lista');

          // Listar propostas recentes (últimas 5)
          console.log('\n📋 Propostas mais recentes:');
          propostas.slice(-5).forEach(p => {
            console.log(`   ${p.numero || p.id} - ${p.status}`);
          });
        }

      } else {
        console.log('❌ Nenhuma proposta encontrada no sistema');
      }

    } else {
      console.log(`❌ Erro ao buscar propostas: HTTP ${response.status}`);
      console.log('Resposta:', response.text);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

async function buscarPorNumeroExato() {
  console.log('\n🔍 Buscando PROP-2025-045 por número exato...');

  // Tentar diferentes endpoints
  const endpoints = [
    '/api/propostas/PROP-2025-045',
    '/api/propostas/numero/PROP-2025-045',
    '/api/portal/proposta/PROP-2025-045',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Testando: ${endpoint}`);
      const response = await makeRequest(`${BASE_URL}${endpoint}`);

      if (response.ok) {
        console.log(`   ✅ Encontrada em: ${endpoint}`);
        console.log(`   Status: ${response.data.status || response.data.proposta?.status}`);
        console.log(`   Dados:`, JSON.stringify(response.data, null, 2));
        return response.data;
      } else {
        console.log(`   ❌ ${response.status}: ${response.text}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }

  console.log('❌ PROP-2025-045 não encontrada em nenhum endpoint');
  return null;
}

// Executar ambas as verificações
async function executar() {
  await listarPropostas();
  await buscarPorNumeroExato();
}

executar().then(() => {
  console.log('\n✅ Verificação finalizada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
