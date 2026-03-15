import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarEvent } from '../../types/calendar';
import { Calendar, Clock, MapPin, User, Users, FileText, X } from 'lucide-react';

type InviteResponse = Extract<CalendarEvent['myRsvp'], 'confirmed' | 'declined'>;
const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveOrganizerLabel = (
  criadoPorNome?: string | null,
  responsavel?: string | null,
  collaborator?: string | null,
): string => {
  const candidates = [criadoPorNome, responsavel, collaborator]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  const readable = candidates.find((value) => !UUID_LIKE_REGEX.test(value));
  return readable || 'Organizador do evento';
};


interface EventDetailsModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onRespond?: (response: InviteResponse) => Promise<void> | void;
  canRespond?: boolean;
  isResponding?: boolean;
}

const formatDateTimeLabel = (event: CalendarEvent) => {
  if (event.allDay) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(event.start);
  }

  const sameDay = event.start.toDateString() === event.end.toDateString();
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(event.start);
  const startTime = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.start);
  const endTime = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.end);

  if (sameDay) {
    return `${dateLabel} • ${startTime} até ${endTime}`;
  }

  const endDateLabel = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(event.end);

  return `${dateLabel} • ${startTime} → ${endDateLabel}`;
};

const eventStatusLabelMap: Record<CalendarEvent['status'], string> = {
  confirmed: 'Evento confirmado',
  pending: 'Evento pendente',
  cancelled: 'Evento cancelado',
};

const eventStatusClassMap: Record<CalendarEvent['status'], string> = {
  confirmed: 'border-green-200 bg-green-50 text-green-700',
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const rsvpLabelMap: Record<NonNullable<CalendarEvent['myRsvp']>, string> = {
  pending: 'Sua resposta: pendente',
  confirmed: 'Sua resposta: confirmada',
  declined: 'Sua resposta: não vou',
};

const rsvpClassMap: Record<NonNullable<CalendarEvent['myRsvp']>, string> = {
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-rose-200 bg-rose-50 text-rose-700',
};

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  event,
  onClose,
  onRespond,
  canRespond = false,
  isResponding = false,
}) => {
  const location = useLocation();
  if (!isOpen || !event) return null;

  const attendees = Array.isArray(event.attendees) ? event.attendees : [];
  const organizerLabel = resolveOrganizerLabel(event.criadoPorNome, event.responsavel, event.collaborator);
  const detailsPagePath = location.pathname.startsWith('/crm/')
    ? `/crm/agenda/eventos/${event.id}`
    : `/agenda/eventos/${event.id}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#072433]/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agenda-event-details-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E5EEF2] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D7E5EA] bg-[#F7FBFC] px-2.5 py-1 text-[11px] font-semibold text-[#406173]">
                Somente visualização
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${eventStatusClassMap[event.status]}`}
              >
                {eventStatusLabelMap[event.status]}
              </span>
              {event.myRsvp ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${rsvpClassMap[event.myRsvp]}`}
                >
                  {rsvpLabelMap[event.myRsvp]}
                </span>
              ) : null}
            </div>
            <h2
              id="agenda-event-details-title"
              className="truncate text-lg font-semibold text-[#19384C] sm:text-xl"
              title={event.title}
            >
              {event.title}
            </h2>
            <p className="mt-1 text-sm text-[#607B89]">
              Consulte os detalhes do convite e confirme sua participação.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#D7E5EA] bg-white text-[#6A8795] transition-colors hover:bg-[#F6FBFC]"
            aria-label="Fechar detalhes do evento"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-3">
              <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                <Calendar className="h-3.5 w-3.5" />
                Data
              </div>
              <div className="text-sm font-medium text-[#19384C]">{formatDateTimeLabel(event)}</div>
            </div>

            <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-3">
              <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                <User className="h-3.5 w-3.5" />
                Responsável
              </div>
              <div className="text-sm font-medium text-[#19384C] break-words">{organizerLabel}</div>
            </div>

            <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-3 sm:col-span-2">
              <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                {event.allDay ? <Calendar className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                Horário
              </div>
              <div className="text-sm font-medium text-[#19384C]">
                {event.allDay
                  ? 'Evento de dia inteiro'
                  : `${new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.start)} até ${new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.end)}`}
              </div>
            </div>

            {event.location ? (
              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-3 sm:col-span-2">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <MapPin className="h-3.5 w-3.5" />
                  Local
                </div>
                <div className="text-sm font-medium text-[#19384C] break-words">{event.location}</div>
              </div>
            ) : null}

            {event.description ? (
              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-3 sm:col-span-2">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <FileText className="h-3.5 w-3.5" />
                  Descrição
                </div>
                <div className="whitespace-pre-wrap text-sm text-[#355061]">{event.description}</div>
              </div>
            ) : null}

            {attendees.length > 0 ? (
              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-3 sm:col-span-2">
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <Users className="h-3.5 w-3.5" />
                  Participantes ({attendees.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((attendee) => (
                    <span
                      key={attendee}
                      className="inline-flex max-w-full items-center rounded-full border border-[#D7E5EA] bg-white px-2.5 py-1 text-xs font-medium text-[#4A6473]"
                      title={attendee}
                    >
                      <span className="truncate">{attendee}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E5EEF2] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
          >
            Fechar
          </button>

          {canRespond ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to={detailsPagePath}
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                Abrir página
              </Link>
              <button
                type="button"
                onClick={() => onRespond?.('declined')}
                disabled={isResponding}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#F2C5CD] bg-white px-4 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#FFF5F6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Não vou
              </button>
              <button
                type="button"
                onClick={() => onRespond?.('confirmed')}
                disabled={isResponding}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResponding ? 'Salvando...' : 'Confirmar presença'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6A8795]">
                Você pode visualizar os detalhes deste evento.
              </span>
              <Link
                to={detailsPagePath}
                onClick={onClose}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-[#CFDDE2] bg-white px-3 text-xs font-semibold text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                Abrir página
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
