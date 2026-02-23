import React, { useState, useEffect } from 'react';
import { MonthView } from '../../components/calendar/MonthView';
import { WeekView } from '../../components/calendar/WeekView';
import { CreateEventModal } from '../../components/calendar/CreateEventModal';
import { EventDetailsModal } from '../../components/calendar/EventDetailsModal';
import { Card, FiltersBar, InlineStats, PageHeader, SectionCard } from '../../components/layout-v2';
import { useCalendarEvents, useCalendarView, useCalendarDragDrop } from '../../hooks/useCalendar';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarEvent } from '../../types/calendar';
import { getMonthName, formatDate } from '../../utils/calendarUtils';
import { buildAgendaUpcomingNotification, getAgendaSummaryNotificationId } from './agendaNotifications';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  Download,
  Settings,
  Grid3X3,
  Rows,
  Square,
  Users,
  User,
  Building2,
  MapPin,
  X,
} from 'lucide-react';

const mapModalEventTypeToCalendarType = (
  modalEventType: string | undefined,
): CalendarEvent['type'] => {
  switch (modalEventType) {
    case 'reuniao':
      return 'meeting';
    case 'ligacao':
      return 'call';
    case 'tarefa':
      return 'task';
    case 'follow-up':
      return 'follow-up';
    case 'evento':
    default:
      return 'event';
  }
};

const AGENDA_PREFERENCES_KEYS = {
  showStatsPanel: 'agenda:show-stats-panel',
  openFiltersByDefault: 'agenda:open-filters-default',
} as const;

const readBooleanPreference = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  const value = window.localStorage.getItem(key);
  if (value === null) return defaultValue;
  return value === 'true';
};

const writeBooleanPreference = (key: string, value: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, String(value));
};

const matchesCollaboratorFilter = (event: CalendarEvent, filterValue: string): boolean => {
  if (!filterValue) return true;
  if (event.collaborator === filterValue) return true;
  if (event.responsavel === filterValue) return true;
  return !!event.attendees?.includes(filterValue);
};

const toCsvCell = (value: unknown): string => {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
};

const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AgendaPage: React.FC = () => {
  // Hook de notificações
  const { addNotification, showSuccess, showWarning } = useNotifications();

  const {
    events,
    selectedEvent,
    setSelectedEvent,
    addEvent,
    updateEvent,
    respondToInvite,
    updateEventLocalMeta,
    deleteEvent,
    moveEvent,
    duplicateEvent,
    getCollaborators,
  } = useCalendarEvents();
  const { user } = useAuth();

  const { view, navigateDate, setViewType, goToToday } = useCalendarView();

  const { draggedEvent, dropTarget, startDrag, endDrag, setDrop } = useCalendarDragDrop(
    events,
    moveEvent,
  );

  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [isRespondingToInvite, setIsRespondingToInvite] = useState(false);
  const [eventModalDate, setEventModalDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(() =>
    readBooleanPreference(AGENDA_PREFERENCES_KEYS.openFiltersByDefault, false),
  );
  const [showStatsPanel, setShowStatsPanel] = useState<boolean>(() =>
    readBooleanPreference(AGENDA_PREFERENCES_KEYS.showStatsPanel, true),
  );
  const [showAgendaSettings, setShowAgendaSettings] = useState(false);
  const [settingsShowStatsPanel, setSettingsShowStatsPanel] = useState<boolean>(showStatsPanel);
  const [settingsOpenFiltersByDefault, setSettingsOpenFiltersByDefault] = useState<boolean>(() =>
    readBooleanPreference(AGENDA_PREFERENCES_KEYS.openFiltersByDefault, false),
  );
  const [filterType, setFilterType] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCollaborator, setFilterCollaborator] = useState<string>('');

  // Função para verificar conflitos de horário
  const checkEventConflicts = (newEvent: any, existingEvents: CalendarEvent[]) => {
    if (newEvent.allDay) return []; // Eventos de dia todo não geram conflito

    const newStart = new Date(newEvent.start);
    const newEnd = new Date(newEvent.end);

    return existingEvents.filter((event) => {
      if (event.allDay) return false;

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Verificar sobreposição de horários
      return newStart < eventEnd && newEnd > eventStart;
    });
  };

  // Handlers
  const currentUserEmail = String(user?.email || '')
    .trim()
    .toLowerCase();
  const currentUserId = String(user?.id || '').trim();
  const canUpdateAgendaEvents = React.useMemo(() => {
    const permissions = [
      ...(Array.isArray((user as any)?.permissions) ? (user as any).permissions : []),
      ...(Array.isArray((user as any)?.permissoes) ? (user as any).permissoes : []),
    ];

    return permissions.some(
      (permission: unknown) =>
        typeof permission === 'string' && permission.trim().toLowerCase() === 'crm.agenda.update',
    );
  }, [user]);

  const isEventAttendee = (event: CalendarEvent) =>
    !!currentUserEmail &&
    Array.isArray(event.attendees) &&
    event.attendees.some((attendee) => attendee?.trim().toLowerCase() === currentUserEmail);

  const shouldOpenReadOnlyDetails = (event: CalendarEvent) => {
    if (!isEventAttendee(event)) return false;

    // Regra principal: participante que nao criou o evento abre detalhes read-only.
    if (event.criadoPorId) {
      return !currentUserId || event.criadoPorId !== currentUserId;
    }

    // Fallback de seguranca para eventos compartilhados legados sem metadado de criador.
    // Preferimos bloquear edicao a permitir alteracao indevida por convidado.
    return true;
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (shouldOpenReadOnlyDetails(event)) {
      setShowEventModal(false);
      setShowEventDetailsModal(true);
      return;
    }

    setShowEventDetailsModal(false);
    setShowEventModal(true);
  };

  const handleDateClick = (date: Date) => {
    setEventModalDate(date);
    setSelectedEvent(null);
    setShowEventDetailsModal(false);
    setShowEventModal(true);
  };

  const handleTimeSlotClick = (dateTime: Date) => {
    setEventModalDate(dateTime);
    setSelectedEvent(null);
    setShowEventDetailsModal(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    const mappedEventType = mapModalEventTypeToCalendarType(eventData.eventType);
    const collaboratorName = eventData.responsavel || '';
    const responsavelId = eventData.responsavelId || undefined;

    // Converter dados do CreateEventModal para o formato CalendarEvent
    const calendarEventData: Omit<CalendarEvent, 'id'> = {
      title: eventData.title,
      description: eventData.description || '',
      start: eventData.start,
      end: eventData.end,
      location: eventData.location || '',
      locationType: eventData.locationType || 'presencial',
      allDay: eventData.allDay || false,
      type: mappedEventType,
      priority: eventData.priority || 'medium',
      status: eventData.status || 'pending',
      collaborator: collaboratorName,
      responsavel: collaboratorName || responsavelId || '',
      responsavelId,
      category: eventData.category || mappedEventType,
      color: eventData.color || '#159A9C',
      attendees: eventData.attendees || [],
      reminderTime: eventData.reminderTime,
      reminderType: eventData.reminderType,
      emailOffline: !!eventData.emailOffline,
      attachments: Array.isArray(eventData.attachments) ? eventData.attachments : [],
      isRecurring: !!eventData.isRecurring,
    };

    let savedEvent: CalendarEvent | null = null;

    try {
      if (selectedEvent) {
        const updatedEvent = await updateEvent(selectedEvent.id, calendarEventData);
        if (!updatedEvent) {
          throw new Error('Falha ao atualizar evento');
        }
        savedEvent = updatedEvent;
        // Toast será exibido pelo CreateEventModal
      } else {
        const createdEvent = await addEvent(calendarEventData);
        if (!createdEvent) {
          throw new Error('Falha ao criar evento');
        }
        savedEvent = createdEvent;
        // Toast será exibido pelo CreateEventModal

        // Verificar conflitos de horário para novos eventos
        const conflicts = checkEventConflicts(eventData, events);
        if (conflicts.length > 0) {
          showWarning(
            '\u26A0\uFE0F Conflito de Horário',
            `Este evento conflita com ${conflicts.length} outro(s) evento(s)`,
          );
        }
      }

      // Fechar modal após sucesso
      setShowEventModal(false);
      setSelectedEvent(null);
      setEventModalDate(null);
      return savedEvent ?? undefined;
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      addNotification({
        title: '\u274C Erro na Agenda',
        message: 'Não foi possível salvar o evento. Tente novamente.',
        type: 'error',
        priority: 'high',
      });
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
    } catch (error) {
      addNotification({
        title: 'Erro ao Excluir',
        message: 'Não foi possível excluir o evento. Tente novamente.',
        type: 'error',
        priority: 'high',
      });
      throw error;
    }
  };

  const handleDuplicateEvent = async (eventId: string) => {
    try {
      const duplicatedEvent = await duplicateEvent(eventId);
      if (!duplicatedEvent) {
        throw new Error('Falha ao duplicar evento');
      }

      // Apenas toast para feedback imediato
      showSuccess('Evento Duplicado', 'Uma cópia do evento foi criada com sucesso');
    } catch (error) {
      addNotification({
        title: 'Erro ao Duplicar',
        message: 'Não foi possível duplicar o evento. Tente novamente.',
        type: 'error',
        priority: 'high',
      });
    }
  };
  const handleDrop = (targetDate: Date) => {
    if (draggedEvent) {
      // Apenas toast para feedback imediato
      showSuccess(
        'Evento Movido',
        `Evento foi movido para ${targetDate.toLocaleDateString('pt-BR')}`,
      );
    }
    setDrop(targetDate);
  };

  // Verificar eventos próximos a cada 5 minutos
  useEffect(() => {
    const checkUpcomingEvents = () => {
      const now = new Date();
      const next15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
      const next60Minutes = new Date(now.getTime() + 60 * 60 * 1000);

      // Agrupar eventos por período para evitar notificações duplicadas
      const upcomingEvents15min = events.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart > now && eventStart <= next15Minutes && !event.allDay;
      });

      const upcomingEvents1hour = events.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart > next15Minutes && eventStart <= next60Minutes && !event.allDay;
      });

      // Criar uma única notificação para eventos em 15 minutos
      const urgentNotification = buildAgendaUpcomingNotification(upcomingEvents15min, '15m');
      if (urgentNotification) addNotification(urgentNotification);

      const oneHourNotification = buildAgendaUpcomingNotification(upcomingEvents1hour, '1h');
      if (oneHourNotification) addNotification(oneHourNotification);
    };

    // Verificar imediatamente e depois a cada 5 minutos
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [events, addNotification]);

  // Notificação de boas-vindas e resumo da agenda
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Eventos de hoje
    const todayEvents = events.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });

    // Eventos pendentes
    const pendingEvents = events.filter((event) => event.status === 'pending');

    // Notificação de resumo - evitar duplicatas usando um ID único baseado na data
    const summaryId = getAgendaSummaryNotificationId(today);

    // Verificar se já foi mostrada hoje
    const summaryStatus = sessionStorage.getItem(summaryId);

    if (!summaryStatus) {
      sessionStorage.setItem(summaryId, 'scheduled');

      const timeoutId = window.setTimeout(() => {
        addNotification({
          id: summaryId,
          title: '\u{1F4C5} Agenda Carregada',
          message: `${todayEvents.length} eventos hoje • ${pendingEvents.length} pendentes`,
          type: 'info',
          priority: 'low',
          entityType: 'agenda',
          entityId: summaryId,
        });

        sessionStorage.setItem(summaryId, 'shown');
      }, 1000);

      return () => window.clearTimeout(timeoutId);
    }
  }, [events, addNotification]);

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setEventModalDate(null);
  };

  const handleCloseEventDetailsModal = () => {
    setShowEventDetailsModal(false);
    setSelectedEvent(null);
  };

  const handleInviteResponse = async (response: Extract<CalendarEvent['myRsvp'], 'confirmed' | 'declined'>) => {
    if (!selectedEvent) return;

    setIsRespondingToInvite(true);
    try {
      try {
        await respondToInvite(selectedEvent.id, response);
      } catch (persistError) {
        // Fallback local para manter UX em ambientes sem migration/endpoint atualizado
        updateEventLocalMeta(selectedEvent.id, { myRsvp: response });
        console.warn('[Agenda] RSVP persistido indisponível; usando fallback local.', persistError);
      }

      showSuccess(
        response === 'confirmed' ? 'Presença confirmada' : 'Convite recusado',
        response === 'confirmed'
          ? 'Sua resposta foi registrada nesta agenda.'
          : 'Sua recusa foi registrada nesta agenda.',
      );
    } catch (error) {
      console.error('Erro ao registrar resposta do convite:', error);
      addNotification({
        title: '❌ Erro ao responder convite',
        message: 'Não foi possível registrar sua resposta. Tente novamente.',
        type: 'error',
        priority: 'medium',
      });
    } finally {
      setIsRespondingToInvite(false);
    }
  };

  const getViewTitle = () => {
    switch (view.type) {
      case 'month':
        return getMonthName(view.date);
      case 'week':
        const weekStart = new Date(view.date);
        weekStart.setDate(view.date.getDate() - view.date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      case 'day':
        return formatDate(view.date, 'long');
      default:
        return '';
    }
  };

  // Função para filtrar eventos
  const getFilteredEvents = () => {
    return events.filter((event) => {
      if (filterType && event.type !== filterType) return false;
      if (filterPriority && event.priority !== filterPriority) return false;
      if (filterStatus && event.status !== filterStatus) return false;
      if (filterCollaborator && !matchesCollaboratorFilter(event, filterCollaborator)) return false;
      return true;
    });
  };

  const filteredEvents = getFilteredEvents();

  const resetFilters = () => {
    setFilterType('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterCollaborator('');
  };

  const handleDownloadAgenda = () => {
    if (filteredEvents.length === 0) {
      showWarning(
        'Sem dados para exportar',
        'Ajuste os filtros ou crie um evento antes de exportar.',
      );
      return;
    }

    const header = [
      'Título',
      'Início',
      'Fim',
      'Tipo',
      'Status',
      'Prioridade',
      'Local',
      'Responsável',
      'Participantes',
    ];

    const rows = filteredEvents.map((event) => [
      event.title,
      event.start.toISOString(),
      event.end.toISOString(),
      event.type,
      event.status,
      event.priority,
      event.location || '',
      event.collaborator || event.responsavel || '',
      event.attendees?.join(' | ') || '',
    ]);

    const csvContent = [header, ...rows].map((row) => row.map(toCsvCell).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    showSuccess(
      'Exportação concluída',
      `${filteredEvents.length} evento(s) exportado(s) com sucesso.`,
    );
  };

  const handleOpenAgendaSettings = () => {
    setSettingsShowStatsPanel(showStatsPanel);
    setSettingsOpenFiltersByDefault(
      readBooleanPreference(AGENDA_PREFERENCES_KEYS.openFiltersByDefault, false),
    );
    setShowAgendaSettings(true);
  };

  const handleSaveAgendaSettings = () => {
    setShowStatsPanel(settingsShowStatsPanel);
    setShowFilters(settingsOpenFiltersByDefault);

    writeBooleanPreference(AGENDA_PREFERENCES_KEYS.showStatsPanel, settingsShowStatsPanel);
    writeBooleanPreference(
      AGENDA_PREFERENCES_KEYS.openFiltersByDefault,
      settingsOpenFiltersByDefault,
    );

    setShowAgendaSettings(false);
    showSuccess('Configurações salvas', 'Preferências da agenda atualizadas com sucesso.');
  };

  const activeFilterCount = [filterType, filterPriority, filterStatus, filterCollaborator].filter(
    Boolean,
  ).length;
  const todayEventsCount = filteredEvents.filter((event) => {
    const today = new Date();
    const eventDate = new Date(event.start);
    return eventDate.toDateString() === today.toDateString();
  }).length;
  const confirmedEventsCount = filteredEvents.filter((event) => event.status === 'confirmed').length;
  const pendingEventsCount = filteredEvents.filter((event) => event.status === 'pending').length;
  const highPriorityEventsCount = filteredEvents.filter((event) => event.priority === 'high').length;

  const activeFilterChips = [
    filterType ? { label: 'Tipo', value: filterType } : null,
    filterPriority ? { label: 'Prioridade', value: filterPriority } : null,
    filterStatus ? { label: 'Status', value: filterStatus } : null,
    filterCollaborator ? { label: 'Colaborador', value: filterCollaborator } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const pageDescription =
    activeFilterCount > 0
      ? `Gerencie seus eventos, reuniões e compromissos - ${activeFilterCount} filtro(s) ativo(s)`
      : 'Gerencie seus eventos, reuniões e compromissos';

  const fieldLabelClass = 'mb-2 block text-sm font-medium text-[#385A6A]';
  const fieldSelectClass =
    'h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15';
  const iconButtonClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4E2E7] bg-white text-[#355061] transition-colors hover:bg-[#F6FBFC]';
  const ghostButtonClass =
    'inline-flex h-10 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]';
  const calendarGridClassName = showStatsPanel
    ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]'
    : 'grid gap-4';
  const nowReference = Date.now();
  const upcomingSidebarEvents = [...filteredEvents]
    .filter((event) => new Date(event.end).getTime() >= nowReference)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);
  const formatSidebarEventDate = (event: CalendarEvent) =>
    event.allDay
      ? new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(event.start)
      : new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(event.start);
  const getSidebarOwnerLabel = (event: CalendarEvent) => {
    const candidate = (event.collaborator || event.responsavel || '').trim();
    if (!candidate) return null;
    if (UUID_LIKE_REGEX.test(candidate)) return null;
    return candidate;
  };
  const getSidebarContextMeta = (
    event: CalendarEvent,
  ): { label: string; kind: 'owner' | 'client' | 'location' } | null => {
    const ownerLabel = getSidebarOwnerLabel(event);
    if (ownerLabel) return { label: ownerLabel, kind: 'owner' };

    const clientLabel = event.cliente?.name?.trim();
    if (clientLabel) return { label: clientLabel, kind: 'client' };

    const locationLabel = event.location?.trim();
    if (locationLabel) return { label: locationLabel, kind: 'location' };

    return null;
  };
  const statusLabelMap: Record<CalendarEvent['status'], string> = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    cancelled: 'Cancelado',
  };
  const statusBadgeClassMap: Record<CalendarEvent['status'], string> = {
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              <Calendar className="h-6 w-6 text-[#159A9C]" />
              <span>Agenda</span>
              {activeFilterCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
                  {activeFilterCount} filtro{activeFilterCount === 1 ? '' : 's'} ativo
                  {activeFilterCount === 1 ? '' : 's'}
                </span>
              ) : null}
            </span>
          }
          description={pageDescription}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                  showFilters
                    ? 'border-[#159A9C] bg-[#159A9C] text-white'
                    : 'border-[#CFDDE2] bg-white text-[#355061] hover:bg-[#F6FBFC]'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setEventModalDate(null);
                  setShowEventModal(true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Novo Evento
              </button>
            </div>
          }
        />
        <InlineStats
          stats={[
            { label: 'Total filtrado', value: String(filteredEvents.length), tone: 'neutral' },
            { label: 'Hoje', value: String(todayEventsCount), tone: 'accent' },
            { label: 'Confirmados', value: String(confirmedEventsCount), tone: 'accent' },
            { label: 'Pendentes', value: String(pendingEventsCount), tone: 'warning' },
            { label: 'Alta prioridade', value: String(highPriorityEventsCount), tone: 'warning' },
          ]}
        />
      </SectionCard>
      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigateDate('prev')} className={iconButtonClass}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => navigateDate('next')} className={iconButtonClass}>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={goToToday} className={ghostButtonClass}>
                  Hoje
                </button>
              </div>
              <div className="min-w-0 text-sm font-semibold text-[#17374B] sm:text-base lg:text-lg">
                {getViewTitle()}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-lg border border-[#D7E5EA] bg-white">
                <button
                  type="button"
                  onClick={() => setViewType('month')}
                  className={`inline-flex h-10 items-center gap-1.5 px-3 text-sm font-medium transition-colors ${
                    view.type === 'month'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#62808E] hover:bg-[#F5FAFB]'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('week')}
                  className={`inline-flex h-10 items-center gap-1.5 border-l border-[#E2EDF1] px-3 text-sm font-medium transition-colors ${
                    view.type === 'week'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#62808E] hover:bg-[#F5FAFB]'
                  }`}
                >
                  <Rows className="h-4 w-4" />
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('day')}
                  className={`inline-flex h-10 items-center gap-1.5 border-l border-[#E2EDF1] px-3 text-sm font-medium transition-colors ${
                    view.type === 'day'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#62808E] hover:bg-[#F5FAFB]'
                  }`}
                >
                  <Square className="h-4 w-4" />
                  Dia
                </button>
              </div>
              <button
                type="button"
                onClick={handleDownloadAgenda}
                title="Exportar agenda"
                className={ghostButtonClass}
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button
                type="button"
                onClick={handleOpenAgendaSettings}
                title="Configurações da agenda"
                className={ghostButtonClass}
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>
            </div>
          </div>
          {showFilters ? (
            <div className="rounded-xl border border-[#E3EDF1] bg-[#FBFDFE] p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className={fieldLabelClass}>Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={fieldSelectClass}
                  >
                    <option value="">Todos</option>
                    <option value="meeting">Reunião</option>
                    <option value="call">Ligação</option>
                    <option value="task">Tarefa</option>
                    <option value="event">Evento</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass}>Prioridade</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className={fieldSelectClass}
                  >
                    <option value="">Todas</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={fieldSelectClass}
                  >
                    <option value="">Todos</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="pending">Pendente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className={`${fieldLabelClass} inline-flex items-center gap-1.5`}>
                    <Users className="h-4 w-4 text-[#6A8795]" />
                    Responsável/Participante
                  </label>
                  <select
                    value={filterCollaborator}
                    onChange={(e) => setFilterCollaborator(e.target.value)}
                    className={fieldSelectClass}
                  >
                    <option value="">Todos</option>
                    {getCollaborators().map((collaborator) => (
                      <option key={collaborator.value} value={collaborator.value}>
                        {collaborator.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`${ghostButtonClass} w-full justify-center`}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {activeFilterChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-[#E5EEF2] pt-1">
              {activeFilterChips.map((chip) => (
                <span
                  key={`${chip.label}-${chip.value}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[#D7E5EA] bg-white px-2.5 py-1 text-xs font-medium text-[#56707F]"
                >
                  <span className="text-[#7B95A2]">{chip.label}:</span>
                  <span className="text-[#1D3B4D]">{chip.value}</span>
                </span>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-full border border-[#D7E5EA] bg-white px-2.5 py-1 text-xs font-semibold text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            </div>
          ) : null}
        </div>
      </FiltersBar>
      <div className={calendarGridClassName}>
        <Card className="overflow-hidden p-0">
          {filteredEvents.length === 0 && activeFilterCount > 0 ? (
            <div className="border-b border-[#E5EEF2] bg-[#FBFDFE] px-4 py-3 text-sm text-[#607B89]">
              Nenhum evento encontrado com os filtros atuais. Ajuste os filtros para ampliar os resultados.
            </div>
          ) : null}
          {view.type === 'month' && (
            <MonthView
              date={view.date}
              events={filteredEvents}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onDragStart={startDrag}
              onDragEnd={endDrag}
              onDrop={handleDrop}
              draggedEvent={draggedEvent?.eventId || null}
              dropTarget={dropTarget}
            />
          )}
          {view.type === 'week' && (
            <WeekView
              date={view.date}
              events={filteredEvents}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onDragStart={startDrag}
              onDragEnd={endDrag}
              onDrop={handleDrop}
              draggedEvent={draggedEvent?.eventId || null}
              dropTarget={dropTarget}
              daysToShow={7}
            />
          )}
          {view.type === 'day' && (
            <WeekView
              date={view.date}
              events={filteredEvents}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onDragStart={startDrag}
              onDragEnd={endDrag}
              onDrop={handleDrop}
              draggedEvent={draggedEvent?.eventId || null}
              dropTarget={dropTarget}
              daysToShow={1}
            />
          )}
        </Card>
        {showStatsPanel ? (
          <SectionCard className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#19384C]">Próximos eventos</h3>
              <button
                type="button"
                onClick={() => setShowStatsPanel(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D7E5EA] bg-white text-[#6A8795] transition-colors hover:bg-[#F6FBFC]"
                title="Ocultar painel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border border-[#E5EEF2] rounded-xl bg-[#FBFDFE] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#607B89]">Lista filtrada</span>
                <span className="text-xs font-medium text-[#6A8795]">
                  {upcomingSidebarEvents.length} em foco
                </span>
              </div>
              {upcomingSidebarEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingSidebarEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handleEventClick(event)}
                      className="w-full rounded-xl border border-[#E1EBEF] bg-white px-3 py-2 text-left transition-colors hover:border-[#CDE6DF] hover:bg-[#F8FCFB]"
                    >
                      {(() => {
                        const contextMeta = getSidebarContextMeta(event);

                        return (
                          <>
                            <div className="truncate text-sm font-semibold text-[#19384C]">
                              {event.title}
                            </div>
                            <div className="mt-0.5 text-xs text-[#607B89]">
                              {formatSidebarEventDate(event)}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClassMap[event.status]}`}
                              >
                                {statusLabelMap[event.status]}
                              </span>
                              {contextMeta && (
                                <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-[#607B89]">
                                  {contextMeta.kind === 'owner' ? (
                                    <User className="h-3 w-3 shrink-0 text-[#6A8795]" />
                                  ) : contextMeta.kind === 'client' ? (
                                    <Building2 className="h-3 w-3 shrink-0 text-[#6A8795]" />
                                  ) : (
                                    <MapPin className="h-3 w-3 shrink-0 text-[#6A8795]" />
                                  )}
                                  <span className="truncate">
                                    {contextMeta.kind === 'client'
                                      ? `Cliente: ${contextMeta.label}`
                                      : contextMeta.kind === 'location'
                                        ? `Local: ${contextMeta.label}`
                                        : contextMeta.label}
                                  </span>
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D7E5EA] bg-white px-3 py-4 text-sm text-[#607B89]">
                  Nenhum próximo evento com os filtros atuais.
                </div>
              )}
            </div>

          </SectionCard>
        ) : null}
      </div>
      {showAgendaSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072433]/55 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]">
            <div className="border-b border-[#E5EEF2] px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#19384C]">Configurações da agenda</h3>
                <button
                  type="button"
                  onClick={() => setShowAgendaSettings(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6A8795] transition-colors hover:bg-[#F3F8FA]"
                  aria-label="Fechar configurações da agenda"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3 px-6 py-5">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E3EDF1] bg-[#FBFDFE] px-3 py-2.5">
                <span className="text-sm font-medium text-[#355061]">Exibir painel de próximos eventos</span>
                <input
                  type="checkbox"
                  checked={settingsShowStatsPanel}
                  onChange={(e) => setSettingsShowStatsPanel(e.target.checked)}
                  className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E3EDF1] bg-[#FBFDFE] px-3 py-2.5">
                <span className="text-sm font-medium text-[#355061]">Abrir filtros por padrão</span>
                <input
                  type="checkbox"
                  checked={settingsOpenFiltersByDefault}
                  onChange={(e) => setSettingsOpenFiltersByDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#E5EEF2] bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setShowAgendaSettings(false)}
                className="inline-flex h-10 items-center rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAgendaSettings}
                className="inline-flex h-10 items-center rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      <CreateEventModal
        isOpen={showEventModal}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        selectedDate={eventModalDate}
      />
      <EventDetailsModal
        isOpen={showEventDetailsModal}
        event={selectedEvent}
        onClose={handleCloseEventDetailsModal}
        canRespond={!!selectedEvent && isEventAttendee(selectedEvent) && selectedEvent.status !== 'cancelled'}
        onRespond={handleInviteResponse}
        isResponding={isRespondingToInvite}
      />
    </div>
  );
};

export default AgendaPage;
