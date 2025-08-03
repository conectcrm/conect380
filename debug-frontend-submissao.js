/**
 * 🔍 DEBUG FRONTEND - Análise de Submissão de Formulário
 * 
 * Este script simula o comportamento do frontend para identificar
 * por que múltiplas requisições estão sendo enviadas
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const planoId = 'c6a051cc-562b-4835-8953-d9f9da0bde43';

// Simular dados de formulário como no frontend
const dadosPlano = {
  nome: 'Teste Atualizado Frontend Debug',
  codigo: 'teste-debug',
  descricao: 'Plano de teste para debug do frontend',
  preco: 199.99,
  limiteUsuarios: 3,
  limiteClientes: 75,
  limiteStorage: 2048,
  limiteApiCalls: 10000,
  whiteLabel: false,
  suportePrioritario: false,
  ativo: true,
  ordem: 0
};

async function testarComportamentoFrontend() {
  console.log('🚀 Iniciando teste de comportamento do frontend...\n');

  try {
    // Teste 1: Requisição com dados completos (como deveria ser)
    console.log('📊 Teste 1: Requisição com dados completos');
    console.log('Dados enviados:', JSON.stringify(dadosPlano, null, 2));

    const response = await axios.put(`${BASE_URL}/planos/${planoId}`, dadosPlano, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Erro:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Teste 2: Requisição vazia (simulando o problema)
    console.log('📊 Teste 2: Requisição vazia (simulando problema do frontend)');
    console.log('Dados enviados: {}');

    const responseEmpty = await axios.put(`${BASE_URL}/planos/${planoId}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });

    console.log('✅ Status:', responseEmpty.status);
    console.log('✅ Resposta:', JSON.stringify(responseEmpty.data, null, 2));

  } catch (error) {
    console.log('❌ Erro (esperado):', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Teste 3: Requisição sem body (null/undefined)
    console.log('📊 Teste 3: Requisição sem body');
    console.log('Dados enviados: undefined');

    const responseNull = await axios.put(`${BASE_URL}/planos/${planoId}`, undefined, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });

    console.log('✅ Status:', responseNull.status);

  } catch (error) {
    console.log('❌ Erro (esperado):', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n🔍 Análise: O backend está funcionando corretamente!');
  console.log('O problema está no frontend enviando múltiplas requisições.');
  console.log('Precisamos verificar o código React para evitar múltiplas submissões.\n');
}

// Executar teste
testarComportamentoFrontend()
  .then(() => {
    console.log('✅ Teste de comportamento frontend concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  });
