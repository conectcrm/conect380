import axios from 'axios';

const sanitizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_GUARDIAN_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return sanitizeBaseUrl(envUrl.trim());
  }

  if (typeof window === 'undefined' || !window.location) {
    return 'http://localhost:3001';
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  return `${protocol}://${hostname}:3001`;
};

export const GUARDIAN_AUTH_TOKEN_KEY = 'guardian_auth_token';
export const GUARDIAN_USER_DATA_KEY = 'guardian_user_data';

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(GUARDIAN_AUTH_TOKEN_KEY);
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
      localStorage.removeItem(GUARDIAN_AUTH_TOKEN_KEY);
      localStorage.removeItem(GUARDIAN_USER_DATA_KEY);
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
