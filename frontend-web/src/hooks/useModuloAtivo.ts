import { useState, useEffect } from 'react';
import { modulosService, ModuloEnum } from '../services/modulosService';
import { apiPublic } from '../services/api';

const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';
type ModuloCheckError = 'backend_unavailable' | null;

const HEALTHCHECK_TTL_MS = 15_000;
let lastHealthCheckAt = 0;
let lastHealthOk = true;
let healthRequest: Promise<boolean> | null = null;

const checkBackendHealth = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - lastHealthCheckAt <= HEALTHCHECK_TTL_MS) {
    return lastHealthOk;
  }

  if (healthRequest) {
    return healthRequest;
  }

  healthRequest = apiPublic
    .get('/health')
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      healthRequest = null;
    });

  const ok = await healthRequest;
  lastHealthOk = ok;
  lastHealthCheckAt = Date.now();
  return ok;
};

const isBackendUnavailableError = (error: unknown): boolean => {
  const status = (error as any)?.response?.status;

  // Axios: quando nao existe `response`, geralmente e falha de rede/servidor fora do ar.
  if (status === undefined || status === null) {
    const code = String((error as any)?.code || '').toUpperCase();
    const message = String((error as any)?.message || '').toLowerCase();

    if (
      code.includes('ECONNREFUSED') ||
      code.includes('ERR_NETWORK') ||
      code.includes('ENOTFOUND') ||
      code.includes('ETIMEDOUT')
    ) {
      return true;
    }

    if (message.includes('network error') || message.includes('failed to fetch')) {
      return true;
    }

    // Sem status e sem assinatura clara: ainda assim tratamos como indisponibilidade.
    return true;
  }

  return [502, 503, 504].includes(Number(status));
};

const getEmpresaAtivaKey = (): string =>
  typeof window === 'undefined' ? '' : localStorage.getItem('empresaAtiva') || '';

const useEmpresaAtivaDependency = (): string => {
  const [empresaAtivaKey, setEmpresaAtivaKey] = useState<string>(getEmpresaAtivaKey);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncEmpresaAtiva = () => {
      setEmpresaAtivaKey(getEmpresaAtivaKey());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'empresaAtiva') {
        syncEmpresaAtiva();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EMPRESA_EVENT_NAME, syncEmpresaAtiva);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EMPRESA_EVENT_NAME, syncEmpresaAtiva);
    };
  }, []);

  return empresaAtivaKey;
};

/**
 * Hook para verificar se empresa tem módulo ativo
 * @param modulo Módulo a verificar
 * @returns [isAtivo, isLoading, errorKind]
 */
export const useModuloAtivo = (modulo: ModuloEnum): [boolean, boolean, ModuloCheckError] => {
  const [isAtivo, setIsAtivo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorKind, setErrorKind] = useState<ModuloCheckError>(null);
  const empresaAtivaKey = useEmpresaAtivaDependency();

  useEffect(() => {
    const verificar = async () => {
      try {
        setIsLoading(true);
        setErrorKind(null);

        // Usa listagem deduplicada/cacheada para evitar 1 request por rota.
        const modulos = await modulosService.listarModulosAtivos();
        setIsAtivo(modulos.includes(modulo));

        // Mesmo com cache de modulos, validamos rapidamente se o backend esta no ar.
        const healthOk = await checkBackendHealth();
        if (!healthOk) {
          setErrorKind('backend_unavailable');
        }
      } catch (error) {
        console.error(`Erro ao verificar módulo ${modulo}:`, error);
        setIsAtivo(false);
        setErrorKind(isBackendUnavailableError(error) ? 'backend_unavailable' : null);
      } finally {
        setIsLoading(false);
      }
    };

    void verificar();
  }, [modulo, empresaAtivaKey]);

  return [isAtivo, isLoading, errorKind];
};

/**
 * Hook para listar todos os módulos ativos
 * @returns [modulosAtivos, isLoading]
 */
export const useModulosAtivos = (): [ModuloEnum[], boolean] => {
  const [modulosAtivos, setModulosAtivos] = useState<ModuloEnum[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const empresaAtivaKey = useEmpresaAtivaDependency();

  useEffect(() => {
    const carregar = async () => {
      try {
        setIsLoading(true);
        const modulos = await modulosService.listarModulosAtivos();
        setModulosAtivos(modulos);
      } catch (error) {
        console.error('Erro ao carregar módulos ativos:', error);
        setModulosAtivos([]);
      } finally {
        setIsLoading(false);
      }
    };

    carregar();
  }, [empresaAtivaKey]);

  return [modulosAtivos, isLoading];
};
