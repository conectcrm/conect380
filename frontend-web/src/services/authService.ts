import api, { apiPublic } from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';

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

  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    const response = await api.post<ApiResponse<{ access_token: string }>>('/auth/refresh');
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
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { success: true, message: 'Sessao local encerrada sem token ativo.' };
    }

    const response = await apiPublic.post<ApiResponse>(
      '/auth/logout',
      payload || {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_data');
    localStorage.removeItem('empresaAtiva');
    localStorage.removeItem('selectedProfileId');
  },

  setToken(token: string) {
    localStorage.setItem('authToken', token);
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  setUser(user: User) {
    localStorage.setItem('user_data', JSON.stringify(user));
  },

  getUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  },
};
