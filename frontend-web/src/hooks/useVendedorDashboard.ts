import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../services/api';

const DASHBOARD_FETCH_TIMEOUT_MS = 20_000;
const STATUS_PROPOSTA_ATIVA = new Set(['enviada', 'visualizada']);

export type VendedorDashboardPeriodo = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

const fetchJsonWithTimeout = async <T>(
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

const toNullableNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNonEmptyText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  const normalizedLower = normalized.toLowerCase();
  if (
    normalizedLower === '[object object]' ||
    normalizedLower === 'undefined' ||
    normalizedLower === 'null'
  ) {
    return null;
  }
  return normalized.length > 0 ? normalized : null;
};

const toIsoDate = (value: Date): string => value.toISOString().split('T')[0];

const formatHour = (value: Date): string =>
  value.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const mapAlertType = (tipo: string): 'meta' | 'atividade' | 'proposta' | 'lead' | 'conquista' => {
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
  if (normalized === 'email') return 'email';
  return 'tarefa';
};

const mapAgendaStatus = (
  status?: string,
): 'agendado' | 'em_andamento' | 'concluido' | 'cancelado' => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'cancelado') return 'cancelado';
  if (normalized === 'concluido') return 'concluido';
  if (normalized === 'em_andamento') return 'em_andamento';
  return 'agendado';
};

const mapAgendaPrioridade = (prioridade?: string): 'baixa' | 'media' | 'alta' | 'urgente' => {
  const normalized = String(prioridade || '').toLowerCase();
  if (normalized === 'urgente') return 'urgente';
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

const resolvePropostaClienteLabel = (proposta: PropostaResponse): string => {
  const candidates: unknown[] = [
    proposta.clienteNome,
    proposta.cliente_nome,
    proposta.nomeCliente,
    proposta.titulo,
  ];

  if (typeof proposta.cliente === 'string') {
    candidates.unshift(proposta.cliente);
  } else if (proposta.cliente && typeof proposta.cliente === 'object') {
    const cliente = proposta.cliente as Record<string, unknown>;
    const clienteContato =
      cliente.contato && typeof cliente.contato === 'object'
        ? (cliente.contato as Record<string, unknown>)
        : null;
    candidates.unshift(
      cliente.nome,
      cliente.nomeCompleto,
      cliente.razaoSocial,
      cliente.razao_social,
      cliente.nomeFantasia,
      cliente.nome_fantasia,
      cliente.empresa,
      cliente.cliente,
      cliente.name,
      clienteContato?.nome,
      clienteContato?.nomeCompleto,
      clienteContato?.razaoSocial,
      clienteContato?.razao_social,
    );
  }

  const firstValid = candidates
    .map((candidate) => toNonEmptyText(candidate))
    .find((candidate): candidate is string => Boolean(candidate));

  if (firstValid) return firstValid;

  const numero = toNonEmptyText(proposta.numero);
  return numero ? `Proposta ${numero}` : 'Cliente nao informado';
};

const startOfDay = (value: Date): Date => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const endOfDay = (value: Date): Date => {
  const normalized = new Date(value);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const getPeriodoBounds = (
  periodo: VendedorDashboardPeriodo,
  reference: Date,
): { inicio: Date; fim: Date; totalDias: number; diasDecorridos: number } => {
  const oneDayMs = 1000 * 60 * 60 * 24;
  const today = startOfDay(reference);

  let inicio: Date;
  let fim: Date;

  if (periodo === 'semanal') {
    const weekDay = today.getDay();
    const distanceToMonday = (weekDay + 6) % 7;
    inicio = new Date(today);
    inicio.setDate(today.getDate() - distanceToMonday);
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  } else if (periodo === 'trimestral') {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    inicio = new Date(today.getFullYear(), quarterStartMonth, 1);
    fim = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
  } else if (periodo === 'semestral') {
    const semesterStartMonth = today.getMonth() < 6 ? 0 : 6;
    inicio = new Date(today.getFullYear(), semesterStartMonth, 1);
    fim = new Date(today.getFullYear(), semesterStartMonth + 6, 0);
  } else if (periodo === 'anual') {
    inicio = new Date(today.getFullYear(), 0, 1);
    fim = new Date(today.getFullYear(), 11, 31);
  } else {
    inicio = new Date(today.getFullYear(), today.getMonth(), 1);
    fim = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  const inicioDia = startOfDay(inicio);
  const fimDia = endOfDay(fim);
  const totalDias = Math.max(1, Math.round((fimDia.getTime() - inicioDia.getTime()) / oneDayMs));
  const diasDecorridos = Math.max(
    1,
    Math.min(totalDias, Math.floor((today.getTime() - inicioDia.getTime()) / oneDayMs) + 1),
  );

  return {
    inicio: inicioDia,
    fim: fimDia,
    totalDias,
    diasDecorridos,
  };
};

interface DashboardResumoResponse {
  kpis?: {
    faturamentoTotal?: { valor?: number; meta?: number };
    emNegociacao?: { valor?: number; quantidade?: number; propostas?: unknown[] };
    taxaSucessoGeral?: { percentual?: number };
    ticketMedio?: { valor?: number };
    cicloMedio?: { dias?: number };
    agenda?: {
      resumoHoje?: {
        totalEventos?: number;
        estatisticasPorTipo?: {
          reuniao?: number;
          ligacao?: number;
          apresentacao?: number;
          visita?: number;
          'follow-up'?: number;
          outro?: number;
        };
      };
      resumoSemana?: {
        totalEventos?: number;
        estatisticasPorTipo?: {
          reuniao?: number;
          ligacao?: number;
          apresentacao?: number;
          visita?: number;
          'follow-up'?: number;
          outro?: number;
        };
      };
      metasAtividade?: {
        callsDiarias?: number;
        ligacoesDiarias?: number;
        reunioesSemana?: number;
        reunioesSemanais?: number;
        followupsDiarios?: number;
        followUpsDiarios?: number;
      };
      metas?: {
        callsDiarias?: number;
        ligacoesDiarias?: number;
        reunioesSemana?: number;
        reunioesSemanais?: number;
        followupsDiarios?: number;
        followUpsDiarios?: number;
      };
    };
    satisfacaoCliente?: { valor?: number };
    satisfacao?: { valor?: number };
    csat?: { valor?: number };
  };
  vendedoresRanking?: Array<{
    id?: string;
    posicao?: number;
    vendas?: number;
    meta?: number;
    variacao?: number;
    badges?: unknown[];
    pontos?: number;
  }>;
  alertas?: Array<{
    id?: string | number;
    tipo?: string;
    severidade?: string;
    titulo?: string;
    descricao?: string;
    acao?: {
      texto?: string;
      url?: string;
    };
  }>;
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
  titulo?: string | null;
  status?: string;
  cliente?: unknown;
  clienteNome?: string | null;
  cliente_nome?: string | null;
  nomeCliente?: string | null;
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
    pontos: number | null;
    nivel: string | null;
    proximoNivel: {
      nome: string | null;
      pontosNecessarios: number | null;
    };
    vendas: number;
    meta: number;
    variacao: number;
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
      callsDiarias: number | null;
      reunioesSemana: number | null;
      followupsDiarios: number | null;
    };
  };
  performance: {
    taxaConversao: number;
    ticketMedio: number;
    tempoMedioCiclo: number;
    satisfacaoCliente: number | null;
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
  prazo?: string;
  diasAteVencimento?: number;
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
  periodo?: VendedorDashboardPeriodo;
}

interface VendedorDashboardInsights {
  statusMeta?: 'superada' | 'quase_la' | 'caminho_certo' | 'atencao';
  produtividadeDiaria?: number;
  efetividadePipeline?: number;
  projecaoMensal?: number;
  performanceGeral?: number;
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

export const useVendedorDashboard = (
  options: UseVendedorDashboardOptions = {},
): {
  data: VendedorDashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  insights: VendedorDashboardInsights;
  period: VendedorDashboardPeriodo;
  lastUpdatedAt: string | null;
} => {
  const { user } = useAuth();
  const periodoSelecionado: VendedorDashboardPeriodo = options.periodo || 'mensal';
  const [data, setData] = useState<VendedorDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadVendedorData = useCallback(async (): Promise<void> => {
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
      params.append('periodo', periodoSelecionado);
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
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weeklyBounds = getPeriodoBounds('semanal', now);

      const agendaStart = new Date(weeklyBounds.inicio);
      const agendaEnd = new Date(now);
      agendaEnd.setDate(agendaEnd.getDate() + 14);
      agendaEnd.setHours(23, 59, 59, 999);
      if (weeklyBounds.fim.getTime() > agendaEnd.getTime()) {
        agendaEnd.setTime(weeklyBounds.fim.getTime());
      }

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
        rankingLista.find((item) => String(item?.id) === String(user?.id)) || rankingLista[0];

      const metaMensal = toNumber(kpisResumo?.faturamentoTotal?.meta);
      const metaAtual = toNumber(kpisResumo?.faturamentoTotal?.valor);
      const percentualMeta =
        metaMensal > 0 ? Math.max(0, Math.round((metaAtual / metaMensal) * 100)) : 0;

      const periodInfo = getPeriodoBounds(periodoSelecionado, now);
      const diasNoPeriodo = periodInfo.totalDias;
      const diasDecorridos = periodInfo.diasDecorridos;
      const diasRestantes = Math.max(0, diasNoPeriodo - diasDecorridos);
      const agendaResumo = kpisResumo?.agenda ?? {};

      const taxaConversao = toNumber(kpisResumo?.taxaSucessoGeral?.percentual);
      const ticketMedio = toNumber(kpisResumo?.ticketMedio?.valor);
      const tempoMedioCiclo = toNumber(kpisResumo?.cicloMedio?.dias);
      const satisfacaoCliente = toNullableNumber(
        kpisResumo?.satisfacaoCliente?.valor ??
          kpisResumo?.satisfacao?.valor ??
          kpisResumo?.csat?.valor,
      );
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

      const totalRanking =
        toNumber(resumo?.metadata?.vendedoresDisponiveis?.length) || rankingLista.length;
      const valorVendasRanking = toNumber(rankingAtual?.vendas);
      const metaRanking = toNumber(rankingAtual?.meta);
      const variacaoRanking = toNumber(rankingAtual?.variacao);
      const rankingBadges = Array.isArray(rankingAtual?.badges)
        ? rankingAtual.badges.map((badge: unknown) => String(badge))
        : [];
      const pontosRanking = toNullableNumber(rankingAtual?.pontos);
      const nivelRanking = rankingBadges.length > 0 ? rankingBadges[0] : null;
      const propostasNumerosResumo = Array.isArray(kpisResumo?.emNegociacao?.propostas)
        ? kpisResumo.emNegociacao.propostas.map((value: unknown) => String(value))
        : [];

      const propostasApi = Array.isArray(propostasResult?.propostas)
        ? propostasResult.propostas
        : [];
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

      const propostasAtivas: PropostaAtiva[] = propostasApiOrdenadas.map((proposta, index) => {
        const status = String(proposta.status || 'em negociacao');
        const probabilidade = getProbabilidadeByStatus(status, pipelineProbabilidade);
        const valor = toNumber(proposta.valor);

        const createdAtRaw = proposta.createdAt || proposta.updatedAt;
        const createdAtDate = createdAtRaw ? new Date(createdAtRaw) : null;
        const hasCreatedAt = Boolean(createdAtDate && !Number.isNaN(createdAtDate.getTime()));
        const dueDate = hasCreatedAt && createdAtDate ? new Date(createdAtDate) : null;
        if (dueDate) {
          const validade = Math.max(1, toNumber(proposta.validadeDias) || 7);
          dueDate.setDate(dueDate.getDate() + validade);
        }

        return {
          id: String(proposta.id || proposta.numero || `proposta-${index + 1}`),
          cliente: resolvePropostaClienteLabel(proposta),
          valor,
          probabilidade,
          temperatura: getTemperatura(probabilidade),
          prazo: dueDate ? toIsoDate(dueDate) : undefined,
          diasAteVencimento: dueDate ? getDiasAte(now, dueDate) : undefined,
          proximaAcao: getProximaAcaoByStatus(status),
          status,
        };
      });

      const distribuicaoPipeline = {
        quente: { valor: 0, quantidade: 0 },
        morno: { valor: 0, quantidade: 0 },
        frio: { valor: 0, quantidade: 0 },
      };
      for (const proposta of propostasApiFiltradas) {
        const status = String(proposta.status || 'em negociacao');
        const probabilidade = getProbabilidadeByStatus(status, pipelineProbabilidade);
        const temperatura = getTemperatura(probabilidade);
        distribuicaoPipeline[temperatura].quantidade += 1;
        distribuicaoPipeline[temperatura].valor += toNumber(proposta.valor);
      }

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
          tipo: evento.tipo
            ? mapAgendaTipoFromBackend(evento.tipo)
            : mapAgendaTipo(titulo, evento.descricao),
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
        .filter((item) => item._sort >= now.getTime())
        .slice(0, 5)
        .map(({ _sort, ...item }) => item);

      const createActivityCounters = (): {
        calls: number;
        reunioes: number;
        followups: number;
        emails: number;
        propostas: number;
      } => ({
        calls: 0,
        reunioes: 0,
        followups: 0,
        emails: 0,
        propostas: 0,
      });
      const mapResumoAgendaToCounters = (
        stats?:
          | {
              reuniao?: number;
              ligacao?: number;
              apresentacao?: number;
              visita?: number;
              'follow-up'?: number;
              outro?: number;
            }
          | undefined,
      ): ReturnType<typeof createActivityCounters> => ({
        calls: toNumber(stats?.ligacao),
        reunioes:
          toNumber(stats?.reuniao) + toNumber(stats?.apresentacao) + toNumber(stats?.visita),
        followups: toNumber(stats?.['follow-up']),
        emails: toNumber(stats?.outro),
        propostas: 0,
      });

      const hasResumoHojeAgenda = Boolean(agendaResumo?.resumoHoje?.estatisticasPorTipo);
      const hasResumoSemanaAgenda = Boolean(agendaResumo?.resumoSemana?.estatisticasPorTipo);

      const atividadesHoje = hasResumoHojeAgenda
        ? mapResumoAgendaToCounters(agendaResumo?.resumoHoje?.estatisticasPorTipo)
        : createActivityCounters();
      const atividadesSemana = hasResumoSemanaAgenda
        ? mapResumoAgendaToCounters(agendaResumo?.resumoSemana?.estatisticasPorTipo)
        : createActivityCounters();

      const incrementarAtividade = (
        target: ReturnType<typeof createActivityCounters>,
        tipo: AtividadeAgenda['tipo'],
      ): void => {
        if (tipo === 'call') target.calls += 1;
        if (tipo === 'reuniao') target.reunioes += 1;
        if (tipo === 'followup') target.followups += 1;
        if (tipo === 'email') target.emails += 1;
      };

      if (!hasResumoHojeAgenda || !hasResumoSemanaAgenda) {
        for (const item of agendaItems) {
          const inicioEvento = new Date(item._sort);
          if (!hasResumoHojeAgenda && inicioEvento >= todayStart && inicioEvento <= todayEnd) {
            incrementarAtividade(atividadesHoje, item.tipo);
          }
          if (
            !hasResumoSemanaAgenda &&
            inicioEvento >= weeklyBounds.inicio &&
            inicioEvento <= weeklyBounds.fim
          ) {
            incrementarAtividade(atividadesSemana, item.tipo);
          }
        }
      }

      for (const proposta of propostasApiFiltradas) {
        const createdAtRaw = proposta.createdAt || proposta.updatedAt;
        if (!createdAtRaw) {
          continue;
        }
        const createdAt = new Date(createdAtRaw);
        if (Number.isNaN(createdAt.getTime())) {
          continue;
        }
        if (createdAt >= todayStart && createdAt <= todayEnd) {
          atividadesHoje.propostas += 1;
        }
        if (createdAt >= weeklyBounds.inicio && createdAt <= weeklyBounds.fim) {
          atividadesSemana.propostas += 1;
        }
      }

      const metasAtividade = agendaResumo?.metasAtividade ?? agendaResumo?.metas ?? {};
      const callsMetaDiarias = toNullableNumber(
        metasAtividade?.callsDiarias ?? metasAtividade?.ligacoesDiarias,
      );
      const reunioesMetaSemanais = toNullableNumber(
        metasAtividade?.reunioesSemana ?? metasAtividade?.reunioesSemanais,
      );
      const followupsMetaDiarios = toNullableNumber(
        metasAtividade?.followupsDiarios ?? metasAtividade?.followUpsDiarios,
      );

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
            ultimoContato:
              lead.data_ultima_interacao || lead.created_at || new Date().toISOString(),
            proximaAcao: mapLeadAction(status),
            telefone: lead.telefone || '',
            email: lead.email || '',
          };
        });

      const alertasApi = Array.isArray(resumo?.alertas) ? resumo.alertas : [];
      const alertas = alertasApi.map((alerta, index: number) => {
        const severidade: 'baixa' | 'media' | 'alta' | 'critica' = [
          'baixa',
          'media',
          'alta',
          'critica',
        ].includes(String(alerta?.severidade))
          ? (String(alerta?.severidade) as 'baixa' | 'media' | 'alta' | 'critica')
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
            metaDiaria: diasNoPeriodo > 0 ? Number((metaMensal / diasNoPeriodo).toFixed(2)) : 0,
          },
          ranking: {
            posicao: toNumber(rankingAtual?.posicao),
            total: totalRanking,
            pontos: pontosRanking,
            nivel: nivelRanking,
            proximoNivel: {
              nome: null,
              pontosNecessarios: null,
            },
            vendas: valorVendasRanking,
            meta: metaRanking,
            variacao: variacaoRanking,
          },
          pipeline: {
            valor: pipelineValor,
            quantidade: pipelineQuantidade,
            probabilidade: pipelineProbabilidade,
            distribuicao: distribuicaoPipeline,
          },
          atividades: {
            hoje: {
              calls: atividadesHoje.calls,
              reunioes: atividadesHoje.reunioes,
              followups: atividadesHoje.followups,
              emails: atividadesHoje.emails,
              propostas: atividadesHoje.propostas,
            },
            semana: {
              calls: atividadesSemana.calls,
              reunioes: atividadesSemana.reunioes,
              followups: atividadesSemana.followups,
              emails: atividadesSemana.emails,
              propostas: atividadesSemana.propostas,
            },
            metas: {
              callsDiarias: callsMetaDiarias,
              reunioesSemana: reunioesMetaSemanais,
              followupsDiarios: followupsMetaDiarios,
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
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do vendedor');
    } finally {
      setLoading(false);
    }
  }, [periodoSelecionado, user?.id]);

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

  const insights = useMemo<VendedorDashboardInsights>(() => {
    if (!data.kpis.meta) return {};

    const { meta, atividades, performance, pipeline } = data.kpis;
    const performanceParts = [performance.nota * 10, performance.taxaConversao];
    if (typeof performance.satisfacaoCliente === 'number') {
      performanceParts.push(performance.satisfacaoCliente * 20);
    }

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
      performanceGeral:
        performanceParts.length > 0
          ? Math.round(
              performanceParts.reduce((acc, item) => acc + item, 0) / performanceParts.length,
            )
          : 0,
    };
  }, [data.kpis]);

  return {
    data,
    loading,
    error,
    refresh,
    insights,
    period: periodoSelecionado,
    lastUpdatedAt,
  };
};
