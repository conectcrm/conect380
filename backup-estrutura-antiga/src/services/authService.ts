import api from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
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

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
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
