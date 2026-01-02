import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationContext';
import {
  minhasEmpresasService,
  EmpresaCompleta,
  NovaEmpresaRequest,
} from '../services/minhasEmpresasService';

export interface EmpresaInfo
  extends Omit<EmpresaCompleta, 'dataVencimento' | 'dataCriacao' | 'ultimoAcesso'> {
  dataVencimento: Date;
  dataCriacao: Date;
  ultimoAcesso: Date;
}

interface EmpresaContextType {
  empresas: EmpresaInfo[];
  empresaAtiva: EmpresaInfo | null;
  loading: boolean;
  switchEmpresa: (empresaId: string) => Promise<void>;
  refreshEmpresas: () => Promise<void>;
  addEmpresa: (empresa: NovaEmpresaRequest) => Promise<void>;
  updateEmpresa: (empresaId: string, updates: Partial<EmpresaInfo>) => Promise<void>;
  updateConfiguracoes: (
    empresaId: string,
    configuracoes: Partial<EmpresaInfo['configuracoes']>,
  ) => Promise<void>;
  getEstatisticas: (
    empresaId: string,
    periodo?: 'mes' | 'trimestre' | 'ano',
  ) => Promise<EmpresaInfo['estatisticas']>;
  error: string | null;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

interface EmpresaProviderProps {
  children: ReactNode;
}

export const EmpresaProvider: React.FC<EmpresaProviderProps> = ({ children }) => {
  const [empresas, setEmpresas] = useState<EmpresaInfo[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Carregar empresas do usuário
  const loadEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);

      const empresasData = await minhasEmpresasService.getMinhasEmpresas();

      // Converter datas string para Date objects
      if (!Array.isArray(empresasData)) {
        console.error('❌ empresasData não é um array:', empresasData);
        return;
      }
      const empresasComDatas = empresasData.map((empresa) => ({
        ...empresa,
        dataVencimento: new Date(empresa.dataVencimento),
        dataCriacao: new Date(empresa.dataCriacao),
        ultimoAcesso: new Date(empresa.ultimoAcesso),
      }));

      setEmpresas(empresasComDatas);

      // Buscar empresa ativa do localStorage ou primeira empresa
      const empresaAtivaId = localStorage.getItem('empresaAtiva');
      const ativa =
        empresasComDatas.find((e) => (empresaAtivaId ? e.id === empresaAtivaId : e.isActive)) ||
        empresasComDatas[0];

      setEmpresaAtiva(ativa);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      setError(error.message || 'Erro ao carregar empresas');
      addNotification({
        type: 'error',
        title: 'Erro ao carregar empresas',
        message: error.message || 'Não foi possível carregar suas empresas. Tente novamente.',
        priority: 'high',
      });
    } finally {
      setLoading(false);
    }
  };

  // Alternar empresa ativa
  const switchEmpresa = async (empresaId: string) => {
    try {
      const empresa = empresas.find((e) => e.id === empresaId);
      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      // Chamar API para alternar contexto
      const result = await minhasEmpresasService.switchEmpresa(empresaId);

      if (result.success) {
        // Atualizar estado local
        setEmpresas((prev) => {
          if (!Array.isArray(prev)) return [];
          return prev.map((e) => ({
            ...e,
            isActive: e.id === empresaId,
          }));
        });

        setEmpresaAtiva({ ...empresa, isActive: true });

        addNotification({
          type: 'success',
          title: 'Empresa alterada',
          message: `Agora você está trabalhando com ${empresa.nome}`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao alterar empresa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao alterar empresa',
        message: error.message || 'Não foi possível alterar a empresa. Tente novamente.',
      });
      throw error;
    }
  };

  // Recarregar empresas
  const refreshEmpresas = async () => {
    await loadEmpresas();
  };

  // Adicionar nova empresa
  const addEmpresa = async (novaEmpresa: NovaEmpresaRequest) => {
    try {
      const empresaCriada = await minhasEmpresasService.criarEmpresa(novaEmpresa);

      const empresaComDatas: EmpresaInfo = {
        ...empresaCriada,
        dataVencimento: new Date(empresaCriada.dataVencimento),
        dataCriacao: new Date(empresaCriada.dataCriacao),
        ultimoAcesso: new Date(empresaCriada.ultimoAcesso),
      };

      setEmpresas((prev) => [...prev, empresaComDatas]);

      addNotification({
        type: 'success',
        title: 'Empresa cadastrada',
        message: `A empresa ${novaEmpresa.nome} foi cadastrada com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao adicionar empresa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao cadastrar empresa',
        message: error.message || 'Não foi possível cadastrar a empresa. Tente novamente.',
      });
      throw error;
    }
  };

  // Atualizar empresa
  const updateEmpresa = async (empresaId: string, updates: Partial<EmpresaInfo>) => {
    try {
      const empresaAtualizada = await minhasEmpresasService.atualizarEmpresa(empresaId, updates);

      const empresaComDatas: EmpresaInfo = {
        ...empresaAtualizada,
        dataVencimento: new Date(empresaAtualizada.dataVencimento),
        dataCriacao: new Date(empresaAtualizada.dataCriacao),
        ultimoAcesso: new Date(empresaAtualizada.ultimoAcesso),
      };

      setEmpresas((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((e) => (e.id === empresaId ? empresaComDatas : e));
      });

      if (empresaAtiva?.id === empresaId) {
        setEmpresaAtiva(empresaComDatas);
      }

      addNotification({
        type: 'success',
        title: 'Empresa atualizada',
        message: 'As informações da empresa foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar empresa',
        message: error.message || 'Não foi possível atualizar a empresa. Tente novamente.',
      });
      throw error;
    }
  };

  // Atualizar configurações específicas
  const updateConfiguracoes = async (
    empresaId: string,
    configuracoes: Partial<EmpresaInfo['configuracoes']>,
  ) => {
    try {
      const novasConfiguracoes = await minhasEmpresasService.atualizarConfiguracoes(
        empresaId,
        configuracoes,
      );

      setEmpresas((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((e) => (e.id === empresaId ? { ...e, configuracoes: novasConfiguracoes } : e));
      });

      if (empresaAtiva?.id === empresaId) {
        setEmpresaAtiva((prev) => (prev ? { ...prev, configuracoes: novasConfiguracoes } : null));
      }

      addNotification({
        type: 'success',
        title: 'Configurações atualizadas',
        message: 'As configurações foram salvas com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar configurações:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar configurações',
        message: error.message || 'Não foi possível atualizar as configurações.',
      });
      throw error;
    }
  };

  // Buscar estatísticas detalhadas
  const getEstatisticas = async (
    empresaId: string,
    periodo: 'mes' | 'trimestre' | 'ano' = 'mes',
  ) => {
    try {
      const estatisticas = await minhasEmpresasService.getEstatisticasEmpresa(empresaId, periodo);

      // Atualizar estatísticas no estado local
      setEmpresas((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((e) => (e.id === empresaId ? { ...e, estatisticas } : e));
      });

      if (empresaAtiva?.id === empresaId) {
        setEmpresaAtiva((prev) => (prev ? { ...prev, estatisticas } : null));
      }

      return estatisticas;
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao carregar estatísticas',
        message: error.message || 'Não foi possível carregar as estatísticas.',
      });
      throw error;
    }
  };

  // Carregar empresas na inicialização
  useEffect(() => {
    loadEmpresas();
  }, []);

  const value: EmpresaContextType = {
    empresas,
    empresaAtiva,
    loading,
    switchEmpresa,
    refreshEmpresas,
    addEmpresa,
    updateEmpresa,
    updateConfiguracoes,
    getEstatisticas,
    error,
  };

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
};

export const useEmpresas = (): EmpresaContextType => {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresas deve ser usado dentro de um EmpresaProvider');
  }
  return context;
};
