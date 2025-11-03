import { api } from './api';

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
  };
  createdAt: string;
  updatedAt: string;
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
  tipo: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';
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
}

export interface CreateDemandaDto {
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId?: string;
  titulo: string;
  descricao?: string;
  tipo?: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  status?: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
  dataVencimento?: string;
  responsavelId?: string;
}

export interface UpdateDemandaDto {
  titulo?: string;
  descricao?: string;
  tipo?: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';
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

  async getClientes(filters: ClienteFilters = {}): Promise<PaginatedClientes> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const response = await api.get(`${this.baseUrl}?${queryString}`);

    return response.data;
  }

  async getClienteById(id: string): Promise<Cliente> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    const response = await api.post(this.baseUrl, cliente);
    return response.data;
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    const response = await api.put(`${this.baseUrl}/${id}`, cliente);
    return response.data;
  }

  async deleteCliente(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getClientesByStatus(status: Cliente['status']): Promise<Cliente[]> {
    const response = await api.get(`${this.baseUrl}/status/${status}`);
    return response.data;
  }

  async searchClientes(term: string): Promise<Cliente[]> {
    try {
      // Usar o endpoint principal com parâmetro search
      const response = await api.get(`${this.baseUrl}?search=${encodeURIComponent(term)}&limit=50`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Erro na busca de clientes:', error);
      // Retornar array vazio em caso de erro
      return [];
    }
  }

  async exportClientes(filters: ClienteFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getEstartisticas() {
    const response = await api.get(`${this.baseUrl}/estatisticas`);
    return response.data;
  }

  // ========================================
  // NOTAS DO CLIENTE
  // ========================================

  /**
   * Criar nova nota para cliente/ticket
   */
  async criarNota(nota: CreateNotaDto): Promise<NotaCliente> {
    const response = await api.post('/notas', nota);
    return response.data;
  }

  /**
   * Buscar nota por ID
   */
  async buscarNotaPorId(notaId: string): Promise<NotaCliente> {
    const response = await api.get(`/notas/${notaId}`);
    return response.data;
  }

  /**
   * Listar todas as notas de um cliente
   */
  async listarNotasCliente(clienteId: string, empresaId?: string): Promise<NotaCliente[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/notas/cliente/${clienteId}${params}`);
    return response.data;
  }

  /**
   * Buscar notas por telefone (fallback quando não há clienteId)
   */
  async listarNotasPorTelefone(telefone: string, empresaId?: string): Promise<NotaCliente[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/notas/telefone/${telefone}${params}`);
    return response.data;
  }

  /**
   * Buscar notas de um ticket específico
   */
  async listarNotasTicket(ticketId: string, empresaId?: string): Promise<NotaCliente[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/notas/ticket/${ticketId}${params}`);
    return response.data;
  }

  /**
   * Atualizar nota
   */
  async atualizarNota(notaId: string, nota: UpdateNotaDto): Promise<NotaCliente> {
    const response = await api.patch(`/notas/${notaId}`, nota);
    return response.data;
  }

  /**
   * Marcar/desmarcar nota como importante
   */
  async toggleImportante(notaId: string, importante: boolean): Promise<NotaCliente> {
    const response = await api.patch(`/notas/${notaId}/importante`, { importante });
    return response.data;
  }

  /**
   * Deletar nota
   */
  async deletarNota(notaId: string): Promise<void> {
    await api.delete(`/notas/${notaId}`);
  }

  /**
   * Contar notas de um cliente
   */
  async contarNotasCliente(clienteId: string, empresaId?: string): Promise<{ total: number; importantes: number }> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/notas/cliente/${clienteId}/count${params}`);
    return response.data;
  }

  // ===== Métodos de Demandas =====

  /**
   * Criar uma nova demanda
   */
  async criarDemanda(demanda: CreateDemandaDto): Promise<Demanda> {
    const response = await api.post('/demandas', demanda);
    return response.data;
  }

  /**
   * Buscar demanda por ID
   */
  async buscarDemandaPorId(demandaId: string): Promise<Demanda> {
    const response = await api.get(`/demandas/${demandaId}`);
    return response.data;
  }

  /**
   * Listar todas as demandas de um cliente
   */
  async listarDemandasCliente(clienteId: string, empresaId?: string): Promise<Demanda[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/demandas/cliente/${clienteId}${params}`);
    return response.data;
  }

  /**
   * Buscar demandas por telefone (fallback quando não há clienteId)
   */
  async listarDemandasPorTelefone(telefone: string, empresaId?: string): Promise<Demanda[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/demandas/telefone/${telefone}${params}`);
    return response.data;
  }

  /**
   * Buscar demandas de um ticket específico
   */
  async listarDemandasTicket(ticketId: string, empresaId?: string): Promise<Demanda[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/demandas/ticket/${ticketId}${params}`);
    return response.data;
  }

  /**
   * Buscar demandas por status
   */
  async buscarDemandasPorStatus(
    status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
    empresaId?: string
  ): Promise<Demanda[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/demandas/status/${status}${params}`);
    return response.data;
  }

  /**
   * Atualizar demanda
   */
  async atualizarDemanda(demandaId: string, demanda: UpdateDemandaDto): Promise<Demanda> {
    const response = await api.patch(`/demandas/${demandaId}`, demanda);
    return response.data;
  }

  /**
   * Atribuir responsável à demanda
   */
  async atribuirResponsavel(demandaId: string, responsavelId: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${demandaId}/responsavel`, { responsavelId });
    return response.data;
  }

  /**
   * Alterar status da demanda
   */
  async alterarStatusDemanda(
    demandaId: string,
    status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
  ): Promise<Demanda> {
    const response = await api.patch(`/demandas/${demandaId}/status`, { status });
    return response.data;
  }

  /**
   * Iniciar demanda (atalho para status em_andamento)
   */
  async iniciarDemanda(demandaId: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${demandaId}/iniciar`);
    return response.data;
  }

  /**
   * Concluir demanda
   */
  async concluirDemanda(demandaId: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${demandaId}/concluir`);
    return response.data;
  }

  /**
   * Cancelar demanda
   */
  async cancelarDemanda(demandaId: string): Promise<Demanda> {
    const response = await api.patch(`/demandas/${demandaId}/cancelar`);
    return response.data;
  }

  /**
   * Deletar demanda
   */
  async deletarDemanda(demandaId: string): Promise<void> {
    await api.delete(`/demandas/${demandaId}`);
  }

  /**
   * Contar demandas de um cliente
   */
  async contarDemandasCliente(
    clienteId: string,
    empresaId?: string
  ): Promise<{ total: number; abertas: number; urgentes: number }> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const response = await api.get(`/demandas/cliente/${clienteId}/count${params}`);
    return response.data;
  }
}

export const clientesService = new ClientesService();
