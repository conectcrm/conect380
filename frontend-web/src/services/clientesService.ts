import { api } from './api';
import { getErrorMessage } from '../utils/errorHandling';

type ApiError = {
  response?: {
    status?: number;
  };
};

export interface Cliente {
  id?: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  documento?: string;
  status: 'lead' | 'prospect' | 'cliente' | 'inativo';
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  empresa?: string;
  cargo?: string;
  site?: string;
  observacoes?: string;
  tags?: string[];
  data_nascimento?: string;
  genero?: string;
  profissao?: string;
  renda?: number;
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  avatarUrl?: string;
  foto?: string;
}

export interface NotaCliente {
  id: string;
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId: string;
  conteudo: string;
  importante: boolean;
  autorId: string;
  autor?: {
    id: string;
    username: string;
    nome?: string;
    foto?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  dataCriacao?: string;
  dataEdicao?: string;
}

export interface CreateNotaDto {
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId?: string;
  conteudo: string;
  importante?: boolean;
}

export interface UpdateNotaDto {
  conteudo?: string;
  importante?: boolean;
}

export interface Demanda {
  id: string;
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId: string;
  titulo: string;
  descricao?: string;
  tipo:
  | 'tecnica'
  | 'comercial'
  | 'financeira'
  | 'suporte'
  | 'reclamacao'
  | 'solicitacao'
  | 'outros';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
  dataVencimento?: string;
  dataConclusao?: string;
  responsavelId?: string;
  responsavel?: {
    id: string;
    username: string;
    nome?: string;
  };
  autorId: string;
  autor?: {
    id: string;
    username: string;
    nome?: string;
  };
  createdAt: string;
  updatedAt: string;
  dataAbertura?: string;
}

export interface CreateDemandaDto {
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId?: string;
  titulo: string;
  descricao?: string;
  tipo?:
  | 'tecnica'
  | 'comercial'
  | 'financeira'
  | 'suporte'
  | 'reclamacao'
  | 'solicitacao'
  | 'outros';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  status?: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
  dataVencimento?: string;
  responsavelId?: string;
}

export interface UpdateDemandaDto {
  titulo?: string;
  descricao?: string;
  tipo?:
  | 'tecnica'
  | 'comercial'
  | 'financeira'
  | 'suporte'
  | 'reclamacao'
  | 'solicitacao'
  | 'outros';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  status?: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
  dataVencimento?: string;
  responsavelId?: string;
}

export interface PaginatedClientes {
  data: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClienteFilters {
  search?: string;
  status?: string;
  tipo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

class ClientesService {
  private readonly baseUrl = '/clientes';
  private readonly maxConcurrentSearches = 2;
  private readonly minIntervalBetweenSearches = 150; // ms
  private readonly rateLimitCooldownMs = 5000;
  private searchQueue: Array<() => void> = [];
  private inFlightSearches = 0;
  private lastSearchAt = 0;
  private searchCooldownUntil = 0;
  private lastRateLimitAt = 0;

  private buildQueryString(params: Record<string, unknown> = {}): string {
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
      console.error(`[ClientesService] ${context}:`, err);
      throw new Error(getErrorMessage(err, context));
    }
  }

  private async handleVoidRequest(request: () => Promise<unknown>, context: string): Promise<void> {
    try {
      await request();
    } catch (err: unknown) {
      console.error(`[ClientesService] ${context}:`, err);
      throw new Error(getErrorMessage(err, context));
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private processSearchQueue(): void {
    if (this.inFlightSearches >= this.maxConcurrentSearches) {
      return;
    }

    const next = this.searchQueue.shift();
    if (next) {
      next();
    }
  }

  private async scheduleSearchRequest<T>(executor: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async (): Promise<void> => {
        try {
          if (Date.now() < this.searchCooldownUntil) {
            await this.delay(this.searchCooldownUntil - Date.now());
          }

          const elapsed = Date.now() - this.lastSearchAt;
          if (elapsed < this.minIntervalBetweenSearches) {
            await this.delay(this.minIntervalBetweenSearches - elapsed);
          }

          this.inFlightSearches++;
          this.lastSearchAt = Date.now();

          const result = await executor();
          resolve(result);
        } catch (error) {
          const status = (error as ApiError)?.response?.status;
          if (status === 429) {
            this.searchCooldownUntil = Date.now() + this.rateLimitCooldownMs;
            this.lastRateLimitAt = Date.now();
            console.warn(
              `⚠️ [ClientesService] Rate limit detectado (429). Cooldown de ${this.rateLimitCooldownMs}ms aplicado.`,
            );
          }
          reject(error);
        } finally {
          this.inFlightSearches = Math.max(0, this.inFlightSearches - 1);
          this.processSearchQueue();
        }
      };

      if (this.inFlightSearches < this.maxConcurrentSearches) {
        run().catch(() => {
          // Erro será propagado pelo reject acima
        });
      } else {
        this.searchQueue.push(() => {
          run().catch(() => {
            // Erro será propagado pelo reject acima
          });
        });
      }
    });
  }

  async getClientes(filters: ClienteFilters = {}): Promise<PaginatedClientes> {
    const queryString = this.buildQueryString(filters);
    return this.handleRequest(
      () => api.get<PaginatedClientes>(`${this.baseUrl}${queryString}`),
      'Erro ao listar clientes',
    );
  }

  async getClienteById(id: string): Promise<Cliente> {
    return this.handleRequest(
      () => api.get<Cliente>(`${this.baseUrl}/${id}`),
      'Erro ao buscar cliente',
    );
  }

  async createCliente(
    cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Cliente> {
    return this.handleRequest(
      () => api.post<Cliente>(this.baseUrl, cliente),
      'Erro ao criar cliente',
    );
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    return this.handleRequest(
      () => api.put<Cliente>(`${this.baseUrl}/${id}`, cliente),
      'Erro ao atualizar cliente',
    );
  }

  async deleteCliente(id: string): Promise<void> {
    await this.handleVoidRequest(
      () => api.delete(`${this.baseUrl}/${id}`),
      'Erro ao excluir cliente',
    );
  }

  async getClientesByStatus(status: Cliente['status']): Promise<Cliente[]> {
    return this.handleRequest(
      () => api.get<Cliente[]>(`${this.baseUrl}/status/${status}`),
      'Erro ao listar clientes por status',
    );
  }

  async searchClientes(term: string): Promise<Cliente[]> {
    try {
      const response = await this.scheduleSearchRequest(() =>
        api.get<{ data?: Cliente[]; results?: Cliente[] }>(
          `${this.baseUrl}?search=${encodeURIComponent(term)}&limit=50`,
        ),
      );
      const payload = response.data;

      if (Array.isArray(payload)) {
        return payload;
      }

      if (Array.isArray(payload?.data)) {
        return payload.data;
      }

      if (Array.isArray(payload?.results)) {
        return payload.results;
      }

      return [];
    } catch (err: unknown) {
      console.error('Erro na busca de clientes:', err);
      throw new Error(getErrorMessage(err, 'Erro na busca de clientes'));
    }
  }

  isSearchRateLimited(): boolean {
    return Date.now() < this.searchCooldownUntil;
  }

  getSearchCooldownRemaining(): number {
    return Math.max(0, this.searchCooldownUntil - Date.now());
  }

  async exportClientes(filters: ClienteFilters = {}): Promise<Blob> {
    const queryString = this.buildQueryString(filters);
    return this.handleRequest(
      () =>
        api.get<Blob>(`${this.baseUrl}/export${queryString}`, {
          responseType: 'blob',
        }),
      'Erro ao exportar clientes',
    );
  }

  async getEstartisticas(): Promise<Record<string, unknown>> {
    return this.handleRequest(
      () => api.get<Record<string, unknown>>(`${this.baseUrl}/estatisticas`),
      'Erro ao carregar estatísticas de clientes',
    );
  }

  // ========================================
  // NOTAS DO CLIENTE
  // ========================================

  /**
   * Criar nova nota para cliente/ticket
   */
  async criarNota(nota: CreateNotaDto): Promise<NotaCliente> {
    return this.handleRequest(() => api.post<NotaCliente>('/notas', nota), 'Erro ao criar nota');
  }

  /**
   * Buscar nota por ID
   */
  async buscarNotaPorId(notaId: string): Promise<NotaCliente> {
    return this.handleRequest(
      () => api.get<NotaCliente>(`/notas/${notaId}`),
      'Erro ao buscar nota',
    );
  }

  /**
   * Listar todas as notas de um cliente
   */
  async listarNotasCliente(clienteId: string, empresaId?: string): Promise<NotaCliente[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<NotaCliente[]>(`/notas/cliente/${clienteId}${queryString}`),
      'Erro ao listar notas do cliente',
    );
  }

  /**
   * Buscar notas por telefone (fallback quando não há clienteId)
   */
  async listarNotasPorTelefone(telefone: string, empresaId?: string): Promise<NotaCliente[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<NotaCliente[]>(`/notas/telefone/${telefone}${queryString}`),
      'Erro ao listar notas por telefone',
    );
  }

  /**
   * Buscar notas de um ticket específico
   */
  async listarNotasTicket(ticketId: string, empresaId?: string): Promise<NotaCliente[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<NotaCliente[]>(`/notas/ticket/${ticketId}${queryString}`),
      'Erro ao listar notas do ticket',
    );
  }

  /**
   * Atualizar nota
   */
  async atualizarNota(notaId: string, nota: UpdateNotaDto): Promise<NotaCliente> {
    return this.handleRequest(
      () => api.patch<NotaCliente>(`/notas/${notaId}`, nota),
      'Erro ao atualizar nota',
    );
  }

  /**
   * Marcar/desmarcar nota como importante
   */
  async toggleImportante(notaId: string, importante: boolean): Promise<NotaCliente> {
    return this.handleRequest(
      () => api.patch<NotaCliente>(`/notas/${notaId}/importante`, { importante }),
      'Erro ao atualizar destaque da nota',
    );
  }

  /**
   * Deletar nota
   */
  async deletarNota(notaId: string): Promise<void> {
    await this.handleVoidRequest(() => api.delete(`/notas/${notaId}`), 'Erro ao excluir nota');
  }

  /**
   * Contar notas de um cliente
   */
  async contarNotasCliente(
    clienteId: string,
    empresaId?: string,
  ): Promise<{ total: number; importantes: number }> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () =>
        api.get<{ total: number; importantes: number }>(
          `/notas/cliente/${clienteId}/count${queryString}`,
        ),
      'Erro ao contar notas do cliente',
    );
  }

  // ===== Métodos de Demandas =====

  /**
   * Criar uma nova demanda
   */
  async criarDemanda(demanda: CreateDemandaDto): Promise<Demanda> {
    return this.handleRequest(
      () => api.post<Demanda>('/demandas', demanda),
      'Erro ao criar demanda',
    );
  }

  /**
   * Buscar demanda por ID
   */
  async buscarDemandaPorId(demandaId: string): Promise<Demanda> {
    return this.handleRequest(
      () => api.get<Demanda>(`/demandas/${demandaId}`),
      'Erro ao buscar demanda',
    );
  }

  /**
   * Listar todas as demandas de um cliente
   */
  async listarDemandasCliente(clienteId: string, empresaId?: string): Promise<Demanda[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<Demanda[]>(`/demandas/cliente/${clienteId}${queryString}`),
      'Erro ao listar demandas do cliente',
    );
  }

  /**
   * Buscar demandas por telefone (fallback quando não há clienteId)
   */
  async listarDemandasPorTelefone(telefone: string, empresaId?: string): Promise<Demanda[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<Demanda[]>(`/demandas/telefone/${telefone}${queryString}`),
      'Erro ao listar demandas por telefone',
    );
  }

  /**
   * Buscar demandas de um ticket específico
   */
  async listarDemandasTicket(ticketId: string, empresaId?: string): Promise<Demanda[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<Demanda[]>(`/demandas/ticket/${ticketId}${queryString}`),
      'Erro ao listar demandas do ticket',
    );
  }

  /**
   * Buscar demandas por status
   */
  async buscarDemandasPorStatus(
    status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
    empresaId?: string,
  ): Promise<Demanda[]> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () => api.get<Demanda[]>(`/demandas/status/${status}${queryString}`),
      'Erro ao listar demandas por status',
    );
  }

  /**
   * Atualizar demanda
   */
  async atualizarDemanda(demandaId: string, demanda: UpdateDemandaDto): Promise<Demanda> {
    return this.handleRequest(
      () => api.patch<Demanda>(`/demandas/${demandaId}`, demanda),
      'Erro ao atualizar demanda',
    );
  }

  /**
   * Atribuir responsável à demanda
   */
  async atribuirResponsavel(demandaId: string, responsavelId: string): Promise<Demanda> {
    return this.handleRequest(
      () => api.patch<Demanda>(`/demandas/${demandaId}/responsavel`, { responsavelId }),
      'Erro ao atribuir responsável à demanda',
    );
  }

  /**
   * Alterar status da demanda
   */
  async alterarStatusDemanda(
    demandaId: string,
    status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
  ): Promise<Demanda> {
    return this.handleRequest(
      () => api.patch<Demanda>(`/demandas/${demandaId}/status`, { status }),
      'Erro ao alterar status da demanda',
    );
  }

  /**
   * Iniciar demanda (atalho para status em_andamento)
   */
  async iniciarDemanda(demandaId: string): Promise<Demanda> {
    return this.handleRequest(
      () => api.patch<Demanda>(`/demandas/${demandaId}/iniciar`),
      'Erro ao iniciar demanda',
    );
  }

  /**
   * Concluir demanda
   */
  async concluirDemanda(demandaId: string): Promise<Demanda> {
    return this.handleRequest(
      () => api.patch<Demanda>(`/demandas/${demandaId}/concluir`),
      'Erro ao concluir demanda',
    );
  }

  /**
   * Cancelar demanda
   */
  async cancelarDemanda(demandaId: string): Promise<Demanda> {
    return this.handleRequest(
      () => api.patch<Demanda>(`/demandas/${demandaId}/cancelar`),
      'Erro ao cancelar demanda',
    );
  }

  /**
   * Deletar demanda
   */
  async deletarDemanda(demandaId: string): Promise<void> {
    await this.handleVoidRequest(
      () => api.delete(`/demandas/${demandaId}`),
      'Erro ao excluir demanda',
    );
  }

  /**
   * Contar demandas de um cliente
   */
  async contarDemandasCliente(
    clienteId: string,
    empresaId?: string,
  ): Promise<{ total: number; abertas: number; urgentes: number }> {
    const queryString = this.buildQueryString({ empresaId });
    return this.handleRequest(
      () =>
        api.get<{ total: number; abertas: number; urgentes: number }>(
          `/demandas/cliente/${clienteId}/count${queryString}`,
        ),
      'Erro ao contar demandas do cliente',
    );
  }
}

export const clientesService = new ClientesService();
