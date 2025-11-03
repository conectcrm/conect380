import { useState, useEffect } from 'react';
import { modulosService, ModuloEnum } from '../services/modulosService';

/**
 * Hook para verificar se empresa tem módulo ativo
 * @param modulo Módulo a verificar
 * @returns [isAtivo, isLoading]
 */
export const useModuloAtivo = (modulo: ModuloEnum): [boolean, boolean] => {
  const [isAtivo, setIsAtivo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  }, [modulo]);

  return [isAtivo, isLoading];
};

/**
 * Hook para listar todos os módulos ativos
 * @returns [modulosAtivos, isLoading]
 */
export const useModulosAtivos = (): [ModuloEnum[], boolean] => {
  const [modulosAtivos, setModulosAtivos] = useState<ModuloEnum[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  }, []);

  return [modulosAtivos, isLoading];
};
