// Script de teste para verificar se os clientes estão sendo retornados do backend
const API_BASE_URL = 'http://localhost:5000';

async function testarClientes() {
  try {
    console.log('🔍 Testando endpoint de clientes...');
    
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Adicionar token de auth se necessário
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Resposta do backend:', data);
    console.log('📊 Total de clientes:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('👤 Primeiro cliente:', data.data[0]);
    } else {
      console.log('⚠️ Nenhum cliente encontrado no backend');
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
  }
}

// Executar o teste
testarClientes();
