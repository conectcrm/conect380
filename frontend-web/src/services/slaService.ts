import api from './api';

/**
 * ====================================
 * INTERFACES SLA TRACKING
 * ====================================
 */

export interface HorarioFuncionamento {
  segunda: { ativo: boolean; inicio: string; fim: string };
  terca: { ativo: boolean; inicio: string; fim: string };
  quarta: { ativo: boolean; inicio: string; fim: string };
  quinta: { ativo: boolean; inicio: string; fim: string };
  sexta: { ativo: boolean; inicio: string; fim: string };
  sabado: { ativo: boolean; inicio: string; fim: string };
  domingo: { ativo: boolean; inicio: string; fim: string };
}

export interface SlaConfig {
  id: string;
  nome: string;
  descricao?: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  canal?: string;
  tempoRespostaMinutos: number;
  tempoResolucaoMinutos: number;
  horariosFuncionamento?: HorarioFuncionamento;
  alertaPercentual: number;
  notificarEmail: boolean;
  notificarSistema: boolean;
  ativo: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlaConfigDto {
  nome: string;
  descricao?: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  canal?: string;
  tempoRespostaMinutos: number;
  tempoResolucaoMinutos: number;
  horariosFuncionamento?: HorarioFuncionamento;
  alertaPercentual?: number;
  notificarEmail?: boolean;
  notificarSistema?: boolean;
  ativo?: boolean;
}

export interface UpdateSlaConfigDto {
  nome?: string;
  descricao?: string;
  prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente';
  canal?: string;
  tempoRespostaMinutos?: number;
  tempoResolucaoMinutos?: number;
  horariosFuncionamento?: HorarioFuncionamento;
  alertaPercentual?: number;
  notificarEmail?: boolean;
  notificarSistema?: boolean;
  ativo?: boolean;
}

export interface SlaEventLog {
  id: string;
  ticketId: string;
  slaConfigId?: string;
  tipoEvento: 'inicio' | 'primeira_resposta' | 'resolucao' | 'violacao' | 'alerta';
  status: 'cumprido' | 'em_risco' | 'violado';
  tempoRespostaMinutos?: number;
  tempoResolucaoMinutos?: number;
  tempoLimiteMinutos?: number;
  percentualUsado?: number;
  detalhes?: string;
  empresaId: string;
  createdAt: string;
}

export interface SlaCalculoResult {
  ticketId: string;
  slaConfigId?: string;
  status: 'cumprido' | 'em_risco' | 'violado';
  tempoDecorridoMinutos: number;
  tempoLimiteMinutos: number;
  percentualUsado: number;
  tempoRestanteMinutos: number;
  prioridade: string;
  canal: string;
  detalhes: string;
}

export interface SlaMetricas {
  totalTickets: number;
  ticketsCumpridos: number;
  ticketsEmRisco: number;
  ticketsViolados: number;
  taxaCumprimento: number;
  tempoMedioRespostaMinutos: number;
  tempoMedioResolucaoMinutos: number;
  distribuicaoPorPrioridade: {
    prioridade: string;
    total: number;
    cumpridos: number;
    emRisco: number;
    violados: number;
  }[];
  distribuicaoPorCanal: {
    canal: string;
    total: number;
    cumpridos: number;
    emRisco: number;
    violados: number;
  }[];
}

export interface SlaMetricasFilterDto {
  dataInicio?: string;
  dataFim?: string;
  prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente';
  canal?: string;
}

/**
 * ====================================
 * SERVICE SLA TRACKING
 * ====================================
 */

export const slaService = {
  /**
   * Listar todas as configurações de SLA
   */
  async listarConfigs(apenasAtivas?: boolean): Promise<SlaConfig[]> {
    try {
      const url = apenasAtivas 
        ? '/atendimento/sla/configs?apenasAtivas=true'
        : '/atendimento/sla/configs';
      
      const response = await api.get(url);
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao listar configurações SLA:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao listar configurações SLA');
    }
  },

  /**
   * Buscar configuração de SLA por ID
   */
  async buscarPorId(id: string): Promise<SlaConfig> {
    try {
      const response = await api.get(`/atendimento/sla/configs/${id}`);
      return response.data;
    } catch (err: unknown) {
      console.error(`Erro ao buscar configuração SLA ${id}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao buscar configuração SLA');
    }
  },

  /**
   * Criar nova configuração de SLA
   */
  async criarConfig(dto: CreateSlaConfigDto): Promise<SlaConfig> {
    try {
      const response = await api.post('/atendimento/sla/configs', dto);
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao criar configuração SLA:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao criar configuração SLA');
    }
  },

  /**
   * Atualizar configuração de SLA existente
   */
  async atualizarConfig(id: string, dto: UpdateSlaConfigDto): Promise<SlaConfig> {
    try {
      const response = await api.put(`/atendimento/sla/configs/${id}`, dto);
      return response.data;
    } catch (err: unknown) {
      console.error(`Erro ao atualizar configuração SLA ${id}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao atualizar configuração SLA');
    }
  },

  /**
   * Deletar configuração de SLA
   */
  async deletarConfig(id: string): Promise<void> {
    try {
      await api.delete(`/atendimento/sla/configs/${id}`);
    } catch (err: unknown) {
      console.error(`Erro ao deletar configuração SLA ${id}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao deletar configuração SLA');
    }
  },

  /**
   * Calcular SLA de um ticket específico
   */
  async calcularSlaTicket(
    ticketId: string,
    prioridade: string,
    canal: string,
    criadoEm: string
  ): Promise<SlaCalculoResult> {
    try {
      const response = await api.post(`/atendimento/sla/tickets/${ticketId}/calcular`, {
        prioridade,
        canal,
        criadoEm,
      });
      return response.data;
    } catch (err: unknown) {
      console.error(`Erro ao calcular SLA do ticket ${ticketId}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao calcular SLA do ticket');
    }
  },

  /**
   * Buscar métricas de SLA com filtros opcionais
   */
  async buscarMetricas(filtros?: SlaMetricasFilterDto): Promise<SlaMetricas> {
    try {
      const params = new URLSearchParams();
      if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros?.prioridade) params.append('prioridade', filtros.prioridade);
      if (filtros?.canal) params.append('canal', filtros.canal);

      const url = `/atendimento/sla/metricas${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao buscar métricas SLA:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao buscar métricas SLA');
    }
  },

  /**
   * Buscar histórico de eventos SLA de um ticket
   */
  async buscarHistoricoTicket(ticketId: string): Promise<SlaEventLog[]> {
    try {
      const response = await api.get(`/atendimento/sla/tickets/${ticketId}/historico`);
      return response.data;
    } catch (err: unknown) {
      console.error(`Erro ao buscar histórico SLA do ticket ${ticketId}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao buscar histórico SLA');
    }
  },

  /**
   * Buscar tickets com alertas SLA
   */
  async buscarAlertas(): Promise<SlaEventLog[]> {
    try {
      const response = await api.get('/atendimento/sla/alertas');
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao buscar alertas SLA:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao buscar alertas SLA');
    }
  },

  /**
   * Buscar tickets com violações SLA
   */
  async buscarViolacoes(): Promise<SlaEventLog[]> {
    try {
      const response = await api.get('/atendimento/sla/violacoes');
      return response.data;
    } catch (err: unknown) {
      console.error('Erro ao buscar violações SLA:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao buscar violações SLA');
    }
  },

  /**
   * Gerar alerta para um ticket específico
   */
  async gerarAlerta(ticketId: string, detalhes: string): Promise<SlaEventLog> {
    try {
      const response = await api.post(`/atendimento/sla/tickets/${ticketId}/alerta`, {
        detalhes,
      });
      return response.data;
    } catch (err: unknown) {
      console.error(`Erro ao gerar alerta SLA para ticket ${ticketId}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao gerar alerta SLA');
    }
  },

  /**
   * Registrar violação para um ticket específico
   */
  async registrarViolacao(ticketId: string, detalhes: string): Promise<SlaEventLog> {
    try {
      const response = await api.post(`/atendimento/sla/tickets/${ticketId}/violacao`, {
        detalhes,
      });
      return response.data;
    } catch (err: unknown) {
      console.error(`Erro ao registrar violação SLA para ticket ${ticketId}:`, err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      throw new Error(normalizedMessage || fallbackMessage || 'Erro ao registrar violação SLA');
    }
  },
};

export default slaService;
