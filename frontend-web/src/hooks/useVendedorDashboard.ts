import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../services/api';

const DASHBOARD_FETCH_TIMEOUT_MS = 20_000;
const STATUS_PROPOSTA_ATIVA = new Set(['enviada', 'visualizada']);

const fetchJsonWithTimeout = async <T,>(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIsoDate = (value: Date): string => value.toISOString().split('T')[0];

const formatHour = (value: Date): string =>
  value.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const mapAlertType = (
  tipo: string,
): 'meta' | 'atividade' | 'proposta' | 'lead' | 'conquista' => {
  switch (tipo) {
    case 'meta':
      return 'meta';
    case 'prazo':
      return 'proposta';
    case 'oportunidade':
      return 'lead';
    case 'conquista':
      return 'conquista';
    case 'tendencia':
    default:
      return 'atividade';
  }
};

const mapLeadAction = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'novo':
      return 'Primeiro contato';
    case 'contatado':
      return 'Qualificar';
    case 'qualificado':
      return 'Converter para oportunidade';
    default:
      return 'Acompanhar';
  }
};

const mapLeadInterest = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'novo':
      return 'Novo lead';
    case 'contatado':
      return 'Contato iniciado';
    case 'qualificado':
      return 'Pronto para conversao';
    default:
      return 'Em analise';
  }
};

const mapAgendaTipo = (
  titulo: string,
  descricao?: string,
): 'reuniao' | 'call' | 'followup' | 'email' | 'tarefa' => {
  const source = `${titulo} ${descricao || ''}`.toLowerCase();
  if (source.includes('reuni')) return 'reuniao';
  if (source.includes('call') || source.includes('liga')) return 'call';
  if (source.includes('follow')) return 'followup';
  if (source.includes('email')) return 'email';
  return 'tarefa';
};

const mapAgendaTipoFromBackend = (
  tipo?: string,
): 'reuniao' | 'call' | 'followup' | 'email' | 'tarefa' => {
  const normalized = String(tipo || '').toLowerCase();
  if (normalized === 'reuniao' || normalized === 'apresentacao' || normalized === 'visita') {
    return 'reuniao';
  }
  if (normalized === 'ligacao') return 'call';
  if (normalized === 'follow-up') return 'followup';
  return 'tarefa';
};

const mapAgendaStatus = (status?: string): 'agendado' | 'em_andamento' | 'concluido' | 'cancelado' => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'cancelado') return 'cancelado';
  if (normalized === 'concluido') return 'concluido';
  if (normalized === 'em_andamento') return 'em_andamento';
  return 'agendado';
};

const mapAgendaPrioridade = (prioridade?: string): 'baixa' | 'media' | 'alta' | 'urgente' => {
  const normalized = String(prioridade || '').toLowerCase();
  if (normalized === 'alta') return 'alta';
  if (normalized === 'baixa') return 'baixa';
  return 'media';
};

const getTemperatura = (probabilidade: number): 'quente' | 'morno' | 'frio' => {
  if (probabilidade >= 75) return 'quente';
  if (probabilidade >= 50) return 'morno';
  return 'frio';
};

const getProbabilidadeByStatus = (status: string, fallback: number): number => {
  const normalized = status.toLowerCase();
  if (normalized === 'visualizada') return 75;
  if (normalized === 'enviada') return 60;
  return fallback;
};

const getProximaAcaoByStatus = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized === 'visualizada') return 'Negociar condicoes';
  if (normalized === 'enviada') return 'Realizar follow-up';
  return 'Acompanhar proposta';
};

const getDiasAte = (from: Date, targetDate: Date): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil((targetDate.getTime() - from.getTime()) / oneDay);
};

interface DashboardResumoResponse {
  kpis?: any;
  vendedoresRanking?: any[];
  alertas?: any[];
  metadata?: {
    vendedoresDisponiveis?: Array<{ id: string }>;
  };
}

interface AgendaEventoResponse {
  id: string;
  titulo?: string;
  descricao?: string;
  inicio?: string;
  fim?: string | null;
  dataInicio?: string;
  dataFim?: string | null;
  tipo?: string;
  status?: string;
  prioridade?: string;
  local?: string;
}

interface LeadResponse {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa_nome?: string;
  status: string;
  origem?: string;
  score?: number;
  data_ultima_interacao?: string;
  created_at?: string;
}

interface PropostaResponse {
  id?: string;
  numero?: string;
  titulo?: string;
  status?: string;
  cliente?: string;
  valor?: number;
  createdAt?: string;
  updatedAt?: string;
  validadeDias?: number;
  vendedor?: string | { id?: string };
}

interface PaginatedResponse<T> {
  data: T[];
}

interface PropostasListResponse {
  propostas?: PropostaResponse[];
}

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

const emptyData: VendedorDashboardData = {
  kpis: {} as VendedorKPIs,
  propostas: [],
  agenda: [],
  leads: [],
  alertas: [],
};

export const useVendedorDashboard = (options: UseVendedorDashboardOptions = {}) => {
  const { user } = useAuth();
  const [data, setData] = useState<VendedorDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVendedorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Sessao nao autenticada. Faca login novamente.');
      }

      const commonHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const params = new URLSearchParams();
      params.append('periodo', 'mensal');
      if (user?.id) {
        params.append('vendedor', user.id);
      }

      const resumo = await fetchJsonWithTimeout<DashboardResumoResponse>(
        `${API_BASE_URL}/dashboard/resumo?${params.toString()}`,
        {
          method: 'GET',
          headers: commonHeaders,
        },
        DASHBOARD_FETCH_TIMEOUT_MS,
      );

      const now = new Date();
      const agendaStart = new Date(now);
      agendaStart.setHours(0, 0, 0, 0);
      const agendaEnd = new Date(now);
      agendaEnd.setDate(agendaEnd.getDate() + 14);
      agendaEnd.setHours(23, 59, 59, 999);

      const leadsParams = new URLSearchParams({
        limit: '20',
      });
      if (user?.id) {
        leadsParams.append('responsavel_id', user.id);
      }

      const agendaPromise = (async () => {
        try {
          return await fetchJsonWithTimeout<AgendaEventoResponse[]>(
            `${API_BASE_URL}/eventos?startDate=${encodeURIComponent(agendaStart.toISOString())}&endDate=${encodeURIComponent(agendaEnd.toISOString())}`,
            {
              method: 'GET',
              headers: commonHeaders,
            },
            DASHBOARD_FETCH_TIMEOUT_MS,
          );
        } catch {
          return await fetchJsonWithTimeout<
            PaginatedResponse<AgendaEventoResponse> | AgendaEventoResponse[]
          >(
            `${API_BASE_URL}/agenda-eventos?dataInicio=${encodeURIComponent(agendaStart.toISOString())}&dataFim=${encodeURIComponent(agendaEnd.toISOString())}&limit=20`,
            {
              method: 'GET',
              headers: commonHeaders,
            },
            DASHBOARD_FETCH_TIMEOUT_MS,
          ).catch(() => null);
        }
      })();

      const leadsPromise = fetchJsonWithTimeout<PaginatedResponse<LeadResponse>>(
        `${API_BASE_URL}/leads?${leadsParams.toString()}`,
        {
          method: 'GET',
          headers: commonHeaders,
        },
        DASHBOARD_FETCH_TIMEOUT_MS,
      ).catch(() => null);

      const propostasPromise = fetchJsonWithTimeout<PropostasListResponse>(
        `${API_BASE_URL}/propostas`,
        {
          method: 'GET',
          headers: commonHeaders,
        },
        DASHBOARD_FETCH_TIMEOUT_MS,
      ).catch(() => null);

      const [agendaResult, leadsResult, propostasResult] = await Promise.all([
        agendaPromise,
        leadsPromise,
        propostasPromise,
      ]);

      const kpisResumo = resumo?.kpis ?? {};
      const rankingLista = Array.isArray(resumo?.vendedoresRanking) ? resumo.vendedoresRanking : [];
      const rankingAtual =
        rankingLista.find((item: any) => String(item?.id) === String(user?.id)) || rankingLista[0];

      const metaMensal = toNumber(kpisResumo?.faturamentoTotal?.meta);
      const metaAtual = toNumber(kpisResumo?.faturamentoTotal?.valor);
      const percentualMeta =
        metaMensal > 0 ? Math.max(0, Math.round((metaAtual / metaMensal) * 100)) : 0;

      const daysNow = new Date();
      const diasNoMes = new Date(daysNow.getFullYear(), daysNow.getMonth() + 1, 0).getDate();
      const diasDecorridos = Math.max(1, daysNow.getDate());
      const diasRestantes = Math.max(0, diasNoMes - daysNow.getDate());

      const agendaResumo = kpisResumo?.agenda ?? {};
      const estatisticasPorTipo = agendaResumo?.estatisticasPorTipo ?? {};
      const callsHoje = toNumber(estatisticasPorTipo?.ligacao);
      const reunioesHoje = toNumber(estatisticasPorTipo?.reuniao);
      const followupsHoje = toNumber(estatisticasPorTipo?.['follow-up']);
      const emailsHoje = toNumber(estatisticasPorTipo?.outro);
      const propostasHoje = toNumber(kpisResumo?.emNegociacao?.quantidade);

      const taxaConversao = toNumber(kpisResumo?.taxaSucessoGeral?.percentual);
      const ticketMedio = toNumber(kpisResumo?.ticketMedio?.valor);
      const tempoMedioCiclo = toNumber(kpisResumo?.cicloMedio?.dias);
      const satisfacaoCliente = 4.5;
      const notaBase =
        taxaConversao * 0.1 +
        Math.min(ticketMedio / 3000, 3) +
        Math.max(0, 3 - tempoMedioCiclo / 15) +
        2;
      const nota = Number(Math.max(0, Math.min(10, notaBase)).toFixed(1));
      const estrelas = Math.max(1, Math.min(5, Math.round((nota / 10) * 5)));

      const pipelineValor = toNumber(kpisResumo?.emNegociacao?.valor);
      const pipelineQuantidade = toNumber(kpisResumo?.emNegociacao?.quantidade);
      const pipelineProbabilidade = Math.max(0, Math.min(100, Math.round(taxaConversao)));
      const quenteQuantidade = Math.round(pipelineQuantidade * 0.3);
      const mornoQuantidade = Math.round(pipelineQuantidade * 0.4);
      const frioQuantidade = Math.max(0, pipelineQuantidade - quenteQuantidade - mornoQuantidade);
      const quenteValor = Number((pipelineValor * 0.4).toFixed(2));
      const mornoValor = Number((pipelineValor * 0.35).toFixed(2));
      const frioValor = Number((pipelineValor - quenteValor - mornoValor).toFixed(2));

      const totalRanking =
        toNumber(resumo?.metadata?.vendedoresDisponiveis?.length) || rankingLista.length;
      const valorVendasRanking = toNumber(rankingAtual?.vendas);
      const pontosRanking = Math.round(valorVendasRanking / 1000);

      const valorMedioProposta = pipelineQuantidade > 0 ? pipelineValor / pipelineQuantidade : 0;
      const propostasNumerosResumo = Array.isArray(kpisResumo?.emNegociacao?.propostas)
        ? kpisResumo.emNegociacao.propostas.map((value: unknown) => String(value))
        : [];

      const propostasApi = Array.isArray(propostasResult?.propostas) ? propostasResult.propostas : [];
      const propostasApiFiltradas = propostasApi
        .filter((item) => STATUS_PROPOSTA_ATIVA.has(String(item?.status || '').toLowerCase()))
        .filter((item) => {
          if (!user?.id) return true;
          const vendedorId =
            typeof item?.vendedor === 'string' ? item.vendedor : item?.vendedor?.id || undefined;
          return !vendedorId || vendedorId === user.id;
        });

      const propostasApiOrdenadas = (
        propostasNumerosResumo.length > 0
          ? propostasNumerosResumo
              .map((numero) =>
                propostasApiFiltradas.find((proposta) => String(proposta.numero) === numero),
              )
              .filter((proposta): proposta is PropostaResponse => Boolean(proposta))
          : propostasApiFiltradas
      ).slice(0, 5);

      const propostasAtivas: PropostaAtiva[] =
        propostasApiOrdenadas.length > 0
          ? propostasApiOrdenadas.map((proposta) => {
              const status = String(proposta.status || 'em negociacao');
              const probabilidade = getProbabilidadeByStatus(status, pipelineProbabilidade);
              const valor = toNumber(proposta.valor) || Number(valorMedioProposta.toFixed(2));

              const createdAt = proposta.createdAt ? new Date(proposta.createdAt) : now;
              const dueDate = new Date(createdAt);
              const validade = Math.max(1, toNumber(proposta.validadeDias) || 7);
              dueDate.setDate(dueDate.getDate() + validade);

              return {
                id: String(proposta.id || proposta.numero || `proposta-${Math.random()}`),
                cliente: String(proposta.cliente || proposta.titulo || `Proposta ${proposta.numero || ''}`).trim(),
                valor,
                probabilidade,
                temperatura: getTemperatura(probabilidade),
                prazo: toIsoDate(dueDate),
                diasAteVencimento: getDiasAte(now, dueDate),
                proximaAcao: getProximaAcaoByStatus(status),
                status,
              };
            })
          : propostasNumerosResumo.slice(0, 5).map((numero, index) => {
              const probabilidade = Math.max(35, pipelineProbabilidade - index * 10);
              const dueDate = new Date(now);
              dueDate.setDate(dueDate.getDate() + index + 2);

              return {
                id: numero,
                cliente: `Proposta ${numero}`,
                valor: Number(valorMedioProposta.toFixed(2)),
                probabilidade,
                temperatura: getTemperatura(probabilidade),
                prazo: toIsoDate(dueDate),
                diasAteVencimento: getDiasAte(now, dueDate),
                proximaAcao: 'Realizar follow-up',
                status: 'enviada',
              };
            });

      const agendaRaw: AgendaEventoResponse[] = Array.isArray(agendaResult)
        ? agendaResult
        : Array.isArray(agendaResult?.data)
          ? agendaResult.data
          : [];

      const agendaItems: Array<AtividadeAgenda & { _sort: number }> = [];
      for (const evento of agendaRaw) {
        const inicioIso = evento.inicio ?? evento.dataInicio;
        if (!inicioIso) {
          continue;
        }

        const inicio = new Date(inicioIso);
        if (Number.isNaN(inicio.getTime())) {
          continue;
        }

        const fimIso = evento.fim ?? evento.dataFim;
        const fim = fimIso ? new Date(fimIso) : null;
        const duracao =
          fim && fim.getTime() > inicio.getTime()
            ? Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60))
            : 30;

        const titulo = evento.titulo || 'Atividade';
        agendaItems.push({
          id: evento.id,
          tipo: evento.tipo ? mapAgendaTipoFromBackend(evento.tipo) : mapAgendaTipo(titulo, evento.descricao),
          titulo,
          cliente: evento.local || undefined,
          horario: formatHour(inicio),
          duracao,
          status: mapAgendaStatus(evento.status),
          prioridade: mapAgendaPrioridade(evento.prioridade),
          _sort: inicio.getTime(),
        });
      }

      const agenda = agendaItems
        .sort((a, b) => a._sort - b._sort)
        .slice(0, 5)
        .map(({ _sort, ...item }) => item);

      const leadsRaw = Array.isArray(leadsResult?.data) ? leadsResult.data : [];
      const leads = leadsRaw
        .filter((lead) => {
          const status = String(lead.status || '').toLowerCase();
          return status !== 'convertido' && status !== 'desqualificado';
        })
        .sort((a, b) => {
          const scoreDiff = toNumber(b.score) - toNumber(a.score);
          if (scoreDiff !== 0) return scoreDiff;
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5)
        .map((lead) => {
          const status = String(lead.status || '');
          return {
            id: lead.id,
            nome: lead.nome,
            empresa: lead.empresa_nome || 'Sem empresa',
            fonte: String(lead.origem || 'manual'),
            score: toNumber(lead.score),
            interesse: mapLeadInterest(status),
            ultimoContato: lead.data_ultima_interacao || lead.created_at || new Date().toISOString(),
            proximaAcao: mapLeadAction(status),
            telefone: lead.telefone || '',
            email: lead.email || '',
          };
        });

      const alertasApi = Array.isArray(resumo?.alertas) ? resumo.alertas : [];
      const alertas = alertasApi.map((alerta: any, index: number) => {
        const severidade = ['baixa', 'media', 'alta', 'critica'].includes(alerta?.severidade)
          ? alerta.severidade
          : 'media';

        return {
          id: String(alerta?.id ?? `alerta-${index}`),
          tipo: mapAlertType(String(alerta?.tipo ?? 'tendencia')),
          severidade,
          titulo: String(alerta?.titulo ?? 'Alerta'),
          descricao: String(alerta?.descricao ?? 'Sem detalhes'),
          acao: alerta?.acao
            ? {
                texto: String(alerta.acao.texto ?? 'Abrir'),
                url: String(alerta.acao.url ?? '/dashboard'),
              }
            : undefined,
        };
      });

      setData({
        kpis: {
          meta: {
            mensal: metaMensal,
            atual: metaAtual,
            percentual: percentualMeta,
            diasRestantes,
            mediaVendasDiarias: Number((metaAtual / diasDecorridos).toFixed(2)),
            metaDiaria: diasNoMes > 0 ? Number((metaMensal / diasNoMes).toFixed(2)) : 0,
          },
          ranking: {
            posicao: toNumber(rankingAtual?.posicao),
            total: totalRanking,
            pontos: pontosRanking,
            nivel: pontosRanking >= 1000 ? 'Vendedor Gold' : 'Vendedor Silver',
            proximoNivel: {
              nome: 'Vendedor Platinum',
              pontosNecessarios: Math.max(0, 1500 - pontosRanking),
            },
          },
          pipeline: {
            valor: pipelineValor,
            quantidade: pipelineQuantidade,
            probabilidade: pipelineProbabilidade,
            distribuicao: {
              quente: { valor: quenteValor, quantidade: quenteQuantidade },
              morno: { valor: mornoValor, quantidade: mornoQuantidade },
              frio: { valor: frioValor, quantidade: frioQuantidade },
            },
          },
          atividades: {
            hoje: {
              calls: callsHoje,
              reunioes: reunioesHoje,
              followups: followupsHoje,
              emails: emailsHoje,
              propostas: propostasHoje,
            },
            semana: {
              calls: callsHoje * 5,
              reunioes: reunioesHoje * 5,
              followups: followupsHoje * 5,
              emails: emailsHoje * 5,
              propostas: propostasHoje * 5,
            },
            metas: {
              callsDiarias: 10,
              reunioesSemana: 10,
              followupsDiarios: 6,
            },
          },
          performance: {
            taxaConversao,
            ticketMedio,
            tempoMedioCiclo,
            satisfacaoCliente,
            nota,
            estrelas,
          },
        },
        propostas: propostasAtivas,
        agenda,
        leads,
        alertas,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do vendedor');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(() => {
    void loadVendedorData();
  }, [loadVendedorData]);

  useEffect(() => {
    void loadVendedorData();
  }, [loadVendedorData]);

  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) {
      return undefined;
    }

    const interval = window.setInterval(loadVendedorData, options.refreshInterval);
    return () => window.clearInterval(interval);
  }, [loadVendedorData, options.autoRefresh, options.refreshInterval]);

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
