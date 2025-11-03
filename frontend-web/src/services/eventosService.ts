import { api } from './api';
import { CalendarEvent } from '../types/calendar';

export interface EventoCreate {
  titulo: string;
  descricao?: string;
  dataInicio: string; // ISO string
  dataFim?: string; // ISO string
  diaInteiro?: boolean;
  local?: string;
  tipo?: 'reuniao' | 'ligacao' | 'apresentacao' | 'visita' | 'follow-up' | 'outro';
  cor?: string;
  clienteId?: string;
  usuarioId: string;
  empresaId: string;
}

export interface EventoUpdate extends Partial<EventoCreate> { }

export interface EventoResponse {
  id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  diaInteiro: boolean;
  local?: string;
  tipo: string;
  cor: string;
  clienteId?: string;
  usuarioId: string;
  empresaId: string;
  usuario?: {
    id: string;
    name: string;
    email: string;
  };
  cliente?: {
    id: string;
    nome: string;
  };
  criadoEm: string;
  atualizadoEm: string;
}

export interface ConflictCheck {
  dataInicio: string;
  dataFim: string;
}

class EventosService {
  private readonly baseUrl = '/eventos';

  // Converter EventoResponse para CalendarEvent
  private toCalendarEvent(evento: EventoResponse): CalendarEvent {
    return {
      id: evento.id,
      title: evento.titulo,
      description: evento.descricao || '',
      start: new Date(evento.dataInicio),
      end: evento.dataFim ? new Date(evento.dataFim) : new Date(evento.dataInicio),
      allDay: evento.diaInteiro,
      location: evento.local || '',
      type: this.mapTipoToType(evento.tipo),
      priority: 'medium',
      status: 'confirmed',
      category: 'meeting',
      color: evento.cor,
      collaborator: evento.usuario?.name || '',
      attendees: [],
      notes: '',
      isRecurring: false,
      recurringPattern: undefined,
      responsavelId: evento.usuarioId,
      criadoPorId: evento.usuarioId
    };
  }

  // Converter CalendarEvent para EventoCreate
  private fromCalendarEvent(event: Omit<CalendarEvent, 'id'>, usuarioId: string, empresaId: string): EventoCreate {
    return {
      titulo: event.title,
      descricao: event.description,
      dataInicio: event.start.toISOString(),
      dataFim: event.end ? event.end.toISOString() : undefined,
      diaInteiro: event.allDay,
      local: event.location,
      tipo: this.mapTypeToTipo(event.type),
      cor: event.color,
      clienteId: undefined, // TODO: adicionar suporte a clientes
      usuarioId: usuarioId,
      empresaId: empresaId
    };
  }

  // Mapear tipos do frontend para backend
  private mapTypeToTipo(type: string): 'reuniao' | 'ligacao' | 'apresentacao' | 'visita' | 'follow-up' | 'outro' {
    switch (type) {
      case 'meeting':
        return 'reuniao';
      case 'call':
        return 'ligacao';
      case 'event':
        return 'apresentacao';
      case 'task':
        return 'visita';
      case 'follow-up':
        return 'follow-up';
      default:
        return 'outro';
    }
  }

  // Mapear tipos do backend para frontend
  private mapTipoToType(tipo: string): 'meeting' | 'call' | 'task' | 'follow-up' | 'event' {
    switch (tipo) {
      case 'reuniao':
        return 'meeting';
      case 'ligacao':
        return 'call';
      case 'apresentacao':
        return 'event';
      case 'visita':
        return 'task';
      case 'follow-up':
        return 'follow-up';
      default:
        return 'meeting';
    }
  }

  private getUserData() {
    const user = localStorage.getItem('user_data');
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    return JSON.parse(user);
  }

  async listarEventos(filtros?: {
    startDate?: Date;
    endDate?: Date;
    tipo?: string;
  }): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams();

      if (filtros?.startDate) {
        params.append('startDate', filtros.startDate.toISOString());
      }
      if (filtros?.endDate) {
        params.append('endDate', filtros.endDate.toISOString());
      }
      if (filtros?.tipo) {
        params.append('tipo', filtros.tipo);
      }

      const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;
      const response = await api.get<EventoResponse[]>(url);

      return response.data.map(evento => this.toCalendarEvent(evento));
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      throw new Error('Não foi possível carregar os eventos');
    }
  }

  async obterEvento(id: string): Promise<CalendarEvent> {
    try {
      const response = await api.get<EventoResponse>(`${this.baseUrl}/${id}`);
      return this.toCalendarEvent(response.data);
    } catch (error) {
      console.error('Erro ao obter evento:', error);
      throw new Error('Não foi possível carregar o evento');
    }
  }

  async criarEvento(event: Omit<CalendarEvent, 'id'>, responsavelId: string): Promise<CalendarEvent> {
    try {
      const userData = this.getUserData();
      const eventoData = this.fromCalendarEvent(event, responsavelId, userData.empresa.id);
      const response = await api.post<EventoResponse>(this.baseUrl, eventoData);
      return this.toCalendarEvent(response.data);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw new Error('Não foi possível criar o evento');
    }
  }

  async atualizarEvento(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const updateData: EventoUpdate = {};

      if (updates.title !== undefined) updateData.titulo = updates.title;
      if (updates.description !== undefined) updateData.descricao = updates.description;
      if (updates.start !== undefined) updateData.dataInicio = updates.start.toISOString();
      if (updates.end !== undefined) updateData.dataFim = updates.end?.toISOString();
      if (updates.allDay !== undefined) updateData.diaInteiro = updates.allDay;
      if (updates.location !== undefined) updateData.local = updates.location;
      if (updates.type !== undefined) updateData.tipo = this.mapTypeToTipo(updates.type);
      if (updates.color !== undefined) updateData.cor = updates.color;

      const response = await api.patch<EventoResponse>(`${this.baseUrl}/${id}`, updateData);
      return this.toCalendarEvent(response.data);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw new Error('Não foi possível atualizar o evento');
    }
  }

  async excluirEvento(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw new Error('Não foi possível excluir o evento');
    }
  }

  async verificarConflitos(start: Date, end: Date, eventoId?: string): Promise<CalendarEvent[]> {
    try {
      if (eventoId) {
        // Verificar conflitos para edição de evento existente
        const params = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString()
        });

        const response = await api.get<EventoResponse[]>(`${this.baseUrl}/${eventoId}/conflicts?${params.toString()}`);
        return response.data.map(evento => this.toCalendarEvent(evento));
      } else {
        // Verificar conflitos para novo evento
        const conflictData: ConflictCheck = {
          dataInicio: start.toISOString(),
          dataFim: end.toISOString()
        };

        const response = await api.post<EventoResponse[]>(`${this.baseUrl}/check-conflicts`, conflictData);
        return response.data.map(evento => this.toCalendarEvent(evento));
      }
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      return []; // Retorna array vazio em caso de erro
    }
  }

  async listarEventosPorPeriodo(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return this.listarEventos({ startDate, endDate });
  }

  async listarEventosPorTipo(type: string): Promise<CalendarEvent[]> {
    const tipo = this.mapTypeToTipo(type);
    return this.listarEventos({ tipo });
  }
}

export const eventosService = new EventosService();
export default eventosService;
