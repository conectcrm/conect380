const fetch = require('node-fetch');

async function testBillingAPIs() {
  try {
    console.log('🔐 Fazendo login...');

    // 1. Login para obter token
    const loginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@conectcrm.com',
        password: 'password'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login response:', { status: loginResponse.status, hasToken: !!loginData.data?.access_token });

    if (loginData.data?.access_token) {
      const token = loginData.data.access_token;
      console.log('🎫 Token obtido:', token.substring(0, 20) + '...');

      // 2. Testar API de planos
      console.log('\n📋 Testando GET /planos...');
      const planosResponse = await fetch('http://localhost:3001/planos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📋 Planos status:', planosResponse.status);
      if (planosResponse.ok) {
        const planosData = await planosResponse.json();
        console.log('✅ Planos encontrados:', planosData.length);
      } else {
        const errorText = await planosResponse.text();
        console.log('❌ Erro planos:', errorText);
      }

      // 3. Testar API de assinaturas
      console.log('\n📄 Testando GET /assinaturas/empresa/1...');
      const assinaturasResponse = await fetch('http://localhost:3001/assinaturas/empresa/1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📄 Assinaturas status:', assinaturasResponse.status);
      if (assinaturasResponse.ok) {
        const assinaturasData = await assinaturasResponse.json();
        console.log('✅ Assinatura encontrada:', assinaturasData);
      } else {
        const errorText = await assinaturasResponse.text();
        console.log('❌ Erro assinaturas:', errorText);
      }

      // 4. Testar API de módulos
      console.log('\n⚙️ Testando GET /planos/modulos...');
      const modulosResponse = await fetch('http://localhost:3001/planos/modulos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('⚙️ Módulos status:', modulosResponse.status);
      if (modulosResponse.ok) {
        const modulosData = await modulosResponse.json();
        console.log('✅ Módulos encontrados:', modulosData.length);
      } else {
        const errorText = await modulosResponse.text();
        console.log('❌ Erro módulos:', errorText);
      }

    } else {
      console.log('❌ Falha no login - token não encontrado');
    }

  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

testBillingAPIs();
