import axios from 'axios';
import { resolveApiBaseUrl } from '../utils/network';

const API_URL = resolveApiBaseUrl({
  envUrl: process.env.REACT_APP_API_URL,
  onEnvIgnored: ({ envUrl, currentHost }) => {
    console.warn(
      '⚠️ [API] Ignorando REACT_APP_API_URL local em acesso via rede:',
      envUrl,
      '→ host atual',
      currentHost,
    );
  },
});
export const API_BASE_URL = API_URL;
const DEBUG = process.env.REACT_APP_DEBUG_API === 'true';

// Instância do axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente público, sem anexar token automaticamente
export const apiPublic = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (DEBUG) {
  console.log('🔧 [API] Base URL configurada:', API_URL);
  console.log('🌐 [API] Hostname detectado:', window.location.hostname);
  console.log('🌐 [API] Window location:', window.location.href);
}

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

      // ⚠️ NÃO adicionar empresaId se já está no path (ex: /configuracao-inatividade/:empresaId)
      const empresaIdNoPath = config.url?.match(/\/[a-f0-9-]{36}\/?/i); // UUID no path

      if (empresaAtiva && metodo === 'get' && !empresaIdNoPath) {
        // Adicionar empresaId nos query params para GET requests
        config.params = {
          ...config.params,
          empresaId: empresaAtiva,
        };
      } else if (
        empresaAtiva &&
        (metodo === 'post' || metodo === 'patch' || metodo === 'put') &&
        !empresaIdNoPath
      ) {
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
    if (DEBUG && config.url?.includes('/planos')) {
      console.log('🔄 [FRONTEND] Enviando requisição para API:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        data: config.data,
        headers: config.headers,
        token: token ? 'presente' : 'ausente',
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
        authHeader: config.headers.Authorization,
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
        authHeader: config.headers.Authorization,
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
        authHeader: config.headers.Authorization,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 🔄 Flag e fila para controlar refresh de token (evitar múltiplas tentativas simultâneas)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor para lidar com respostas de erro
api.interceptors.response.use(
  (response) => {
    // Debug específico para respostas de planos
    if (response.config.url?.includes('/planos')) {
      console.log('✅ [FRONTEND] Resposta recebida da API:', {
        status: response.status,
        data: response.data,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
      });
    }

    // Debug específico para respostas de contratos
    if (response.config.url?.includes('/contratos')) {
      console.log('✅ [FRONTEND] Resposta de contratos recebida:', {
        status: response.status,
        data: response.data,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
      });
    }

    // Debug específico para respostas de faturamento
    if (response.config.url?.includes('/faturamento')) {
      console.log('✅ [FRONTEND] Resposta de faturamento recebida:', {
        status: response.status,
        data: response.data,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Debug específico para erros de planos
    if (error.config?.url?.includes('/planos')) {
      console.error('❌ [FRONTEND] Erro na requisição de planos:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
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
        params: error.config?.params,
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
        requestData: error.config?.data,
      });
    }

    // 🔄 TENTAR REFRESH AUTOMÁTICO DO TOKEN antes de redirecionar para login
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginPage = window.location.pathname === '/login';
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const isRefreshEndpoint = error.config?.url?.includes('/auth/refresh');

      // Não tentar refresh se:
      // - Já estiver na página de login
      // - Já for um endpoint de auth (evitar loops)
      // - Já for o endpoint de refresh (falhou o refresh)
      if (isLoginPage || isAuthEndpoint || isRefreshEndpoint) {
        return Promise.reject(error);
      }

      // 🔒 Se já estiver refreshing, colocar requisição na fila
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 [API] Tentando renovar token automaticamente...');

        // ⚠️ IMPORTANTE: O endpoint /auth/refresh REQUER autenticação (JWT Guard)
        // Então precisamos enviar o token antigo (mesmo expirado) para o backend verificar
        const oldToken = localStorage.getItem('authToken');

        const refreshResponse = await apiPublic.post(
          '/auth/refresh',
          {},
          {
            headers: {
              Authorization: `Bearer ${oldToken}`,
            },
          }
        );

        if (refreshResponse.data?.success && refreshResponse.data?.data?.access_token) {
          const newToken = refreshResponse.data.data.access_token;

          // Salvar novo token
          localStorage.setItem('authToken', newToken);

          console.log('✅ [API] Token renovado com sucesso!');

          // Atualizar header da requisição original
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Processar fila de requisições pendentes
          processQueue(null, newToken);

          isRefreshing = false;

          // Retentar requisição original
          return api(originalRequest);
        } else {
          throw new Error('Resposta de refresh inválida');
        }
      } catch (refreshError) {
        console.error('❌ [API] Falha ao renovar token:', refreshError);

        // Processar fila com erro
        processQueue(refreshError, null);

        isRefreshing = false;

        // Token não pôde ser renovado - limpar sessão e redirecionar
        console.warn('⚠️ [API] Token expirado e não pôde ser renovado - Limpando sessão...');

        localStorage.removeItem('authToken');
        localStorage.removeItem('user_data');
        localStorage.removeItem('empresaAtiva');
        localStorage.removeItem('selectedProfileId');
        localStorage.setItem('sessionExpired', 'true');

        setTimeout(() => {
          window.location.href = '/login';
        }, 100);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
