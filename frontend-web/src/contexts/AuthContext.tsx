import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

const DEBUG = process.env.NODE_ENV === 'development';
const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';
const AUTH_TOKEN_EVENT_NAME = 'authTokenChanged';

const dispatchEmpresaAtivaChanged = (empresaId?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(EMPRESA_EVENT_NAME, {
      detail: { empresaId: empresaId || null },
    }),
  );
};

const dispatchAuthTokenChanged = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_EVENT_NAME));
};

const syncEmpresaAtiva = (empresaId?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (empresaId) {
    localStorage.setItem('empresaAtiva', empresaId);
    dispatchEmpresaAtivaChanged(empresaId);
    return;
  }

  localStorage.removeItem('empresaAtiva');
  dispatchEmpresaAtivaChanged(null);
};

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
          try {
            const profileResponse = await authService.getProfile();

            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
              authService.setUser(profileResponse.data);
              syncEmpresaAtiva(profileResponse.data.empresa?.id);
            } else {
              console.warn('[AuthContext] Unexpected response when loading profile:', profileResponse);
              setUser(savedUser);
              syncEmpresaAtiva(savedUser.empresa?.id);
            }
          } catch (profileError: any) {
            console.warn('[AuthContext] Error loading profile:', profileError.message);

            if (profileError.response?.status === 401) {
              console.warn('[AuthContext] Invalid token (401), performing logout');
              authService.logout();
              syncEmpresaAtiva(null);
              dispatchAuthTokenChanged();
              setUser(null);
            } else {
              console.warn('[AuthContext] Network/server error, keeping saved session data');
              setUser(savedUser);
              syncEmpresaAtiva(savedUser.empresa?.id);
            }
          }
        } else {
          if (DEBUG) {
            console.log('[AuthContext] No token/user found, user is not authenticated');
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        authService.logout();
        syncEmpresaAtiva(null);
        dispatchAuthTokenChanged();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, senha: password });

      if (response.action === 'TROCAR_SENHA') {
        const trocarSenhaData = response.data as { userId: string; email: string; nome: string };
        const error = new Error('TROCAR_SENHA') as any;
        error.data = {
          userId: trocarSenhaData.userId,
          email: trocarSenhaData.email,
          nome: trocarSenhaData.nome,
          senhaTemporaria: password,
        };
        throw error;
      }

      if (response.success && response.data) {
        const loginData = response.data as { access_token: string; user: User };
        const { access_token, user: userData } = loginData;

        authService.setToken(access_token);
        dispatchAuthTokenChanged();

        authService.setUser(userData);
        setUser(userData);

        if (userData.empresa?.id) {
          syncEmpresaAtiva(userData.empresa.id);
          if (DEBUG) {
            console.log('[AuthContext] empresaId saved:', userData.empresa.id);
          }
        } else {
          syncEmpresaAtiva(null);
          console.warn('[AuthContext] userData.empresa.id not found:', userData);
        }
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    syncEmpresaAtiva(null);
    localStorage.removeItem('selectedProfileId');
    dispatchAuthTokenChanged();
    if (DEBUG) {
      console.log('[AuthContext] Logout done, empresaId removed');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      authService.setUser(updatedUser);
      syncEmpresaAtiva(updatedUser.empresa?.id);
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
