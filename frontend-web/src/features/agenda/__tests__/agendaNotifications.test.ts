import { CalendarEvent } from '../../../types/calendar';
import {
  buildAgendaUpcomingNotification,
  shouldSuppressUpcomingWarningForDedicatedReminder,
} from '../agendaNotifications';

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => {
  const now = new Date('2026-03-25T10:00:00.000Z');

  return {
    id: overrides.id ?? 'evt-1',
    title: overrides.title ?? 'Reuniao comercial',
    start: overrides.start ?? new Date(now.getTime() + 14 * 60 * 1000),
    end: overrides.end ?? new Date(now.getTime() + 15 * 60 * 1000),
    type: overrides.type ?? 'meeting',
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'pending',
    allDay: overrides.allDay ?? false,
    reminderType: overrides.reminderType,
    reminderTime: overrides.reminderTime,
  };
};

describe('agendaNotifications', () => {
  it('builds 15-minute upcoming warning with auto close', () => {
    const event = makeEvent();

    const draft = buildAgendaUpcomingNotification([event], '15m');

    expect(draft).not.toBeNull();
    expect(draft).toEqual(
      expect.objectContaining({
        type: 'warning',
        title: 'Evento em 15 minutos',
        autoClose: true,
        duration: 8000,
        entityId: event.id,
      }),
    );
  });

  it('builds 1-hour upcoming info with auto close', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const event = makeEvent({
      start: new Date(now.getTime() + 30 * 60 * 1000),
      end: new Date(now.getTime() + 31 * 60 * 1000),
    });

    const draft = buildAgendaUpcomingNotification([event], '1h');

    expect(draft).not.toBeNull();
    expect(draft).toEqual(
      expect.objectContaining({
        type: 'info',
        title: 'Evento em 1 hora',
        autoClose: true,
      }),
    );
    expect(draft?.duration).toBeUndefined();
  });

  it('suppresses 15-minute warning when event has active dedicated notification reminder', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const event = makeEvent({
      start: new Date(now.getTime() + 14 * 60 * 1000),
      reminderType: 'notification',
      reminderTime: 10,
    });

    expect(shouldSuppressUpcomingWarningForDedicatedReminder(event, now, 15)).toBe(true);
  });

  it('does not suppress warning when dedicated reminder time has already passed', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const event = makeEvent({
      start: new Date(now.getTime() + 8 * 60 * 1000),
      reminderType: 'notification',
      reminderTime: 10,
    });

    expect(shouldSuppressUpcomingWarningForDedicatedReminder(event, now, 15)).toBe(false);
  });

  it('does not suppress warning for non-toast reminder channels', () => {
    const now = new Date('2026-03-25T10:00:00.000Z');
    const event = makeEvent({
      reminderType: 'email',
      reminderTime: 10,
    });

    expect(shouldSuppressUpcomingWarningForDedicatedReminder(event, now, 15)).toBe(false);
  });
});
