/**
 * Teste de requisição PUT para planos
 * Este script testa especificamente o problema relatado: "Error: Erro ao salvar plano"
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Dados de teste para atualizar um plano
const dadosPlano = {
  nome: 'Plano Teste Atualizado',
  descricao: 'Plano de teste para debug do erro 400',
  preco: 99.99,
  periodicidade: 'mensal',
  limiteUsuarios: -1, // Valor que pode estar causando problema
  limiteClientes: 100,
  limiteStorage: -1, // Valor que pode estar causando problema  
  limiteApiCalls: 1000,
  modulos: ['vendas', 'clientes']
};

async function testarPutPlano() {
  try {
    console.log('🔍 Testando requisição PUT para planos...');
    console.log('📍 URL:', `${BASE_URL}/planos/1`);
    console.log('📦 Dados:', JSON.stringify(dadosPlano, null, 2));

    // Primeiro vamos listar os planos para ver qual ID usar
    console.log('\n📋 Listando planos existentes...');
    const listaPlanos = await axios.get(`${BASE_URL}/planos`);
    console.log('✅ Planos encontrados:', listaPlanos.data.length);

    if (listaPlanos.data.length > 0) {
      const primeiroPlano = listaPlanos.data[0];
      const planoId = primeiroPlano.id;
      console.log(`📋 Usando plano ID: ${planoId}`);
      console.log('📊 Dados do plano atual:', JSON.stringify(primeiroPlano, null, 2));

      // Agora fazer o PUT
      console.log('\n🔄 Fazendo requisição PUT...');
      const response = await axios.put(
        `${BASE_URL}/planos/${planoId}`,
        dadosPlano,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('✅ Sucesso! Status:', response.status);
      console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));

    } else {
      console.log('❌ Nenhum plano encontrado para testar');
    }

  } catch (error) {
    console.log('\n❌ ERRO CAPTURADO:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);

    if (error.response?.status === 400) {
      console.log('\n🚨 ERRO 400 - Bad Request confirmado!');
      console.log('Este é exatamente o erro que estamos investigando.');
    }
  }
}

// Executar o teste
testarPutPlano();
