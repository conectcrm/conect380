import api, { apiPublic } from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';

const ACCESS_TOKEN_STORAGE_KEY = 'authToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const USER_STORAGE_KEY = 'user_data';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async verifyMfaCode(payload: {
    challengeId: string;
    codigo: string;
  }): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/mfa/verify', payload);
    return response.data;
  },

  async resendMfaCode(payload: {
    challengeId: string;
  }): Promise<ApiResponse<{ challengeId: string; email: string; expiresInSeconds: number; canResendAfterSeconds: number }>> {
    const response = await api.post<
      ApiResponse<{
        challengeId: string;
        email: string;
        expiresInSeconds: number;
        canResendAfterSeconds: number;
      }>
    >('/auth/mfa/resend', payload);
    return response.data;
  },

  async register(userData: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    empresa_id: string;
  }): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>('/auth/register', userData);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    const response = await apiPublic.post<ApiResponse<{ access_token: string; refresh_token: string }>>(
      '/auth/refresh',
      { refreshToken },
    );
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return response.data;
  },

  async solicitarRecuperacaoSenha(email: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async redefinirSenhaComToken(dados: { token: string; senhaNova: string }): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/auth/reset-password', dados);
    return response.data;
  },

  async logoutSession(payload?: { reason?: string }): Promise<ApiResponse> {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    const requestBody = {
      ...(payload || {}),
      ...(refreshToken ? { refreshToken } : {}),
    };

    if (!token) {
      return { success: true, message: 'Sessao local encerrada sem token ativo.' };
    }

    const response = await apiPublic.post<ApiResponse>(
      '/auth/logout',
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  logout() {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('empresaAtiva');
    localStorage.removeItem('selectedProfileId');
    localStorage.removeItem('sessionExpired');
    localStorage.removeItem('sessionExpiredReason');
    localStorage.removeItem('sessionExpiredMessage');
  },

  setSessionTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  },

  setToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  },

  setRefreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  },

  setUser(user: User) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  },
};
