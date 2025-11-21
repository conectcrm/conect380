import api from './api';

/**
 * Enums espelhando o backend
 */
export enum EstrategiaDistribuicao {
  ROUND_ROBIN = 'ROUND_ROBIN',
  MENOR_CARGA = 'MENOR_CARGA',
  PRIORIDADE = 'PRIORIDADE',
}

export enum PrioridadePadrao {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

/**
 * Interfaces TypeScript espelhando DTOs do backend
 */
export interface Fila {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  cor?: string; // HEX color (ex: #159A9C) - Novo campo (Jan 2025)
  icone?: string; // Lucide React icon name (ex: Headphones) - Novo campo (Jan 2025)
  nucleoId?: string; // Novo campo - Consolidação Equipe → Fila (Jan 2025)
  departamentoId?: string; // Novo campo - Consolidação Equipe → Fila (Jan 2025)
  ativo: boolean;
  ordem: number;
  horarioAtendimento?: any;
  estrategiaDistribuicao: EstrategiaDistribuicao;
  capacidadeMaxima: number;
  distribuicaoAutomatica: boolean;
  configuracoes?: {
    tempoMaximoEspera?: number;
    prioridadePadrao?: PrioridadePadrao;
    notificarAposMinutos?: number;
  };
  atendentes?: FilaAtendente[];
  createdAt: Date;
  updatedAt: Date;

  // Relacionamentos - Novos (Jan 2025)
  nucleo?: {
    id: string;
    nome: string;
    cor: string;
    icone?: string;
  };
  departamento?: {
    id: string;
    nome: string;
    descricao?: string;
  };

  // Load balancing (retornado por buscarFilaIdeal) - Novo (Jan 2025)
  ticketsAtivos?: number;
}

export interface FilaAtendente {
  id: string;
  filaId: string;
  atendenteId: string;
  capacidade: number;
  prioridade: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  atendente?: {
    id: string;
    nome: string;
    email: string;
    status_atendente: string;
    tickets_ativos: number;
    capacidade_maxima: number;
  };
}

export interface CreateFilaDto {
  nome: string;
  descricao?: string;
  cor?: string; // HEX color - Novo (Jan 2025)
  icone?: string; // Lucide icon name - Novo (Jan 2025)
  nucleoId?: string; // Novo (Jan 2025)
  departamentoId?: string; // Novo (Jan 2025)
  estrategiaDistribuicao?: EstrategiaDistribuicao;
  capacidadeMaxima?: number;
  distribuicaoAutomatica?: boolean;
  ordem?: number;
  ativo?: boolean;
  configuracoes?: {
    tempoMaximoEspera?: number;
    prioridadePadrao?: PrioridadePadrao;
    notificarAposMinutos?: number;
  };
  horarioAtendimento?: any;
}

export interface UpdateFilaDto extends Partial<CreateFilaDto> { }

export interface AddAtendenteFilaDto {
  atendenteId: string;
  capacidade?: number;
  prioridade?: number;
}

export interface AtribuirTicketDto {
  ticketId: string;
  filaId: string;
  distribuicaoAutomatica?: boolean;
  atendenteId?: string;
}

export interface MetricasFila {
  totalTickets: number;
  ticketsAguardando: number;
  ticketsEmAtendimento: number;
  ticketsFinalizados: number;
  tempoMedioEspera: number;
  tempoMedioAtendimento: number;
  taxaResolucao: number;
  atendentesDisponiveis: number;
  atendentesBloqueados: number;
}

/**
 * Serviço de Filas
 * Consome os 11 endpoints REST do FilaController
 */
class FilaService {
  /**
   * Lista todas as filas da empresa
   */
  async listar(empresaId: string): Promise<Fila[]> {
    try {
      const response = await api.get(`/api/filas?empresaId=${empresaId}`);
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao listar filas:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao listar filas',
      );
    }
  }

  /**
   * Busca uma fila por ID
   */
  async buscarPorId(id: string, empresaId: string): Promise<Fila> {
    try {
      const response = await api.get(
        `/api/filas/${id}?empresaId=${empresaId}`,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao buscar fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao buscar fila',
      );
    }
  }

  /**
   * Cria uma nova fila
   */
  async criar(empresaId: string, dto: CreateFilaDto): Promise<Fila> {
    try {
      const response = await api.post(
        `/api/filas?empresaId=${empresaId}`,
        dto,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao criar fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao criar fila',
      );
    }
  }

  /**
   * Atualiza uma fila existente
   */
  async atualizar(
    id: string,
    empresaId: string,
    dto: UpdateFilaDto,
  ): Promise<Fila> {
    try {
      const response = await api.put(
        `/api/filas/${id}?empresaId=${empresaId}`,
        dto,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao atualizar fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao atualizar fila',
      );
    }
  }

  /**
   * Remove uma fila (soft delete)
   */
  async remover(id: string, empresaId: string): Promise<void> {
    try {
      await api.delete(`/api/filas/${id}?empresaId=${empresaId}`);
    } catch (err: unknown) {
      console.error('Erro ao remover fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao remover fila',
      );
    }
  }

  /**
   * Adiciona um atendente a uma fila
   */
  async adicionarAtendente(
    filaId: string,
    empresaId: string,
    dto: AddAtendenteFilaDto,
  ): Promise<FilaAtendente> {
    try {
      const response = await api.post(
        `/api/filas/${filaId}/atendentes?empresaId=${empresaId}`,
        dto,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao adicionar atendente à fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao adicionar atendente à fila',
      );
    }
  }

  /**
   * Remove um atendente de uma fila
   */
  async removerAtendente(
    filaId: string,
    atendenteId: string,
    empresaId: string,
  ): Promise<void> {
    try {
      await api.delete(
        `/api/filas/${filaId}/atendentes/${atendenteId}?empresaId=${empresaId}`,
      );
    } catch (err: unknown) {
      console.error('Erro ao remover atendente da fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao remover atendente da fila',
      );
    }
  }

  /**
   * Lista atendentes de uma fila
   */
  async listarAtendentes(
    filaId: string,
    empresaId: string,
  ): Promise<FilaAtendente[]> {
    try {
      const response = await api.get(
        `/api/filas/${filaId}/atendentes?empresaId=${empresaId}`,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao listar atendentes da fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao listar atendentes da fila',
      );
    }
  }

  /**
   * Distribui um ticket para um atendente
   */
  async distribuirTicket(
    empresaId: string,
    dto: AtribuirTicketDto,
  ): Promise<{ ticket: any; atendente: any }> {
    try {
      const response = await api.post(
        `/api/filas/distribuir?empresaId=${empresaId}`,
        dto,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao distribuir ticket:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao distribuir ticket',
      );
    }
  }

  /**
   * Obter métricas de uma fila
   */
  async obterMetricas(
    filaId: string,
    empresaId: string,
  ): Promise<MetricasFila> {
    try {
      const response = await api.get(
        `/api/filas/${filaId}/metricas?empresaId=${empresaId}`,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao obter métricas da fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao obter métricas da fila',
      );
    }
  }

  /**
   * Lista tickets de uma fila
   * TODO: Implementar quando integrado com TicketService
   */
  async listarTickets(
    filaId: string,
    empresaId: string,
    status?: string,
  ): Promise<any[]> {
    try {
      const statusParam = status ? `&status=${status}` : '';
      const response = await api.get(
        `/api/filas/${filaId}/tickets?empresaId=${empresaId}${statusParam}`,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao listar tickets da fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao listar tickets da fila',
      );
    }
  }

  // ========================================================================
  // MÉTODOS ENTERPRISE - Consolidação Equipe → Fila (Jan 2025)
  // ========================================================================

  /**
   * Atribui um núcleo de atendimento a uma fila
   * PATCH /api/filas/:id/nucleo
   */
  async atribuirNucleo(
    filaId: string,
    empresaId: string,
    nucleoId: string,
  ): Promise<Fila> {
    try {
      const response = await api.patch(
        `/api/filas/${filaId}/nucleo?empresaId=${empresaId}`,
        { nucleoId },
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao atribuir núcleo à fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao atribuir núcleo',
      );
    }
  }

  /**
   * Atribui um departamento a uma fila
   * PATCH /api/filas/:id/departamento
   */
  async atribuirDepartamento(
    filaId: string,
    empresaId: string,
    departamentoId: string,
  ): Promise<Fila> {
    try {
      const response = await api.patch(
        `/api/filas/${filaId}/departamento?empresaId=${empresaId}`,
        { departamentoId },
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao atribuir departamento à fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage || fallbackMessage || 'Erro ao atribuir departamento',
      );
    }
  }

  /**
   * Atribui núcleo E/OU departamento simultaneamente
   * PATCH /api/filas/:id/atribuir
   */
  async atribuirNucleoEDepartamento(
    filaId: string,
    empresaId: string,
    nucleoId?: string,
    departamentoId?: string,
  ): Promise<Fila> {
    try {
      const response = await api.patch(
        `/api/filas/${filaId}/atribuir?empresaId=${empresaId}`,
        { nucleoId, departamentoId },
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao atribuir núcleo/departamento à fila:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao atribuir núcleo/departamento',
      );
    }
  }

  /**
   * Lista todas as filas de um núcleo específico
   * GET /api/filas/nucleo/:nucleoId
   */
  async listarPorNucleo(nucleoId: string, empresaId: string): Promise<Fila[]> {
    try {
      const response = await api.get(
        `/api/filas/nucleo/${nucleoId}?empresaId=${empresaId}`,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao listar filas por núcleo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao listar filas por núcleo',
      );
    }
  }

  /**
   * Lista todas as filas de um departamento específico
   * GET /api/filas/departamento/:departamentoId
   */
  async listarPorDepartamento(
    departamentoId: string,
    empresaId: string,
  ): Promise<Fila[]> {
    try {
      const response = await api.get(
        `/api/filas/departamento/${departamentoId}?empresaId=${empresaId}`,
      );
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao listar filas por departamento:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(
        normalizedMessage ||
        fallbackMessage ||
        'Erro ao listar filas por departamento',
      );
    }
  }

  /**
   * Busca fila ideal para distribuição automática (menor carga)
   * GET /api/filas/nucleo/:nucleoId/ideal
   * 
   * Algoritmo de Load Balancing Inteligente:
   * - Retorna fila com MENOR número de tickets ativos (aguardando + em_atendimento)
   * - Usado pelo bot de triagem para distribuição automática
   * - Retorna null se nenhuma fila ativa encontrada
   */
  async buscarFilaIdeal(
    nucleoId: string,
    empresaId: string,
  ): Promise<Fila | null> {
    try {
      const response = await api.get(
        `/api/filas/nucleo/${nucleoId}/ideal?empresaId=${empresaId}`,
      );

      const data = response.data;

      // Se retornar mensagem, significa que não há filas ativas
      if (data?.message) {
        console.warn(data.message);
        return null;
      }

      return data;
    } catch (err: unknown) {
      console.error('Erro ao buscar fila ideal:', err);
      // Não lançar erro - retornar null para não quebrar fluxo do bot
      return null;
    }
  }
}

export const filaService = new FilaService();
