const axios = require('axios');

// Configuração base
const API_BASE = 'http://localhost:3001';

// Dados de teste para login - vamos tentar com dados que podem existir
const loginData = {
  email: 'test@exemplo.com',
  password: 'teste123'
};

// Dados de teste para evento
const eventoData = {
  titulo: 'Reunião de Teste - Database',
  descricao: 'Teste de criação de evento no banco de dados',
  dataInicio: new Date().toISOString(),
  dataFim: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hora
  diaInteiro: false,
  local: 'Escritório',
  tipo: 'reuniao',
  cor: '#3B82F6'
};

async function testarEventoAPI() {
  try {
    console.log('🔐 Fazendo login...');
    
    // Primeiro, fazer login para obter o token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    const token = loginResponse.data.access_token;
    
    if (!token) {
      console.error('❌ Erro: Token não recebido no login');
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    
    // Configurar headers com token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📅 Criando evento...');
    console.log('Dados do evento:', JSON.stringify(eventoData, null, 2));
    
    // Criar evento
    const eventoResponse = await axios.post(`${API_BASE}/eventos`, eventoData, { headers });
    
    console.log('✅ Evento criado com sucesso!');
    console.log('Resposta:', JSON.stringify(eventoResponse.data, null, 2));
    
    const eventoId = eventoResponse.data.id;
    
    // Listar eventos para confirmar
    console.log('📋 Listando eventos...');
    const listResponse = await axios.get(`${API_BASE}/eventos`, { headers });
    
    console.log('✅ Eventos encontrados:', listResponse.data.length);
    console.log('Eventos:', JSON.stringify(listResponse.data, null, 2));
    
    // Buscar evento específico
    console.log(`🔍 Buscando evento ${eventoId}...`);
    const getResponse = await axios.get(`${API_BASE}/eventos/${eventoId}`, { headers });
    
    console.log('✅ Evento encontrado:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

// Executar teste
testarEventoAPI();
