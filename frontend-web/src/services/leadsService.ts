import { api } from './api';

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
    dados?: any;
  }>;
}

// ===========================
// Service Class
// ===========================

class LeadsService {
  private readonly baseUrl = '/leads';

  private sanitizePayload<T extends object>(data: T): Partial<T> {
    return Object.entries(data as Record<string, unknown>).reduce<Partial<T>>((acc, [key, value]) => {
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
    }, {});
  }

  /**
   * Lista todos os leads com filtros e paginação
   */
  async listar(filters: LeadFilters = {}): Promise<PaginatedLeads> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await api.get<PaginatedLeads>(url);
    return response.data;
  }

  /**
   * Busca um lead específico por ID
   */
  async buscarPorId(id: string): Promise<Lead> {
    const response = await api.get<Lead>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Cria um novo lead
   */
  async criar(data: CreateLeadDto): Promise<Lead> {
    const payload = this.sanitizePayload(data);
    const response = await api.post<Lead>(this.baseUrl, payload);
    return response.data;
  }

  /**
   * Atualiza um lead existente
   */
  async atualizar(id: string, data: UpdateLeadDto): Promise<Lead> {
    const payload = this.sanitizePayload(data);
    const response = await api.patch<Lead>(`${this.baseUrl}/${id}`, payload);
    return response.data;
  }

  /**
   * Deleta um lead
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Busca estatísticas dos leads
   */
  async getEstatisticas(): Promise<LeadEstatisticas> {
    const response = await api.get<LeadEstatisticas>(`${this.baseUrl}/estatisticas`);
    return response.data;
  }

  /**
   * Converte um lead em oportunidade
   */
  async converter(id: string, data: ConvertLeadDto = {}): Promise<Lead> {
    const response = await api.post<Lead>(`${this.baseUrl}/${id}/converter`, data);
    return response.data;
  }

  /**
   * Captura lead de formulário público (endpoint sem autenticação)
   */
  async capturarPublico(data: CaptureLeadDto): Promise<{ success: boolean; message: string; lead_id?: string }> {
    const response = await api.post<{ success: boolean; message: string; lead_id?: string }>(
      `${this.baseUrl}/capture`,
      data
    );
    return response.data;
  }

  /**
   * Importa múltiplos leads via CSV
   * @param file Arquivo CSV com colunas: nome, email, telefone, empresa_nome, origem
   */
  async importarCSV(file: File): Promise<ImportLeadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImportLeadResult>(
      `${this.baseUrl}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Atualiza o score de um lead (recalcula baseado em critérios)
   */
  async recalcularScore(id: string): Promise<Lead> {
    const response = await api.post<Lead>(`${this.baseUrl}/${id}/recalcular-score`);
    return response.data;
  }

  /**
   * Atribui um responsável a um lead
   */
  async atribuirResponsavel(id: string, responsavel_id: string): Promise<Lead> {
    const response = await api.patch<Lead>(`${this.baseUrl}/${id}`, {
      responsavel_id,
    });
    return response.data;
  }

  /**
   * Busca leads por email (útil para detectar duplicatas)
   */
  async buscarPorEmail(email: string): Promise<Lead[]> {
    const response = await api.get<Lead[]>(`${this.baseUrl}`, {
      params: { search: email },
    });
    return response.data;
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
