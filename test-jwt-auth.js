// Script para testar autenticação JWT
const axios = require('axios');

async function testJWTAuth() {
  const baseURL = 'http://localhost:3001';

  try {
    console.log('🔐 Fazendo login...');

    // Login
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@conectcrm.com',
      senha: 'password'
    });

    const token = loginResponse.data.data.access_token;
    console.log('✅ Login realizado com sucesso!');

    if (!token) {
      console.log('❌ Token não encontrado na resposta!');
      console.log('📊 Resposta completa:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    console.log(`🔑 Token: ${token.substring(0, 50)}...`);

    // Testar rota protegida simples (perfil do usuário)
    console.log('\n🧪 Testando autenticação...');

    try {
      const profileResponse = await axios.get(`${baseURL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Autenticação funcionando!');
      console.log(`👤 Usuário logado: ${profileResponse.data.nome}`);
      console.log(`🏢 Empresa: ${profileResponse.data.empresa?.nome || 'N/A'}`);

    } catch (error) {
      console.log(`❌ Erro na autenticação: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      console.log('Response headers:', error.response?.headers);
    }

  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
  }
}

// Executar teste
testJWTAuth();
