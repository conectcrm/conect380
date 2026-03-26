import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  DollarSign,
  RefreshCw,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { agendaEventosService } from '../../services/agendaEventosService';
import faturamentoService from '../../services/faturamentoService';
import type { DashboardV2Overview } from '../dashboard-v2/useDashboardV2';

type ReportsPeriodPreset = '7d' | '30d' | '90d' | 'month';

type ReportsHubPayload = {
  comercial: DashboardV2Overview | null;
  financeiro: {
    totalFaturas: number;
    valorTotal: number;
    valorRecebido: number;
    valorEmAberto: number;
    faturasPagas: number;
    faturasPendentes: number;
    faturasVencidas: number;
  } | null;
  agenda: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    nextEvents: number;
  } | null;
};

const formatCurrency = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

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

const resolveRange = (
  preset: ReportsPeriodPreset,
): {
  periodStart: string;
  periodEnd: string;
  startDate: Date;
  endDate: Date;
} => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  if (preset === '7d') {
    startDate.setDate(startDate.getDate() - 6);
  } else if (preset === '30d') {
    startDate.setDate(startDate.getDate() - 29);
  } else if (preset === '90d') {
    startDate.setDate(startDate.getDate() - 89);
  } else if (preset === 'month') {
    startDate.setDate(1);
  }

  return {
    periodStart: toDateInput(startDate),
    periodEnd: toDateInput(endDate),
    startDate,
    endDate,
  };
};

const ReportsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [periodPreset, setPeriodPreset] = useState<ReportsPeriodPreset>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [payload, setPayload] = useState<ReportsHubPayload>({
    comercial: null,
    financeiro: null,
    agenda: null,
  });

  const range = useMemo(() => resolveRange(periodPreset), [periodPreset]);

  const loadData = useCallback(async () => {
    setWarning(null);
    const { periodStart, periodEnd, startDate, endDate } = range;

    const [comercialResult, financeiroResult, agendaResult] = await Promise.allSettled([
      api.get<{ overview: DashboardV2Overview }>('/dashboard/v2/snapshot', {
        params: {
          periodStart,
          periodEnd,
        },
      }),
      faturamentoService.obterEstatisticas({
        inicio: periodStart,
        fim: periodEnd,
      }),
      agendaEventosService.listarEventos({
        startDate,
        endDate,
      }),
    ]);

    const nextPayload: ReportsHubPayload = {
      comercial: null,
      financeiro: null,
      agenda: null,
    };

    let failedSources = 0;

    if (comercialResult.status === 'fulfilled') {
      nextPayload.comercial = comercialResult.value.data?.overview || null;
    } else {
      failedSources += 1;
    }

    if (financeiroResult.status === 'fulfilled') {
      nextPayload.financeiro = financeiroResult.value;
    } else {
      failedSources += 1;
    }

    if (agendaResult.status === 'fulfilled') {
      const events = agendaResult.value || [];
      const now = Date.now();
      const agendaSummary = events.reduce(
        (acc, event) => {
          if (event.status === 'confirmed') acc.confirmed += 1;
          if (event.status === 'pending') acc.pending += 1;
          if (event.status === 'cancelled') acc.cancelled += 1;
          if (event.start.getTime() >= now && event.status !== 'cancelled') {
            acc.nextEvents += 1;
          }
          return acc;
        },
        {
          total: events.length,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          nextEvents: 0,
        },
      );

      nextPayload.agenda = agendaSummary;
    } else {
      failedSources += 1;
    }

    setPayload(nextPayload);
    if (failedSources > 0) {
      setWarning(
        'Alguns blocos de relatorio nao puderam ser carregados agora. Os dados disponiveis continuam visiveis.',
      );
    }
  }, [range]);

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

  const buildComercialPath = useCallback(
    (metric: 'geral' | 'faturamento' | 'pipeline-negociacao') => {
      const params = new URLSearchParams({
        metric,
        periodStart: range.periodStart,
        periodEnd: range.periodEnd,
      });
      return `/relatorios/comercial/drilldown?${params.toString()}`;
    },
    [range.periodEnd, range.periodStart],
  );

  const nextEventsLabel = useMemo(() => {
    const nextEvents = Number(payload.agenda?.nextEvents || 0);
    return `${formatNumber(nextEvents)} nos proximos dias`;
  }, [payload.agenda?.nextEvents]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Central de relatorios
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              Relatorios por area
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Visao consolidada de Comercial, Financeiro e Agenda no mesmo recorte de periodo.
            </p>
          </div>

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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {([
            { value: '7d', label: '7 dias' },
            { value: '30d', label: '30 dias' },
            { value: '90d', label: '90 dias' },
            { value: 'month', label: 'Mes atual' },
          ] as Array<{ value: ReportsPeriodPreset; label: string }>).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriodPreset(item.value)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                periodPreset === item.value
                  ? 'border-[#159A9C] bg-[#EAF8F8] font-semibold text-[#136F70]'
                  : 'border-[#D3E2E8] bg-white text-[#4C6774] hover:border-[#C3D7DF]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="rounded-full border border-[#D3E2E8] bg-white px-3 py-1 text-xs text-[#4C6774]">
            {range.periodStart} ate {range.periodEnd}
          </span>
        </div>

        {warning ? (
          <div className="mt-4 rounded-xl border border-[#F4D7A5] bg-[#FFF8E8] px-3 py-2 text-sm text-[#8D5A12]">
            {warning}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Comercial</h2>
            <Target className="h-5 w-5 text-[#1C8A8D]" />
          </div>
          <p className="mt-1 text-[13px] text-[#6B8591]">
            Receita, ticket medio, carteira ativa e pipeline.
          </p>
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-[#E3EBEF] bg-[#F8FBFC] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Receita fechada</p>
              <p className="mt-1 text-[20px] font-semibold text-[#18374B]">
                {formatCurrency(Number(payload.comercial?.receitaFechada || 0))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Oportunidades</p>
                <p className="mt-1 text-[18px] font-semibold text-[#18374B]">
                  {formatNumber(Number(payload.comercial?.oportunidadesAtivas || 0))}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Ticket medio</p>
                <p className="mt-1 text-[18px] font-semibold text-[#18374B]">
                  {formatCurrency(Number(payload.comercial?.ticketMedio || 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => navigate(buildComercialPath('geral'))}
              className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Visao geral comercial
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate(buildComercialPath('pipeline-negociacao'))}
              className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Pipeline em negociacao
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Financeiro</h2>
            <DollarSign className="h-5 w-5 text-[#1C8A8D]" />
          </div>
          <p className="mt-1 text-[13px] text-[#6B8591]">
            Recebimento, aberto, vencido e desempenho das faturas.
          </p>
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-[#E3EBEF] bg-[#F8FBFC] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Valor recebido</p>
              <p className="mt-1 text-[20px] font-semibold text-[#18374B]">
                {formatCurrency(Number(payload.financeiro?.valorRecebido || 0))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Em aberto</p>
                <p className="mt-1 text-[18px] font-semibold text-[#18374B]">
                  {formatCurrency(Number(payload.financeiro?.valorEmAberto || 0))}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Vencidas</p>
                <p className="mt-1 text-[18px] font-semibold text-[#18374B]">
                  {formatNumber(Number(payload.financeiro?.faturasVencidas || 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => navigate('/financeiro/relatorios')}
              className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Relatorio financeiro completo
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/financeiro/faturamento')}
              className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Abrir faturamento
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <article className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">Agenda</h2>
            <CalendarDays className="h-5 w-5 text-[#1C8A8D]" />
          </div>
          <p className="mt-1 text-[13px] text-[#6B8591]">
            Eventos, status de confirmacao e proximos compromissos.
          </p>
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-[#E3EBEF] bg-[#F8FBFC] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Eventos no periodo</p>
              <p className="mt-1 text-[20px] font-semibold text-[#18374B]">
                {formatNumber(Number(payload.agenda?.total || 0))}
              </p>
              <p className="mt-1 text-xs text-[#5F7783]">{nextEventsLabel}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-2 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Confirmados</p>
                <p className="mt-1 text-[16px] font-semibold text-[#18374B]">
                  {formatNumber(Number(payload.agenda?.confirmed || 0))}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-2 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Pendentes</p>
                <p className="mt-1 text-[16px] font-semibold text-[#18374B]">
                  {formatNumber(Number(payload.agenda?.pending || 0))}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EBEF] bg-white px-2 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Cancelados</p>
                <p className="mt-1 text-[16px] font-semibold text-[#18374B]">
                  {formatNumber(Number(payload.agenda?.cancelled || 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => navigate('/relatorios/agenda')}
              className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Relatorio da agenda
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/agenda')}
              className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
            >
              Abrir calendario completo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1C8A8D]" />
          <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Outros relatorios disponiveis
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/relatorios/comercial/propostas-contratos')}
            className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2.5 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Propostas e contratos
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/relatorios/comercial/clientes-leads')}
            className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2.5 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Clientes e leads
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/financeiro/conciliacao')}
            className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2.5 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Conciliacao bancaria
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/financeiro/aprovacoes')}
            className="inline-flex items-center justify-between rounded-xl border border-[#D6E4E9] bg-white px-3 py-2.5 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Aprovacoes financeiras
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default ReportsHubPage;
