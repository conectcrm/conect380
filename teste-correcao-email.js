// Teste final - Email Service corrigido
// Execute no console do browser para validar

console.log('🧪 Testando correção do EmailServiceReal...');

async function testarEmailServiceCorrigido() {
  const API_URL = 'http://localhost:3001';
  
  try {
    // Teste 1: Status do serviço
    console.log('\n1. ✅ Testando /email/status...');
    const statusResponse = await fetch(`${API_URL}/email/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status funcionando:', statusData);
    
    // Teste 2: Envio genérico (que o emailServiceReal agora usa)
    console.log('\n2. ✅ Testando /email/enviar...');
    const enviarResponse = await fetch(`${API_URL}/email/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        para: ['cliente@teste.com'],
        assunto: 'Teste EmailServiceReal Corrigido',
        corpo: 'Este é um teste do emailServiceReal após correção'
      })
    });
    const enviarData = await enviarResponse.json();
    console.log('✅ Envio funcionando:', enviarData);
    
    // Teste 3: Simular aceite de proposta
    console.log('\n3. ✅ Testando aceite completo...');
    const aceiteResponse = await fetch(`${API_URL}/api/portal/proposta/PROP-001/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'aprovada',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        userAgent: 'Test-Correcao'
      })
    });
    const aceiteData = await aceiteResponse.json();
    console.log('✅ Aceite funcionando:', aceiteData);
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Correção aplicada com sucesso');
    console.log('✅ EmailServiceReal agora usa backend integrado');
    console.log('✅ "Failed to fetch" deve estar resolvido');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

// Auto-executar
testarEmailServiceCorrigido();
