import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarView, DragData } from '../types/calendar';
import { eventosService } from '../services/eventosService';
import { useAuth } from '../contexts/AuthContext';

// Hook para gerenciar eventos da agenda
export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Carregar eventos do banco de dados
  const loadEvents = useCallback(async (filtros?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    type?: string;
  }) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const eventos = await eventosService.listarEventos(filtros);
      setEvents(eventos);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError('Não foi possível carregar os eventos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar eventos iniciais
  useEffect(() => {
    if (user?.id) {
      loadEvents();
    }
  }, [user?.id, loadEvents]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Adicionar evento (criar no banco)
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newEvent = await eventosService.criarEvento(event, user.id);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      setError('Não foi possível criar o evento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Atualizar evento
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedEvent = await eventosService.atualizarEvento(eventId, updates);
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? updatedEvent : event
        )
      );
      
      // Atualizar selectedEvent se for o mesmo
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(updatedEvent);
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      setError('Não foi possível atualizar o evento');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  // Excluir evento
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await eventosService.excluirEvento(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      setError('Não foi possível excluir o evento');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  // Mover evento (drag & drop)
  const moveEvent = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    await updateEvent(eventId, { start: newStart, end: newEnd });
  }, [updateEvent]);

  // Duplicar evento
  const duplicateEvent = useCallback(async (eventId: string) => {
    const eventToDuplicate = events.find(e => e.id === eventId);
    if (eventToDuplicate && user?.id) {
      const duplicated = {
        ...eventToDuplicate,
        title: `${eventToDuplicate.title} (Cópia)`,
        start: new Date(eventToDuplicate.start.getTime() + 24 * 60 * 60 * 1000), // +1 dia
        end: new Date(eventToDuplicate.end.getTime() + 24 * 60 * 60 * 1000)
      };
      
      // Remove o id para criar um novo
      const { id, ...eventData } = duplicated;
      return await addEvent(eventData);
    }
    return null;
  }, [events, addEvent, user?.id]);

  // Verificar conflitos
  const checkConflicts = useCallback(async (start: Date, end: Date, excludeEventId?: string) => {
    try {
      return await eventosService.verificarConflitos(start, end, excludeEventId);
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      return [];
    }
  }, []);

  // Filtrar eventos por período
  const filterByPeriod = useCallback(async (startDate: Date, endDate: Date) => {
    await loadEvents({ startDate, endDate });
  }, [loadEvents]);

  // Filtrar eventos por status
  const filterByStatus = useCallback(async (status: string) => {
    await loadEvents({ status });
  }, [loadEvents]);

  // Filtrar eventos por tipo
  const filterByType = useCallback(async (type: string) => {
    await loadEvents({ type });
  }, [loadEvents]);

  // Função para obter lista única de colaboradores
  const getCollaborators = useCallback(() => {
    const collaborators = events
      .map(event => event.collaborator)
      .filter((collaborator): collaborator is string => !!collaborator)
      .filter((collaborator, index, array) => array.indexOf(collaborator) === index)
      .sort();
    
    return collaborators.map(name => ({
      value: name,
      label: name
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
    getCollaborators,
    checkConflicts,
    filterByPeriod,
    filterByStatus,
    filterByType,
    loadEvents,
    loading,
    error
  };
};

// Hook para gerenciar visualização da agenda
export const useCalendarView = () => {
  const [view, setView] = useState<CalendarView>({
    type: 'month',
    date: new Date()
  });

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setView(prev => {
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
    setView(prev => ({ ...prev, type }));
  }, []);

  const goToToday = useCallback(() => {
    setView(prev => ({ ...prev, date: new Date() }));
  }, []);

  const goToDate = useCallback((date: Date) => {
    setView(prev => ({ ...prev, date }));
  }, []);

  return {
    view,
    navigateDate,
    setViewType,
    goToToday,
    goToDate
  };
};

// Hook para drag & drop
export const useCalendarDragDrop = (
  events: CalendarEvent[],
  onMoveEvent: (eventId: string, newStart: Date, newEnd: Date) => void
) => {
  const [draggedEvent, setDraggedEvent] = useState<DragData | null>(null);
  const [dropTarget, setDropTarget] = useState<Date | null>(null);

  const startDrag = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setDraggedEvent({
        eventId,
        originalDate: event.start,
        originalStartTime: event.start,
        originalEndTime: event.end
      });
    }
  }, [events]);

  const endDrag = useCallback(() => {
    if (draggedEvent && dropTarget) {
      const event = events.find(e => e.id === draggedEvent.eventId);
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

  const setDrop = useCallback((date: Date) => {
    setDropTarget(date);
    // Chama endDrag automaticamente quando um drop target é definido
    setTimeout(() => {
      if (draggedEvent) {
        endDrag();
      }
    }, 0);
  }, [draggedEvent, endDrag]);

  return {
    draggedEvent,
    dropTarget,
    startDrag,
    endDrag,
    cancelDrag,
    setDrop,
    isDragging: !!draggedEvent
  };
};
