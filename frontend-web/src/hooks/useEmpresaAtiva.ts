import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEmpresas } from '../contexts/EmpresaContextAPIReal';

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
  slug: string | null;
  isLoading: boolean;
  origin: 'empresa_context' | 'auth_user' | 'fallback';
};

export const useEmpresaAtiva = (): EmpresaAtivaData => {
  const { user } = useAuth();
  const { empresas, empresaAtiva, loading } = useEmpresas();
  const [storedEmpresaId, setStoredEmpresaId] = useState<string | null>(getStoredEmpresaId);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFromStorage = () => {
      setStoredEmpresaId(getStoredEmpresaId());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'empresaAtiva') {
        syncFromStorage();
      }
    };

    const handleEmpresaEvent = (event: Event) => {
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
      ? empresas.find((empresa) => empresa.id === storedEmpresaId) ?? null
      : null;

    const companyFromContext = storedEmpresaId
      ? empresaAtiva?.id === storedEmpresaId
        ? empresaAtiva
        : fromEmpresasList
      : empresaAtiva ?? fromEmpresasList;

    const contextNome =
      typeof companyFromContext?.nome === 'string' ? companyFromContext.nome.trim() : '';

    if (contextNome) {
      return {
        id: companyFromContext?.id ?? null,
        nome: contextNome,
        nomeCurto: shortenEmpresaName(contextNome),
        slug: null,
        isLoading: loading,
        origin: 'empresa_context' as const,
      };
    }

    const authNome = typeof user?.empresa?.nome === 'string' ? user.empresa.nome.trim() : '';
    if (authNome) {
      return {
        id: user?.empresa?.id ?? storedEmpresaId ?? null,
        nome: authNome,
        nomeCurto: shortenEmpresaName(authNome),
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
      slug: null,
      isLoading: loading,
      origin: 'fallback' as const,
    };
  }, [empresas, empresaAtiva, loading, storedEmpresaId, user?.empresa]);
};

export type { EmpresaAtivaData };
