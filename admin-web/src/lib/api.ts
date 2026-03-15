import axios from 'axios';

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_ADMIN_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  return `${window.location.origin}/api`;
};

export const ADMIN_AUTH_TOKEN_KEY = 'admin_auth_token';
export const ADMIN_USER_DATA_KEY = 'admin_user_data';

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    if (status === 401) {
      localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_DATA_KEY);
    }
    return Promise.reject(error);
  },
);

export const publicApi = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});
