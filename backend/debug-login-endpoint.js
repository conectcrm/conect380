const { default: fetch } = require('node-fetch');

// Script para debug detalhado do login
async function debugLogin() {
  console.log('🔍 Debugando endpoint de login...\n');

  const loginData = {
    email: 'admin@conectcrm.com',
    senha: 'password'
  };

  console.log('📤 Dados sendo enviados:');
  console.log(JSON.stringify(loginData, null, 2));

  try {
    console.log('\n🌐 Fazendo requisição para http://localhost:3001/auth/login...');

    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    console.log(`\n📡 Status da resposta: ${response.status} ${response.statusText}`);
    console.log('📋 Headers da resposta:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    const responseText = await response.text();
    console.log('\n📝 Corpo da resposta:');
    console.log(responseText);

    if (response.status === 401) {
      console.log('\n🚨 Erro 401 - Possíveis causas:');
      console.log('   1. LocalStrategy não está sendo chamada');
      console.log('   2. Request body não está sendo parseado');
      console.log('   3. Campos email/senha estão chegando undefined');
      console.log('   4. AuthService.validateUser está retornando null');
    }

  } catch (error) {
    console.error('\n❌ Erro na requisição:', error.message);
  }
}

debugLogin().catch(console.error);
