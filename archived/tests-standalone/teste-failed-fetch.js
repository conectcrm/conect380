// 🔧 TESTE ESPECÍFICO: Failed to fetch
// Execute este código no console do browser (F12) quando o erro ocorrer

console.log('🔍 INICIANDO DIAGNÓSTICO AVANÇADO - Failed to fetch');

async function diagnosticoFailedFetch() {
  const API_URL = 'http://localhost:3001';
  
  console.log('\n📊 INFORMAÇÕES DO AMBIENTE:');
  console.log('Browser:', navigator.userAgent);
  console.log('Online:', navigator.onLine);
  console.log('Location:', window.location.href);
  console.log('API URL:', API_URL);
  
  console.log('\n🧪 TESTE 1: Conectividade básica');
  try {
    const response = await fetch(`${API_URL}/email/status`);
    console.log('✅ Conectividade OK:', response.status);
  } catch (error) {
    console.error('❌ FALHA na conectividade:', error);
    return;
  }
  
  console.log('\n🧪 TESTE 2: CORS Headers');
  try {
    const response = await fetch(`${API_URL}/email/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      }
    });
    console.log('✅ CORS OK:', response.headers.get('Access-Control-Allow-Origin'));
  } catch (error) {
    console.error('❌ FALHA no CORS:', error);
  }
  
  console.log('\n🧪 TESTE 3: POST simples');
  try {
    const response = await fetch(`${API_URL}/email/enviar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        para: ['teste@exemplo.com'],
        assunto: 'Teste diagnóstico',
        corpo: 'Teste de conectividade'
      })
    });
    console.log('✅ POST simples OK:', response.status);
  } catch (error) {
    console.error('❌ FALHA no POST simples:', error);
  }
  
  console.log('\n🧪 TESTE 4: Notificação de aceite');
  try {
    const response = await fetch(`${API_URL}/email/notificar-aceite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero: 'TESTE-001',
        titulo: 'Teste Diagnóstico',
        cliente: 'Cliente Teste',
        valor: 1000,
        status: 'aprovada',
        dataAceite: new Date().toISOString()
      })
    });
    console.log('✅ Notificação aceite OK:', response.status);
    const result = await response.json();
    console.log('Resultado:', result);
  } catch (error) {
    console.error('❌ FALHA na notificação:', error);
    
    // Análise detalhada do erro
    console.log('\n🔬 ANÁLISE DO ERRO:');
    console.log('Tipo:', typeof error);
    console.log('Nome:', error.name);
    console.log('Mensagem:', error.message);
    console.log('Stack:', error.stack);
    
    if (error.message === 'Failed to fetch') {
      console.log('\n🚨 FAILED TO FETCH CONFIRMADO!');
      console.log('Possíveis causas:');
      console.log('1. 🔥 Firewall/Antivírus bloqueando');
      console.log('2. 🔥 Backend não está rodando');
      console.log('3. 🔥 CORS mal configurado');
      console.log('4. 🔥 Proxy/VPN interferindo');
      console.log('5. 🔥 Browser bloqueando requisições');
    }
  }
  
  console.log('\n🎯 TESTE COMPLETO!');
  console.log('Execute: diagnosticoFailedFetch() para repetir');
}

// Auto-executar
diagnosticoFailedFetch();
