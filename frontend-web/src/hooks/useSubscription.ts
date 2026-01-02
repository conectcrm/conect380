import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export interface Plano {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number;
  limiteApiCalls: number;
  permiteWhitelabel: boolean;
  permiteApi: boolean;
  permiteIntegracao: boolean;
  suportePrioridade: 'basico' | 'prioritario' | 'vip';
  ativo: boolean;
  modulosInclusos?: ModuloSistema[];
}

export interface ModuloSistema {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  icone: string;
  cor?: string;
  ativo: boolean;
  essencial: boolean;
  ordem: number;
}

export interface AssinaturaEmpresa {
  id: string;
  empresaId: string;
  plano: Plano;
  status: 'ativa' | 'cancelada' | 'suspensa' | 'pendente';
  dataInicio: string;
  dataFim?: string;
  proximoVencimento: string;
  valorMensal: number;
  renovacaoAutomatica: boolean;
  usuariosAtivos: number;
  clientesCadastrados: number;
  storageUtilizado: number;
  apiCallsHoje: number;
  observacoes?: string;
}

export interface LimitesInfo {
  usuariosAtivos: number;
  limiteUsuarios: number;
  clientesCadastrados: number;
  limiteClientes: number;
  storageUtilizado: number;
  limiteStorage: number;
  podeAdicionarUsuario: boolean;
  podeAdicionarCliente: boolean;
  storageDisponivel: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [assinatura, setAssinatura] = useState<AssinaturaEmpresa | null>(null);
  const [limites, setLimites] = useState<LimitesInfo | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar assinatura atual da empresa
  const buscarAssinatura = async () => {
    if (!user?.empresa?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/assinaturas/empresa/${user.empresa.id}`);
      setAssinatura(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar assinatura:', err);
      if (err.response?.status === 404) {
        setAssinatura(null); // Empresa sem assinatura
      } else {
        setError('Erro ao carregar informações da assinatura');
      }
    } finally {
      setLoading(false);
    }
  };

  // Buscar limites e uso atual
  const buscarLimites = async () => {
    if (!user?.empresa?.id || !assinatura) return;

    try {
      const response = await api.get(`/assinaturas/empresa/${user.empresa.id}/limites`);
      setLimites(response.data);
    } catch (err) {
      console.error('Erro ao buscar limites:', err);
    }
  };

  // Buscar planos disponíveis
  const buscarPlanos = async () => {
    try {
      const response = await api.get('/planos');
      setPlanos(response.data.filter((plano: Plano) => plano.ativo));
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    }
  };

  // Alterar plano da assinatura
  const alterarPlano = async (novoPlanoId: string) => {
    if (!user?.empresa?.id) throw new Error('Empresa não identificada');

    try {
      const response = await api.patch(`/assinaturas/empresa/${user.empresa.id}/plano`, {
        novoPlanoId,
      });

      setAssinatura(response.data);
      await buscarLimites(); // Atualizar limites

      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erro ao alterar plano');
    }
  };

  // Cancelar assinatura
  const cancelarAssinatura = async (dataFim?: string) => {
    if (!user?.empresa?.id) throw new Error('Empresa não identificada');

    try {
      const response = await api.patch(`/assinaturas/empresa/${user.empresa.id}/cancelar`, {
        dataFim,
      });

      setAssinatura(response.data);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erro ao cancelar assinatura');
    }
  };

  // Verificar se tem acesso a um módulo
  const temAcessoModulo = (codigoModulo: string): boolean => {
    if (!assinatura || assinatura.status !== 'ativa') return false;

    return (
      assinatura.plano.modulosInclusos?.some(
        (modulo) => modulo.codigo === codigoModulo && modulo.ativo,
      ) || false
    );
  };

  // Verificar se pode executar ação (baseado em limites)
  const podeExecutarAcao = (tipo: 'usuario' | 'cliente' | 'storage', quantidade = 1): boolean => {
    if (!limites) return false;

    switch (tipo) {
      case 'usuario':
        return limites.usuariosAtivos + quantidade <= limites.limiteUsuarios;
      case 'cliente':
        return limites.clientesCadastrados + quantidade <= limites.limiteClientes;
      case 'storage':
        return limites.storageUtilizado + quantidade <= limites.limiteStorage;
      default:
        return false;
    }
  };

  // Calcular progresso dos limites
  const calcularProgresso = () => {
    if (!limites) return null;

    return {
      usuarios: {
        usado: limites.usuariosAtivos,
        total: limites.limiteUsuarios,
        percentual: Math.min((limites.usuariosAtivos / limites.limiteUsuarios) * 100, 100),
      },
      clientes: {
        usado: limites.clientesCadastrados,
        total: limites.limiteClientes,
        percentual: Math.min((limites.clientesCadastrados / limites.limiteClientes) * 100, 100),
      },
      storage: {
        usado: Math.round(limites.storageUtilizado / (1024 * 1024)), // MB
        total: Math.round(limites.limiteStorage / (1024 * 1024)), // MB
        percentual: Math.min((limites.storageUtilizado / limites.limiteStorage) * 100, 100),
      },
    };
  };

  // Obter status da assinatura
  const getStatusInfo = () => {
    if (!assinatura) {
      return {
        status: 'sem-assinatura',
        cor: 'gray',
        texto: 'Sem Assinatura',
        descricao: 'Empresa não possui assinatura ativa',
      };
    }

    const statusMap = {
      ativa: {
        status: 'ativa',
        cor: 'green',
        texto: 'Ativa',
        descricao: 'Assinatura funcionando normalmente',
      },
      suspensa: {
        status: 'suspensa',
        cor: 'orange',
        texto: 'Suspensa',
        descricao: 'Assinatura temporariamente suspensa',
      },
      cancelada: {
        status: 'cancelada',
        cor: 'red',
        texto: 'Cancelada',
        descricao: 'Assinatura foi cancelada',
      },
      pendente: {
        status: 'pendente',
        cor: 'yellow',
        texto: 'Pendente',
        descricao: 'Aguardando confirmação de pagamento',
      },
    };

    return statusMap[assinatura.status] || statusMap.pendente;
  };

  useEffect(() => {
    if (user?.empresa?.id) {
      buscarAssinatura();
      buscarPlanos();
    }
  }, [user?.empresa?.id]);

  useEffect(() => {
    if (assinatura) {
      buscarLimites();
    }
  }, [assinatura]);

  return {
    // Estado
    assinatura,
    limites,
    planos,
    loading,
    error,

    // Funções
    buscarAssinatura,
    buscarLimites,
    alterarPlano,
    cancelarAssinatura,

    // Verificações
    temAcessoModulo,
    podeExecutarAcao,

    // Utilitários
    calcularProgresso,
    getStatusInfo,

    // Flags úteis
    temAssinatura: !!assinatura,
    assinaturaAtiva: assinatura?.status === 'ativa',
    precisaUpgrade: (modulo: string) => !temAcessoModulo(modulo),
  };
};
