import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface VendedorKPIs {
  meta: {
    mensal: number;
    atual: number;
    percentual: number;
    diasRestantes: number;
    mediaVendasDiarias: number;
    metaDiaria: number;
  };
  ranking: {
    posicao: number;
    total: number;
    pontos: number;
    nivel: string;
    proximoNivel: {
      nome: string;
      pontosNecessarios: number;
    };
  };
  pipeline: {
    valor: number;
    quantidade: number;
    probabilidade: number;
    distribuicao: {
      quente: { valor: number; quantidade: number };
      morno: { valor: number; quantidade: number };
      frio: { valor: number; quantidade: number };
    };
  };
  atividades: {
    hoje: {
      calls: number;
      reunioes: number;
      followups: number;
      emails: number;
      propostas: number;
    };
    semana: {
      calls: number;
      reunioes: number;
      followups: number;
      emails: number;
      propostas: number;
    };
    metas: {
      callsDiarias: number;
      reunioesSemana: number;
      followupsDiarios: number;
    };
  };
  performance: {
    taxaConversao: number;
    ticketMedio: number;
    tempoMedioCiclo: number;
    satisfacaoCliente: number;
    nota: number;
    estrelas: number;
  };
}

export interface PropostaAtiva {
  id: string;
  cliente: string;
  valor: number;
  probabilidade: number;
  temperatura: 'quente' | 'morno' | 'frio';
  prazo: string;
  diasAteVencimento: number;
  proximaAcao: string;
  status: string;
}

export interface AtividadeAgenda {
  id: string;
  tipo: 'reuniao' | 'call' | 'followup' | 'email' | 'tarefa';
  titulo: string;
  cliente?: string;
  horario: string;
  duracao: number;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
}

export interface LeadQualificar {
  id: string;
  nome: string;
  empresa: string;
  fonte: string;
  score: number;
  interesse: string;
  ultimoContato: string;
  proximaAcao: string;
  telefone: string;
  email: string;
}

interface UseVendedorDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface VendedorDashboardData {
  kpis: VendedorKPIs;
  propostas: PropostaAtiva[];
  agenda: AtividadeAgenda[];
  leads: LeadQualificar[];
  alertas: Array<{
    id: string;
    tipo: 'meta' | 'atividade' | 'proposta' | 'lead' | 'conquista';
    severidade: 'baixa' | 'media' | 'alta' | 'critica';
    titulo: string;
    descricao: string;
    acao?: {
      texto: string;
      url: string;
    };
  }>;
}

export const useVendedorDashboard = (options: UseVendedorDashboardOptions = {}) => {
  const { user } = useAuth();
  const [data, setData] = useState<VendedorDashboardData>({
    kpis: {} as VendedorKPIs,
    propostas: [],
    agenda: [],
    leads: [],
    alertas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar dados do vendedor
  const loadVendedorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamadas reais para a API
      // Por enquanto, retornando dados simulados
      const mockData: VendedorDashboardData = {
        kpis: {
          meta: {
            mensal: 50000,
            atual: 37500,
            percentual: 75,
            diasRestantes: 8,
            mediaVendasDiarias: 1875,
            metaDiaria: 1667,
          },
          ranking: {
            posicao: 2,
            total: 8,
            pontos: 1250,
            nivel: 'Vendedor Gold',
            proximoNivel: {
              nome: 'Vendedor Platinum',
              pontosNecessarios: 250,
            },
          },
          pipeline: {
            valor: 125000,
            quantidade: 12,
            probabilidade: 68,
            distribuicao: {
              quente: { valor: 45000, quantidade: 4 },
              morno: { valor: 52000, quantidade: 5 },
              frio: { valor: 28000, quantidade: 3 },
            },
          },
          atividades: {
            hoje: {
              calls: 8,
              reunioes: 3,
              followups: 5,
              emails: 12,
              propostas: 2,
            },
            semana: {
              calls: 42,
              reunioes: 12,
              followups: 28,
              emails: 65,
              propostas: 8,
            },
            metas: {
              callsDiarias: 10,
              reunioesSemana: 15,
              followupsDiarios: 8,
            },
          },
          performance: {
            taxaConversao: 18.5,
            ticketMedio: 12500,
            tempoMedioCiclo: 28,
            satisfacaoCliente: 4.7,
            nota: 8.5,
            estrelas: 4,
          },
        },
        propostas: [
          {
            id: '1',
            cliente: 'Tech Solutions',
            valor: 15000,
            probabilidade: 85,
            temperatura: 'quente',
            prazo: '2025-08-10',
            diasAteVencimento: 6,
            proximaAcao: 'Apresentação final',
            status: 'Negociação',
          },
          {
            id: '2',
            cliente: 'StartUp Growth',
            valor: 22000,
            probabilidade: 70,
            temperatura: 'morno',
            prazo: '2025-08-15',
            diasAteVencimento: 11,
            proximaAcao: 'Ajustar proposta',
            status: 'Análise',
          },
          {
            id: '3',
            cliente: 'Digital Pro',
            valor: 8000,
            probabilidade: 40,
            temperatura: 'frio',
            prazo: '2025-08-20',
            diasAteVencimento: 16,
            proximaAcao: 'Follow-up',
            status: 'Enviada',
          },
        ],
        agenda: [
          {
            id: '1',
            tipo: 'reuniao',
            titulo: 'Apresentação Tech Solutions',
            cliente: 'Tech Solutions',
            horario: '14:30',
            duracao: 60,
            status: 'agendado',
            prioridade: 'alta',
          },
          {
            id: '2',
            tipo: 'call',
            titulo: 'Follow-up Digital Pro',
            cliente: 'Digital Pro',
            horario: '16:00',
            duracao: 30,
            status: 'agendado',
            prioridade: 'media',
          },
          {
            id: '3',
            tipo: 'followup',
            titulo: 'Revisão proposta StartUp',
            cliente: 'StartUp Growth',
            horario: '17:30',
            duracao: 45,
            status: 'agendado',
            prioridade: 'alta',
          },
        ],
        leads: [
          {
            id: '1',
            nome: 'Maria Santos',
            empresa: 'Inovação Corp',
            fonte: 'LinkedIn',
            score: 85,
            interesse: 'Software CRM',
            ultimoContato: '2025-08-03',
            proximaAcao: 'Qualificação inicial',
            telefone: '(11) 9999-8888',
            email: 'maria@inovacao.com',
          },
          {
            id: '2',
            nome: 'Carlos Oliveira',
            empresa: 'Tech Startup',
            fonte: 'Site',
            score: 72,
            interesse: 'Automação vendas',
            ultimoContato: '2025-08-02',
            proximaAcao: 'Demo agendada',
            telefone: '(11) 8888-7777',
            email: 'carlos@techstartup.com',
          },
        ],
        alertas: [
          {
            id: '1',
            tipo: 'meta',
            severidade: 'media',
            titulo: 'Meta mensal 75% atingida',
            descricao: 'Você está no caminho certo! Restam 8 dias para fechar o mês.',
            acao: {
              texto: 'Ver pipeline',
              url: '/propostas',
            },
          },
          {
            id: '2',
            tipo: 'proposta',
            severidade: 'alta',
            titulo: 'Proposta Tech Solutions vence em 6 dias',
            descricao: 'Proposta de R$ 15.000 com 85% de probabilidade precisa de atenção.',
            acao: {
              texto: 'Ver proposta',
              url: '/propostas/1',
            },
          },
        ],
      };

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do vendedor');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar dados
  const refresh = () => {
    loadVendedorData();
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadVendedorData();
  }, []);

  // Auto-refresh se habilitado
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(loadVendedorData, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval]);

  // Dados computados para insights
  const insights = useMemo(() => {
    if (!data.kpis.meta) return {};

    const { meta, atividades, performance, pipeline } = data.kpis;

    return {
      statusMeta:
        meta.percentual >= 100
          ? 'superada'
          : meta.percentual >= 90
            ? 'quase_la'
            : meta.percentual >= 70
              ? 'caminho_certo'
              : 'atencao',
      produtividadeDiaria:
        atividades.hoje.calls + atividades.hoje.reunioes + atividades.hoje.followups,
      efetividadePipeline: (pipeline.valor * pipeline.probabilidade) / 100,
      projecaoMensal: meta.atual + meta.mediaVendasDiarias * meta.diasRestantes,
      performanceGeral: Math.round(
        (performance.nota * 10 + performance.taxaConversao + performance.satisfacaoCliente * 20) /
          3,
      ),
    };
  }, [data.kpis]);

  return {
    data,
    loading,
    error,
    refresh,
    insights,
  };
};
