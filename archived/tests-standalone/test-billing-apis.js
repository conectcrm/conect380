// Script para testar APIs de billing
const axios = require('axios');

async function testBillingAPIs() {
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

    // Configurar headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🧪 Testando APIs de billing...');

    // Testar /planos
    try {
      console.log('📋 Testando GET /planos...');
      const planosResponse = await axios.get(`${baseURL}/planos`, { headers });
      console.log(`✅ Planos: ${planosResponse.data.length} encontrados`);
      planosResponse.data.forEach(plano => {
        console.log(`  💰 ${plano.nome} - R$ ${plano.preco}`);
      });
    } catch (error) {
      console.log(`❌ Erro em /planos: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Testar /assinaturas/empresa/:id
    try {
      console.log('\n📋 Testando GET /assinaturas/empresa/f47ac10b-58cc-4372-a567-0e02b2c3d479...');
      const assinaturaResponse = await axios.get(`${baseURL}/assinaturas/empresa/f47ac10b-58cc-4372-a567-0e02b2c3d479`, { headers });
      console.log('✅ Assinatura encontrada:');
      const ass = assinaturaResponse.data;
      console.log(`  🏢 Empresa: ${ass.empresa?.nome || 'N/A'}`);
      console.log(`  💰 Plano: ${ass.plano?.nome || 'N/A'}`);
      console.log(`  📅 Status: ${ass.status}`);
    } catch (error) {
      console.log(`❌ Erro em /assinaturas: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Testar /planos/modulos
    try {
      console.log('\n📋 Testando GET /planos/modulos...');
      const modulosResponse = await axios.get(`${baseURL}/planos/modulos`, { headers });
      console.log(`✅ Módulos: ${modulosResponse.data.length} encontrados`);
      modulosResponse.data.forEach(modulo => {
        console.log(`  🧩 ${modulo.nome} (${modulo.codigo})`);
      });
    } catch (error) {
      console.log(`❌ Erro em /planos/modulos: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ Teste de APIs concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testBillingAPIs();
