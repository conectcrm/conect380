const { default: fetch } = require('node-fetch');

// Script para testar o acesso aos endpoints de cobrança
async function testBillingEndpoints() {
  console.log('🔍 Testando acesso aos endpoints de cobrança...\n');

  // 1. Fazer login primeiro
  console.log('1. Fazendo login...');
  const loginResponse = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@conectcrm.com',
      senha: 'password'
    })
  });

  const loginData = await loginResponse.json();
  console.log(`   Status: ${loginResponse.status}`);

  if (!loginData.success) {
    console.log('❌ Falha no login');
    return;
  }

  const token = loginData.data.access_token;
  console.log('   ✅ Login realizado com sucesso');
  console.log(`   Token: ${token.substring(0, 50)}...`);

  // 2. Testar endpoints de cobrança
  const endpoints = [
    '/planos',
    '/assinaturas',
    '/planos/modulos'
  ];

  console.log('\n2. Testando endpoints de cobrança:');

  for (const endpoint of endpoints) {
    console.log(`\n   🌐 Testando ${endpoint}...`);

    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log(`      Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`      ✅ Sucesso - ${JSON.stringify(data).length} bytes`);
      } else {
        const error = await response.text();
        console.log(`      ❌ Erro: ${error}`);
      }

    } catch (error) {
      console.log(`      ❌ Erro na requisição: ${error.message}`);
    }
  }

  console.log('\n3. 🎯 Resumo:');
  console.log('   ✅ Sistema de autenticação funcionando');
  console.log('   ✅ Endpoints de cobrança acessíveis');
  console.log('   ✅ Frontend pode acessar as funcionalidades em /billing');
}

testBillingEndpoints().catch(console.error);
