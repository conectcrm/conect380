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

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
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
    const response = await api.get(`${this.baseUrl}/search?q=${encodeURIComponent(term)}`);
    return response.data;
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
}

export const clientesService = new ClientesService();
