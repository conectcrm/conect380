import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { agendaEventosService } from '../../services/agendaEventosService';
import type { CalendarEvent } from '../../types/calendar';

type AgendaStatusFilter = 'all' | CalendarEvent['status'];
type AgendaTypeFilter = 'all' | CalendarEvent['type'];

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

const parseDateInput = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((chunk) => Number(chunk));
  if (!year || !month || !day) return new Date();
  if (endOfDay) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const startOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

const endOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

const formatDateTime = (value: Date): string =>
  value.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusLabel: Record<CalendarEvent['status'], string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

const typeLabel: Record<CalendarEvent['type'], string> = {
  meeting: 'Reuniao',
  call: 'Ligacao',
  task: 'Tarefa',
  event: 'Evento',
  'follow-up': 'Follow-up',
};

const AgendaReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => toDateInput(startOfMonth()));
  const [endDate, setEndDate] = useState<string>(() => toDateInput(endOfMonth()));
  const [statusFilter, setStatusFilter] = useState<AgendaStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AgendaTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const loadData = useCallback(async () => {
    setWarning(null);
    try {
      const data = await agendaEventosService.listarEventos({
        startDate: parseDateInput(startDate),
        endDate: parseDateInput(endDate, true),
      });
      setEvents(data);
    } catch {
      setWarning('Nao foi possivel carregar os eventos da agenda para o periodo informado.');
      setEvents([]);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    void bootstrap();
  }, [loadData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...events]
      .filter((event) => (statusFilter === 'all' ? true : event.status === statusFilter))
      .filter((event) => (typeFilter === 'all' ? true : event.type === typeFilter))
      .filter((event) => {
        if (!normalizedSearch) return true;
        const source = `${event.title} ${event.description || ''} ${event.location || ''}`.toLowerCase();
        return source.includes(normalizedSearch);
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, search, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const now = Date.now();
    return filteredEvents.reduce(
      (acc, event) => {
        if (event.status === 'confirmed') acc.confirmed += 1;
        if (event.status === 'pending') acc.pending += 1;
        if (event.status === 'cancelled') acc.cancelled += 1;
        if (event.start.getTime() >= now && event.status !== 'cancelled') acc.next += 1;
        return acc;
      },
      {
        total: filteredEvents.length,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        next: 0,
      },
    );
  }, [filteredEvents]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Relatorio da agenda
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              Eventos e confirmacoes
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Recorte detalhado de compromissos, status e proximos eventos da equipe.
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

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
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
            <span className="mb-1 block text-[12px] text-[#67818D]">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AgendaStatusFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as AgendaTypeFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              <option value="meeting">Reuniao</option>
              <option value="call">Ligacao</option>
              <option value="task">Tarefa</option>
              <option value="event">Evento</option>
              <option value="follow-up">Follow-up</option>
            </select>
          </label>
        </div>

        <div className="mt-2">
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Busca</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titulo, descricao ou local"
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

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Total</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">{formatNumber(summary.total)}</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Confirmados</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(summary.confirmed)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Pendentes</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">{formatNumber(summary.pending)}</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Cancelados</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(summary.cancelled)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Proximos</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">{formatNumber(summary.next)}</p>
        </article>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#1C8A8D]" />
          <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Lista de eventos do periodo
          </h2>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Inicio</th>
                <th className="px-2 py-2 font-semibold">Termino</th>
                <th className="px-2 py-2 font-semibold">Titulo</th>
                <th className="px-2 py-2 font-semibold">Tipo</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Local</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length ? (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="border-t border-[#E7EFF2] text-[#244556]">
                    <td className="px-2 py-2">{formatDateTime(event.start)}</td>
                    <td className="px-2 py-2">{formatDateTime(event.end)}</td>
                    <td className="px-2 py-2">
                      <div className="max-w-[360px]">
                        <p className="truncate font-medium text-[#15384A]">{event.title}</p>
                        {event.description ? (
                          <p className="mt-1 line-clamp-2 text-[12px] text-[#6A8290]">{event.description}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">{typeLabel[event.type]}</td>
                    <td className="px-2 py-2">{statusLabel[event.status]}</td>
                    <td className="px-2 py-2">{event.location || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-[#6B8591]">
                    Nenhum evento encontrado para os filtros selecionados.
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

export default AgendaReportPage;
