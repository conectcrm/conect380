import { useState, useEffect } from 'react';
import { modulosService, ModuloEnum } from '../services/modulosService';

const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';

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
 * @returns [isAtivo, isLoading]
 */
export const useModuloAtivo = (modulo: ModuloEnum): [boolean, boolean] => {
  const [isAtivo, setIsAtivo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const empresaAtivaKey = useEmpresaAtivaDependency();

  useEffect(() => {
    const verificar = async () => {
      try {
        setIsLoading(true);
        const ativo = await modulosService.isModuloAtivo(modulo);
        setIsAtivo(ativo);
      } catch (error) {
        console.error(`Erro ao verificar módulo ${modulo}:`, error);
        setIsAtivo(false);
      } finally {
        setIsLoading(false);
      }
    };

    verificar();
  }, [modulo, empresaAtivaKey]);

  return [isAtivo, isLoading];
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
