import api from './api';

/**
 * Service para Distribuição Automática Avançada
 * Conecta com backend: /distribuicao-avancada
 */

// ========================================
// INTERFACES / TYPES
// ========================================

export type AlgoritmoDistribuicao = 'round-robin' | 'menor-carga' | 'skills' | 'hibrido';

export interface DistribuicaoConfig {
  id: string;
  filaId: string;
  fila?: {
    id: string;
    nome: string;
  };
  algoritmo: AlgoritmoDistribuicao;
  capacidadeMaxima: number;
  priorizarOnline: boolean;
  considerarSkills: boolean;
  tempoTimeoutMin: number;
  permitirOverflow: boolean;
  filaBackupId?: string;
  filaBackup?: {
    id: string;
    nome: string;
  };
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateDistribuicaoConfigDto {
  filaId: string;
  algoritmo: AlgoritmoDistribuicao;
  capacidadeMaxima: number;
  priorizarOnline?: boolean;
  considerarSkills?: boolean;
  tempoTimeoutMin?: number;
  permitirOverflow?: boolean;
  filaBackupId?: string;
  ativo?: boolean;
}

export interface UpdateDistribuicaoConfigDto {
  algoritmo?: AlgoritmoDistribuicao;
  capacidadeMaxima?: number;
  priorizarOnline?: boolean;
  considerarSkills?: boolean;
  tempoTimeoutMin?: number;
  permitirOverflow?: boolean;
  filaBackupId?: string;
  ativo?: boolean;
}

export interface AtendenteSkill {
  id: string;
  atendenteId: string;
  atendente?: {
    id: string;
    nome: string;
  };
  skill: string;
  nivel: number; // 1-5
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAtendenteSkillDto {
  atendenteId: string;
  skill: string;
  nivel: number;
  ativo?: boolean;
}

export interface UpdateAtendenteSkillDto {
  skill?: string;
  nivel?: number;
  ativo?: boolean;
}

export interface DistribuicaoLog {
  id: string;
  ticketId: string;
  ticket?: any;
  atendenteId: string;
  atendente?: {
    id: string;
    nome: string;
  };
  filaId: string;
  fila?: {
    id: string;
    nome: string;
  };
  algoritmo: AlgoritmoDistribuicao;
  motivo: string;
  cargaAtendente: number;
  realocacao: boolean;
  motivoRealocacao?: string;
  timestamp: Date;
}

export interface DistribuicaoMetricas {
  totalDistribuicoes: number;
  totalRealocacoes: number;
  distribuicoesRecentes: number;
  porAlgoritmo: Array<{
    algoritmo: AlgoritmoDistribuicao;
    total: number;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ========================================
// SERVICE
// ========================================

export const distribuicaoAvancadaService = {
  // ========================================
  // DISTRIBUIÇÃO DE TICKETS
  // ========================================

  /**
   * Distribui um ticket automaticamente
   */
  distribuir: async (ticketId: string, requiredSkills?: string[]) => {
    const response = await api.post(`/distribuicao-avancada/distribuir/${ticketId}`, {
      requiredSkills,
    });
    return response.data;
  },

  /**
   * Realoca ticket para outro atendente
   */
  realocar: async (ticketId: string, novoAtendenteId: string, motivoRealocacao: string) => {
    const response = await api.post(`/distribuicao-avancada/realocar/${ticketId}`, {
      novoAtendenteId,
      motivoRealocacao,
    });
    return response.data;
  },

  // ========================================
  // CONFIGURAÇÕES (CRUD)
  // ========================================

  /**
   * Lista todas as configurações de distribuição
   */
  listarConfiguracoes: async (filaId?: string): Promise<DistribuicaoConfig[]> => {
    const params = filaId ? { filaId } : {};
    const response = await api.get('/distribuicao-avancada/configuracoes', { params });
    return response.data.data;
  },

  /**
   * Busca configuração por ID
   */
  buscarConfiguracao: async (id: string): Promise<DistribuicaoConfig> => {
    const response = await api.get(`/distribuicao-avancada/configuracoes/${id}`);
    return response.data.data;
  },

  /**
   * Cria nova configuração de distribuição
   */
  criarConfiguracao: async (data: CreateDistribuicaoConfigDto): Promise<DistribuicaoConfig> => {
    const response = await api.post('/distribuicao-avancada/configuracoes', data);
    return response.data.data;
  },

  /**
   * Atualiza configuração existente
   */
  atualizarConfiguracao: async (
    id: string,
    data: UpdateDistribuicaoConfigDto,
  ): Promise<DistribuicaoConfig> => {
    const response = await api.put(`/distribuicao-avancada/configuracoes/${id}`, data);
    return response.data.data;
  },

  /**
   * Deleta configuração
   */
  deletarConfiguracao: async (id: string): Promise<void> => {
    await api.delete(`/distribuicao-avancada/configuracoes/${id}`);
  },

  // ========================================
  // SKILLS (CRUD)
  // ========================================

  /**
   * Lista skills (opcionalmente filtrado por atendente)
   */
  listarSkills: async (atendenteId?: string): Promise<AtendenteSkill[]> => {
    const params = atendenteId ? { atendenteId } : {};
    const response = await api.get('/distribuicao-avancada/skills', { params });
    return response.data.data;
  },

  /**
   * Lista todas as skills de um atendente específico
   */
  listarSkillsPorAtendente: async (atendenteId: string): Promise<AtendenteSkill[]> => {
    const response = await api.get(`/distribuicao-avancada/skills/atendente/${atendenteId}`);
    return response.data.data;
  },

  /**
   * Cria skill para atendente
   */
  criarSkill: async (data: CreateAtendenteSkillDto): Promise<AtendenteSkill> => {
    const response = await api.post('/distribuicao-avancada/skills', data);
    return response.data.data;
  },

  /**
   * Atualiza skill existente
   */
  atualizarSkill: async (id: string, data: UpdateAtendenteSkillDto): Promise<AtendenteSkill> => {
    const response = await api.put(`/distribuicao-avancada/skills/${id}`, data);
    return response.data.data;
  },

  /**
   * Deleta skill
   */
  deletarSkill: async (id: string): Promise<void> => {
    await api.delete(`/distribuicao-avancada/skills/${id}`);
  },

  /**
   * Lista todas as skills disponíveis no sistema (únicas)
   */
  listarSkillsDisponiveis: async (): Promise<string[]> => {
    const response = await api.get('/distribuicao-avancada/skills-disponiveis');
    return response.data.data;
  },

  // ========================================
  // LOGS E MÉTRICAS
  // ========================================

  /**
   * Lista logs de distribuição com filtros e paginação
   */
  listarLogs: async (filtros: {
    ticketId?: string;
    atendenteId?: string;
    filaId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<DistribuicaoLog>> => {
    const response = await api.get('/distribuicao-avancada/logs', {
      params: {
        page: filtros.page || 1,
        limit: filtros.limit || 50,
        ...filtros,
      },
    });
    return response.data;
  },

  /**
   * Obtém métricas de distribuição
   */
  obterMetricas: async (filaId?: string): Promise<DistribuicaoMetricas> => {
    const params = filaId ? { filaId } : {};
    const response = await api.get('/distribuicao-avancada/metricas', { params });
    return response.data.data;
  },

  /**
   * Obtém métricas de performance do service (cache, tempo médio, taxa de sucesso)
   */
  obterMetricasPerformance: async (): Promise<{
    distribuicoes: {
      total: number;
      sucesso: number;
      falha: number;
      taxaSucessoPct: number;
    };
    performance: {
      tempoMedioMs: number;
      tempoTotalMs: number;
    };
    cache: {
      hits: number;
      misses: number;
      taxaHitPct: number;
      configsCacheadas: number;
      skillsCacheadas: number;
    };
  }> => {
    const response = await api.get('/distribuicao-avancada/metricas-performance');
    return response.data.data;
  },

  /**
   * Limpa o cache de configurações e skills (forçar reload)
   */
  limparCache: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/distribuicao-avancada/limpar-cache');
    return response.data;
  },
};
