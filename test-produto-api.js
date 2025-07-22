// Script de teste para debugar a API de produtos
// Execute com: node test-produto-api.js

const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Dados de teste para criar um produto
const produtoTeste = {
  nome: 'Produto Teste',
  categoria: 'Teste',
  preco: 100.00,
  tipoItem: 'aplicativo',
  frequencia: 'mensal',
  unidadeMedida: 'licenca',
  status: 'ativo',
  descricao: 'Produto de teste'
};

async function testarAPI() {
  console.log('🔍 Testando API de Produtos...\n');

  try {
    // 1. Testar se o backend está rodando
    console.log('1. Testando conexão com o backend...');
    try {
      const healthResponse = await axios.get(`${API_URL}/produtos`);
      console.log('✅ Backend está respondendo');
      console.log(`📊 Produtos existentes: ${healthResponse.data.length}`);
    } catch (error) {
      console.log('❌ Backend não está respondendo');
      console.log('💡 Certifique-se de que o backend está rodando com: npm run start:dev');
      return;
    }

    // 2. Testar criação de produto
    console.log('\n2. Testando criação de produto...');
    console.log('📤 Dados sendo enviados:', JSON.stringify(produtoTeste, null, 2));
    
    try {
      const createResponse = await axios.post(`${API_URL}/produtos`, produtoTeste);
      console.log('✅ Produto criado com sucesso!');
      console.log('📥 Resposta:', JSON.stringify(createResponse.data, null, 2));
      
      // 3. Testar busca do produto criado
      const produtoId = createResponse.data.id;
      console.log(`\n3. Testando busca do produto criado (ID: ${produtoId})...`);
      
      const getResponse = await axios.get(`${API_URL}/produtos/${produtoId}`);
      console.log('✅ Produto encontrado!');
      console.log('📥 Dados do produto:', JSON.stringify(getResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Erro ao criar produto:');
      
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('📋 Dados do erro:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 400) {
          console.log('\n🔍 Erro 400 - Possíveis causas:');
          console.log('• Dados obrigatórios faltando (nome, categoria, preco)');
          console.log('• Tipo de dados incorreto (preco deve ser number)');
          console.log('• Valores inválidos para enums (tipoItem, frequencia, etc.)');
          console.log('• Validação customizada falhando');
        }
      } else {
        console.log('❌ Erro de rede:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

// Teste com diferentes combinações de dados
async function testarVariacoes() {
  console.log('\n🧪 Testando diferentes variações de dados...\n');

  const variações = [
    {
      nome: 'Teste Básico',
      categoria: 'teste',
      preco: 50
    },
    {
      nome: 'Teste Completo',
      categoria: 'teste',
      preco: 100,
      tipoItem: 'produto',
      frequencia: 'unico',
      unidadeMedida: 'unidade',
      status: 'ativo'
    },
    {
      nome: 'Teste Aplicativo',
      categoria: 'software',
      preco: 200,
      tipoItem: 'aplicativo',
      frequencia: 'mensal',
      unidadeMedida: 'licenca'
    }
  ];

  for (let i = 0; i < variações.length; i++) {
    const variacao = variações[i];
    console.log(`Teste ${i + 1}:`, JSON.stringify(variacao, null, 2));
    
    try {
      const response = await axios.post(`${API_URL}/produtos`, variacao);
      console.log('✅ Sucesso!', response.data.id);
    } catch (error) {
      console.log('❌ Falhou:', error.response?.data || error.message);
    }
    console.log('---');
  }
}

// Executar testes
testarAPI()
  .then(() => testarVariacoes())
  .then(() => {
    console.log('\n🏁 Testes concluídos!');
    console.log('\n💡 Para usar no frontend:');
    console.log('1. Abra o DevTools (F12)');
    console.log('2. Vá para a aba Console');
    console.log('3. Tente criar um produto no modal');
    console.log('4. Verifique os logs que adicionamos no produtosService.ts');
  });
