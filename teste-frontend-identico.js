const axios = require('axios');

// Simulação exata do frontend
const API_URL = 'http://localhost:3001';

// Criar instância como no frontend
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor igual ao frontend
api.interceptors.request.use(
  (config) => {
    const token = 'mock-token-for-testing';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug específico para requisições de planos
    if (config.url?.includes('/planos')) {
      console.log('🔄 [FRONTEND-SIMULADO] Enviando requisição para API:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        data: config.data,
        headers: config.headers,
        token: token ? 'presente' : 'ausente'
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta igual ao frontend
api.interceptors.response.use(
  (response) => {
    // Debug específico para respostas de planos
    if (response.config.url?.includes('/planos')) {
      console.log('✅ [FRONTEND-SIMULADO] Resposta recebida da API:', {
        status: response.status,
        data: response.data,
        url: response.config.url,
        method: response.config.method?.toUpperCase()
      });
    }
    return response;
  },
  (error) => {
    // Debug específico para erros de planos
    if (error.config?.url?.includes('/planos')) {
      console.error('❌ [FRONTEND-SIMULADO] Erro na requisição de planos:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

// Função que simula handleSalvarPlano do frontend
const handleSalvarPlano = async (dadosPlano) => {
  try {
    console.log('📊 [FRONTEND-SIMULADO] Dados sendo enviados:', dadosPlano);
    console.log('📊 [FRONTEND-SIMULADO] Token no localStorage: mock-token-for-testing');

    const editingPlano = { id: 'c6a051cc-562b-4835-8953-d9f9da0bde43' };

    if (editingPlano) {
      // Atualizar plano existente - igual ao frontend
      const response = await api.put(`/planos/${editingPlano.id}`, dadosPlano);
      console.log('✅ [FRONTEND-SIMULADO] Sucesso:', response.data);
      return response.data;
    }
  } catch (err) {
    console.error('❌ [FRONTEND-SIMULADO] Erro ao salvar plano:', err);
    console.error('❌ [FRONTEND-SIMULADO] Resposta do erro:', err.response?.data);
    throw new Error('Erro ao salvar plano');
  }
};

// Dados exatos do formulário frontend
const formData = {
  nome: 'Teste Atualizado',
  codigo: 'teste-updated',
  descricao: 'Plano especial para startups com recursos limitados mas essenciais',
  preco: 149.99,
  limiteUsuarios: 2,
  limiteClientes: 50,
  limiteStorage: 1024,
  limiteApiCalls: 5000,
  whiteLabel: false,
  suportePrioritario: false,
  ativo: true,
  ordem: 0
};

console.log('🚀 [FRONTEND-SIMULADO] Iniciando teste...');
console.log('📋 [FRONTEND-SIMULADO] FormData tipos:', {
  nome: typeof formData.nome,
  codigo: typeof formData.codigo,
  preco: typeof formData.preco,
  limiteUsuarios: typeof formData.limiteUsuarios,
  limiteClientes: typeof formData.limiteClientes,
  limiteStorage: typeof formData.limiteStorage,
  limiteApiCalls: typeof formData.limiteApiCalls
});

handleSalvarPlano(formData).catch(console.error);
