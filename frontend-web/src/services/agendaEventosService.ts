import { api } from './api';
import { CalendarEvent } from '../types/calendar';

export type AgendaStatusBackend = 'confirmado' | 'pendente' | 'cancelado';
export type AgendaPrioridadeBackend = 'alta' | 'media' | 'baixa';

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

const toCalendarEvent = (evento: AgendaEventoResponse): CalendarEvent => {
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

const fromCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
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

class AgendaEventosService {
  private readonly baseUrl = '/agenda-eventos';

  private extractData(responseData: AgendaEventoResponse[] | PaginatedAgendaResponse) {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray((responseData as PaginatedAgendaResponse).data)) {
      return (responseData as PaginatedAgendaResponse).data;
    }
    return [] as AgendaEventoResponse[];
  }

  async listarEventos(filtros?: {
    startDate?: Date;
    endDate?: Date;
    status?: CalendarEvent['status'];
    priority?: CalendarEvent['priority'];
    search?: string;
    interacaoId?: string;
  }): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();

    if (filtros?.startDate) params.append('dataInicio', filtros.startDate.toISOString());
    if (filtros?.endDate) params.append('dataFim', filtros.endDate.toISOString());
    if (filtros?.status) params.append('status', mapStatusToBackend(filtros.status));
    if (filtros?.priority) params.append('prioridade', mapPriorityToBackend(filtros.priority));
    if (filtros?.search) params.append('busca', filtros.search);
    if (filtros?.interacaoId) params.append('interacao_id', filtros.interacaoId);

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;
    const response = await api.get<AgendaEventoResponse[] | PaginatedAgendaResponse>(url);
    const raw = this.extractData(response.data);
    return raw.map(toCalendarEvent);
  }

  async obterEvento(id: string): Promise<CalendarEvent> {
    const response = await api.get<AgendaEventoResponse>(`${this.baseUrl}/${id}`);
    return toCalendarEvent(response.data);
  }

  async criarEvento(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const payload = fromCalendarEvent(event);
    const response = await api.post<AgendaEventoResponse>(this.baseUrl, payload);
    return toCalendarEvent(response.data);
  }

  async atualizarEvento(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const current = updates.start ? updates : updates; // manter assinatura simples

    const payload: any = {};
    if (current.title !== undefined) payload.titulo = current.title;
    if (current.description !== undefined) payload.descricao = current.description;
    if (current.start !== undefined) payload.inicio = current.start.toISOString();
    if (current.end !== undefined) payload.fim = current.end ? current.end.toISOString() : undefined;
    if (current.allDay !== undefined) payload.all_day = current.allDay;
    if (current.status !== undefined) payload.status = mapStatusToBackend(current.status);
    if (current.priority !== undefined) payload.prioridade = mapPriorityToBackend(current.priority);
    if (current.location !== undefined) payload.local = current.location;
    if (current.color !== undefined) payload.color = current.color;
    if (current.attendees !== undefined) payload.attendees = current.attendees;

    const response = await api.patch<AgendaEventoResponse>(`${this.baseUrl}/${id}`, payload);
    return toCalendarEvent(response.data);
  }

  async excluirEvento(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export const agendaEventosService = new AgendaEventosService();
export default agendaEventosService;
