import { api } from './api';
import { getErrorMessage } from '../utils/errorHandling';

export enum TipoInteracao {
  CHAMADA = 'chamada',
  EMAIL = 'email',
  REUNIAO = 'reuniao',
  NOTA = 'nota',
  OUTRO = 'outro',
}

export interface Interacao {
  id: string;
  empresa_id: string;
  tipo: TipoInteracao | string;
  titulo?: string;
  descricao?: string;
  data_referencia?: string;
  proxima_acao_em?: string;
  proxima_acao_descricao?: string;
  agenda_event_id?: string;
  lead_id?: string;
  contato_id?: string;
  responsavel_id?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    nome: string;
    email?: string;
  } | null;
  contato?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  } | null;
  responsavel?: {
    id: string;
    username?: string;
    nome?: string;
    email?: string;
  } | null;
}

export interface AgendaEventoPayload {
  titulo: string;
  descricao?: string;
  inicio: string;
  fim?: string;
  all_day?: boolean;
  status?: 'confirmado' | 'pendente' | 'cancelado';
  prioridade?: 'alta' | 'media' | 'baixa';
  local?: string;
  color?: string;
}

export interface CreateInteracaoDto {
  tipo: TipoInteracao | string;
  titulo?: string;
  descricao?: string;
  data_referencia?: string;
  proxima_acao_em?: string;
  proxima_acao_descricao?: string;
  agenda_event_id?: string;
  lead_id?: string;
  contato_id?: string;
  responsavel_id?: string;
  agenda_evento?: AgendaEventoPayload;
}

export interface UpdateInteracaoDto extends Partial<CreateInteracaoDto> { }

export interface InteracaoFiltro {
  tipo?: TipoInteracao | string;
  lead_id?: string;
  contato_id?: string;
  responsavel_id?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface PaginatedInteracoes<T = Interacao> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface InteracoesEstatisticas {
  total: number;
  porTipo: Array<{ tipo: TipoInteracao | string; quantidade: number }>;
}

class InteracoesService {
  private readonly baseUrl = '/interacoes';
  private readonly errorPrefix = '[InteracoesService]';

  private buildQueryString(params: any = {}): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  private sanitizePayload<T extends object>(data: T): Partial<T> {
    return Object.entries(data as Record<string, unknown>).reduce<Partial<T>>((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;

      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return acc;
        (acc as Record<string, unknown>)[key] = trimmed;
        return acc;
      }

      (acc as Record<string, unknown>)[key] = value;
      return acc;
    }, {});
  }

  private async handleRequest<T>(request: () => Promise<{ data: T }>, context: string): Promise<T> {
    try {
      const response = await request();
      return response.data;
    } catch (err: unknown) {
      console.error(`${this.errorPrefix} ${context}:`, err);
      throw new Error(getErrorMessage(err, context));
    }
  }

  async listar(filtros: InteracaoFiltro = {}): Promise<PaginatedInteracoes> {
    const query = this.buildQueryString(filtros);
    return this.handleRequest<PaginatedInteracoes>(
      () => api.get(`${this.baseUrl}${query}`),
      'listar interações',
    );
  }

  async obterEstatisticas(): Promise<InteracoesEstatisticas> {
    return this.handleRequest<InteracoesEstatisticas>(
      () => api.get(`${this.baseUrl}/estatisticas`),
      'estatísticas de interações',
    );
  }

  async criar(payload: CreateInteracaoDto): Promise<Interacao> {
    const body = this.sanitizePayload(payload);
    return this.handleRequest<Interacao>(
      () => api.post(this.baseUrl, body),
      'criar interação',
    );
  }

  async atualizar(id: string, payload: UpdateInteracaoDto): Promise<Interacao> {
    const body = this.sanitizePayload(payload);
    return this.handleRequest<Interacao>(
      () => api.patch(`${this.baseUrl}/${id}`, body),
      'atualizar interação',
    );
  }

  async remover(id: string): Promise<void> {
    return this.handleRequest<void>(
      () => api.delete(`${this.baseUrl}/${id}`),
      'remover interação',
    );
  }

  async obterPorId(id: string): Promise<Interacao> {
    return this.handleRequest<Interacao>(
      () => api.get(`${this.baseUrl}/${id}`),
      'buscar interação',
    );
  }
}

export const interacoesService = new InteracoesService();
