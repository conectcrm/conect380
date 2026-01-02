import { CalendarEvent, CalendarDay } from '../types/calendar';

// Utilitários para formatação de datas
export const formatDate = (
  date: Date,
  format: 'short' | 'long' | 'time' | 'datetime' = 'short',
): string => {
  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case 'short':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      break;
    case 'long':
      options.weekday = 'long';
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'datetime':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
  }

  return date.toLocaleDateString('pt-BR', options);
};

// Gerar dias do mês para visualização
export const generateCalendarDays = (date: Date, events: CalendarEvent[]): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1);
  // Último dia do mês
  const lastDay = new Date(year, month + 1, 0);

  // Primeiro dia da semana (domingo = 0)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // Último dia da semana
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  const days: CalendarDay[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayEvents = events.filter((event) => isSameDay(event.start, currentDate));

    days.push({
      date: new Date(currentDate),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: isSameDay(currentDate, today),
      isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      events: dayEvents,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

// Verificar se duas datas são do mesmo dia
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Gerar semana atual
export const generateWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });
};

// Gerar horários do dia (08:00 - 20:00)
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

// Verificar se um evento está em conflito com outro
export const hasEventConflict = (
  newEvent: { start: Date; end: Date },
  existingEvents: CalendarEvent[],
  excludeEventId?: string,
): boolean => {
  return existingEvents.some((event) => {
    if (excludeEventId && event.id === excludeEventId) return false;

    return (
      (newEvent.start >= event.start && newEvent.start < event.end) ||
      (newEvent.end > event.start && newEvent.end <= event.end) ||
      (newEvent.start <= event.start && newEvent.end >= event.end)
    );
  });
};

// Calcular posição do evento no grid de tempo
export const calculateEventPosition = (
  event: CalendarEvent,
  containerHeight: number,
  startHour: number = 8,
  endHour: number = 20,
): { top: number; height: number } => {
  const totalMinutes = (endHour - startHour) * 60;
  const minutesPerPixel = containerHeight / totalMinutes;

  const eventStartMinutes = (event.start.getHours() - startHour) * 60 + event.start.getMinutes();
  const eventDurationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);

  return {
    top: Math.max(0, eventStartMinutes * minutesPerPixel),
    height: Math.max(20, eventDurationMinutes * minutesPerPixel),
  };
};

// Agrupar eventos por coluna para evitar sobreposição
export const organizeEventColumns = (events: CalendarEvent[]): CalendarEvent[][] => {
  if (events.length === 0) return [];

  // Ordenar eventos por horário de início
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  const columns: CalendarEvent[][] = [];

  sortedEvents.forEach((event) => {
    // Encontrar primeira coluna onde o evento cabe
    let columnIndex = columns.findIndex((column) => {
      const lastEventInColumn = column[column.length - 1];
      return lastEventInColumn.end <= event.start;
    });

    // Se não encontrou coluna, criar nova
    if (columnIndex === -1) {
      columns.push([event]);
    } else {
      columns[columnIndex].push(event);
    }
  });

  return columns;
};

// Obter nome do mês
export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

// Obter nome do dia da semana
export const getDayName = (date: Date, format: 'short' | 'long' = 'long'): string => {
  return date.toLocaleDateString('pt-BR', {
    weekday: format === 'short' ? 'short' : 'long',
  });
};

// Verificar se uma data está dentro de um range
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

// Criar nova data com horário específico
export const setTimeToDate = (date: Date, hours: number, minutes: number = 0): Date => {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

// Arredondar horário para o slot mais próximo (15 min)
export const roundToNearestSlot = (date: Date, slotMinutes: number = 15): Date => {
  const ms = slotMinutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
};
