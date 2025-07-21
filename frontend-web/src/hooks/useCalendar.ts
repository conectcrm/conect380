import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, CalendarView, DragData } from '../types/calendar';

// Hook para gerenciar eventos da agenda
export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Reunião com Cliente ABC',
      description: 'Discussão sobre nova proposta',
      start: new Date(2025, 6, 22, 10, 0),
      end: new Date(2025, 6, 22, 11, 0),
      type: 'meeting',
      priority: 'high',
      status: 'confirmed',
      location: 'Escritório',
      collaborator: 'João Silva',
      cliente: { id: '1', name: 'Cliente ABC' },
      attendees: ['joao@empresa.com', 'maria@cliente.com']
    },
    {
      id: '2',
      title: 'Follow-up Proposta XYZ',
      start: new Date(2025, 6, 23, 14, 30),
      end: new Date(2025, 6, 23, 15, 0),
      type: 'follow-up',
      priority: 'medium',
      status: 'pending',
      collaborator: 'Maria Santos',
      cliente: { id: '2', name: 'Empresa XYZ' }
    },
    {
      id: '3',
      title: 'Chamada - Negociação Contrato',
      start: new Date(2025, 6, 24, 9, 0),
      end: new Date(2025, 6, 24, 10, 0),
      type: 'call',
      priority: 'high',
      status: 'confirmed',
      collaborator: 'João Silva',
      location: 'Online - Teams'
    },
    {
      id: '4',
      title: 'Preparar Relatório Mensal',
      start: new Date(2025, 6, 25, 16, 0),
      end: new Date(2025, 6, 25, 18, 0),
      type: 'task',
      priority: 'medium',
      status: 'confirmed',
      collaborator: 'Pedro Costa'
    },
    {
      id: '5',
      title: 'Reunião de Vendas',
      start: new Date(2025, 6, 26, 11, 0),
      end: new Date(2025, 6, 26, 12, 0),
      type: 'meeting',
      priority: 'medium',
      status: 'confirmed',
      collaborator: 'Ana Oliveira',
      location: 'Sala de Reuniões'
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
  }, [selectedEvent]);

  const moveEvent = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    updateEvent(eventId, { start: newStart, end: newEnd });
  }, [updateEvent]);

  const duplicateEvent = useCallback((eventId: string) => {
    const eventToDuplicate = events.find(e => e.id === eventId);
    if (eventToDuplicate) {
      const duplicated = {
        ...eventToDuplicate,
        title: `${eventToDuplicate.title} (Cópia)`,
        start: new Date(eventToDuplicate.start.getTime() + 24 * 60 * 60 * 1000), // +1 dia
        end: new Date(eventToDuplicate.end.getTime() + 24 * 60 * 60 * 1000)
      };
      return addEvent(duplicated);
    }
  }, [events, addEvent]);

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
    getCollaborators
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
        newStart.setHours(event.start.getHours(), event.start.getMinutes());
        const newEnd = new Date(newStart.getTime() + duration);
        
        onMoveEvent(draggedEvent.eventId, newStart, newEnd);
      }
    }
    
    setDraggedEvent(null);
    setDropTarget(null);
  }, [draggedEvent, dropTarget, events, onMoveEvent]);

  const cancelDrag = useCallback(() => {
    setDraggedEvent(null);
    setDropTarget(null);
  }, []);

  const setDrop = useCallback((date: Date) => {
    setDropTarget(date);
  }, []);

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
