import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

const DEBUG = process.env.NODE_ENV === 'development';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        const savedUser = authService.getUser();

        if (token && savedUser) {
          // Verificar se o token ainda é válido fazendo uma requisição
          try {
            const profileResponse = await authService.getProfile();

            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
              authService.setUser(profileResponse.data);

              // ✨ GARANTIR que empresaId está salvo ao verificar perfil
              if (profileResponse.data.empresa?.id) {
                localStorage.setItem('empresaAtiva', profileResponse.data.empresa.id);
              }
            } else {
              console.warn('⚠️ [AuthContext] Resposta inesperada ao verificar perfil:', profileResponse);
              // Manter o usuário salvo mesmo se a verificação falhar
              setUser(savedUser);
            }
          } catch (profileError: any) {
            console.warn('⚠️ [AuthContext] Erro ao verificar perfil:', profileError.message);

            // Se for erro 401, o token é inválido - fazer logout
            if (profileError.response?.status === 401) {
              console.warn('⚠️ [AuthContext] Token inválido (401) - Fazendo logout');
              authService.logout();
              setUser(null);
            } else {
              // Para outros erros (rede, servidor, etc), manter o usuário logado
              console.warn('⚠️ [AuthContext] Erro de rede/servidor - Mantendo sessão com dados salvos');
              setUser(savedUser);
            }
          }
        } else {
          console.log('ℹ️ [AuthContext] Nenhum token/usuário encontrado - Usuário não autenticado');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Erro ao inicializar autenticação:', error);
        // Em caso de erro inesperado, limpar tudo
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, senha: password });

      // ✅ VERIFICAR SE PRECISA TROCAR SENHA (primeiro acesso)
      if (response.action === 'TROCAR_SENHA') {
        const trocarSenhaData = response.data as { userId: string; email: string; nome: string };
        // Lançar erro especial com dados para redirect
        const error = new Error('TROCAR_SENHA') as any;
        error.data = {
          userId: trocarSenhaData.userId,
          email: trocarSenhaData.email,
          nome: trocarSenhaData.nome,
        };
        throw error;
      }

      if (response.success && response.data) {
        const loginData = response.data as { access_token: string; user: User };
        const { access_token, user: userData } = loginData;

        authService.setToken(access_token);
        authService.setUser(userData);
        setUser(userData);

        // ✨ SALVAR empresaId para uso em rotas de atendimento
        if (userData.empresa?.id) {
          localStorage.setItem('empresaAtiva', userData.empresa.id);
          console.log('✅ [AuthContext] empresaId salvo:', userData.empresa.id);
        } else {
          console.warn('⚠️ [AuthContext] userData.empresa.id não encontrado:', userData);
        }
      } else {
        throw new Error('Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // ✨ LIMPAR empresaId no logout
    localStorage.removeItem('empresaAtiva');
    console.log('🔓 [AuthContext] Logout realizado - empresaId removido');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      authService.setUser(updatedUser);
    }
  };

  const value: AuthContextData = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
