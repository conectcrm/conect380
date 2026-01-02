export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'call' | 'task' | 'event' | 'follow-up';
  priority: 'low' | 'medium' | 'high';
  status: 'confirmed' | 'pending' | 'cancelled';
  attendees?: string[];
  location?: string;
  color?: string;
  collaborator?: string; // Colaborador responsável pelo evento
  responsavel?: string; // ID do usuário responsável pelo evento
  category?: string; // Categoria do evento
  cliente?: {
    id: string;
    name: string;
  };
  allDay?: boolean;
  notes?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    until?: Date;
  };
  isRecurring?: boolean;
  recurringPattern?: unknown;
  responsavelId?: string;
  criadoPorId?: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}

export interface DragData {
  eventId: string;
  originalDate: Date;
  originalStartTime: Date;
  originalEndTime: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

export const EVENT_COLORS = {
  meeting: '#3B82F6',
  call: '#10B981',
  task: '#F59E0B',
  event: '#8B5CF6',
  'follow-up': '#EF4444',
} as const;

export const PRIORITY_COLORS = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#EF4444',
} as const;
