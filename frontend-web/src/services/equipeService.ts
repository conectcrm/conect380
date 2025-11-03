import api from './api';

// ========================================================================
// TYPES & INTERFACES
// ========================================================================

export interface Equipe {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  atendenteEquipes?: AtendenteEquipe[];
  atribuicoes?: EquipeAtribuicao[];
}

export interface AtendenteEquipe {
  id: string;
  atendenteId: string;
  equipeId: string;
  funcao: string; // 'lider', 'membro', 'supervisor'
  createdAt: string;
  updatedAt: string;
  atendente?: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface AtendenteAtribuicao {
  id: string;
  atendenteId: string;
  nucleoId?: string;
  departamentoId?: string;
  prioridade: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  nucleo?: {
    id: string;
    nome: string;
  };
  departamento?: {
    id: string;
    nome: string;
  };
}

export interface EquipeAtribuicao {
  id: string;
  equipeId: string;
  nucleoId?: string;
  departamentoId?: string;
  prioridade: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  nucleo?: {
    id: string;
    nome: string;
  };
  departamento?: {
    id: string;
    nome: string;
  };
}

export interface CreateEquipeDto {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
}

export interface UpdateEquipeDto {
  nome?: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
}

export interface AtribuirAtendenteDto {
  atendenteId: string;
  nucleoId?: string;
  departamentoId?: string;
  prioridade?: number;
}

export interface AtribuirEquipeDto {
  equipeId: string;
  nucleoId?: string;
  departamentoId?: string;
  prioridade?: number;
}

// ========================================================================
// SERVICE
// ========================================================================

class EquipeService {
  // ========================================================================
  // GESTÃO DE EQUIPES
  // ========================================================================

  /**
   * Lista todas as equipes da empresa
   */
  async listar(): Promise<Equipe[]> {
    const response = await api.get('/equipes');
    return response.data;
  }

  /**
   * Busca uma equipe por ID
   */
  async buscarPorId(id: string): Promise<Equipe> {
    const response = await api.get(`/equipes/${id}`);
    return response.data;
  }

  /**
   * Cria uma nova equipe
   */
  async criar(dados: CreateEquipeDto): Promise<Equipe> {
    const response = await api.post('/equipes', dados);
    return response.data;
  }

  /**
   * Atualiza uma equipe
   */
  async atualizar(id: string, dados: UpdateEquipeDto): Promise<Equipe> {
    const response = await api.put(`/equipes/${id}`, dados);
    return response.data;
  }

  /**
   * Remove uma equipe
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/equipes/${id}`);
  }

  // ========================================================================
  // GESTÃO DE MEMBROS
  // ========================================================================

  /**
   * Adiciona um atendente à equipe
   */
  async adicionarAtendente(
    equipeId: string,
    atendenteId: string,
    funcao: string = 'membro',
  ): Promise<AtendenteEquipe> {
    const response = await api.post(`/equipes/${equipeId}/atendentes`, {
      atendenteId,
      funcao,
    });
    return response.data;
  }

  /**
   * Remove um atendente da equipe
   */
  async removerAtendente(equipeId: string, atendenteId: string): Promise<void> {
    await api.delete(`/equipes/${equipeId}/atendentes/${atendenteId}`);
  }

  /**
   * Lista atendentes de uma equipe
   */
  async listarAtendentes(equipeId: string): Promise<any[]> {
    const response = await api.get(`/equipes/${equipeId}/atendentes`);
    return response.data;
  }

  /**
   * Lista atribuições de uma equipe
   */
  async listarAtribuicoes(equipeId: string): Promise<EquipeAtribuicao[]> {
    const response = await api.get(`/equipes/${equipeId}/atribuicoes`);
    return response.data;
  }

  // ========================================================================
  // ATRIBUIÇÕES
  // ========================================================================

  /**
   * Atribui um atendente diretamente a um núcleo ou departamento
   */
  async atribuirAtendente(dados: AtribuirAtendenteDto): Promise<AtendenteAtribuicao> {
    const response = await api.post('/atribuicoes/atendente', dados);
    return response.data;
  }

  /**
   * Remove uma atribuição de atendente
   */
  async removerAtribuicaoAtendente(atribuicaoId: string): Promise<void> {
    await api.delete(`/atribuicoes/atendente/${atribuicaoId}`);
  }

  /**
   * Lista atribuições de um atendente
   */
  async listarAtribuicoesAtendente(atendenteId: string): Promise<AtendenteAtribuicao[]> {
    const response = await api.get(`/atribuicoes/atendente/${atendenteId}`);
    return response.data;
  }

  /**
   * Atribui uma equipe a um núcleo ou departamento
   */
  async atribuirEquipe(dados: AtribuirEquipeDto): Promise<EquipeAtribuicao> {
    const response = await api.post('/atribuicoes/equipe', dados);
    return response.data;
  }

  /**
   * Remove uma atribuição de equipe
   */
  async removerAtribuicaoEquipe(atribuicaoId: string): Promise<void> {
    await api.delete(`/atribuicoes/equipe/${atribuicaoId}`);
  }

  /**
   * Busca atendentes disponíveis para um núcleo/departamento
   */
  async buscarAtendentesDisponiveis(
    nucleoId: string,
    departamentoId?: string,
  ): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('nucleoId', nucleoId);
    if (departamentoId) params.append('departamentoId', departamentoId);

    const response = await api.get(`/atribuicoes/disponiveis?${params.toString()}`);
    return response.data;
  }

  /**
   * Lista todos os atendentes cadastrados
   */
  async listarTodosAtendentes(): Promise<any[]> {
    const response = await api.get('/atendimento/atendentes');
    // Backend retorna { success: true, data: [...] }
    return response.data?.data || response.data;
  }
}

export default new EquipeService();
