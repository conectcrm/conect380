import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, RefreshCw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { leadsService, StatusLead, type Lead, type LeadEstatisticas } from '../../services/leadsService';
import {
  clientesService,
  type Cliente,
  type ClientesEstatisticas,
  type ClienteStatus,
} from '../../services/clientesService';

type LeadStatusFilter = 'all' | StatusLead;
type ClienteStatusFilter = 'all' | ClienteStatus;

type SourceSummaryRow = {
  source: string;
  leadsTotal: number;
  leadsConverted: number;
  leadsQualified: number;
  clientesCriados: number;
  conversionRate: number;
};

const MAX_PAGES = 40;
const PAGE_SIZE = 250;

const leadStatusLabel: Record<StatusLead, string> = {
  [StatusLead.NOVO]: 'Novo',
  [StatusLead.CONTATADO]: 'Contatado',
  [StatusLead.QUALIFICADO]: 'Qualificado',
  [StatusLead.DESQUALIFICADO]: 'Desqualificado',
  [StatusLead.CONVERTIDO]: 'Convertido',
};

const clienteStatusLabel: Record<ClienteStatus, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  cliente: 'Cliente',
  inativo: 'Inativo',
};

const sourceLabelMap: Record<string, string> = {
  formulario: 'Formulario',
  importacao: 'Importacao',
  api: 'API',
  whatsapp: 'WhatsApp',
  manual: 'Manual',
  indicacao: 'Indicacao',
  outro: 'Outro',
  nao_informado: 'Nao informado',
};

const formatNumber = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateSafe = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return null;
};

const parseDateInput = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((chunk) => Number(chunk));
  if (!year || !month || !day) return new Date();
  if (endOfDay) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const normalizeSource = (value: unknown): string => {
  if (typeof value !== 'string') return 'nao_informado';
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  return normalized || 'nao_informado';
};

const toSourceLabel = (source: string): string => {
  if (sourceLabelMap[source]) return sourceLabelMap[source];
  return source
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const formatDateTime = (value: unknown): string => {
  const parsed = parseDateSafe(value);
  if (!parsed) return '-';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ComercialClientesLeadsReportPage: React.FC = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return toDateInput(start);
  }, [now]);
  const defaultEnd = useMemo(() => toDateInput(now), [now]);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatusFilter>('all');
  const [clienteStatusFilter, setClienteStatusFilter] = useState<ClienteStatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [leadsTruncated, setLeadsTruncated] = useState(false);
  const [clientesTruncated, setClientesTruncated] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clientesNoPeriodo, setClientesNoPeriodo] = useState<Cliente[]>([]);
  const [leadStatsGlobal, setLeadStatsGlobal] = useState<LeadEstatisticas | null>(null);
  const [clientesStatsGlobal, setClientesStatsGlobal] = useState<ClientesEstatisticas | null>(null);

  const fetchAllLeads = useCallback(async (): Promise<{ data: Lead[]; truncated: boolean }> => {
    let page = 1;
    const acc: Lead[] = [];
    let truncated = false;

    while (page <= MAX_PAGES) {
      const response = await leadsService.listar({
        page,
        limit: PAGE_SIZE,
        dataInicio: startDate,
        dataFim: endDate,
      });

      const chunk = Array.isArray(response.data) ? response.data : [];
      acc.push(...chunk);

      const totalPages = Math.max(1, Number(response.totalPages || 1));
      if (!chunk.length || page >= totalPages) {
        return { data: acc, truncated };
      }

      page += 1;
    }

    truncated = true;
    return { data: acc, truncated };
  }, [endDate, startDate]);

  const fetchClientesNoPeriodo = useCallback(
    async (): Promise<{ data: Cliente[]; truncated: boolean }> => {
      let page = 1;
      const acc: Cliente[] = [];
      let truncated = false;
      const startTime = parseDateInput(startDate).getTime();
      const endTime = parseDateInput(endDate, true).getTime();

      while (page <= MAX_PAGES) {
        const response = await clientesService.getClientes({
          page,
          limit: PAGE_SIZE,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        });

        const chunk = Array.isArray(response.data) ? response.data : [];

        if (!chunk.length) {
          return { data: acc, truncated };
        }

        for (const cliente of chunk) {
          const createdAt = parseDateSafe(cliente.created_at);
          if (!createdAt) continue;
          const time = createdAt.getTime();
          if (time >= startTime && time <= endTime) {
            acc.push(cliente);
          }
        }

        const oldestTimeInPage = chunk.reduce((oldest, cliente) => {
          const createdAt = parseDateSafe(cliente.created_at);
          if (!createdAt) return oldest;
          return Math.min(oldest, createdAt.getTime());
        }, Number.POSITIVE_INFINITY);

        const totalPages = Math.max(1, Number(response.totalPages || 1));
        const reachedOlderThanRange =
          Number.isFinite(oldestTimeInPage) && oldestTimeInPage < startTime;

        if (page >= totalPages || reachedOlderThanRange) {
          return { data: acc, truncated };
        }

        page += 1;
      }

      truncated = true;
      return { data: acc, truncated };
    },
    [endDate, startDate],
  );

  const loadData = useCallback(async () => {
    setWarning(null);

    const [leadsResult, clientesPeriodoResult, leadStatsResult, clientesStatsResult] =
      await Promise.allSettled([
        fetchAllLeads(),
        fetchClientesNoPeriodo(),
        leadsService.getEstatisticas(),
        clientesService.getEstatisticas(),
      ]);

    let failCount = 0;
    const warningMessages: string[] = [];

    if (leadsResult.status === 'fulfilled') {
      setLeads(leadsResult.value.data);
      setLeadsTruncated(leadsResult.value.truncated);
      if (leadsResult.value.truncated) {
        warningMessages.push('Lista de leads limitada por volume (refine o periodo para detalhes completos).');
      }
    } else {
      setLeads([]);
      setLeadsTruncated(false);
      failCount += 1;
    }

    if (clientesPeriodoResult.status === 'fulfilled') {
      setClientesNoPeriodo(clientesPeriodoResult.value.data);
      setClientesTruncated(clientesPeriodoResult.value.truncated);
      if (clientesPeriodoResult.value.truncated) {
        warningMessages.push(
          'Lista de clientes no periodo foi truncada por volume (refine o periodo para leitura completa).',
        );
      }
    } else {
      setClientesNoPeriodo([]);
      setClientesTruncated(false);
      failCount += 1;
    }

    if (leadStatsResult.status === 'fulfilled') {
      setLeadStatsGlobal(leadStatsResult.value);
    } else {
      setLeadStatsGlobal(null);
      failCount += 1;
    }

    if (clientesStatsResult.status === 'fulfilled') {
      setClientesStatsGlobal(clientesStatsResult.value);
    } else {
      setClientesStatsGlobal(null);
      failCount += 1;
    }

    if (failCount > 0 || warningMessages.length > 0) {
      const failureMessage =
        failCount > 0
          ? 'Alguns blocos do relatorio nao puderam ser carregados agora. Dados parciais continuam visiveis.'
          : '';
      const merged = [failureMessage, ...warningMessages].filter(Boolean).join(' ');
      setWarning(merged || null);
    }
  }, [fetchAllLeads, fetchClientesNoPeriodo]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [loadData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const availableSources = useMemo(() => {
    const sourceSet = new Set<string>();
    leads.forEach((lead) => sourceSet.add(normalizeSource(lead.origem)));
    clientesNoPeriodo.forEach((cliente) => sourceSet.add(normalizeSource(cliente.origem)));
    return Array.from(sourceSet).sort((a, b) => toSourceLabel(a).localeCompare(toSourceLabel(b)));
  }, [clientesNoPeriodo, leads]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads
      .filter((lead) => (leadStatusFilter === 'all' ? true : lead.status === leadStatusFilter))
      .filter((lead) =>
        sourceFilter === 'all' ? true : normalizeSource(lead.origem) === sourceFilter,
      )
      .filter((lead) => {
        if (!term) return true;
        const source = [
          lead.nome,
          lead.email || '',
          lead.telefone || '',
          lead.empresa_nome || '',
          lead.status,
          lead.origem || '',
          lead.observacoes || '',
        ]
          .join(' ')
          .toLowerCase();
        return source.includes(term);
      })
      .sort((a, b) => {
        const first = parseDateSafe(a.created_at)?.getTime() || 0;
        const second = parseDateSafe(b.created_at)?.getTime() || 0;
        return second - first;
      });
  }, [leadStatusFilter, leads, search, sourceFilter]);

  const filteredClientes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clientesNoPeriodo
      .filter((cliente) =>
        clienteStatusFilter === 'all' ? true : cliente.status === clienteStatusFilter,
      )
      .filter((cliente) =>
        sourceFilter === 'all' ? true : normalizeSource(cliente.origem) === sourceFilter,
      )
      .filter((cliente) => {
        if (!term) return true;
        const source = [
          cliente.nome,
          cliente.email || '',
          cliente.telefone || '',
          cliente.status || '',
          cliente.origem || '',
          cliente.empresa || '',
        ]
          .join(' ')
          .toLowerCase();
        return source.includes(term);
      })
      .sort((a, b) => {
        const first = parseDateSafe(a.created_at)?.getTime() || 0;
        const second = parseDateSafe(b.created_at)?.getTime() || 0;
        return second - first;
      });
  }, [clienteStatusFilter, clientesNoPeriodo, search, sourceFilter]);

  const leadSummary = useMemo(() => {
    const total = filteredLeads.length;
    const convertidos = filteredLeads.filter((lead) => lead.status === StatusLead.CONVERTIDO).length;
    const qualificados = filteredLeads.filter((lead) => lead.status === StatusLead.QUALIFICADO).length;
    const contatados = filteredLeads.filter((lead) => lead.status === StatusLead.CONTATADO).length;
    const desqualificados = filteredLeads.filter(
      (lead) => lead.status === StatusLead.DESQUALIFICADO,
    ).length;
    const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;
    const scoreMedio =
      total > 0
        ? Math.round(
            filteredLeads.reduce((sum, lead) => sum + Number(lead.score || 0), 0) / total,
          )
        : 0;

    return {
      total,
      convertidos,
      qualificados,
      contatados,
      desqualificados,
      taxaConversao,
      scoreMedio,
    };
  }, [filteredLeads]);

  const clienteSummary = useMemo(() => {
    const total = filteredClientes.length;
    const leadsCount = filteredClientes.filter((cliente) => cliente.status === 'lead').length;
    const prospects = filteredClientes.filter((cliente) => cliente.status === 'prospect').length;
    const clientesCount = filteredClientes.filter((cliente) => cliente.status === 'cliente').length;
    const inativos = filteredClientes.filter((cliente) => cliente.status === 'inativo').length;

    return {
      total,
      leadsCount,
      prospects,
      clientesCount,
      inativos,
    };
  }, [filteredClientes]);

  const sourceSummary = useMemo((): SourceSummaryRow[] => {
    const leadMap = new Map<string, { total: number; converted: number; qualified: number }>();
    const clienteMap = new Map<string, number>();

    filteredLeads.forEach((lead) => {
      const source = normalizeSource(lead.origem);
      const current = leadMap.get(source) || { total: 0, converted: 0, qualified: 0 };
      current.total += 1;
      if (lead.status === StatusLead.CONVERTIDO) current.converted += 1;
      if (lead.status === StatusLead.QUALIFICADO) current.qualified += 1;
      leadMap.set(source, current);
    });

    filteredClientes.forEach((cliente) => {
      const source = normalizeSource(cliente.origem);
      clienteMap.set(source, (clienteMap.get(source) || 0) + 1);
    });

    const sources = new Set<string>([...leadMap.keys(), ...clienteMap.keys()]);

    return Array.from(sources)
      .map((source) => {
        const leadInfo = leadMap.get(source) || { total: 0, converted: 0, qualified: 0 };
        const clientesCriados = clienteMap.get(source) || 0;
        const conversionRate =
          leadInfo.total > 0 ? Number(((leadInfo.converted / leadInfo.total) * 100).toFixed(1)) : 0;

        return {
          source,
          leadsTotal: leadInfo.total,
          leadsConverted: leadInfo.converted,
          leadsQualified: leadInfo.qualified,
          clientesCriados,
          conversionRate,
        };
      })
      .sort((a, b) => b.leadsTotal - a.leadsTotal || b.clientesCriados - a.clientesCriados);
  }, [filteredClientes, filteredLeads]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Relatorio comercial
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              Clientes e leads por origem
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Conversao, qualificacao e volume de clientes criados no periodo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/relatorios')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para relatorios
            </button>
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-6">
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Fim</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Status lead</span>
            <select
              value={leadStatusFilter}
              onChange={(event) => setLeadStatusFilter(event.target.value as LeadStatusFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              {Object.values(StatusLead).map((status) => (
                <option key={status} value={status}>
                  {leadStatusLabel[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Status cliente</span>
            <select
              value={clienteStatusFilter}
              onChange={(event) => setClienteStatusFilter(event.target.value as ClienteStatusFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              {(Object.keys(clienteStatusLabel) as ClienteStatus[]).map((status) => (
                <option key={status} value={status}>
                  {clienteStatusLabel[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Origem</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todas</option>
              {availableSources.map((source) => (
                <option key={source} value={source}>
                  {toSourceLabel(source)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Busca</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, email, empresa ou observacao"
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
        </div>

        {warning ? (
          <div className="mt-3 rounded-xl border border-[#F4D7A5] bg-[#FFF8E8] px-3 py-2 text-sm text-[#8D5A12]">
            {warning}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-6">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Leads no periodo</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">{formatNumber(leadSummary.total)}</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Conversao no periodo</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {leadSummary.taxaConversao.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            {formatNumber(leadSummary.convertidos)} convertidos
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Qualificados</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(leadSummary.qualificados)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Contatados: {formatNumber(leadSummary.contatados)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Clientes criados</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(clienteSummary.total)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">No periodo filtrado</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Base ativa atual</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(Number(clientesStatsGlobal?.ativos || 0))}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Total: {formatNumber(Number(clientesStatsGlobal?.total || 0))}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Score medio lead</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(leadSummary.scoreMedio)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Global: {formatNumber(Number(leadStatsGlobal?.scoreMedio || 0))}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-4">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Clientes no filtro</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(clienteSummary.total)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">Leads: {formatNumber(clienteSummary.leadsCount)}</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Prospects no filtro</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(clienteSummary.prospects)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Base atual: {formatNumber(Number(clientesStatsGlobal?.prospects || 0))}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Clientes ativos no filtro</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(clienteSummary.clientesCount)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">Inativos no filtro: {formatNumber(clienteSummary.inativos)}</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Leads desqualificados</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(leadSummary.desqualificados)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">
            Global: {formatNumber(Number(leadStatsGlobal?.desqualificados || 0))}
          </p>
        </article>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1C8A8D]" />
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Conversao por origem
            </h2>
          </div>
          <div className="text-xs text-[#607B88]">
            {leadsTruncated || clientesTruncated
              ? 'Visao parcial por limite de volume.'
              : 'Visao completa do periodo selecionado.'}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Origem</th>
                <th className="px-2 py-2 font-semibold">Leads</th>
                <th className="px-2 py-2 font-semibold">Qualificados</th>
                <th className="px-2 py-2 font-semibold">Convertidos</th>
                <th className="px-2 py-2 font-semibold">Taxa conversao</th>
                <th className="px-2 py-2 font-semibold">Clientes criados</th>
              </tr>
            </thead>
            <tbody>
              {sourceSummary.length ? (
                sourceSummary.map((row) => (
                  <tr key={row.source} className="border-t border-[#E7EFF2] text-[#244556]">
                    <td className="px-2 py-2 font-medium text-[#15384A]">{toSourceLabel(row.source)}</td>
                    <td className="px-2 py-2">{formatNumber(row.leadsTotal)}</td>
                    <td className="px-2 py-2">{formatNumber(row.leadsQualified)}</td>
                    <td className="px-2 py-2">{formatNumber(row.leadsConverted)}</td>
                    <td className="px-2 py-2">{row.conversionRate.toFixed(1)}%</td>
                    <td className="px-2 py-2">{formatNumber(row.clientesCriados)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-[#6B8591]">
                    Nenhum dado encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1C8A8D]" />
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Leads no periodo
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/crm/leads')}
            className="rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Abrir leads
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Criado em</th>
                <th className="px-2 py-2 font-semibold">Lead</th>
                <th className="px-2 py-2 font-semibold">Empresa</th>
                <th className="px-2 py-2 font-semibold">Origem</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length ? (
                filteredLeads.slice(0, 80).map((lead) => (
                  <tr key={lead.id} className="border-t border-[#E7EFF2] text-[#244556]">
                    <td className="px-2 py-2">{formatDateTime(lead.created_at)}</td>
                    <td className="px-2 py-2">
                      <div className="max-w-[260px]">
                        <p className="truncate font-medium text-[#15384A]">{lead.nome}</p>
                        <p className="truncate text-[12px] text-[#6A8290]">
                          {lead.email || lead.telefone || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-2">{lead.empresa_nome || '-'}</td>
                    <td className="px-2 py-2">{toSourceLabel(normalizeSource(lead.origem))}</td>
                    <td className="px-2 py-2">{leadStatusLabel[lead.status] || lead.status}</td>
                    <td className="px-2 py-2">{formatNumber(Number(lead.score || 0))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-[#6B8591]">
                    Nenhum lead encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1C8A8D]" />
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Clientes criados no periodo
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/crm/clientes')}
            className="rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Abrir clientes
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Criado em</th>
                <th className="px-2 py-2 font-semibold">Cliente</th>
                <th className="px-2 py-2 font-semibold">Contato</th>
                <th className="px-2 py-2 font-semibold">Origem</th>
                <th className="px-2 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length ? (
                filteredClientes.slice(0, 80).map((cliente, index) => (
                  <tr
                    key={String(cliente.id || `${cliente.email || cliente.nome}-${index}`)}
                    className="border-t border-[#E7EFF2] text-[#244556]"
                  >
                    <td className="px-2 py-2">{formatDateTime(cliente.created_at)}</td>
                    <td className="px-2 py-2">
                      <div className="max-w-[260px]">
                        <p className="truncate font-medium text-[#15384A]">{cliente.nome}</p>
                        <p className="truncate text-[12px] text-[#6A8290]">{cliente.empresa || '-'}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2">{cliente.email || cliente.telefone || '-'}</td>
                    <td className="px-2 py-2">{toSourceLabel(normalizeSource(cliente.origem))}</td>
                    <td className="px-2 py-2">{clienteStatusLabel[cliente.status] || cliente.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-2 py-5 text-[#6B8591]">
                    Nenhum cliente encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ComercialClientesLeadsReportPage;
