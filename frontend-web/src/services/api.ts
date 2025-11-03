import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const DEBUG = false;

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
    const token = localStorage.getItem('authToken'); // ✅ Corrigido para 'authToken'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      // Permite que o Axios defina o boundary corretamente
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    // ✨ ADICIONAR empresaId automaticamente para rotas de atendimento
    if (config.url?.includes('/atendimento')) {
      const empresaAtiva = localStorage.getItem('empresaAtiva');
      const metodo = config.method?.toLowerCase();

      if (empresaAtiva && metodo === 'get') {
        // Adicionar empresaId nos query params para GET requests
        config.params = {
          ...config.params,
          empresaId: empresaAtiva,
        };
      } else if (empresaAtiva && (metodo === 'post' || metodo === 'patch' || metodo === 'put')) {
        // Adicionar empresaId no body para POST/PATCH requests
        if (config.data instanceof FormData) {
          // FormData não pode ser espalhado, então apenas anexamos o campo
          if (!config.data.has('empresaId')) {
            config.data.append('empresaId', empresaAtiva);
          }
        } else if (config.data && typeof config.data === 'object') {
          config.data = {
            ...config.data,
            empresaId: empresaAtiva,
          };
        }
      }
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

    // Debug específico para requisições de contratos
    if (config.url?.includes('/contratos')) {
      console.log('📋 [FRONTEND] Enviando requisição para contratos:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        data: config.data,
        token: token ? `presente (${token.substring(0, 10)}...)` : 'ausente',
        authHeader: config.headers.Authorization
      });
    }

    // Debug específico para requisições de faturamento
    if (config.url?.includes('/faturamento')) {
      console.log('💰 [FRONTEND] Enviando requisição para faturamento:', {
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

    // Debug específico para respostas de contratos
    if (response.config.url?.includes('/contratos')) {
      console.log('✅ [FRONTEND] Resposta de contratos recebida:', {
        status: response.status,
        data: response.data,
        url: response.config.url,
        method: response.config.method?.toUpperCase()
      });
    }

    // Debug específico para respostas de faturamento
    if (response.config.url?.includes('/faturamento')) {
      console.log('✅ [FRONTEND] Resposta de faturamento recebida:', {
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

    // Debug específico para erros de contratos
    if (error.config?.url?.includes('/contratos')) {
      console.error('❌ [FRONTEND] Erro na requisição de contratos:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        params: error.config?.params
      });
    }

    // Debug específico para erros de faturamento
    if (error.config?.url?.includes('/faturamento')) {
      console.error('❌ [FRONTEND] Erro na requisição de faturamento:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        requestData: error.config?.data
      });
    }

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.warn('⚠️ [API] Erro 401 detectado - Token inválido ou expirado');
      console.warn('⚠️ [API] URL da requisição:', error.config?.url);

      // Evitar loop infinito: não redirecionar se já estiver na página de login
      const isLoginPage = window.location.pathname === '/login';
      const isAuthEndpoint = error.config?.url?.includes('/auth/');

      if (!isLoginPage && !isAuthEndpoint) {
        console.warn('⚠️ [API] Token inválido - Limpando sessão e redirecionando...');
        
        // Limpar localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_data');
        localStorage.removeItem('empresaAtiva');
        localStorage.removeItem('selectedProfileId');
        
        // Adicionar mensagem para o usuário
        localStorage.setItem('sessionExpired', 'true');
        
        // Redirecionar após pequeno delay para permitir que a mensagem seja mostrada
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
