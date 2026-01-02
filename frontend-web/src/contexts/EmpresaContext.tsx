import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationContext';

export interface EmpresaInfo {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  plano: {
    nome: 'Starter' | 'Professional' | 'Enterprise';
    preco: number;
    features: string[];
  };
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  isActive: boolean;
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
  addEmpresa: (empresa: Omit<EmpresaInfo, 'id'>) => Promise<void>;
  updateEmpresa: (empresaId: string, updates: Partial<EmpresaInfo>) => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

interface EmpresaProviderProps {
  children: ReactNode;
}

export const EmpresaProvider: React.FC<EmpresaProviderProps> = ({ children }) => {
  const [empresas, setEmpresas] = useState<EmpresaInfo[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Carregar empresas do usuário
  const loadEmpresas = async () => {
    try {
      setLoading(true);

      // Mock de dados - em produção seria uma chamada à API
      const mockEmpresas: EmpresaInfo[] = [
        {
          id: '1',
          nome: 'Tech Solutions Ltda',
          cnpj: '12.345.678/0001-90',
          email: 'contato@techsolutions.com.br',
          telefone: '(11) 99999-8888',
          plano: {
            nome: 'Professional',
            preco: 199.9,
            features: ['Até 50 usuários', 'API completa', 'Suporte prioritário'],
          },
          status: 'ativa',
          isActive: true,
          dataVencimento: new Date('2025-08-30'),
          dataCriacao: new Date('2023-01-15'),
          ultimoAcesso: new Date('2025-07-30'),
        },
        {
          id: '2',
          nome: 'Marketing Digital Corp',
          cnpj: '98.765.432/0001-10',
          email: 'admin@mdcorp.com.br',
          telefone: '(21) 88888-7777',
          plano: {
            nome: 'Enterprise',
            preco: 499.9,
            features: ['Usuários ilimitados', 'API + Webhooks', 'Suporte 24/7'],
          },
          status: 'ativa',
          isActive: false,
          dataVencimento: new Date('2025-09-15'),
          dataCriacao: new Date('2022-08-20'),
          ultimoAcesso: new Date('2025-07-29'),
        },
        {
          id: '3',
          nome: 'Consultoria Empresarial',
          cnpj: '11.222.333/0001-44',
          email: 'contato@consultoria.com.br',
          telefone: '(31) 77777-6666',
          plano: {
            nome: 'Starter',
            preco: 79.9,
            features: ['Até 10 usuários', 'API básica', 'Suporte por email'],
          },
          status: 'trial',
          isActive: false,
          dataVencimento: new Date('2025-08-05'),
          dataCriacao: new Date('2025-07-20'),
          ultimoAcesso: new Date('2025-07-28'),
        },
      ];

      // Simular delay da API
      await new Promise((resolve) => setTimeout(resolve, 800));

      setEmpresas(mockEmpresas);
      const ativa = mockEmpresas.find((e) => e.isActive) || mockEmpresas[0];
      setEmpresaAtiva(ativa);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao carregar empresas',
        message: 'Não foi possível carregar suas empresas. Tente novamente.',
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

      // Atualizar estado local
      setEmpresas((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((e) => ({
          ...e,
          isActive: e.id === empresaId,
        }));
      });

      setEmpresaAtiva(empresa);

      // Simular chamada à API para alterar contexto
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Salvar no localStorage (ou seria enviado para API)
      localStorage.setItem('empresaAtiva', empresaId);

      addNotification({
        type: 'success',
        title: 'Empresa alterada',
        message: `Agora você está trabalhando com ${empresa.nome}`,
      });
    } catch (error) {
      console.error('Erro ao alterar empresa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao alterar empresa',
        message: 'Não foi possível alterar a empresa. Tente novamente.',
      });
      throw error;
    }
  };

  // Recarregar empresas
  const refreshEmpresas = async () => {
    await loadEmpresas();
  };

  // Adicionar nova empresa
  const addEmpresa = async (novaEmpresa: Omit<EmpresaInfo, 'id'>) => {
    try {
      // Simular criação na API
      const empresaComId: EmpresaInfo = {
        ...novaEmpresa,
        id: Date.now().toString(), // Em produção viria da API
      };

      setEmpresas((prev) => [...prev, empresaComId]);

      addNotification({
        type: 'success',
        title: 'Empresa cadastrada',
        message: `A empresa ${novaEmpresa.nome} foi cadastrada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar empresa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao cadastrar empresa',
        message: 'Não foi possível cadastrar a empresa. Tente novamente.',
      });
      throw error;
    }
  };

  // Atualizar empresa
  const updateEmpresa = async (empresaId: string, updates: Partial<EmpresaInfo>) => {
    try {
      setEmpresas((prev) => prev.map((e) => (e.id === empresaId ? { ...e, ...updates } : e)));

      if (empresaAtiva?.id === empresaId) {
        setEmpresaAtiva((prev) => (prev ? { ...prev, ...updates } : null));
      }

      addNotification({
        type: 'success',
        title: 'Empresa atualizada',
        message: 'As informações da empresa foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar empresa',
        message: 'Não foi possível atualizar a empresa. Tente novamente.',
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
