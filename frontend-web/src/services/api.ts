import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Instância do axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug específico para requisições de planos
    if (config.url?.includes('/planos')) {
      console.log('🔄 [FRONTEND] Enviando requisição para API:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        data: config.data,
        headers: config.headers,
        token: token ? 'presente' : 'ausente'
      });
    }

    // Debug específico para requisições de eventos
    if (config.url?.includes('/eventos')) {
      console.log('📅 [FRONTEND] Enviando requisição para eventos:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        data: config.data,
        token: token ? `presente (${token.substring(0, 10)}...)` : 'ausente',
        authHeader: config.headers.Authorization
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas de erro
api.interceptors.response.use(
  (response) => {
    // Debug específico para respostas de planos
    if (response.config.url?.includes('/planos')) {
      console.log('✅ [FRONTEND] Resposta recebida da API:', {
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
      console.error('❌ [FRONTEND] Erro na requisição de planos:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message
      });
    }

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
