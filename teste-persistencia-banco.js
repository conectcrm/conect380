// Teste para verificar se o problema está na persistência dos dados
// no banco de dados

const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5434,
  username: 'conectcrm',
  password: 'conectcrm123',
  database: 'conectcrm_db'
};

async function verificarStatusNoBanco(numeroPropsota = 'PROP-2025-045') {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('🔗 Conectado ao banco PostgreSQL');

    // 1. Buscar proposta pelo número
    const query = 'SELECT id, numero, status, "atualizadaEm" FROM propostas WHERE numero = $1';
    const result = await client.query(query, [numeroPropsota]);

    if (result.rows.length === 0) {
      console.log(`❌ Proposta ${numeroPropsota} não encontrada no banco`);
      return;
    }

    const proposta = result.rows[0];
    console.log('📊 Dados da proposta no banco:', {
      id: proposta.id,
      numero: proposta.numero,
      status: proposta.status,
      atualizadaEm: proposta.atualizadaEm
    });

    return proposta;

  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error.message);
  } finally {
    await client.end();
  }
}

async function testarAtualizacaoStatus(numeroPropsota = 'PROP-2025-045', novoStatus = 'visualizada') {
  console.log(`🧪 Testando atualização de status para ${novoStatus}...`);

  // 1. Verificar status atual no banco
  console.log('\n📊 Status ANTES da atualização:');
  await verificarStatusNoBanco(numeroPropsota);

  // 2. Fazer chamada para o portal
  const http = require('http');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/portal/proposta/${numeroPropsota}/acao`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', async () => {
      console.log(`\n📡 Resposta da API (${res.statusCode}):`, JSON.parse(body));

      // 3. Aguardar um pouco e verificar novamente
      console.log('\n⏳ Aguardando 2 segundos...');
      setTimeout(async () => {
        console.log('\n📊 Status DEPOIS da atualização:');
        await verificarStatusNoBanco(numeroPropsota);
      }, 2000);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.write(JSON.stringify({ acao: novoStatus }));
  req.end();
}

async function executarTestes() {
  console.log('🔧 Teste de Persistência de Status no Banco');
  console.log('==========================================');

  // Testar as 3 ações
  console.log('\n=== TESTE 1: VISUALIZADA ===');
  await testarAtualizacaoStatus('PROP-2025-045', 'visualizada');

  setTimeout(async () => {
    console.log('\n=== TESTE 2: REJEITADA ===');
    await testarAtualizacaoStatus('PROP-2025-045', 'rejeitada');

    setTimeout(async () => {
      console.log('\n=== TESTE 3: APROVADA ===');
      await testarAtualizacaoStatus('PROP-2025-045', 'aprovada');
    }, 5000);
  }, 5000);
}

executarTestes().catch(console.error);
