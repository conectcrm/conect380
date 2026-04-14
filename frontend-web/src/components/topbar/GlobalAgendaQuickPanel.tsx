import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { agendaEventosService } from '../../services/agendaEventosService';
import { CalendarEvent } from '../../types/calendar';

type GlobalAgendaQuickPanelProps = {
  className?: string;
};

const LOOKAHEAD_DAYS = 45;
const REFRESH_INTERVAL_MS = 120_000;
const MAX_VISIBLE_EVENTS = 4;
const UPCOMING_WINDOW_HOURS = 24;

const dateKey = (value: Date): string => format(value, 'yyyy-MM-dd');

const buildMonthGrid = (monthCursor: Date): Date[] => {
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
};

const byStartDateAsc = (a: CalendarEvent, b: CalendarEvent) => a.start.getTime() - b.start.getTime();

const formatEventTimeLabel = (event: CalendarEvent): string => {
  if (event.allDay) {
    return 'Dia inteiro';
  }

  const startLabel = format(event.start, 'HH:mm');
  const endLabel = format(event.end, 'HH:mm');
  return `${startLabel} - ${endLabel}`;
};

const formatEventCountLabel = (count: number): string => `${count} evento${count === 1 ? '' : 's'}`;

const capitalizeFirst = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const statusLabelMap: Record<CalendarEvent['status'], string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

const statusToneMap: Record<CalendarEvent['status'], string> = {
  confirmed: 'border-[#CFEAE2] bg-[#EFF9F5] text-[#136B5E]',
  pending: 'border-[#F3E4C4] bg-[#FFF9EE] text-[#9A6A13]',
  cancelled: 'border-[#F5D5D9] bg-[#FFF4F6] text-[#A12843]',
};

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const GlobalAgendaQuickPanel: React.FC<GlobalAgendaQuickPanelProps> = ({ className }) => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());
  const [onlyNext24h, setOnlyNext24h] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fetchEvents = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const now = new Date();
        const rangeStart = startOfDay(now);
        const rangeEnd = endOfDay(addDays(rangeStart, LOOKAHEAD_DAYS));
        const payload = await agendaEventosService.listarEventos({
          startDate: rangeStart,
          endDate: rangeEnd,
        });
        setEvents([...payload].sort(byStartDateAsc));
      } catch (fetchError) {
        console.error('Erro ao carregar agenda rápida da topbar:', fetchError);
        setError('Não foi possível carregar os eventos da agenda.');
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void fetchEvents({ silent: true });
  }, [fetchEvents]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void fetchEvents();

    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      void fetchEvents({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(refreshInterval);
  }, [fetchEvents, isOpen]);

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      const key = dateKey(event.start);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [events]);

  const todayEventsCount = countsByDate.get(dateKey(new Date())) ?? 0;
  const upcoming24hEvents = useMemo(() => {
    const now = Date.now();
    const limit = now + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000;

    return events
      .filter((event) => {
        const startAt = event.start.getTime();
        return startAt >= now && startAt <= limit && event.status !== 'cancelled';
      })
      .sort(byStartDateAsc);
  }, [events]);
  const upcoming24hCount = upcoming24hEvents.length;
  const monthGrid = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  const eventsForSelectedDate = useMemo(
    () => events.filter((event) => isSameDay(event.start, selectedDate)).slice(0, MAX_VISIBLE_EVENTS),
    [events, selectedDate],
  );
  const eventsForCurrentFilter = useMemo(
    () => (onlyNext24h ? upcoming24hEvents.slice(0, MAX_VISIBLE_EVENTS) : eventsForSelectedDate),
    [eventsForSelectedDate, onlyNext24h, upcoming24hEvents],
  );

  const selectedDateLabel = useMemo(
    () => capitalizeFirst(format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })),
    [selectedDate],
  );
  const currentListTitle = onlyNext24h ? 'Próximas 24 horas' : selectedDateLabel;

  const handleOpenAgenda = () => {
    setIsOpen(false);
    navigate('/crm/agenda');
  };

  const handleCreateEvent = () => {
    setIsOpen(false);
    navigate('/crm/agenda', {
      state: {
        openCreateEvent: true,
        selectedDate: selectedDate.toISOString(),
      },
    });
  };

  const handleOpenEventDetails = (event: CalendarEvent) => {
    setIsOpen(false);
    navigate(`/crm/agenda/eventos/${event.id}`);
  };

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="group relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent p-1.5 text-[#607B89] transition-all duration-200 ease-out hover:border-[#159A9C]/25 hover:bg-[#DEEFE7]/65 hover:text-[#002333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-[1px] sm:min-h-0 sm:min-w-0 sm:p-2"
        title="Agenda global"
        aria-label={`Agenda global${upcoming24hCount > 0 ? `, ${upcoming24hCount} eventos nas próximas 24 horas` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
        {upcoming24hCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#159A9C] px-1 text-[10px] font-semibold text-white">
            {upcoming24hCount > 99 ? '99+' : upcoming24hCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed left-2 right-2 top-[calc(env(safe-area-inset-top,0px)+86px)] z-50 flex max-h-[min(calc(100vh-110px),640px)] flex-col rounded-2xl border border-[#D7E4E8] bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] sm:max-h-[min(calc(100vh-120px),640px)]">
          <div className="border-b border-[#E5EEF2] px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#19384C]">Agenda rápida</p>
                <p className="text-xs text-[#607B89]">
                  {todayEventsCount > 0
                    ? `${formatEventCountLabel(todayEventsCount)} para hoje`
                    : 'Nenhum evento para hoje'}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-[#D3E6E2] bg-[#EFF9F5] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#136B5E]">
                24h: {upcoming24hCount}
              </span>
              <button
                type="button"
                onClick={() => void fetchEvents()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D7E5EA] bg-white text-[#6A8795] transition-colors hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/30"
                aria-label="Atualizar agenda rápida"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="border-b border-[#E5EEF2] px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMonthCursor((current) => subMonths(current, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D7E5EA] bg-white text-[#6A8795] transition-colors hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/30"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold capitalize text-[#19384C]">
                {format(monthCursor, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button
                type="button"
                onClick={() => setMonthCursor((current) => addMonths(current, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D7E5EA] bg-white text-[#6A8795] transition-colors hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/30"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDayLabels.map((label) => (
                <span
                  key={label}
                  className="flex h-7 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6C8694]"
                >
                  {label}
                </span>
              ))}
              {monthGrid.map((day) => {
                const key = dateKey(day);
                const hasEvents = (countsByDate.get(key) ?? 0) > 0;
                const isDaySelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthCursor);
                const dayIsToday = isToday(day);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day);
                      setOnlyNext24h(false);
                    }}
                    className={clsx(
                      'relative h-9 rounded-lg border text-xs transition-colors',
                      isDaySelected
                        ? 'border-[#159A9C] bg-[#159A9C] text-white'
                        : 'border-transparent bg-white text-[#3E5E70] hover:border-[#D7E5EA] hover:bg-[#F7FBFC]',
                      !isCurrentMonth && !isDaySelected ? 'text-[#A4B6C0]' : '',
                      dayIsToday && !isDaySelected ? 'border-[#BFE0DA] bg-[#F2FAF7] text-[#0F7B7D]' : '',
                    )}
                    aria-label={format(day, "dd 'de' MMMM", { locale: ptBR })}
                  >
                    {format(day, 'd')}
                    {hasEvents ? (
                      <span
                        className={clsx(
                          'absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full',
                          isDaySelected ? 'bg-white' : 'bg-[#159A9C]',
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#19384C]">{currentListTitle}</p>
              {!isLoading && !error ? (
                <span className="text-xs font-medium text-[#6A8795]">
                  {formatEventCountLabel(eventsForCurrentFilter.length)}
                </span>
              ) : null}
            </div>
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setOnlyNext24h((current) => !current)}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  onlyNext24h
                    ? 'border-[#159A9C] bg-[#159A9C] text-white'
                    : 'border-[#D7E5EA] bg-white text-[#56707F] hover:bg-[#F6FBFC]',
                )}
              >
                <Clock3 className="h-3.5 w-3.5" />
                Somente próximas 24h
              </button>
            </div>

            {error ? (
              <div className="rounded-xl border border-[#F5D5D9] bg-[#FFF6F8] px-3 py-2 text-xs text-[#9B1C1C]">
                {error}
              </div>
            ) : null}

            {!error && isLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#E3EDF1] bg-[#FBFDFE] px-3 py-3 text-sm text-[#607B89]">
                <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                Carregando eventos...
              </div>
            ) : null}

            {!error && !isLoading ? (
              eventsForCurrentFilter.length > 0 ? (
                <div className="space-y-2.5">
                  {eventsForCurrentFilter.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handleOpenEventDetails(event)}
                      className="w-full rounded-xl border border-[#E1EBEF] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#CDE6DF] hover:bg-[#F8FCFB]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[#19384C]">{event.title}</p>
                        <span
                          className={clsx(
                            'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            statusToneMap[event.status],
                          )}
                        >
                          {statusLabelMap[event.status]}
                        </span>
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-[#607B89]">
                        <Clock3 className="h-3.5 w-3.5 text-[#6A8795]" />
                        {formatEventTimeLabel(event)}
                      </div>
                      {onlyNext24h ? (
                        <p className="mt-1 text-xs text-[#607B89]">
                          {format(event.start, "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      ) : null}
                      {event.location ? (
                        <p className="mt-1 truncate text-xs text-[#6A8795]">{event.location}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D7E5EA] bg-[#FBFDFE] px-3 py-4 text-sm text-[#607B89]">
                  {onlyNext24h
                    ? 'Nenhum evento previsto para as próximas 24 horas.'
                    : 'Nenhum evento para a data selecionada.'}
                </div>
              )
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-[#E5EEF2] px-4 py-3">
            <button
              type="button"
              onClick={handleCreateEvent}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#159A9C] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35"
            >
              <Plus className="h-4 w-4" />
              Novo evento
            </button>
            <button
              type="button"
              onClick={handleOpenAgenda}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/25"
            >
              <CalendarDays className="h-4 w-4" />
              Abrir agenda
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default React.memo(GlobalAgendaQuickPanel);
