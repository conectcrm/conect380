import React, { useState, useEffect } from 'react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { MonthView } from '../../components/calendar/MonthView';
import { WeekView } from '../../components/calendar/WeekView';
import { CreateEventModal } from '../../components/calendar/CreateEventModal';
import { useCalendarEvents, useCalendarView, useCalendarDragDrop } from '../../hooks/useCalendar';
import { useNotifications } from '../../contexts/NotificationContext';
import { CalendarEvent } from '../../types/calendar';
import { getMonthName, formatDate } from '../../utils/calendarUtils';
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
} from 'lucide-react';

export const AgendaPage: React.FC = () => {
  // Hook de notificações
  const { addNotification, showSuccess, showWarning } = useNotifications();

  const {
    events,
    selectedEvent,
    setSelectedEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    duplicateEvent,
    getCollaborators,
  } = useCalendarEvents();

  const { view, navigateDate, setViewType, goToToday, goToDate } = useCalendarView();

  const { draggedEvent, dropTarget, startDrag, endDrag, cancelDrag, setDrop, isDragging } =
    useCalendarDragDrop(events, moveEvent);

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalDate, setEventModalDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
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
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDateClick = (date: Date) => {
    setEventModalDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleTimeSlotClick = (dateTime: Date) => {
    setEventModalDate(dateTime);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    // Converter dados do CreateEventModal para o formato CalendarEvent
    const calendarEventData: Omit<CalendarEvent, 'id'> = {
      title: eventData.title,
      description: eventData.description || '',
      start: eventData.start,
      end: eventData.end,
      location: eventData.location || '',
      allDay: eventData.allDay || false,
      type: 'event',
      priority: eventData.priority || 'medium',
      status: eventData.status || 'pending',
      collaborator: '',
      category: eventData.category || 'meeting',
      color: eventData.color || '#159A9C',
      attendees: eventData.attendees || [],
      recurring: eventData.isRecurring || false,
      responsavel: eventData.responsavel || '',
    };

    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, calendarEventData);
        // Toast será exibido pelo CreateEventModal
      } else {
        await addEvent(calendarEventData);
        // Toast será exibido pelo CreateEventModal

        // Verificar conflitos de horário para novos eventos
        const conflicts = checkEventConflicts(eventData, events);
        if (conflicts.length > 0) {
          showWarning(
            '⚠️ Conflito de Horário',
            `Este evento conflita com ${conflicts.length} outro(s) evento(s)`,
          );
        }
      }

      // Fechar modal após sucesso
      setShowEventModal(false);
      setSelectedEvent(null);
      setEventModalDate(null);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      addNotification({
        title: '❌ Erro na Agenda',
        message: 'Não foi possível salvar o evento. Tente novamente.',
        type: 'error',
        priority: 'high',
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      deleteEvent(eventId);
    } catch (error) {
      addNotification({
        title: '❌ Erro ao Excluir',
        message: 'Não foi possível excluir o evento. Tente novamente.',
        type: 'error',
        priority: 'high',
      });
    }
  };

  const handleDuplicateEvent = (eventId: string) => {
    try {
      duplicateEvent(eventId);
      // Apenas toast para feedback imediato
      showSuccess('Evento Duplicado', 'Uma cópia do evento foi criada com sucesso');
    } catch (error) {
      addNotification({
        title: '❌ Erro ao Duplicar',
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
      if (upcomingEvents15min.length > 0) {
        const eventCount = upcomingEvents15min.length;
        const firstEvent = upcomingEvents15min[0];

        if (eventCount === 1) {
          addNotification({
            title: '⏰ Evento em 15 minutos!',
            message: `"${firstEvent.title}" começará em breve${firstEvent.location ? ` - ${firstEvent.location}` : ''}`,
            type: 'warning',
            priority: 'high',
            entityType: 'agenda',
            entityId: `urgent-${Date.now()}`,
            autoClose: false,
          });
        } else {
          addNotification({
            title: `⏰ ${eventCount} eventos em 15 minutos!`,
            message: `Próximos eventos: ${upcomingEvents15min.map((e) => e.title).join(', ')}`,
            type: 'warning',
            priority: 'high',
            entityType: 'agenda',
            entityId: `urgent-batch-${Date.now()}`,
            autoClose: false,
          });
        }
      }

      // Criar uma única notificação para eventos em 1 hora
      if (upcomingEvents1hour.length > 0) {
        const eventCount = upcomingEvents1hour.length;
        const firstEvent = upcomingEvents1hour[0];

        if (eventCount === 1) {
          addNotification({
            title: '🔔 Evento em 1 hora',
            message: `"${firstEvent.title}" está programado para ${new Date(firstEvent.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            type: 'info',
            priority: 'medium',
            entityType: 'agenda',
            entityId: `reminder-${Date.now()}`,
          });
        } else {
          addNotification({
            title: `🔔 ${eventCount} eventos em 1 hora`,
            message: `Próximos eventos: ${upcomingEvents1hour.map((e) => e.title).join(', ')}`,
            type: 'info',
            priority: 'medium',
            entityType: 'agenda',
            entityId: `reminder-batch-${Date.now()}`,
          });
        }
      }
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
    const summaryId = `agenda-summary-${today.toDateString()}`;

    // Verificar se já foi mostrada hoje
    const summaryStatus = sessionStorage.getItem(summaryId);

    if (!summaryStatus) {
      sessionStorage.setItem(summaryId, 'scheduled');

      const timeoutId = window.setTimeout(() => {
        addNotification({
          title: '📅 Agenda Carregada',
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
      if (filterCollaborator && event.collaborator !== filterCollaborator) return false;
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Padronizado */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Calendar className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Agenda
                </h1>
                <p className="mt-2 text-gray-600">Gerencie seus eventos, reuniões e compromissos</p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`
                  px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 text-sm font-medium
                  ${showFilters
                      ? 'bg-[#159A9C] text-white border-[#159A9C]'
                      : 'bg-white text-[#002333] border-[#B4BEC9] hover:bg-gray-50'
                    }
                `}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </button>

                <button
                  onClick={() => setShowEventModal(true)}
                  className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Evento</span>
                </button>
              </div>
            </div>

            {/* Filtros */}
            {showFilters && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-[#DEEFE7]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full p-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white text-[#002333]"
                    >
                      <option value="" className="text-[#002333]">
                        Todos
                      </option>
                      <option value="meeting" className="text-[#002333]">
                        🤝 Reunião
                      </option>
                      <option value="call" className="text-[#002333]">
                        📞 Ligação
                      </option>
                      <option value="task" className="text-[#002333]">
                        ✅ Tarefa
                      </option>
                      <option value="event" className="text-[#002333]">
                        📅 Evento
                      </option>
                      <option value="follow-up" className="text-[#002333]">
                        📧 Follow-up
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full p-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white text-[#002333]"
                    >
                      <option value="" className="text-[#002333]">
                        Todas
                      </option>
                      <option value="high" className="text-[#002333]">
                        Alta
                      </option>
                      <option value="medium" className="text-[#002333]">
                        Média
                      </option>
                      <option value="low" className="text-[#002333]">
                        Baixa
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full p-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white text-[#002333]"
                    >
                      <option value="" className="text-[#002333]">
                        Todos
                      </option>
                      <option value="confirmed" className="text-[#002333]">
                        Confirmado
                      </option>
                      <option value="pending" className="text-[#002333]">
                        Pendente
                      </option>
                      <option value="cancelled" className="text-[#002333]">
                        Cancelado
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Users className="w-4 h-4 inline mr-1" />
                      Colaborador
                    </label>
                    <select
                      value={filterCollaborator}
                      onChange={(e) => setFilterCollaborator(e.target.value)}
                      className="w-full p-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white text-[#002333]"
                    >
                      <option value="" className="text-[#002333]">
                        Todos
                      </option>
                      {getCollaborators().map((collaborator) => (
                        <option
                          key={collaborator.value}
                          value={collaborator.value}
                          className="text-[#002333]"
                        >
                          {collaborator.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="w-full p-2 text-[#002333] hover:text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Limpar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navegação e Controles */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#002333]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => navigateDate('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#002333]"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goToToday}
                    className="px-3 py-2 text-sm font-medium text-[#002333] hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Hoje
                  </button>
                </div>

                <h2 className="text-xl font-semibold text-[#002333]">{getViewTitle()}</h2>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-[#B4BEC9] rounded-lg">
                  <button
                    onClick={() => setViewType('month')}
                    className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors flex items-center space-x-2 ${view.type === 'month'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#002333] hover:bg-gray-50'
                      }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>Mês</span>
                  </button>

                  <button
                    onClick={() => setViewType('week')}
                    className={`px-3 py-2 text-sm font-medium border-l border-[#B4BEC9] transition-colors flex items-center space-x-2 ${view.type === 'week'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#002333] hover:bg-gray-50'
                      }`}
                  >
                    <Rows className="w-4 h-4" />
                    <span>Semana</span>
                  </button>

                  <button
                    onClick={() => setViewType('day')}
                    className={`px-3 py-2 text-sm font-medium rounded-r-lg border-l border-[#B4BEC9] transition-colors flex items-center space-x-2 ${view.type === 'day'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#002333] hover:bg-gray-50'
                      }`}
                  >
                    <Square className="w-4 h-4" />
                    <span>Dia</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-[#002333] hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>

                  <button className="p-2 text-[#002333] hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 flex overflow-hidden">
            {/* Calendário */}
            <div className="flex-1 overflow-auto">
              <div className="bg-white rounded-lg shadow-sm min-h-full">
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
                  />
                )}
              </div>
            </div>

            {/* Sidebar de Estatísticas */}
            <div className="w-80 border-l bg-white p-6">
              <h3 className="text-lg font-semibold text-[#002333] mb-4">📊 Estatísticas</h3>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-[#DEEFE7]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#002333]">Eventos Hoje</span>
                    <span className="text-2xl font-bold text-[#159A9C]">
                      {
                        filteredEvents.filter((e) => {
                          const today = new Date();
                          const eventDate = new Date(e.start);
                          return eventDate.toDateString() === today.toDateString();
                        }).length
                      }
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-[#DEEFE7]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#002333]">Confirmados</span>
                    <span className="text-2xl font-bold text-[#159A9C]">
                      {filteredEvents.filter((e) => e.status === 'confirmed').length}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-[#DEEFE7]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#002333]">Pendentes</span>
                    <span className="text-2xl font-bold text-[#159A9C]">
                      {filteredEvents.filter((e) => e.status === 'pending').length}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-[#DEEFE7]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#002333]">Alta Prioridade</span>
                    <span className="text-2xl font-bold text-[#159A9C]">
                      {filteredEvents.filter((e) => e.priority === 'high').length}
                    </span>
                  </div>
                </div>

                {filterCollaborator && (
                  <div className="p-4 bg-white rounded-lg border border-[#DEEFE7]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#002333]">
                        {getCollaborators().find((c) => c.value === filterCollaborator)?.label ||
                          filterCollaborator}
                      </span>
                      <span className="text-2xl font-bold text-[#159A9C]">
                        {filteredEvents.filter((e) => e.collaborator === filterCollaborator).length}
                      </span>
                    </div>
                    <div className="text-xs text-[#002333] mt-1">eventos atribuídos</div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-md font-semibold text-[#002333] mb-3">🎯 Ações Rápidas</h4>

                <div className="space-y-2">
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="w-full p-3 text-left bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Novo Evento</span>
                    </div>
                  </button>

                  <button
                    onClick={goToToday}
                    className="w-full p-3 text-left bg-white text-[#002333] border border-[#DEEFE7] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Ir para Hoje</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Evento */}
      <CreateEventModal
        isOpen={showEventModal}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        selectedDate={eventModalDate}
      />
    </div>
  );
};

export default AgendaPage;
