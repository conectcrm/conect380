import api from './api';

export interface Fornecedor {
  id: number;
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

export interface AtualizarFornecedor extends Partial<NovoFornecedor> { }

export const fornecedorService = {
  // Listar todos os fornecedores
  async listarFornecedores(filtros?: {
    nome?: string;
    ativo?: boolean;
    cidade?: string;
    estado?: string;
  }): Promise<Fornecedor[]> {
    try {
      if (!filtros || Object.keys(filtros).length === 0) {
        const response = await api.get('/fornecedores');
        return response.data;
      }

      const params = new URLSearchParams();

      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await api.get(`/fornecedores?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar fornecedores:', error);
      throw error;
    }
  },

  // Buscar fornecedor por ID
  async buscarFornecedorPorId(id: number): Promise<Fornecedor> {
    try {
      const response = await api.get(`/fornecedores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw error;
    }
  },

  // Criar novo fornecedor
  async criarFornecedor(dados: NovoFornecedor): Promise<Fornecedor> {
    try {
      const response = await api.post('/fornecedores', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error;
    }
  },

  // Atualizar fornecedor
  async atualizarFornecedor(id: number, dados: AtualizarFornecedor): Promise<Fornecedor> {
    try {
      const response = await api.put(`/fornecedores/${id}`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw error;
    }
  },

  // Excluir fornecedor
  async excluirFornecedor(id: number): Promise<void> {
    try {
      await api.delete(`/fornecedores/${id}`);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error;
    }
  },

  // Buscar fornecedores com filtros
  async buscarFornecedores(filtros: {
    nome?: string;
    ativo?: boolean;
    cidade?: string;
    estado?: string;
  }): Promise<Fornecedor[]> {
    try {
      const params = new URLSearchParams();

      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.ativo !== undefined) params.append('ativo', String(filtros.ativo));
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.estado) params.append('estado', filtros.estado);

      const response = await api.get(`/fornecedores?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw error;
    }
  },

  // Alternar status ativo/inativo
  async alternarStatus(id: number): Promise<Fornecedor> {
    try {
      const response = await api.patch(`/fornecedores/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar status do fornecedor:', error);
      throw error;
    }
  },

  // Excluir múltiplos fornecedores
  async excluirMultiplosFornecedores(ids: number[]): Promise<void> {
    try {
      await api.delete('/fornecedores/bulk', { data: { ids } });
    } catch (error) {
      console.error('Erro ao excluir fornecedores:', error);
      throw error;
    }
  },

  // Exportar fornecedores
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

  // Obter estatísticas de fornecedores
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
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
};

export default fornecedorService;