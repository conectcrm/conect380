import api from './api';

export interface Fornecedor {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  cpf?: string;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato?: string;
  cargo?: string;
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoFornecedor {
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  cpf?: string;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato?: string;
  cargo?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface AtualizarFornecedor extends Partial<NovoFornecedor> {}

export type FiltrosFornecedor = {
  busca?: string;
  nome?: string; // alias legado
  ativo?: boolean;
  cidade?: string;
  estado?: string;
};

const buildFornecedorQueryParams = (filtros?: FiltrosFornecedor): URLSearchParams => {
  const params = new URLSearchParams();
  if (!filtros) return params;

  const busca = filtros.busca?.trim() || filtros.nome?.trim();
  if (busca) params.append('busca', busca);
  if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
  if (filtros.cidade) params.append('cidade', filtros.cidade);
  if (filtros.estado) params.append('estado', filtros.estado);

  return params;
};

export const fornecedorService = {
  async listarFornecedores(filtros?: FiltrosFornecedor): Promise<Fornecedor[]> {
    try {
      if (!filtros || Object.keys(filtros).length === 0) {
        const response = await api.get('/fornecedores');
        return response.data;
      }

      const params = buildFornecedorQueryParams(filtros);
      const response = await api.get(`/fornecedores?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar fornecedores:', error);
      throw error;
    }
  },

  async buscarFornecedorPorId(id: string): Promise<Fornecedor> {
    try {
      const response = await api.get(`/fornecedores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw error;
    }
  },

  async criarFornecedor(dados: NovoFornecedor): Promise<Fornecedor> {
    try {
      const response = await api.post('/fornecedores', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error;
    }
  },

  async atualizarFornecedor(id: string, dados: AtualizarFornecedor): Promise<Fornecedor> {
    try {
      const response = await api.put(`/fornecedores/${id}`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw error;
    }
  },

  async excluirFornecedor(id: string): Promise<void> {
    try {
      await api.delete(`/fornecedores/${id}`);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error;
    }
  },

  async buscarFornecedores(filtros: FiltrosFornecedor): Promise<Fornecedor[]> {
    try {
      const params = buildFornecedorQueryParams(filtros);
      const response = await api.get(`/fornecedores?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw error;
    }
  },

  async alternarStatus(id: string): Promise<Fornecedor> {
    try {
      const fornecedor = await fornecedorService.buscarFornecedorPorId(id);

      if (fornecedor.ativo) {
        const response = await api.patch(`/fornecedores/${id}/desativar`);
        return response.data?.fornecedor ?? response.data;
      }

      const response = await api.put(`/fornecedores/${id}`, { ativo: true });
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar status do fornecedor:', error);
      throw error;
    }
  },

  async excluirMultiplosFornecedores(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map((id) => api.delete(`/fornecedores/${id}`)));
    } catch (error) {
      console.error('Erro ao excluir fornecedores:', error);
      throw error;
    }
  },

  async exportarFornecedores(formato: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get(`/fornecedores/export?formato=${formato}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar fornecedores:', error);
      throw error;
    }
  },

  async obterEstatisticas(): Promise<{
    totalFornecedores: number;
    fornecedoresAtivos: number;
    fornecedoresInativos: number;
    novosFornecedesMes: number;
  }> {
    try {
      const response = await api.get('/fornecedores/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatisticas:', error);
      throw error;
    }
  },
};

export default fornecedorService;
