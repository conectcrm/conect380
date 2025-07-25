// Teste da API no browser
console.log('🔍 Testando conexão frontend -> backend...');

// Simular o que o frontend faz
async function testarConexaoFrontend() {
  const baseURL = 'http://localhost:3001';
  
  try {
    // Teste 1: Listar oportunidades
    console.log('📋 Teste 1: Listando oportunidades...');
    const response = await fetch(`${baseURL}/oportunidades`);
    const oportunidades = await response.json();
    
    console.log('✅ Oportunidades carregadas:', oportunidades.length);
    
    // Teste 2: Obter métricas
    console.log('📊 Teste 2: Obtendo métricas...');
    const metricsResponse = await fetch(`${baseURL}/oportunidades/metricas`);
    const metricas = await metricsResponse.json();
    
    console.log('✅ Métricas obtidas:', metricas);
    
    // Teste 3: Obter dados do pipeline
    console.log('🔄 Teste 3: Obtendo dados do pipeline...');
    const pipelineResponse = await fetch(`${baseURL}/oportunidades/pipeline`);
    const pipeline = await pipelineResponse.json();
    
    console.log('✅ Pipeline obtido:', pipeline);
    
    console.log('🎉 Todos os testes passaram! A API está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    console.error('🔧 Verifique se:');
    console.error('   1. O backend está rodando na porta 3001');
    console.error('   2. Não há bloqueios de CORS');
    console.error('   3. A rede está funcionando');
  }
}

testarConexaoFrontend();
