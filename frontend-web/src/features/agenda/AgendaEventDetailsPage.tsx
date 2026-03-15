import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { Card, InlineStats, PageHeader, SectionCard } from '../../components/layout-v2';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { CalendarEvent } from '../../types/calendar';
import agendaEventosService from '../../services/agendaEventosService';

type InviteResponse = Extract<NonNullable<CalendarEvent['myRsvp']>, 'confirmed' | 'declined'>;
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


const statusLabelMap: Record<CalendarEvent['status'], string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

const statusClassMap: Record<CalendarEvent['status'], string> = {
  confirmed: 'border-green-200 bg-green-50 text-green-700',
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const rsvpLabelMap: Record<NonNullable<CalendarEvent['myRsvp']>, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  declined: 'Não vou',
};

const rsvpClassMap: Record<NonNullable<CalendarEvent['myRsvp']>, string> = {
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-rose-200 bg-rose-50 text-rose-700',
};

const attendeeRsvpLabelMap: Record<NonNullable<CalendarEvent['myRsvp']>, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Não vou',
};

const attendeeRsvpBadgeClassMap: Record<NonNullable<CalendarEvent['myRsvp']>, string> = {
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-rose-200 bg-rose-50 text-rose-700',
};

const formatDateTimeLabel = (event: CalendarEvent) => {
  if (event.allDay) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(event.start);
  }

  const sameDay = event.start.toDateString() === event.end.toDateString();
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(event.start);
  const startTime = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.start);
  const endTime = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.end);

  if (sameDay) return `${dateLabel} • ${startTime} até ${endTime}`;

  return `${dateLabel} • ${startTime} → ${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(event.end)}`;
};

export const AgendaEventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, addNotification } = useNotifications();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserEmail = String(user?.email || '')
    .trim()
    .toLowerCase();

  const attendeeList = Array.isArray(event?.attendees) ? event!.attendees : [];

  const isAttendee = useMemo(
    () => !!currentUserEmail && attendeeList.some((attendee) => attendee.trim().toLowerCase() === currentUserEmail),
    [attendeeList, currentUserEmail],
  );

  const canRespond = !!event && isAttendee && event.status !== 'cancelled';

  const canUpdateAgendaEvents = useMemo(() => {
    const permissions = [
      ...(Array.isArray((user as any)?.permissions) ? (user as any).permissions : []),
      ...(Array.isArray((user as any)?.permissoes) ? (user as any).permissoes : []),
    ];

    return permissions.some(
      (permission: unknown) =>
        typeof permission === 'string' && permission.trim().toLowerCase() === 'crm.agenda.update',
    );
  }, [user]);
  const organizerLabel = resolveOrganizerLabel(event?.criadoPorNome, event?.responsavel, event?.collaborator);

  const attendeeResponseEntries = useMemo(() => {
    if (!event || attendeeList.length === 0) return [];

    return attendeeList.map((email) => {
      const normalizedEmail = email.trim().toLowerCase();
      const response = event.attendeeResponses?.[normalizedEmail] ?? 'pending';
      return {
        email,
        response,
      };
    });
  }, [attendeeList, event]);

  const attendeeResponseCounts = useMemo(() => {
    const counts = {
      confirmed: 0,
      declined: 0,
      pending: 0,
    };

    attendeeResponseEntries.forEach((entry) => {
      if (entry.response === 'confirmed') counts.confirmed += 1;
      else if (entry.response === 'declined') counts.declined += 1;
      else counts.pending += 1;
    });

    return counts;
  }, [attendeeResponseEntries]);

  const canViewAttendeeResponses = canUpdateAgendaEvents && attendeeResponseEntries.length > 0;

  const baseAgendaPath = window.location.pathname.startsWith('/crm/') ? '/crm/agenda' : '/agenda';

  const loadEvent = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await agendaEventosService.obterEvento(id);
      setEvent(data);
    } catch (err) {
      console.error('Erro ao carregar detalhes do evento:', err);
      setError('Não foi possível carregar os detalhes do evento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvent();
  }, [id]);

  const handleRespond = async (response: InviteResponse) => {
    if (!event) return;

    setIsResponding(true);
    try {
      const updated = await agendaEventosService.responderConviteEvento(event.id, response);
      setEvent(updated);
      showSuccess(
        response === 'confirmed' ? 'Presença confirmada' : 'Convite recusado',
        response === 'confirmed'
          ? 'Sua resposta foi registrada com sucesso.'
          : 'Sua recusa foi registrada com sucesso.',
      );
    } catch (err) {
      console.error('Erro ao responder convite na página:', err);
      addNotification({
        title: '❌ Erro ao responder convite',
        message: 'Não foi possível registrar sua resposta. Tente novamente.',
        type: 'error',
        priority: 'medium',
      });
    } finally {
      setIsResponding(false);
    }
  };

  if (!id) {
    return (
      <SectionCard className="p-5">
        <p className="text-sm text-[#607B89]">Evento inválido.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-6 w-6 text-[#159A9C]" />
              <span>Detalhes do Evento</span>
            </span>
          }
          description={
            event
              ? 'Visualize as informações do convite e responda sua participação.'
              : 'Carregando informações do evento da agenda.'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <Link
                to={baseAgendaPath}
                className="inline-flex h-10 items-center rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
              >
                Abrir Agenda
              </Link>
            </div>
          }
        />
        {event ? (
          <InlineStats
            stats={[
              { label: 'Status do evento', value: statusLabelMap[event.status], tone: 'neutral' },
              {
                label: 'Sua resposta',
                value: event.myRsvp ? rsvpLabelMap[event.myRsvp] : isAttendee ? 'Pendente' : 'Sem ação',
                tone: event.myRsvp === 'declined' ? 'warning' : 'accent',
              },
              { label: 'Participantes', value: String(attendeeList.length || 0), tone: 'neutral' },
              {
                label: 'Tipo',
                value: event.allDay ? 'Dia inteiro' : 'Com horário',
                tone: 'neutral',
              },
            ]}
          />
        ) : null}
      </SectionCard>

      {loading ? (
        <Card className="p-5">
          <div className="flex items-center gap-3 text-sm text-[#607B89]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando detalhes do evento...
          </div>
        </Card>
      ) : error ? (
        <Card className="p-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#B42318]">{error}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadEvent()}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
              <Link
                to={baseAgendaPath}
                className="inline-flex h-10 items-center rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
              >
                Voltar para agenda
              </Link>
            </div>
          </div>
        </Card>
      ) : event ? (
        <>
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassMap[event.status]}`}
              >
                {statusLabelMap[event.status]}
              </span>
              {event.myRsvp ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${rsvpClassMap[event.myRsvp]}`}
                >
                  Sua resposta: {rsvpLabelMap[event.myRsvp]}
                </span>
              ) : null}
              {!canUpdateAgendaEvents && isAttendee ? (
                <span className="inline-flex items-center rounded-full border border-[#D7E5EA] bg-[#F7FBFC] px-2.5 py-1 text-xs font-semibold text-[#406173]">
                  Visualização de convidado
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <Calendar className="h-3.5 w-3.5" />
                  Data
                </div>
                <div className="text-sm font-medium text-[#19384C]">{formatDateTimeLabel(event)}</div>
              </div>

              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <User className="h-3.5 w-3.5" />
                  Responsável
                </div>
                <div className="text-sm font-medium text-[#19384C] break-words">{organizerLabel}</div>
              </div>

              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <Clock className="h-3.5 w-3.5" />
                  Horário
                </div>
                <div className="text-sm font-medium text-[#19384C]">
                  {event.allDay
                    ? 'Evento de dia inteiro'
                    : `${new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.start)} até ${new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(event.end)}`}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4">
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  <Users className="h-3.5 w-3.5" />
                  Participantes
                </div>
                <div className="text-sm font-medium text-[#19384C]">{attendeeList.length}</div>
              </div>

              {event.location ? (
                <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4 lg:col-span-2">
                  <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                    <MapPin className="h-3.5 w-3.5" />
                    Local
                  </div>
                  <div className="text-sm font-medium text-[#19384C] break-words">{event.location}</div>
                </div>
              ) : null}

              {event.description ? (
                <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4 lg:col-span-2">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                    <FileText className="h-3.5 w-3.5" />
                    Descrição
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[#355061]">{event.description}</p>
                </div>
              ) : null}

              {attendeeList.length > 0 ? (
                <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4 lg:col-span-2">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                    <Users className="h-3.5 w-3.5" />
                    Lista de participantes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attendeeList.map((attendee) => (
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

              {canViewAttendeeResponses ? (
                <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFE] p-4 lg:col-span-2">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                      <Users className="h-3.5 w-3.5" />
                      Respostas dos participantes
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Confirmados {attendeeResponseCounts.confirmed}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        Não vão {attendeeResponseCounts.declined}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                        Pendentes {attendeeResponseCounts.pending}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {attendeeResponseEntries.map((entry) => (
                      <div
                        key={`rsvp-${entry.email}`}
                        className="flex flex-col gap-2 rounded-lg border border-[#E5EEF2] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 text-sm font-medium text-[#19384C] break-all">{entry.email}</div>
                        <span
                          className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${attendeeRsvpBadgeClassMap[entry.response]}`}
                        >
                          {attendeeRsvpLabelMap[entry.response]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          {canRespond ? (
            <SectionCard className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#19384C]">Responder convite</h2>
                  <p className="mt-1 text-sm text-[#607B89]">
                    Confirme ou recuse sua participação neste evento.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleRespond('declined')}
                    disabled={isResponding}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[#F2C5CD] bg-white px-4 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#FFF5F6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Não vou
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRespond('confirmed')}
                    disabled={isResponding}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResponding ? 'Salvando...' : 'Confirmar presença'}
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default AgendaEventDetailsPage;
