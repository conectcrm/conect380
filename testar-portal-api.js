// Script para testar a API do portal diretamente
const token = 'PROP-2025-042';

console.log(`🧪 Testando API do Portal para token: ${token}`);

// 1. Testar obtenção da proposta
async function testarObterProposta() {
  try {
    console.log('\n=== TESTE 1: Obter Proposta ===');
    const response = await fetch(`http://localhost:3001/api/portal/proposta/${token}`, {
      method: 'GET'
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);

    return response.ok;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// 2. Testar registro de visualização
async function testarRegistroVisualizacao() {
  try {
    console.log('\n=== TESTE 2: Registrar Visualização ===');
    const response = await fetch(`http://localhost:3001/api/portal/proposta/${token}/view`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ip: '127.0.0.1',
        userAgent: 'Teste-Browser/1.0',
        timestamp: new Date().toISOString(),
        resolucaoTela: '1920x1080',
        referrer: 'teste'
      })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);

    return response.ok;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// 3. Testar registro de ação
async function testarRegistroAcao() {
  try {
    console.log('\n=== TESTE 3: Registrar Ação ===');
    const response = await fetch(`http://localhost:3001/api/portal/proposta/${token}/acao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        acao: 'visualizada',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        userAgent: 'Teste-Browser/1.0',
        dados: {
          teste: true
        }
      })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Resposta:', data);

    return response.ok;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// Executar testes
async function executarTestes() {
  console.log('🚀 Iniciando testes da API do Portal...\n');

  const teste1 = await testarObterProposta();
  const teste2 = await testarRegistroVisualizacao();
  const teste3 = await testarRegistroAcao();

  console.log('\n=== RESULTADOS ===');
  console.log('✅ Obter Proposta:', teste1 ? 'SUCESSO' : 'FALHOU');
  console.log('✅ Registrar Visualização:', teste2 ? 'SUCESSO' : 'FALHOU');
  console.log('✅ Registrar Ação:', teste3 ? 'SUCESSO' : 'FALHOU');

  if (teste1 && teste2 && teste3) {
    console.log('\n🎉 Todos os testes passaram! A API do portal está funcionando.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verificar logs do backend.');
  }
}

// Se executado via Node.js
if (typeof module !== 'undefined' && module.exports) {
  executarTestes();
}
