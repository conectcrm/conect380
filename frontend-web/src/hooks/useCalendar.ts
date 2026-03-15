import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarView, DragData } from '../types/calendar';
import { agendaEventosService } from '../services/agendaEventosService';
import { useAuth } from '../contexts/AuthContext';

// Hook para gerenciar eventos da agenda
export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Carregar eventos do banco de dados
  const loadEvents = useCallback(
    async (filtros?: {
      startDate?: Date;
      endDate?: Date;
      status?: CalendarEvent['status'];
      type?: string;
    }) => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);
        let eventos = await agendaEventosService.listarEventos({
          startDate: filtros?.startDate,
          endDate: filtros?.endDate,
          status: filtros?.status,
        });

        if (filtros?.type) {
          eventos = eventos.filter((event) => event.type === filtros.type);
        }

        setEvents(eventos);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        setError('Não foi possível carregar os eventos');
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  // Carregar eventos iniciais
  useEffect(() => {
    if (user?.id) {
      loadEvents();
    }
  }, [user?.id, loadEvents]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Adicionar evento (criar no banco)
  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, 'id'>) => {
      if (!user?.id) {
        setError('Usuário não autenticado');
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const newEvent = await agendaEventosService.criarEvento(event);
        const mergedEvent: CalendarEvent = {
          ...newEvent,
          type: event.type ?? newEvent.type,
          priority: event.priority ?? newEvent.priority,
          status: event.status ?? newEvent.status,
          attendees: event.attendees ?? newEvent.attendees,
          cliente: event.cliente ?? newEvent.cliente,
          allDay: event.allDay ?? newEvent.allDay,
          location: event.location ?? newEvent.location,
          color: event.color ?? newEvent.color,
          collaborator: event.collaborator ?? newEvent.collaborator,
          responsavel: event.responsavel ?? newEvent.responsavel,
          responsavelId: event.responsavelId ?? newEvent.responsavelId,
          category: event.category ?? newEvent.category,
          recurring: event.recurring ?? newEvent.recurring,
          isRecurring: event.isRecurring ?? newEvent.isRecurring,
          recurringPattern: event.recurringPattern ?? newEvent.recurringPattern,
          notes: event.notes ?? newEvent.notes,
        };

        setEvents((prev) => [...prev, mergedEvent]);
        return mergedEvent;
      } catch (error) {
        console.error('Erro ao criar evento:', error);
        setError('Não foi possível criar o evento');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  // Atualizar evento
  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>) => {
      try {
        setLoading(true);
        setError(null);

        const updatedEvent = await agendaEventosService.atualizarEvento(eventId, updates);
        const mergedUpdatedEvent: CalendarEvent = {
          ...updatedEvent,
          type: updates.type ?? updatedEvent.type,
          priority: updates.priority ?? updatedEvent.priority,
          status: updates.status ?? updatedEvent.status,
          attendees: updates.attendees ?? updatedEvent.attendees,
          cliente: updates.cliente ?? updatedEvent.cliente,
          allDay: updates.allDay ?? updatedEvent.allDay,
          location: updates.location ?? updatedEvent.location,
          color: updates.color ?? updatedEvent.color,
          collaborator: updates.collaborator ?? updatedEvent.collaborator,
          responsavel: updates.responsavel ?? updatedEvent.responsavel,
          responsavelId: updates.responsavelId ?? updatedEvent.responsavelId,
          category: updates.category ?? updatedEvent.category,
          recurring: updates.recurring ?? updatedEvent.recurring,
          isRecurring: updates.isRecurring ?? updatedEvent.isRecurring,
          recurringPattern: updates.recurringPattern ?? updatedEvent.recurringPattern,
          notes: updates.notes ?? updatedEvent.notes,
        };

        setEvents((prev) =>
          prev.map((event) => (event.id === eventId ? mergedUpdatedEvent : event)),
        );

        if (selectedEvent?.id === eventId) {
          setSelectedEvent(mergedUpdatedEvent);
        }

        return mergedUpdatedEvent;
      } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        setError('Não foi possível atualizar o evento');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedEvent],
  );

  // Excluir evento
  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        setLoading(true);
        setError(null);

        await agendaEventosService.excluirEvento(eventId);
        setEvents((prev) => prev.filter((event) => event.id !== eventId));

        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
        }

        return true;
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        setError('Não foi possível excluir o evento');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedEvent],
  );

  // Atualizar somente metadados locais (sem persistência no backend)
  const updateEventLocalMeta = useCallback(
    (eventId: string, updates: Partial<CalendarEvent>) => {
      agendaEventosService.atualizarMetadadosLocaisEvento(eventId, updates);

      setEvents((prev) =>
        prev.map((event) => (event.id === eventId ? ({ ...event, ...updates } as CalendarEvent) : event)),
      );

      if (selectedEvent?.id === eventId) {
        setSelectedEvent((prev) => (prev ? ({ ...prev, ...updates } as CalendarEvent) : prev));
      }
    },
    [selectedEvent],
  );

  const respondToInvite = useCallback(
    async (eventId: string, response: Extract<NonNullable<CalendarEvent['myRsvp']>, 'confirmed' | 'declined'>) => {
      try {
        setLoading(true);
        setError(null);

        const updatedEvent = await agendaEventosService.responderConviteEvento(eventId, response);

        setEvents((prev) =>
          prev.map((event) => (event.id === eventId ? ({ ...event, ...updatedEvent } as CalendarEvent) : event)),
        );

        if (selectedEvent?.id === eventId) {
          setSelectedEvent((prev) => (prev ? ({ ...prev, ...updatedEvent } as CalendarEvent) : prev));
        }

        return updatedEvent;
      } catch (error) {
        console.error('Erro ao responder convite:', error);
        setError('Não foi possível responder ao convite');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedEvent],
  );
  // Mover evento (drag & drop)
  const moveEvent = useCallback(
    async (eventId: string, newStart: Date, newEnd: Date) => {
      await updateEvent(eventId, { start: newStart, end: newEnd });
    },
    [updateEvent],
  );

  // Duplicar evento
  const duplicateEvent = useCallback(
    async (eventId: string) => {
      const eventToDuplicate = events.find((e) => e.id === eventId);
      if (eventToDuplicate && user?.id) {
        const duplicated = {
          ...eventToDuplicate,
          title: `${eventToDuplicate.title} (Cópia)`,
          start: new Date(eventToDuplicate.start.getTime() + 24 * 60 * 60 * 1000), // +1 dia
          end: new Date(eventToDuplicate.end.getTime() + 24 * 60 * 60 * 1000),
        };

        // Remove o id para criar um novo
        const { id, ...eventData } = duplicated;
        return await addEvent(eventData);
      }
      return null;
    },
    [events, addEvent, user?.id],
  );

  // Verificar conflitos
  const checkConflicts = useCallback(async () => {
    // Backend atual não expõe verificação de conflito; mantemos stub
    return [] as CalendarEvent[];
  }, []);

  // Filtrar eventos por período
  const filterByPeriod = useCallback(
    async (startDate: Date, endDate: Date) => {
      await loadEvents({ startDate, endDate });
    },
    [loadEvents],
  );

  // Filtrar eventos por status
  const filterByStatus = useCallback(
    async (status: CalendarEvent['status']) => {
      await loadEvents({ status });
    },
    [loadEvents],
  );

  // Filtrar eventos por tipo
  const filterByType = useCallback(
    async (type: string) => {
      await loadEvents({ type });
    },
    [loadEvents],
  );

  // Função para obter lista única de colaboradores
  const getCollaborators = useCallback(() => {
    const collaborators = events
      .flatMap((event) => {
        const values: string[] = [];

        if (event.collaborator) values.push(event.collaborator);
        if (event.responsavel) values.push(event.responsavel);
        if (event.attendees?.length) values.push(...event.attendees);

        return values;
      })
      .filter((value): value is string => !!value)
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return collaborators.map((name) => ({
      value: name,
      label: name,
    }));
  }, [events]);

  return {
    events,
    selectedEvent,
    setSelectedEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    duplicateEvent,
    respondToInvite,
    updateEventLocalMeta,
    getCollaborators,
    checkConflicts,
    filterByPeriod,
    filterByStatus,
    filterByType,
    loadEvents,
    loading,
    error,
  };
};

// Hook para gerenciar visualização da agenda
export const useCalendarView = () => {
  const [view, setView] = useState<CalendarView>({
    type: 'month',
    date: new Date(),
  });

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setView((prev) => {
      const newDate = new Date(prev.date);

      switch (prev.type) {
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
      }

      return { ...prev, date: newDate };
    });
  }, []);

  const setViewType = useCallback((type: CalendarView['type']) => {
    setView((prev) => ({ ...prev, type }));
  }, []);

  const goToToday = useCallback(() => {
    setView((prev) => ({ ...prev, date: new Date() }));
  }, []);

  const goToDate = useCallback((date: Date) => {
    setView((prev) => ({ ...prev, date }));
  }, []);

  return {
    view,
    navigateDate,
    setViewType,
    goToToday,
    goToDate,
  };
};

// Hook para drag & drop
export const useCalendarDragDrop = (
  events: CalendarEvent[],
  onMoveEvent: (eventId: string, newStart: Date, newEnd: Date) => void,
) => {
  const [draggedEvent, setDraggedEvent] = useState<DragData | null>(null);
  const [dropTarget, setDropTarget] = useState<Date | null>(null);

  const startDrag = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setDraggedEvent({
          eventId,
          originalDate: event.start,
          originalStartTime: event.start,
          originalEndTime: event.end,
        });
      }
    },
    [events],
  );

  const endDrag = useCallback(() => {
    if (draggedEvent && dropTarget) {
      const event = events.find((e) => e.id === draggedEvent.eventId);
      if (event) {
        const duration = event.end.getTime() - event.start.getTime();
        const newStart = new Date(dropTarget);

        // Mantém o horário original se for o mesmo dia
        if (dropTarget.toDateString() === event.start.toDateString()) {
          newStart.setHours(event.start.getHours(), event.start.getMinutes());
        } else {
          // Se for dia diferente, mantém o horário
          newStart.setHours(event.start.getHours(), event.start.getMinutes());
        }

        const newEnd = new Date(newStart.getTime() + duration);

        onMoveEvent(draggedEvent.eventId, newStart, newEnd);
      }
    }

    // Reset states
    setDraggedEvent(null);
    setDropTarget(null);
  }, [draggedEvent, dropTarget, events, onMoveEvent]);

  const cancelDrag = useCallback(() => {
    setDraggedEvent(null);
    setDropTarget(null);
  }, []);

  const setDrop = useCallback(
    (date: Date) => {
      setDropTarget(date);
      // Chama endDrag automaticamente quando um drop target é definido
      setTimeout(() => {
        if (draggedEvent) {
          endDrag();
        }
      }, 0);
    },
    [draggedEvent, endDrag],
  );

  return {
    draggedEvent,
    dropTarget,
    startDrag,
    endDrag,
    cancelDrag,
    setDrop,
    isDragging: !!draggedEvent,
  };
};
