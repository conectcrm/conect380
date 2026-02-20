import axios from 'axios';
import { api } from './api';
import { CalendarEvent } from '../types/calendar';

export type AgendaStatusBackend = 'confirmado' | 'pendente' | 'cancelado';
export type AgendaPrioridadeBackend = 'alta' | 'media' | 'baixa';
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
  attendees?: string[] | null;
  interacao_id?: string | null;
  created_at?: string;
  updated_at?: string;
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
    type: 'event',
    category: 'meeting',
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

  return payload;
};

class AgendaEventosService {
  private readonly agendaBaseUrl = '/agenda-eventos';
  private readonly eventosBaseUrl = '/eventos';
  private endpointVariant: EndpointVariant = 'eventos';

  private extractAgendaData(responseData: AgendaEventoResponse[] | PaginatedAgendaResponse) {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray((responseData as PaginatedAgendaResponse).data)) {
      return (responseData as PaginatedAgendaResponse).data;
    }
    return [] as AgendaEventoResponse[];
  }

  private canFallback(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    return status === 404 || status === 500;
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
    return this.withEndpointFallback({
      agenda: async () => {
        const params = new URLSearchParams();

        if (filtros?.startDate) params.append('dataInicio', filtros.startDate.toISOString());
        if (filtros?.endDate) params.append('dataFim', filtros.endDate.toISOString());
        if (filtros?.status) params.append('status', mapStatusToBackend(filtros.status));
        if (filtros?.priority) params.append('prioridade', mapPriorityToBackend(filtros.priority));
        if (filtros?.search) params.append('busca', filtros.search);
        if (filtros?.interacaoId) params.append('interacao_id', filtros.interacaoId);

        const url = params.toString()
          ? `${this.agendaBaseUrl}?${params.toString()}`
          : this.agendaBaseUrl;
        const response = await api.get<AgendaEventoResponse[] | PaginatedAgendaResponse>(url);
        const raw = this.extractAgendaData(response.data);
        return raw.map(toCalendarEventFromAgenda);
      },
      eventos: async () => {
        const params: Record<string, string> = {};

        if (filtros?.startDate) params.startDate = filtros.startDate.toISOString();
        if (filtros?.endDate) params.endDate = filtros.endDate.toISOString();
        if (filtros?.type) {
          params.tipo = mapCalendarTypeToEventosType(filtros.type);
        }

        const response = await api.get<EventoResponse[]>(this.eventosBaseUrl, { params });
        const raw = Array.isArray(response.data) ? response.data : [];
        return raw.map(toCalendarEventFromEventos);
      },
    });
  }

  async obterEvento(id: string): Promise<CalendarEvent> {
    return this.withEndpointFallback({
      agenda: async () => {
        const response = await api.get<AgendaEventoResponse>(`${this.agendaBaseUrl}/${id}`);
        return toCalendarEventFromAgenda(response.data);
      },
      eventos: async () => {
        const response = await api.get<EventoResponse>(`${this.eventosBaseUrl}/${id}`);
        return toCalendarEventFromEventos(response.data);
      },
    });
  }

  async criarEvento(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    return this.withEndpointFallback({
      agenda: async () => {
        const payload = fromCalendarEventToAgenda(event);
        const response = await api.post<AgendaEventoResponse>(this.agendaBaseUrl, payload);
        return toCalendarEventFromAgenda(response.data);
      },
      eventos: async () => {
        const payload = fromCalendarEventToEventos(event);
        const response = await api.post<EventoResponse>(this.eventosBaseUrl, payload);
        return toCalendarEventFromEventos(response.data);
      },
    });
  }

  async atualizarEvento(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return this.withEndpointFallback({
      agenda: async () => {
        const payload = fromCalendarUpdatesToAgenda(updates);
        const response = await api.patch<AgendaEventoResponse>(`${this.agendaBaseUrl}/${id}`, payload);
        return toCalendarEventFromAgenda(response.data);
      },
      eventos: async () => {
        const payload = fromCalendarUpdatesToEventos(updates);
        const response = await api.patch<EventoResponse>(`${this.eventosBaseUrl}/${id}`, payload);
        return toCalendarEventFromEventos(response.data);
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
      },
    });
  }
}

export const agendaEventosService = new AgendaEventosService();
export default agendaEventosService;
