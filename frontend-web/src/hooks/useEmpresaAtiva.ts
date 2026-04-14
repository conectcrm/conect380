import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEmpresas } from '../contexts/EmpresaContextAPIReal';
import { resolveAvatarUrl } from '../utils/avatar';

const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';

const getStoredEmpresaId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = localStorage.getItem('empresaAtiva');
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const shortenEmpresaName = (value: string): string => {
  const normalized = value.trim();
  if (normalized.length <= 34) {
    return normalized;
  }

  return `${normalized.slice(0, 31).trim()}...`;
};

type EmpresaAtivaData = {
  id: string | null;
  nome: string;
  nomeCurto: string;
  logoUrl: string | null;
  slug: string | null;
  isLoading: boolean;
  origin: 'empresa_context' | 'auth_user' | 'fallback';
};

const getLogoCandidate = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const logoValue = record.logoUrl ?? record.logo_url ?? record.logo;
  if (typeof logoValue !== 'string') {
    return null;
  }

  const normalized = logoValue.trim();
  return normalized.length > 0 ? normalized : null;
};

export const useEmpresaAtiva = (): EmpresaAtivaData => {
  const { user } = useAuth();
  const { empresas, empresaAtiva, loading } = useEmpresas();
  const [storedEmpresaId, setStoredEmpresaId] = useState<string | null>(getStoredEmpresaId);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFromStorage = (): void => {
      setStoredEmpresaId(getStoredEmpresaId());
    };

    const handleStorage = (event: StorageEvent): void => {
      if (event.key === 'empresaAtiva') {
        syncFromStorage();
      }
    };

    const handleEmpresaEvent = (event: Event): void => {
      const customEvent = event as CustomEvent<{ empresaId?: string | null }>;
      const empresaId = customEvent?.detail?.empresaId ?? null;

      if (typeof empresaId === 'string' && empresaId.trim().length > 0) {
        setStoredEmpresaId(empresaId);
        return;
      }

      syncFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EMPRESA_EVENT_NAME, handleEmpresaEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EMPRESA_EVENT_NAME, handleEmpresaEvent);
    };
  }, []);

  return useMemo(() => {
    const fromEmpresasList = storedEmpresaId
      ? (empresas.find((empresa) => empresa.id === storedEmpresaId) ?? null)
      : null;

    const companyFromContext = storedEmpresaId
      ? empresaAtiva?.id === storedEmpresaId
        ? empresaAtiva
        : fromEmpresasList
      : (empresaAtiva ?? fromEmpresasList);

    const contextNome =
      typeof companyFromContext?.nome === 'string' ? companyFromContext.nome.trim() : '';
    const contextLogoCandidate =
      getLogoCandidate(companyFromContext?.configuracoes?.geral) ??
      getLogoCandidate(companyFromContext?.configuracoes) ??
      getLogoCandidate(companyFromContext);
    const contextLogoUrl = resolveAvatarUrl(contextLogoCandidate);

    if (contextNome) {
      return {
        id: companyFromContext?.id ?? null,
        nome: contextNome,
        nomeCurto: shortenEmpresaName(contextNome),
        logoUrl: contextLogoUrl,
        slug: null,
        isLoading: loading,
        origin: 'empresa_context' as const,
      };
    }

    const authNome = typeof user?.empresa?.nome === 'string' ? user.empresa.nome.trim() : '';
    const authLogoCandidate = getLogoCandidate(user?.empresa);
    const authLogoUrl = resolveAvatarUrl(authLogoCandidate);
    if (authNome) {
      return {
        id: user?.empresa?.id ?? storedEmpresaId ?? null,
        nome: authNome,
        nomeCurto: shortenEmpresaName(authNome),
        logoUrl: authLogoUrl,
        slug: user?.empresa?.slug ?? null,
        isLoading: loading,
        origin: 'auth_user' as const,
      };
    }

    const fallbackName = loading ? 'Carregando empresa...' : 'Empresa ativa';
    return {
      id: storedEmpresaId,
      nome: fallbackName,
      nomeCurto: shortenEmpresaName(fallbackName),
      logoUrl: null,
      slug: null,
      isLoading: loading,
      origin: 'fallback' as const,
    };
  }, [empresas, empresaAtiva, loading, storedEmpresaId, user]);
};

export type { EmpresaAtivaData };
