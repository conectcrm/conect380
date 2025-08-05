// Teste específico para verificar ações visualizada e rejeitada
// que não estão funcionando corretamente

const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

const BASE_URL = 'http://localhost:3001';
const TOKEN = 'PROP-2025-045';

async function testarAcao(acao) {
  console.log(`\n🧪 Testando ação: ${acao}`);

  try {
    // 1. Verificar status atual
    const statusOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/portal/proposta/${TOKEN}`,
      method: 'GET'
    };

    const statusResult = await makeRequest(statusOptions);

    if (statusResult.status !== 200) {
      console.log(`❌ Erro ao verificar status: ${statusResult.status}`);
      return;
    }

    console.log(`📊 Status antes: ${statusResult.data.proposta.status}`);

    // 2. Executar ação
    const acaoOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/portal/proposta/${TOKEN}/acao`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const acaoResult = await makeRequest(acaoOptions, { acao });

    console.log(`📡 Status da resposta: ${acaoResult.status}`);
    console.log(`📤 Resposta da ação:`, JSON.stringify(acaoResult.data, null, 2));

    // 3. Aguardar um pouco e verificar status novamente
    await new Promise(resolve => setTimeout(resolve, 1000));

    const novoStatusResult = await makeRequest(statusOptions);

    if (novoStatusResult.status === 200) {
      console.log(`📊 Status depois: ${novoStatusResult.data.proposta.status}`);

      if (novoStatusResult.data.proposta.status === acao) {
        console.log(`✅ Ação ${acao} funcionou corretamente!`);
      } else {
        console.log(`❌ Ação ${acao} NÃO atualizou o status corretamente`);
      }
    }

  } catch (error) {
    console.error(`❌ Erro ao testar ação ${acao}:`, error.message);
  }
}

async function executarTestes() {
  console.log('🔧 Teste específico para ações problemáticas');
  console.log('===============================================');

  // Testar as ações que não estão funcionando
  await testarAcao('visualizada');
  await testarAcao('rejeitada');

  // Testar a que funciona (como controle)
  await testarAcao('aprovada');

  console.log('\n🏁 Testes finalizados');
}

executarTestes().catch(console.error);
