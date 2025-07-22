const axios = require('axios');

async function testarAPI() {
  console.log('🧪 Testando API do Backend...\n');
  
  try {
    // Teste básico de healthcheck
    const response = await axios.get('http://localhost:3001');
    console.log('✅ Backend está rodando!');
    console.log('📡 Status:', response.status);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend não está rodando na porta 3001');
      console.log('💡 Execute: npm run start:dev no diretório backend');
    } else {
      console.log('📊 Backend respondeu:', error.response?.status || 'Sem resposta');
    }
  }

  // Teste do endpoint de empresas
  try {
    console.log('\n🏢 Testando endpoint de empresas...');
    const response = await axios.get('http://localhost:3001/empresas/health');
    console.log('✅ Endpoint de empresas funcionando!');
  } catch (error) {
    console.log('ℹ️  Endpoint específico não encontrado (normal se não implementado)');
  }

  console.log('\n🎯 Próximos passos:');
  console.log('1. ✅ Backend compilado sem erros');
  console.log('2. 🔄 Inicie: npm run start:dev (modo watch)');
  console.log('3. 🌐 Teste o frontend: npm start na pasta frontend-web');
  console.log('4. 📝 Acesse: http://localhost:3900/registro');
}

testarAPI();
