import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AxiosError } from 'axios';
import { api, publicApi, ADMIN_AUTH_TOKEN_KEY, ADMIN_USER_DATA_KEY } from '../lib/api';
import {
  isAdminRole,
  type ApiAuthResponse,
  type LoginSuccessPayload,
  type MfaRequiredPayload,
  type ProfileUser,
} from '../types/auth';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: ProfileUser | null;
  mfaChallenge: MfaRequiredPayload | null;
  login: (email: string, senha: string) => Promise<void>;
  verifyMfa: (challengeId: string, codigo: string) => Promise<void>;
  resendMfa: (challengeId: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const isLoginSuccessPayload = (value: unknown): value is LoginSuccessPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.access_token === 'string' &&
    typeof payload.user === 'object' &&
    payload.user !== null
  );
};

const isMfaRequiredPayload = (value: unknown): value is MfaRequiredPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return typeof payload.challengeId === 'string' && typeof payload.email === 'string';
};

const saveSession = (payload: LoginSuccessPayload): void => {
  localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, payload.access_token);
  localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(payload.user));
};

const clearSession = (): void => {
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_DATA_KEY);
};

const parseStoredUser = (): ProfileUser | null => {
  const raw = localStorage.getItem(ADMIN_USER_DATA_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.email === 'string') {
      return parsed as ProfileUser;
    }
  } catch {
    return null;
  }

  return null;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<MfaRequiredPayload | null>(null);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setMfaChallenge(null);
  }, []);

  const applySession = useCallback(
    (payload: LoginSuccessPayload) => {
      const normalizedRole = String(payload.user.role || '').toLowerCase();
      if (!isAdminRole(normalizedRole)) {
        logout();
        throw new Error('Acesso negado para este perfil no admin-web.');
      }

      saveSession(payload);
      setUser(payload.user);
      setMfaChallenge(null);
    },
    [logout],
  );

  const refreshProfile = useCallback(async () => {
    const response = await api.get('/users/profile');
    const profile = response?.data?.data ?? response?.data;
    if (!profile || typeof profile !== 'object') {
      throw new Error('Resposta de perfil invalida.');
    }

    const nextUser = profile as ProfileUser;
    const normalizedRole = String(nextUser.role || '').toLowerCase();
    if (!isAdminRole(normalizedRole)) {
      logout();
      throw new Error('Acesso negado para este perfil no admin-web.');
    }

    localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, [logout]);

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
      const storedUser = parseStoredUser();

      if (!token || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [refreshProfile]);

  const login = useCallback(
    async (email: string, senha: string) => {
      let response: ApiAuthResponse;
      try {
        const apiResponse = await publicApi.post('/auth/login', { email, senha });
        response = apiResponse.data as ApiAuthResponse;
      } catch (error) {
        throw new Error(parseErrorMessage(error, 'Falha ao autenticar.'));
      }

      if (response.action === 'MFA_REQUIRED' && isMfaRequiredPayload(response.data)) {
        setMfaChallenge(response.data);
        return;
      }

      if (!response.success || !isLoginSuccessPayload(response.data)) {
        throw new Error(response.message || 'Resposta de autenticacao invalida.');
      }

      applySession(response.data);
    },
    [applySession],
  );

  const verifyMfa = useCallback(
    async (challengeId: string, codigo: string) => {
      let response: ApiAuthResponse;
      try {
        const apiResponse = await publicApi.post('/auth/mfa/verify', { challengeId, codigo });
        response = apiResponse.data as ApiAuthResponse;
      } catch (error) {
        throw new Error(parseErrorMessage(error, 'Falha ao validar MFA.'));
      }

      if (!response.success || !isLoginSuccessPayload(response.data)) {
        throw new Error(response.message || 'Resposta de MFA invalida.');
      }

      applySession(response.data);
    },
    [applySession],
  );

  const resendMfa = useCallback(async (challengeId: string) => {
    try {
      const apiResponse = await publicApi.post('/auth/mfa/resend', { challengeId });
      const response = apiResponse.data as ApiAuthResponse;
      if (!response.success || !isMfaRequiredPayload(response.data)) {
        throw new Error(response.message || 'Resposta de reenvio MFA invalida.');
      }
      setMfaChallenge(response.data);
    } catch (error) {
      throw new Error(parseErrorMessage(error, 'Falha ao reenviar codigo MFA.'));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      user,
      mfaChallenge,
      login,
      verifyMfa,
      resendMfa,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, mfaChallenge, refreshProfile, resendMfa, user, verifyMfa],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
};
