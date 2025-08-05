// Teste para verificar se o problema está na leitura dos dados
// através da API do backend

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

async function verificarPropostaNaAPI(numeroPropsota = 'PROP-2025-045') {
  // 1. Verificar via API do portal
  const portalOptions = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/portal/proposta/${numeroPropsota}`,
    method: 'GET'
  };

  // 2. Verificar via API principal das propostas
  const apiOptions = {
    hostname: 'localhost',
    port: 3001,
    path: `/propostas`,
    method: 'GET'
  };

  try {
    // Verificar pelo portal
    const portalResult = await makeRequest(portalOptions);
    console.log('📊 Dados do PORTAL:', {
      status: portalResult.status,
      proposta: portalResult.data?.proposta ? {
        numero: portalResult.data.proposta.numero,
        status: portalResult.data.proposta.status,
        cliente: portalResult.data.proposta.cliente
      } : 'Não encontrada'
    });

    // Verificar pela API principal
    const apiResult = await makeRequest(apiOptions);
    if (apiResult.status === 200 && apiResult.data?.propostas) {
      const proposta = apiResult.data.propostas.find(p => p.numero === numeroPropsota);
      console.log('📊 Dados da API PRINCIPAL:', proposta ? {
        numero: proposta.numero,
        status: proposta.status,
        cliente: proposta.cliente
      } : 'Não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar APIs:', error.message);
  }
}

async function testarFluxoCompleto(numeroPropsota = 'PROP-2025-045') {
  console.log(`🔧 Teste de Fluxo Completo: ${numeroPropsota}`);
  console.log('===============================================');

  const acoes = ['visualizada', 'rejeitada', 'aprovada'];

  for (const acao of acoes) {
    console.log(`\n🧪 Testando ação: ${acao}`);

    // 1. Status ANTES
    console.log('\n📊 Status ANTES:');
    await verificarPropostaNaAPI(numeroPropsota);

    // 2. Executar ação
    const acaoOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/portal/proposta/${numeroPropsota}/acao`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const acaoResult = await makeRequest(acaoOptions, { acao });
    console.log(`\n📡 Resultado da ação:`, {
      status: acaoResult.status,
      success: acaoResult.data?.success,
      message: acaoResult.data?.message
    });

    // 3. Status DEPOIS
    console.log('\n⏳ Aguardando 1 segundo...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📊 Status DEPOIS:');
    await verificarPropostaNaAPI(numeroPropsota);

    // Pausa entre testes
    if (acao !== 'aprovada') {
      console.log('\n⏳ Aguardando 3 segundos antes do próximo teste...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n🏁 Teste finalizado');
}

testarFluxoCompleto().catch(console.error);
