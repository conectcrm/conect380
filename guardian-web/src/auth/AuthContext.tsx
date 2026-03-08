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
import { api, publicApi, GUARDIAN_AUTH_TOKEN_KEY, GUARDIAN_USER_DATA_KEY } from '../lib/api';
import {
  isGuardianRole,
  type ApiAuthResponse,
  type GuardianRole,
  type LoginSuccessPayload,
  type MfaRequiredPayload,
  type ProfileUser,
} from '../types/auth';

export type LoginOutcome = 'authenticated' | 'mfa_required';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: ProfileUser | null;
  mfaChallenge: MfaRequiredPayload | null;
  login: (email: string, senha: string) => Promise<LoginOutcome>;
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

const normalizeAuthResponse = (raw: unknown): ApiAuthResponse => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const response = raw as Record<string, unknown>;
  if (
    typeof response.action !== 'undefined' ||
    typeof response.success !== 'undefined' ||
    typeof response.message !== 'undefined'
  ) {
    return response as ApiAuthResponse;
  }

  if (response.data && typeof response.data === 'object') {
    const nested = response.data as Record<string, unknown>;
    if (
      typeof nested.action !== 'undefined' ||
      typeof nested.success !== 'undefined' ||
      typeof nested.message !== 'undefined'
    ) {
      return nested as ApiAuthResponse;
    }
  }

  return response as ApiAuthResponse;
};

const extractMfaChallenge = (raw: unknown): MfaRequiredPayload | null => {
  const response = normalizeAuthResponse(raw);

  const candidates: unknown[] = [response, response.data];
  if (response.data && typeof response.data === 'object') {
    const data = response.data as Record<string, unknown>;
    candidates.push(data.data, data.challenge, data.payload);
  }

  for (const candidate of candidates) {
    if (isMfaRequiredPayload(candidate)) {
      return candidate;
    }
  }

  const code = (response as { code?: unknown }).code;
  const markers = [response.action, response.message, code];
  const hasMfaMarker = markers.some(
    (marker) => typeof marker === 'string' && marker.toUpperCase() === 'MFA_REQUIRED',
  );

  if (!hasMfaMarker) {
    return null;
  }

  return null;
};

const saveSession = (payload: LoginSuccessPayload): void => {
  localStorage.setItem(GUARDIAN_AUTH_TOKEN_KEY, payload.access_token);
  localStorage.setItem(GUARDIAN_USER_DATA_KEY, JSON.stringify(payload.user));
};

const clearSession = (): void => {
  localStorage.removeItem(GUARDIAN_AUTH_TOKEN_KEY);
  localStorage.removeItem(GUARDIAN_USER_DATA_KEY);
};

const parseStoredUser = (): ProfileUser | null => {
  const raw = localStorage.getItem(GUARDIAN_USER_DATA_KEY);
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
      const normalizedRole = String(payload.user.role || '').toLowerCase() as GuardianRole;
      if (!isGuardianRole(normalizedRole)) {
        logout();
        throw new Error('Acesso negado para este perfil no guardian-web.');
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
    const normalizedRole = String(nextUser.role || '').toLowerCase() as GuardianRole;
    if (!isGuardianRole(normalizedRole)) {
      logout();
      throw new Error('Acesso negado para este perfil no guardian-web.');
    }

    localStorage.setItem(GUARDIAN_USER_DATA_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, [logout]);

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem(GUARDIAN_AUTH_TOKEN_KEY);
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
    async (email: string, senha: string): Promise<LoginOutcome> => {
      setMfaChallenge(null);

      try {
        const apiResponse = await publicApi.post('/auth/login', { email, senha });
        const response = normalizeAuthResponse(apiResponse.data);
        const challenge = extractMfaChallenge(response);
        if (challenge) {
          setMfaChallenge(challenge);
          return 'mfa_required';
        }

        if (!response.success || !isLoginSuccessPayload(response.data)) {
          throw new Error(response.message || 'Resposta de autenticacao invalida.');
        }

        applySession(response.data);
        return 'authenticated';
      } catch (error) {
        const challenge = extractMfaChallenge(
          error instanceof AxiosError ? error.response?.data : undefined,
        );
        if (challenge) {
          setMfaChallenge(challenge);
          return 'mfa_required';
        }

        throw new Error(parseErrorMessage(error, 'Falha ao autenticar.'));
      }
    },
    [applySession],
  );

  const verifyMfa = useCallback(
    async (challengeId: string, codigo: string) => {
      let response: ApiAuthResponse;
      try {
        const apiResponse = await publicApi.post('/auth/mfa/verify', { challengeId, codigo });
        response = normalizeAuthResponse(apiResponse.data);
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
      const response = normalizeAuthResponse(apiResponse.data);
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
