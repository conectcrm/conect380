import { api, apiPublic } from './api';
import { getErrorMessage } from '../utils/errorHandling';

// ===========================
// Interfaces e Types
// ===========================

export enum StatusLead {
  NOVO = 'novo',
  CONTATADO = 'contatado',
  QUALIFICADO = 'qualificado',
  DESQUALIFICADO = 'desqualificado',
  CONVERTIDO = 'convertido',
}

export enum OrigemLead {
  FORMULARIO = 'formulario',
  IMPORTACAO = 'importacao',
  API = 'api',
  WHATSAPP = 'whatsapp',
  MANUAL = 'manual',
  INDICACAO = 'indicacao',
  OUTRO = 'outro',
}

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa_nome?: string;
  status: StatusLead;
  origem?: OrigemLead | string | null;
  score: number;
  observacoes?: string;
  responsavel_id?: string;
  data_primeiro_contato?: string;
  data_ultima_interacao?: string;
  convertido_oportunidade_id?: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;

  // Relações populadas (opcional)
  responsavel?: {
    id: string;
    username: string;
    nome?: string;
    email?: string;
  };
}

export interface CreateLeadDto {
  nome: string;
  email?: string;
  telefone?: string;
  empresa_nome?: string;
  origem?: OrigemLead;
  observacoes?: string;
  responsavel_id?: string;
}

export interface UpdateLeadDto {
  nome?: string;
  email?: string;
  telefone?: string;
  empresa_nome?: string;
  status?: StatusLead;
  origem?: OrigemLead;
  observacoes?: string;
  responsavel_id?: string;
}

export interface ConvertLeadDto {
  titulo_oportunidade?: string;
  valor_estimado?: number;
  data_fechamento_prevista?: string;
  observacoes?: string;
}

export interface CaptureLeadDto {
  nome: string;
  email: string;
  telefone?: string;
  empresa_nome?: string;
  mensagem?: string;
}

export interface LeadEstatisticas {
  total: number;
  novos: number;
  contatados: number;
  qualificados: number;
  desqualificados: number;
  convertidos: number;
  taxaConversao: number;
  scoreMedio: number;
  porOrigem: {
    origem: string;
    quantidade: number;
  }[];
  porResponsavel: {
    responsavel_id: string;
    responsavel_nome: string;
    quantidade: number;
  }[];
}

export interface PaginatedLeads {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadFilters {
  search?: string;
  status?: StatusLead | string;
  origem?: OrigemLead | string;
  responsavel_id?: string;
  score_min?: number;
  score_max?: number;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ImportLeadResult {
  total: number;
  importados: number;
  erros: number;
  detalhes?: Array<{
    linha: number;
    erro: string;
    dados?: Record<string, unknown>;
  }>;
}

// ===========================
// Service Class
// ===========================

class LeadsService {
  private readonly baseUrl = '/leads';
  private readonly errorPrefix = '[LeadsService]';

  private buildQueryString(params: any = {}): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
        return;
      }

      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
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

  private async handleVoidRequest(request: () => Promise<unknown>, context: string): Promise<void> {
    try {
      await request();
    } catch (err: unknown) {
      console.error(`${this.errorPrefix} ${context}:`, err);
      throw new Error(getErrorMessage(err, context));
    }
  }

  private sanitizePayload<T extends object>(data: T): Partial<T> {
    return Object.entries(data as Record<string, unknown>).reduce<Partial<T>>(
      (acc, [key, value]) => {
        if (value === undefined || value === null) {
          return acc;
        }

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') {
            return acc;
          }
          (acc as Record<string, unknown>)[key] = trimmed;
          return acc;
        }

        (acc as Record<string, unknown>)[key] = value;
        return acc;
      },
      {},
    );
  }

  /**
   * Lista todos os leads com filtros e paginação
   */
  async listar(filters: LeadFilters = {}): Promise<PaginatedLeads> {
    const query = this.buildQueryString(filters);
    return this.handleRequest<PaginatedLeads>(
      () => api.get(`${this.baseUrl}${query}`),
      'listar leads',
    );
  }

  /**
   * Busca um lead específico por ID
   */
  async buscarPorId(id: string): Promise<Lead> {
    return this.handleRequest<Lead>(() => api.get(`${this.baseUrl}/${id}`), `buscar lead ${id}`);
  }

  /**
   * Cria um novo lead
   */
  async criar(data: CreateLeadDto): Promise<Lead> {
    const payload = this.sanitizePayload(data);
    return this.handleRequest<Lead>(() => api.post(this.baseUrl, payload), 'criar lead');
  }

  /**
   * Atualiza um lead existente
   */
  async atualizar(id: string, data: UpdateLeadDto): Promise<Lead> {
    const payload = this.sanitizePayload(data);
    return this.handleRequest<Lead>(
      () => api.patch(`${this.baseUrl}/${id}`, payload),
      `atualizar lead ${id}`,
    );
  }

  /**
   * Deleta um lead
   */
  async deletar(id: string): Promise<void> {
    await this.handleVoidRequest(() => api.delete(`${this.baseUrl}/${id}`), `deletar lead ${id}`);
  }

  /**
   * Busca estatísticas dos leads
   */
  async getEstatisticas(): Promise<LeadEstatisticas> {
    return this.handleRequest<LeadEstatisticas>(
      () => api.get(`${this.baseUrl}/estatisticas`),
      'buscar estatísticas de leads',
    );
  }

  /**
   * Converte um lead em oportunidade
   */
  async converter(id: string, data: ConvertLeadDto = {}): Promise<Lead> {
    return this.handleRequest<Lead>(
      () => api.post(`${this.baseUrl}/${id}/converter`, data),
      `converter lead ${id}`,
    );
  }

  /**
   * Captura lead de formulário público (endpoint sem autenticação)
   */
  async capturarPublico(
    data: CaptureLeadDto,
  ): Promise<{ success: boolean; message: string; lead_id?: string }> {
    const payload = this.sanitizePayload(data);
    return this.handleRequest<{ success: boolean; message: string; lead_id?: string }>(
      () => apiPublic.post(`${this.baseUrl}/capture`, payload),
      'capturar lead público',
    );
  }

  /**
   * Importa múltiplos leads via CSV
   * @param file Arquivo CSV com colunas: nome, email, telefone, empresa_nome, origem
   */
  async importarCSV(file: File): Promise<ImportLeadResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.handleRequest<ImportLeadResult>(
      () =>
        api.post(`${this.baseUrl}/import`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      'importar leads via CSV',
    );
  }

  /**
   * Atualiza o score de um lead (recalcula baseado em critérios)
   */
  async recalcularScore(id: string): Promise<Lead> {
    return this.handleRequest<Lead>(
      () => api.post(`${this.baseUrl}/${id}/recalcular-score`),
      `recalcular score do lead ${id}`,
    );
  }

  /**
   * Atribui um responsável a um lead
   */
  async atribuirResponsavel(id: string, responsavel_id: string): Promise<Lead> {
    return this.handleRequest<Lead>(
      () =>
        api.patch(`${this.baseUrl}/${id}`, {
          responsavel_id,
        }),
      `atribuir responsável ao lead ${id}`,
    );
  }

  /**
   * Busca leads por email (útil para detectar duplicatas)
   */
  async buscarPorEmail(email: string): Promise<Lead[]> {
    const sanitizedEmail = email.trim();
    const query = this.buildQueryString({ search: sanitizedEmail });

    return this.handleRequest<Lead[]>(
      () => api.get(`${this.baseUrl}${query}`),
      `buscar lead por email ${sanitizedEmail}`,
    );
  }

  /**
   * Marca lead como qualificado
   */
  async qualificar(id: string, observacoes?: string): Promise<Lead> {
    return this.atualizar(id, {
      status: StatusLead.QUALIFICADO,
      observacoes,
    });
  }

  /**
   * Marca lead como não qualificado
   */
  async desqualificar(id: string, motivo?: string): Promise<Lead> {
    return this.atualizar(id, {
      status: StatusLead.DESQUALIFICADO,
      observacoes: motivo,
    });
  }

  /**
   * Registra primeiro contato com o lead
   */
  async registrarPrimeiroContato(id: string, observacoes?: string): Promise<Lead> {
    return this.atualizar(id, {
      status: StatusLead.CONTATADO,
      observacoes,
    });
  }
}

// ===========================
// Export singleton instance
// ===========================

export const leadsService = new LeadsService();
export default leadsService;
