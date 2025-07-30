// Teste de conectividade Frontend -> Backend
// Execute este código no console do navegador (F12)

console.log('🧪 Testando conectividade Frontend -> Backend');

async function testarEmailEndpoints() {
  const baseURL = 'http://localhost:3001';
  
  console.log('\n📧 Testando endpoints de email...');
  
  // Teste 1: Status do serviço
  try {
    console.log('1. Testando /email/status...');
    const statusResponse = await fetch(`${baseURL}/email/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status:', statusData);
  } catch (error) {
    console.error('❌ Erro no status:', error);
  }
  
  // Teste 2: Envio genérico
  try {
    console.log('\n2. Testando /email/enviar...');
    const enviarResponse = await fetch(`${baseURL}/email/enviar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        para: ['teste@exemplo.com'],
        assunto: 'Teste do Frontend',
        corpo: 'Corpo do email de teste'
      })
    });
    const enviarData = await enviarResponse.json();
    console.log('✅ Envio genérico:', enviarData);
  } catch (error) {
    console.error('❌ Erro no envio genérico:', error);
  }
  
  // Teste 3: Notificação de aceite
  try {
    console.log('\n3. Testando /email/notificar-aceite...');
    const notificarResponse = await fetch(`${baseURL}/email/notificar-aceite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero: 'PROP-TEST',
        titulo: 'Proposta Teste',
        cliente: 'Cliente Teste',
        valor: 1000,
        status: 'aprovada'
      })
    });
    const notificarData = await notificarResponse.json();
    console.log('✅ Notificação aceite:', notificarData);
  } catch (error) {
    console.error('❌ Erro na notificação:', error);
  }
  
  console.log('\n🎯 Teste completo!');
}

// Auto-executar
testarEmailEndpoints();

console.log('\n📋 Para executar manualmente: testarEmailEndpoints()');
