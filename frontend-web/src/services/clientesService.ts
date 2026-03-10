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
  ultimo_contato?: string | null;
  proximo_contato?: string | null;
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  avatarUrl?: string;
  avatar_url?: string;
  foto?: string;
}

export type ClienteStatus = Cliente['status'];

export interface CreateClientePayload {
  nome: string;
  email: string;
  telefone?: string;
  tipo: Cliente['tipo'];
  documento?: string;
  cpf_cnpj?: string;
  status?: ClienteStatus;
  ativo?: boolean;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ultimo_contato?: string | null;
  proximo_contato?: string | null;
  avatar?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

export interface ClienteAttachment {
  id: string;
  clienteId?: string;
  cliente_id?: string;
  empresaId?: string;
  empresa_id?: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  created_at?: string;
}

export interface ClienteTicketResumoItem {
  id: string;
  numero: number | null;
  status: string;
  prioridade: string;
  assunto: string | null;
  atualizadoEm: string;
}

export interface ClienteTicketsResumo {
  total: number;
  abertos: number;
  resolvidos: number;
  ultimoAtendimentoEm: string | null;
  tickets: ClienteTicketResumoItem[];
}

export interface ClientePropostaResumoItem {
  id: string;
  numero: string | null;
  titulo: string | null;
  status: string;
  valor: number;
  atualizadaEm: string;
}

export interface ClientePropostasResumo {
  total: number;
  aprovadas: number;
  pendentes: number;
  rejeitadas: number;
  ultimoRegistroEm: string | null;
  propostas: ClientePropostaResumoItem[];
}

export interface ClienteContratoResumoItem {
  id: number;
  numero: string;
  status: string;
  tipo: string;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  atualizadoEm: string;
}

export interface ClienteContratosResumo {
  total: number;
  pendentes: number;
  assinados: number;
  encerrados: number;
  ultimoRegistroEm: string | null;
  contratos: ClienteContratoResumoItem[];
}

export interface ClienteFaturaResumoItem {
  id: number;
  numero: string;
  status: string;
  valorTotal: number;
  valorPago: number;
  dataVencimento: string;
  atualizadoEm: string;
}

export interface ClienteFaturasResumo {
  total: number;
  pagas: number;
  pendentes: number;
  vencidas: number;
  ultimoRegistroEm: string | null;
  faturas: ClienteFaturaResumoItem[];
}

export interface ClienteOmnichannelTicketResumoItem {
  id: string;
  numero: number | null;
  status: string;
  assunto: string | null;
  criadoEm: string;
  canalId?: string | null;
}

export interface ClienteOmnichannelContexto {
  cliente: {
    id: string | null;
    nome: string;
    email: string | null;
    telefone: string | null;
    documento?: string | null;
    empresa?: string | null;
    cargo?: string | null;
    segmento: string;
    primeiroContato: string;
    ultimoContato: string;
    tags?: string[];
  };
  estatisticas: {
    valorTotalGasto: number;
    totalTickets: number;
    ticketsResolvidos: number;
    ticketsAbertos: number;
    avaliacaoMedia: number;
    tempoMedioResposta: string;
  };
  historico: {
    propostas: Record<string, unknown>[];
    faturas: Record<string, unknown>[];
    tickets: ClienteOmnichannelTicketResumoItem[];
  };
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

export interface ClientesEstatisticas {
  total: number;
  ativos: number;
  prospects: number;
  leads: number;
  [key: string]: unknown;
}

export interface ClienteFilters {
  search?: string;
  status?: string;
  tipo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  cacheBust?: number;
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

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeCliente(payload: unknown): Cliente {
    const applyAvatarAliases = (cliente: Cliente): Cliente => ({
      ...cliente,
      avatar_url: cliente.avatar_url ?? cliente.avatarUrl ?? cliente.avatar,
      avatarUrl: cliente.avatarUrl ?? cliente.avatar_url ?? cliente.avatar,
      avatar: cliente.avatar ?? cliente.avatar_url ?? cliente.avatarUrl,
    });

    if (this.isObject(payload) && this.isObject(payload.data)) {
      return applyAvatarAliases(payload.data as unknown as Cliente);
    }

    return applyAvatarAliases(((payload as Cliente) ?? {}) as Cliente);
  }

  private normalizeClientesList(payload: unknown): Cliente[] {
    if (Array.isArray(payload)) {
      return (payload as Cliente[]).map((cliente) => this.normalizeCliente(cliente));
    }

    if (this.isObject(payload) && Array.isArray(payload.data)) {
      return (payload.data as Cliente[]).map((cliente) => this.normalizeCliente(cliente));
    }

    if (this.isObject(payload) && this.isObject(payload.data) && Array.isArray(payload.data.data)) {
      return (payload.data.data as Cliente[]).map((cliente) => this.normalizeCliente(cliente));
    }

    return [];
  }

  private normalizePaginatedClientes(payload: unknown, defaultLimit: number): PaginatedClientes {
    const empty: PaginatedClientes = {
      data: [],
      total: 0,
      page: 1,
      limit: defaultLimit,
      totalPages: 0,
    };

    if (!this.isObject(payload)) {
      return empty;
    }

    if (Array.isArray(payload.data)) {
      return {
        data: (payload.data as Cliente[]).map((cliente) => this.normalizeCliente(cliente)),
        total: this.toNumber(payload.total, 0),
        page: this.toNumber(payload.page, 1),
        limit: this.toNumber(payload.limit, defaultLimit),
        totalPages: this.toNumber(payload.totalPages, 1),
      };
    }

    if (this.isObject(payload.data) && Array.isArray(payload.data.data)) {
      return {
        data: (payload.data.data as Cliente[]).map((cliente) => this.normalizeCliente(cliente)),
        total: this.toNumber(payload.data.total, 0),
        page: this.toNumber(payload.data.page, 1),
        limit: this.toNumber(payload.data.limit, defaultLimit),
        totalPages: this.toNumber(payload.data.totalPages, 1),
      };
    }

    return empty;
  }

  private normalizeEstatisticas(payload: unknown): ClientesEstatisticas {
    if (this.isObject(payload) && this.isObject(payload.data)) {
      return payload.data as ClientesEstatisticas;
    }

    if (this.isObject(payload)) {
      return payload as ClientesEstatisticas;
    }

    return {
      total: 0,
      ativos: 0,
      prospects: 0,
      leads: 0,
    };
  }

  private normalizeAttachment(payload: unknown): ClienteAttachment {
    const attachment = (
      this.isObject(payload) && this.isObject(payload.data) ? payload.data : payload
    ) as ClienteAttachment;

    return {
      ...attachment,
      cliente_id: attachment.cliente_id ?? attachment.clienteId,
      clienteId: attachment.clienteId ?? attachment.cliente_id,
      empresa_id: attachment.empresa_id ?? attachment.empresaId,
      empresaId: attachment.empresaId ?? attachment.empresa_id,
    };
  }

  private normalizeAttachmentsList(payload: unknown): ClienteAttachment[] {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.normalizeAttachment(item));
    }

    if (this.isObject(payload) && Array.isArray(payload.data)) {
      return payload.data.map((item) => this.normalizeAttachment(item));
    }

    return [];
  }

  private buildQueryString(params: Partial<Record<string, unknown>> | ClienteFilters = {}): string {
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
    const payload = await this.handleRequest(
      () => api.get<PaginatedClientes>(`${this.baseUrl}${queryString}`),
      'Erro ao listar clientes',
    );
    return this.normalizePaginatedClientes(payload, filters.limit ?? 10);
  }

  async getClienteById(id: string): Promise<Cliente> {
    const payload = await this.handleRequest(
      () => api.get<Cliente>(`${this.baseUrl}/${id}`),
      'Erro ao buscar cliente',
    );
    return this.normalizeCliente(payload);
  }

  async createCliente(cliente: CreateClientePayload): Promise<Cliente> {
    const payload = await this.handleRequest(
      () => api.post<Cliente>(this.baseUrl, cliente),
      'Erro ao criar cliente',
    );
    return this.normalizeCliente(payload);
  }

  async updateCliente(id: string, cliente: Partial<CreateClientePayload>): Promise<Cliente> {
    const payload = await this.handleRequest(
      () => api.put<Cliente>(`${this.baseUrl}/${id}`, cliente),
      'Erro ao atualizar cliente',
    );
    return this.normalizeCliente(payload);
  }

  async updateClienteStatus(id: string, status: Cliente['status']): Promise<Cliente> {
    const payload = await this.handleRequest(
      () => api.put<Cliente>(`${this.baseUrl}/${id}/status`, { status }),
      'Erro ao atualizar status do cliente',
    );
    return this.normalizeCliente(payload);
  }

  async deleteCliente(id: string): Promise<void> {
    await this.handleVoidRequest(
      () => api.delete(`${this.baseUrl}/${id}`),
      'Erro ao excluir cliente',
    );
  }

  async getClientesByStatus(status: Cliente['status']): Promise<Cliente[]> {
    const payload = await this.handleRequest(
      () => api.get<Cliente[]>(`${this.baseUrl}/status/${status}`),
      'Erro ao listar clientes por status',
    );
    return this.normalizeClientesList(payload);
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

  async getEstartisticas(): Promise<ClientesEstatisticas> {
    const payload = await this.handleRequest(
      () => api.get<ClientesEstatisticas>(`${this.baseUrl}/estatisticas`),
      'Erro ao carregar estatisticas de clientes',
    );
    return this.normalizeEstatisticas(payload);
  }

  async getEstatisticas(): Promise<ClientesEstatisticas> {
    const payload = await this.handleRequest(
      () => api.get<ClientesEstatisticas>(`${this.baseUrl}/estatisticas`),
      'Erro ao carregar estatisticas de clientes',
    );
    return this.normalizeEstatisticas(payload);
  }

  async listarAnexosCliente(clienteId: string): Promise<ClienteAttachment[]> {
    const payload = await this.handleRequest(
      () => api.get<ClienteAttachment[]>(`${this.baseUrl}/${clienteId}/anexos`),
      'Erro ao listar anexos do cliente',
    );
    return this.normalizeAttachmentsList(payload);
  }

  async removerAnexoCliente(clienteId: string, anexoId: string): Promise<void> {
    await this.handleVoidRequest(
      () => api.delete(`${this.baseUrl}/${clienteId}/anexos/${anexoId}`),
      'Erro ao remover anexo do cliente',
    );
  }

  async getResumoTicketsCliente(
    clienteId: string,
    limit = 5,
  ): Promise<ClienteTicketsResumo> {
    const queryString = this.buildQueryString({ limit });

    const payload = await this.handleRequest(
      () =>
        api.get<ClienteTicketsResumo>(`${this.baseUrl}/${clienteId}/tickets/resumo${queryString}`),
      'Erro ao carregar resumo de tickets do cliente',
    );

    if (this.isObject(payload) && this.isObject(payload.data)) {
      return payload.data as unknown as ClienteTicketsResumo;
    }

    return payload as unknown as ClienteTicketsResumo;
  }

  async getResumoPropostasCliente(
    clienteId: string,
    limit = 5,
  ): Promise<ClientePropostasResumo> {
    const queryString = this.buildQueryString({ limit });

    const payload = await this.handleRequest(
      () =>
        api.get<ClientePropostasResumo>(
          `${this.baseUrl}/${clienteId}/propostas/resumo${queryString}`,
        ),
      'Erro ao carregar resumo de propostas do cliente',
    );

    if (this.isObject(payload) && this.isObject(payload.data)) {
      return payload.data as unknown as ClientePropostasResumo;
    }

    return payload as unknown as ClientePropostasResumo;
  }

  async getResumoContratosCliente(
    clienteId: string,
    limit = 5,
  ): Promise<ClienteContratosResumo> {
    const queryString = this.buildQueryString({ limit });

    const payload = await this.handleRequest(
      () =>
        api.get<ClienteContratosResumo>(`${this.baseUrl}/${clienteId}/contratos/resumo${queryString}`),
      'Erro ao carregar resumo de contratos do cliente',
    );

    if (this.isObject(payload) && this.isObject(payload.data)) {
      return payload.data as unknown as ClienteContratosResumo;
    }

    return payload as unknown as ClienteContratosResumo;
  }

  async getResumoFaturasCliente(
    clienteId: string,
    limit = 5,
  ): Promise<ClienteFaturasResumo> {
    const queryString = this.buildQueryString({ limit });

    const payload = await this.handleRequest(
      () => api.get<ClienteFaturasResumo>(`${this.baseUrl}/${clienteId}/faturas/resumo${queryString}`),
      'Erro ao carregar resumo de faturas do cliente',
    );

    if (this.isObject(payload) && this.isObject(payload.data)) {
      return payload.data as unknown as ClienteFaturasResumo;
    }

    return payload as unknown as ClienteFaturasResumo;
  }

  async getContextoOmnichannelCliente(clienteId: string): Promise<ClienteOmnichannelContexto> {
    const payload = await this.handleRequest(
      () => api.get<ClienteOmnichannelContexto>(`/api/atendimento/clientes/${clienteId}/contexto`),
      'Erro ao carregar contexto omnichannel do cliente',
    );

    if (this.isObject(payload) && this.isObject(payload.data)) {
      return payload.data as unknown as ClienteOmnichannelContexto;
    }

    return payload as unknown as ClienteOmnichannelContexto;
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
