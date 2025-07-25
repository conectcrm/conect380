// Teste simples para verificar se o endpoint está funcionando

async function testarOportunidades() {
  try {
    console.log('🔍 Testando endpoint /oportunidades...');
    const response = await fetch('http://localhost:3001/oportunidades');
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📊 Quantidade de oportunidades:', data.length);
    
    if (data.length > 0) {
      console.log('📋 Primeira oportunidade:');
      console.log('  ID:', data[0].id);
      console.log('  Título:', data[0].titulo);
      console.log('  Valor:', data[0].valor);
      console.log('  Estágio:', data[0].estagio);
      console.log('  Responsável ID:', data[0].responsavel_id);
    }
    
    console.log('🔍 Testando endpoint /oportunidades/metricas...');
    const metricsResponse = await fetch('http://localhost:3001/oportunidades/metricas');
    const metricsData = await metricsResponse.json();
    
    console.log('✅ Métricas Status:', metricsResponse.status);
    console.log('📈 Métricas:', metricsData);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarOportunidades();
