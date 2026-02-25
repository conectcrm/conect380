import { CalendarEvent } from '../../types/calendar';

type AgendaNotificationType = 'info' | 'warning';
type AgendaNotificationPriority = 'low' | 'medium' | 'high';
type UpcomingWindow = '15m' | '1h';

type AgendaNotificationDraft = {
  id: string;
  title: string;
  message: string;
  type: AgendaNotificationType;
  priority: AgendaNotificationPriority;
  entityType: 'agenda';
  entityId?: string;
  autoClose?: boolean;
};

const sanitizeIdPart = (value: string) => value.replace(/[^a-zA-Z0-9:_-]/g, '_');

const hashString = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const getUpcomingWindowTitle = (window: UpcomingWindow, count: number) => {
  if (window === '15m') {
    return count === 1 ? 'Evento em 15 minutos' : `${count} eventos em 15 minutos`;
  }
  return count === 1 ? 'Evento em 1 hora' : `${count} eventos em 1 hora`;
};

export const getAgendaSummaryNotificationId = (date: Date) =>
  `agenda:summary:${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const getAgendaEventNotificationId = (
  kind:
    | 'created'
    | 'updated'
    | 'cancelled'
    | 'deleted'
    | 'participants'
    | 'reminder-configured',
  eventId: string,
) => `agenda:event:${kind}:${sanitizeIdPart(eventId)}`;

export const getAgendaReminderId = (eventId: string) =>
  `agenda:reminder:${sanitizeIdPart(eventId)}`;

export const buildAgendaUpcomingNotification = (
  events: CalendarEvent[],
  window: UpcomingWindow,
): AgendaNotificationDraft | null => {
  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const count = sortedEvents.length;
  const firstEvent = sortedEvents[0];

  if (count === 1) {
    return {
      id: `agenda:upcoming:${window}:${sanitizeIdPart(firstEvent.id)}:${firstEvent.start.getTime()}`,
      title: getUpcomingWindowTitle(window, count),
      message:
        window === '15m'
          ? `"${firstEvent.title}" comeca em breve${firstEvent.location ? ` - ${firstEvent.location}` : ''}`
          : `"${firstEvent.title}" esta programado para ${formatTime(new Date(firstEvent.start))}`,
      type: window === '15m' ? 'warning' : 'info',
      priority: window === '15m' ? 'high' : 'medium',
      entityType: 'agenda',
      entityId: firstEvent.id,
      autoClose: window === '15m' ? false : undefined,
    };
  }

  const batchSignature = sortedEvents
    .map((event) => `${event.id}:${event.start.getTime()}`)
    .join('|');

  return {
    id: `agenda:upcoming:${window}:batch:${hashString(batchSignature)}`,
    title: getUpcomingWindowTitle(window, count),
    message: `Proximos eventos: ${sortedEvents.map((event) => event.title).join(', ')}`,
    type: window === '15m' ? 'warning' : 'info',
    priority: window === '15m' ? 'high' : 'medium',
    entityType: 'agenda',
    entityId: `batch:${hashString(batchSignature)}`,
    autoClose: window === '15m' ? false : undefined,
  };
};
