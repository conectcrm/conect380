import axios from 'axios';
import { api } from './api';
import { CalendarEvent } from '../types/calendar';
import { buildScopedStorageKey } from '../utils/storageScope';

export type AgendaStatusBackend = 'confirmado' | 'pendente' | 'cancelado';
export type AgendaPrioridadeBackend = 'alta' | 'media' | 'baixa';
export type AgendaTipoBackend = 'reuniao' | 'ligacao' | 'tarefa' | 'evento' | 'follow-up';
export type AgendaLocationTypeBackend = 'presencial' | 'virtual';
export type AgendaReminderTypeBackend = 'notification' | 'email' | 'both';
export type EventoTipoBackend =
  | 'reuniao'
  | 'ligacao'
  | 'apresentacao'
  | 'visita'
  | 'follow-up'
  | 'outro';
type EndpointVariant = 'agenda' | 'eventos';

interface AgendaEventoResponse {
  id: string;
  titulo: string;
  descricao?: string;
  inicio: string;
  fim?: string | null;
  all_day: boolean;
  status: AgendaStatusBackend;
  prioridade: AgendaPrioridadeBackend;
  local?: string | null;
  color?: string | null;
  tipo?: AgendaTipoBackend | null;
  location_type?: AgendaLocationTypeBackend | null;
  reminder_time?: number | null;
  reminder_type?: AgendaReminderTypeBackend | null;
  email_offline?: boolean | null;
  attachments?: string[] | null;
  is_recurring?: boolean | null;
  recurring_pattern?: Record<string, unknown> | null;
  notes?: string | null;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  attendees?: string[] | null;
  attendee_responses?: Record<string, 'pending' | 'confirmed' | 'declined'> | null;
  my_rsvp?: 'pending' | 'confirmed' | 'declined' | null;
  criado_por_id?: string | null;
  criado_por_nome?: string | null;
  interacao_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AgendaParticipantResponse {
  id: string;
  nome: string;
  email: string;
}

interface PaginatedAgendaResponse {
  data: AgendaEventoResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface EventoResponse {
  id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string | null;
  diaInteiro?: boolean;
  local?: string | null;
  tipo?: EventoTipoBackend;
  cor?: string | null;
  clienteId?: string | null;
  usuarioId?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

const CREVASSE_PRIMARY = '#159A9C';
const LOCAL_AGENDA_EVENT_META_STORAGE_KEY = 'conectcrm:agenda:event-meta:v2';

type AgendaEventLocalMeta = Pick<
  Partial<CalendarEvent>,
  | 'type'
  | 'category'
  | 'status'
  | 'priority'
  | 'attendees'
  | 'attendeeResponses'
  | 'collaborator'
  | 'responsavel'
  | 'responsavelId'
  | 'cliente'
  | 'allDay'
  | 'location'
  | 'locationType'
  | 'color'
  | 'notes'
  | 'reminderTime'
  | 'reminderType'
  | 'emailOffline'
  | 'attachments'
  | 'recurring'
  | 'isRecurring'
  | 'recurringPattern'
  | 'myRsvp'
>;

const AGENDA_EVENT_LOCAL_META_KEYS: Array<keyof AgendaEventLocalMeta> = [
  'type',
  'category',
  'status',
  'priority',
  'attendees',
  'attendeeResponses',
  'collaborator',
  'responsavel',
  'responsavelId',
  'cliente',
  'allDay',
  'location',
  'locationType',
  'color',
  'notes',
  'reminderTime',
  'reminderType',
  'emailOffline',
  'attachments',
  'recurring',
  'isRecurring',
  'recurringPattern',
  'myRsvp',
];

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const getAgendaEventLocalMetaStorageKey = (): string =>
  buildScopedStorageKey(LOCAL_AGENDA_EVENT_META_STORAGE_KEY, {
    includeEmpresa: true,
    includeUser: true,
  });

const readAgendaEventLocalMetaMap = (): Record<string, AgendaEventLocalMeta> => {
  if (!canUseLocalStorage()) return {};

  try {
    const raw = window.localStorage.getItem(getAgendaEventLocalMetaStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Falha ao ler metadados locais da agenda:', error);
    return {};
  }
};

const writeAgendaEventLocalMetaMap = (map: Record<string, AgendaEventLocalMeta>) => {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(getAgendaEventLocalMetaStorageKey(), JSON.stringify(map));
  } catch (error) {
    console.warn('Falha ao salvar metadados locais da agenda:', error);
  }
};

const mergeAgendaEventLocalMeta = (event: CalendarEvent): CalendarEvent => {
  const localMeta = readAgendaEventLocalMetaMap()[event.id];
  if (!localMeta) return event;
  return { ...event, ...localMeta };
};

const upsertAgendaEventLocalMeta = (eventId: string, source: Partial<CalendarEvent>) => {
  if (!eventId || !canUseLocalStorage()) return;

  const map = readAgendaEventLocalMetaMap();
  const currentMeta = { ...(map[eventId] || {}) };

  AGENDA_EVENT_LOCAL_META_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(source, key)) return;
    const value = source[key];

    if (value === undefined) {
      delete currentMeta[key];
      return;
    }

    currentMeta[key] = value as never;
  });

  if (Object.keys(currentMeta).length === 0) {
    delete map[eventId];
  } else {
    map[eventId] = currentMeta;
  }

  writeAgendaEventLocalMetaMap(map);
};

const removeAgendaEventLocalMeta = (eventId: string) => {
  if (!eventId || !canUseLocalStorage()) return;

  const map = readAgendaEventLocalMetaMap();
  if (!map[eventId]) return;

  delete map[eventId];
  writeAgendaEventLocalMetaMap(map);
};

const mapStatusToFrontend = (status: AgendaStatusBackend): CalendarEvent['status'] => {
  switch (status) {
    case 'confirmado':
      return 'confirmed';
    case 'pendente':
      return 'pending';
    case 'cancelado':
      return 'cancelled';
    default:
      return 'confirmed';
  }
};

const mapStatusToBackend = (
  status: CalendarEvent['status'] | AgendaStatusBackend | undefined,
): AgendaStatusBackend => {
  if (status === 'confirmed' || status === 'confirmado') return 'confirmado';
  if (status === 'pending' || status === 'pendente') return 'pendente';
  if (status === 'cancelled' || status === 'cancelado') return 'cancelado';
  return 'confirmado';
};

const mapPriorityToFrontend = (prioridade: AgendaPrioridadeBackend): CalendarEvent['priority'] => {
  switch (prioridade) {
    case 'alta':
      return 'high';
    case 'baixa':
      return 'low';
    default:
      return 'medium';
  }
};

const mapPriorityToBackend = (
  priority: CalendarEvent['priority'] | AgendaPrioridadeBackend | undefined,
): AgendaPrioridadeBackend => {
  if (priority === 'high' || priority === 'alta') return 'alta';
  if (priority === 'low' || priority === 'baixa') return 'baixa';
  return 'media';
};

const mapAgendaTypeToCalendarType = (tipo: AgendaTipoBackend | null | undefined): CalendarEvent['type'] => {
  switch (tipo) {
    case 'reuniao':
      return 'meeting';
    case 'ligacao':
      return 'call';
    case 'tarefa':
      return 'task';
    case 'follow-up':
      return 'follow-up';
    case 'evento':
    default:
      return 'event';
  }
};

const mapCalendarTypeToAgendaType = (
  tipo: CalendarEvent['type'] | AgendaTipoBackend | string | undefined,
): AgendaTipoBackend => {
  if (tipo === 'meeting' || tipo === 'reuniao') return 'reuniao';
  if (tipo === 'call' || tipo === 'ligacao') return 'ligacao';
  if (tipo === 'task' || tipo === 'tarefa') return 'tarefa';
  if (tipo === 'follow-up') return 'follow-up';
  return 'evento';
};

const mapEventosTypeToCalendarType = (
  tipo: EventoTipoBackend | undefined,
): CalendarEvent['type'] => {
  switch (tipo) {
    case 'reuniao':
      return 'meeting';
    case 'ligacao':
      return 'call';
    case 'follow-up':
      return 'follow-up';
    case 'apresentacao':
    case 'visita':
    case 'outro':
    default:
      return 'event';
  }
};

const mapCalendarTypeToEventosType = (
  tipo: CalendarEvent['type'] | string | undefined,
): EventoTipoBackend => {
  if (tipo === 'meeting') return 'reuniao';
  if (tipo === 'call') return 'ligacao';
  if (tipo === 'follow-up') return 'follow-up';
  return 'outro';
};

const toCalendarEventFromAgenda = (evento: AgendaEventoResponse): CalendarEvent => {
  const type = mapAgendaTypeToCalendarType(evento.tipo);

  return {
    id: evento.id,
    title: evento.titulo,
    description: evento.descricao ?? '',
    start: new Date(evento.inicio),
    end: evento.fim ? new Date(evento.fim) : new Date(evento.inicio),
    allDay: !!evento.all_day,
    status: mapStatusToFrontend(evento.status),
    priority: mapPriorityToFrontend(evento.prioridade),
    location: evento.local ?? '',
    color: evento.color ?? CREVASSE_PRIMARY,
    attendees: evento.attendees ?? undefined,
    attendeeResponses: evento.attendee_responses ?? undefined,
    myRsvp: evento.my_rsvp ?? undefined,
    criadoPorId: evento.criado_por_id ?? undefined,
    criadoPorNome: evento.criado_por_nome ?? undefined,
    type,
    category: evento.tipo ?? mapCalendarTypeToAgendaType(type),
    locationType: evento.location_type ?? 'presencial',
    reminderTime:
      typeof evento.reminder_time === 'number' && Number.isFinite(evento.reminder_time)
        ? evento.reminder_time
        : undefined,
    reminderType: evento.reminder_type ?? undefined,
    emailOffline: !!evento.email_offline,
    attachments: Array.isArray(evento.attachments) ? evento.attachments : undefined,
    isRecurring: !!evento.is_recurring,
    recurringPattern: evento.recurring_pattern ?? undefined,
    notes: evento.notes ?? undefined,
    responsavelId: evento.responsavel_id ?? undefined,
    responsavel: evento.responsavel_nome ?? evento.responsavel_id ?? undefined,
    collaborator: evento.responsavel_nome ?? undefined,
  };
};

const toCalendarEventFromEventos = (evento: EventoResponse): CalendarEvent => {
  const start = evento.dataInicio ? new Date(evento.dataInicio) : new Date();
  const end = evento.dataFim ? new Date(evento.dataFim) : new Date(start);

  return {
    id: evento.id,
    title: evento.titulo,
    description: evento.descricao ?? '',
    start,
    end,
    allDay: !!evento.diaInteiro,
    status: 'pending',
    priority: 'medium',
    location: evento.local ?? '',
    color: evento.cor ?? CREVASSE_PRIMARY,
    type: mapEventosTypeToCalendarType(evento.tipo),
    category: evento.tipo ?? 'outro',
    responsavelId: evento.usuarioId ?? undefined,
    responsavel: evento.usuarioId ?? undefined,
    cliente: evento.clienteId
      ? {
          id: evento.clienteId,
          name: '',
        }
      : undefined,
  };
};

const fromCalendarEventToAgenda = (event: Omit<CalendarEvent, 'id'>) => {
  return {
    titulo: event.title,
    descricao: event.description,
    inicio: event.start.toISOString(),
    fim: event.end ? event.end.toISOString() : undefined,
    all_day: !!event.allDay,
    status: mapStatusToBackend(event.status),
    prioridade: mapPriorityToBackend(event.priority),
    tipo: mapCalendarTypeToAgendaType(event.type),
    location_type: event.locationType ?? 'presencial',
    reminder_time: event.reminderTime,
    reminder_type: event.reminderType,
    email_offline: !!event.emailOffline,
    attachments: event.attachments?.length ? event.attachments : undefined,
    is_recurring: !!event.isRecurring,
    recurring_pattern: event.recurringPattern ?? event.recurring ?? undefined,
    notes: event.notes,
    responsavel_id: event.responsavelId || undefined,
    responsavel_nome: event.collaborator || undefined,
    local: event.location,
    color: event.color ?? CREVASSE_PRIMARY,
    attendees: event.attendees?.length ? event.attendees : undefined,
    interacao_id: undefined,
  };
};

const fromCalendarEventToEventos = (event: Omit<CalendarEvent, 'id'>) => {
  return {
    titulo: event.title,
    descricao: event.description || undefined,
    dataInicio: event.start.toISOString(),
    dataFim: event.end ? event.end.toISOString() : undefined,
    diaInteiro: !!event.allDay,
    local: event.location || undefined,
    tipo: mapCalendarTypeToEventosType(event.type),
    cor: event.color ?? CREVASSE_PRIMARY,
    clienteId: event.cliente?.id,
    usuarioId: event.responsavelId || undefined,
  };
};

const fromCalendarUpdatesToAgenda = (updates: Partial<CalendarEvent>) => {
  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) payload.titulo = updates.title;
  if (updates.description !== undefined) payload.descricao = updates.description;
  if (updates.start !== undefined) payload.inicio = updates.start.toISOString();
  if (updates.end !== undefined) payload.fim = updates.end ? updates.end.toISOString() : undefined;
  if (updates.allDay !== undefined) payload.all_day = updates.allDay;
  if (updates.status !== undefined) payload.status = mapStatusToBackend(updates.status);
  if (updates.priority !== undefined) payload.prioridade = mapPriorityToBackend(updates.priority);
  if (updates.type !== undefined) payload.tipo = mapCalendarTypeToAgendaType(updates.type);
  if (updates.locationType !== undefined) payload.location_type = updates.locationType;
  if (updates.reminderTime !== undefined) payload.reminder_time = updates.reminderTime;
  if (updates.reminderType !== undefined) payload.reminder_type = updates.reminderType;
  if (updates.emailOffline !== undefined) payload.email_offline = updates.emailOffline;
  if (updates.attachments !== undefined) payload.attachments = updates.attachments;
  if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;
  if (updates.recurringPattern !== undefined) payload.recurring_pattern = updates.recurringPattern;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.responsavelId !== undefined) payload.responsavel_id = updates.responsavelId;
  if (updates.collaborator !== undefined) payload.responsavel_nome = updates.collaborator;
  if (updates.location !== undefined) payload.local = updates.location;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.attendees !== undefined) payload.attendees = updates.attendees;

  return payload;
};

const fromCalendarUpdatesToEventos = (updates: Partial<CalendarEvent>) => {
  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) payload.titulo = updates.title;
  if (updates.description !== undefined) payload.descricao = updates.description;
  if (updates.start !== undefined) payload.dataInicio = updates.start.toISOString();
  if (updates.end !== undefined) payload.dataFim = updates.end ? updates.end.toISOString() : undefined;
  if (updates.allDay !== undefined) payload.diaInteiro = updates.allDay;
  if (updates.location !== undefined) payload.local = updates.location;
  if (updates.type !== undefined) payload.tipo = mapCalendarTypeToEventosType(updates.type);
  if (updates.color !== undefined) payload.cor = updates.color;
  if (updates.cliente?.id) payload.clienteId = updates.cliente.id;
  if (updates.responsavelId !== undefined) payload.usuarioId = updates.responsavelId || undefined;

  return payload;
};

class AgendaEventosService {
  private readonly agendaBaseUrl = '/agenda-eventos';
  private readonly eventosBaseUrl = '/eventos';
  private endpointVariant: EndpointVariant = 'agenda';

  private extractAgendaData(responseData: AgendaEventoResponse[] | PaginatedAgendaResponse) {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray((responseData as PaginatedAgendaResponse).data)) {
      return (responseData as PaginatedAgendaResponse).data;
    }
    return [] as AgendaEventoResponse[];
  }

  private canFallback(error: unknown, options?: { allowServerError?: boolean }): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    if (status === 404) return true;
    if (options?.allowServerError && status === 500) return true;
    return false;
  }

  private isSharedAgendaEvent(
    payload: Pick<Partial<CalendarEvent>, 'attendees'> | Omit<CalendarEvent, 'id'>,
  ): boolean {
    return Array.isArray(payload.attendees) && payload.attendees.length > 1;
  }

  private async withEndpointFallback<T>(handlers: {
    agenda: () => Promise<T>;
    eventos: () => Promise<T>;
  }): Promise<T> {
    const order: EndpointVariant[] =
      this.endpointVariant === 'eventos' ? ['eventos', 'agenda'] : ['agenda', 'eventos'];

    let lastError: unknown;

    for (let idx = 0; idx < order.length; idx += 1) {
      const endpoint = order[idx];

      try {
        const result = await handlers[endpoint]();
        this.endpointVariant = endpoint;
        return result;
      } catch (error) {
        lastError = error;
        const hasNext = idx < order.length - 1;

        if (!hasNext || !this.canFallback(error)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async listarEventos(filtros?: {
    startDate?: Date;
    endDate?: Date;
    status?: CalendarEvent['status'];
    priority?: CalendarEvent['priority'];
    search?: string;
    interacaoId?: string;
    type?: CalendarEvent['type'] | string;
  }): Promise<CalendarEvent[]> {
    const agendaParams = new URLSearchParams();
    if (filtros?.startDate) agendaParams.append('dataInicio', filtros.startDate.toISOString());
    if (filtros?.endDate) agendaParams.append('dataFim', filtros.endDate.toISOString());
    if (filtros?.status) agendaParams.append('status', mapStatusToBackend(filtros.status));
    if (filtros?.priority) agendaParams.append('prioridade', mapPriorityToBackend(filtros.priority));
    if (filtros?.search) agendaParams.append('busca', filtros.search);
    if (filtros?.interacaoId) agendaParams.append('interacao_id', filtros.interacaoId);
    agendaParams.append('page', '1');
    agendaParams.append('limit', '100');

    const eventosParams: Record<string, string> = {};
    if (filtros?.startDate) eventosParams.startDate = filtros.startDate.toISOString();
    if (filtros?.endDate) eventosParams.endDate = filtros.endDate.toISOString();
    if (filtros?.type) {
      eventosParams.tipo = mapCalendarTypeToEventosType(filtros.type);
    }

    const fetchEventosList = async () => {
      const response = await api.get<EventoResponse[]>(this.eventosBaseUrl, { params: eventosParams });
      const raw = Array.isArray(response.data) ? response.data : [];
      this.endpointVariant = 'eventos';
      return raw
        .map(toCalendarEventFromEventos)
        .map(mergeAgendaEventLocalMeta)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
    };

    // Se o endpoint legado foi o último válido, priorizamos ele para evitar 500 repetitivo.
    if (this.endpointVariant === 'eventos') {
      try {
        return await fetchEventosList();
      } catch (eventosError) {
        if (!this.canFallback(eventosError, { allowServerError: true })) {
          throw eventosError;
        }
      }
    }

    try {
      const buildAgendaUrl = (page: number) => {
        const params = new URLSearchParams(agendaParams);
        params.set('page', String(page));
        return params.toString() ? `${this.agendaBaseUrl}?${params.toString()}` : this.agendaBaseUrl;
      };

      const firstResponse = await api.get<AgendaEventoResponse[] | PaginatedAgendaResponse>(
        buildAgendaUrl(1),
      );
      let rawAgenda = this.extractAgendaData(firstResponse.data);

      if (!Array.isArray(firstResponse.data)) {
        const totalPages = Math.max(1, Number(firstResponse.data.totalPages || 1));

        if (totalPages > 1) {
          const remainingResponses = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              api.get<AgendaEventoResponse[] | PaginatedAgendaResponse>(buildAgendaUrl(index + 2)),
            ),
          );

          remainingResponses.forEach((response) => {
            rawAgenda = [...rawAgenda, ...this.extractAgendaData(response.data)];
          });
        }
      }

      const agendaEvents = rawAgenda.map(toCalendarEventFromAgenda);
      this.endpointVariant = 'agenda';
      return agendaEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    } catch (agendaError) {
      if (!this.canFallback(agendaError, { allowServerError: true })) {
        throw agendaError;
      }
    }

    return fetchEventosList();
  }

  async obterEvento(id: string): Promise<CalendarEvent> {
    return this.withEndpointFallback({
      agenda: async () => {
        const response = await api.get<AgendaEventoResponse>(`${this.agendaBaseUrl}/${id}`);
        return toCalendarEventFromAgenda(response.data);
      },
      eventos: async () => {
        const response = await api.get<EventoResponse>(`${this.eventosBaseUrl}/${id}`);
        return mergeAgendaEventLocalMeta(toCalendarEventFromEventos(response.data));
      },
    });
  }

  async listarParticipantesInternos(): Promise<Array<{ id: string; nome: string; email: string }>> {
    const response = await api.get<{ success?: boolean; data?: AgendaParticipantResponse[] }>(
      `${this.agendaBaseUrl}/participants`,
    );

    const payload = response.data;
    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(response.data)
        ? (response.data as unknown as AgendaParticipantResponse[])
        : [];

    return items
      .filter((item) => item && item.id && item.nome && item.email)
      .map((item) => ({
        id: item.id,
        nome: item.nome,
        email: item.email,
      }));
  }

  async criarEvento(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    if (this.isSharedAgendaEvent(event)) {
      const payload = fromCalendarEventToAgenda(event);
      const response = await api.post<AgendaEventoResponse>(this.agendaBaseUrl, payload);
      this.endpointVariant = 'agenda';
      return toCalendarEventFromAgenda(response.data);
    }

    return this.withEndpointFallback({
      agenda: async () => {
        const payload = fromCalendarEventToAgenda(event);
        const response = await api.post<AgendaEventoResponse>(this.agendaBaseUrl, payload);
        return toCalendarEventFromAgenda(response.data);
      },
      eventos: async () => {
        const payload = fromCalendarEventToEventos(event);
        const response = await api.post<EventoResponse>(this.eventosBaseUrl, payload);
        const mappedEvent = toCalendarEventFromEventos(response.data);
        upsertAgendaEventLocalMeta(mappedEvent.id, event);
        return mergeAgendaEventLocalMeta(mappedEvent);
      },
    });
  }

  async atualizarEvento(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    if (this.isSharedAgendaEvent(updates)) {
      const payload = fromCalendarUpdatesToAgenda(updates);
      const response = await api.patch<AgendaEventoResponse>(`${this.agendaBaseUrl}/${id}`, payload);
      this.endpointVariant = 'agenda';
      return toCalendarEventFromAgenda(response.data);
    }

    return this.withEndpointFallback({
      agenda: async () => {
        const payload = fromCalendarUpdatesToAgenda(updates);
        const response = await api.patch<AgendaEventoResponse>(`${this.agendaBaseUrl}/${id}`, payload);
        return toCalendarEventFromAgenda(response.data);
      },
      eventos: async () => {
        const payload = fromCalendarUpdatesToEventos(updates);
        const response = await api.patch<EventoResponse>(`${this.eventosBaseUrl}/${id}`, payload);
        upsertAgendaEventLocalMeta(id, updates);
        return mergeAgendaEventLocalMeta(toCalendarEventFromEventos(response.data));
      },
    });
  }

  async excluirEvento(id: string): Promise<void> {
    await this.withEndpointFallback({
      agenda: async () => {
        await api.delete(`${this.agendaBaseUrl}/${id}`);
      },
      eventos: async () => {
        await api.delete(`${this.eventosBaseUrl}/${id}`);
        removeAgendaEventLocalMeta(id);
      },
    });
  }

  async responderConviteEvento(
    id: string,
    resposta: Extract<NonNullable<CalendarEvent['myRsvp']>, 'confirmed' | 'declined'>,
  ): Promise<CalendarEvent> {
    const response = await api.patch<AgendaEventoResponse>(`${this.agendaBaseUrl}/${id}/rsvp`, {
      resposta,
    });

    this.endpointVariant = 'agenda';
    return toCalendarEventFromAgenda(response.data);
  }

  atualizarMetadadosLocaisEvento(id: string, updates: Partial<CalendarEvent>): void {
    if (!id) return;
    upsertAgendaEventLocalMeta(id, updates);
  }
}

export const agendaEventosService = new AgendaEventosService();
export default agendaEventosService;
