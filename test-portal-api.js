// Teste direto da API do Portal
// Execute este arquivo no console do navegador ou node para testar

async function testarPortalAPI() {
  const token = 'PROP-001';
  const baseURL = 'http://localhost:3001';
  
  console.log('🧪 Testando Portal API...');
  console.log(`Token: ${token}`);
  console.log(`Base URL: ${baseURL}`);
  
  try {
    // Teste 1: Buscar proposta por token
    console.log('\n📞 Teste 1: Buscando proposta...');
    const response = await fetch(`${baseURL}/api/portal/proposta/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3900'
      },
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
      
      // Teste 2: Atualizar status
      console.log('\n📞 Teste 2: Atualizando status...');
      const updateResponse = await fetch(`${baseURL}/api/portal/proposta/${token}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3900'
        },
        body: JSON.stringify({
          status: 'aprovada',
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          userAgent: 'Test-Browser'
        })
      });
      
      console.log(`Update Status: ${updateResponse.status}`);
      if (updateResponse.ok) {
        const updateData = await updateResponse.json();
        console.log('✅ Status atualizado:', updateData);
      } else {
        const updateError = await updateResponse.text();
        console.log('❌ Erro ao atualizar:', updateError);
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na busca:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Para executar no browser console:
// testarPortalAPI();

// Para executar no Node.js, descomente abaixo:
testarPortalAPI();

console.log('🧪 Script de teste carregado. Execute: testarPortalAPI()');
