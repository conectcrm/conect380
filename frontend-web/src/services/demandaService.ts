/**
 * ⚠️ DEPRECATED - Service de Demandas
 * 
 * @deprecated Sprint 1: Este service está obsoleto após a unificação Tickets + Demandas.
 * 
 * **Use ticketService.ts em vez disso:**
 * - demandaService.listar() → ticketService.listar({ tipo: 'suporte' })
 * - demandaService.criar() → ticketService.criar() com campo tipo
 * - demandaService.atualizar() → ticketService.atualizar()
 * 
 * **Motivo da Deprecação:**
 * Sprint 1 unificou Tickets e Demandas em uma única entity com campo `tipo`.
 * Demandas agora são tickets com tipo = 'suporte' | 'tecnica' | etc.
 * 
 * **Período de Transição:**
 * Este service será removido na Sprint 3 (estimativa: 2-3 semanas).
 * Migre seu código para ticketService.ts o quanto antes.
 * 
 * @see ticketService.ts - Service unificado
 * @see SPRINT_1_PROGRESSO.md - Documentação da migração
 */
// Service de Demandas
import api from './api';

// ========================
// INTERFACES
// ========================

/**
 * @deprecated Use interface Ticket from ticketsService.ts com campo tipo
 * 
 * Migração:
 * ```typescript
 * // Antes (deprecated):
 * import { Demanda } from './demandaService';
 * 
 * // Depois (correto):
 * import { Ticket, TipoTicket } from './ticketsService';
 * const demanda: Ticket = { ...ticket, tipo: 'suporte' };
 * ```
 */
export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  ticketId?: string;
  clienteId?: string;
  contatoTelefone?: string;
  responsavelId?: string;
  autorId: string;
  empresaId: string;
  dataAbertura: string;
  dataVencimento?: string;
  dataConclusao?: string;
  createdAt: string;
  updatedAt: string;
}

export type TipoDemanda = 'tecnica' | 'comercial' | 'suporte' | 'financeira' | 'integracao' | 'treinamento' | 'outra';
export type StatusDemanda = 'aberta' | 'em_andamento' | 'aguardando_cliente' | 'concluida' | 'cancelada';
export type PrioridadeDemanda = 'baixa' | 'media' | 'alta' | 'critica';

export interface CreateDemandaDto {
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status?: StatusDemanda;
  clienteId?: string;
  contatoTelefone?: string;
  responsavelId?: string;
  dataVencimento?: string;
}

export interface ConvertTicketDto {
  tipo?: TipoDemanda;
  prioridade?: PrioridadeDemanda;
  titulo?: string;
  descricao?: string;
  clienteId?: string;
  responsavelId?: string;
  dataVencimento?: string;
}

export interface DemandaStats {
  total: number;
  abertas: number;
  emAndamento: number;
  aguardandoCliente: number;
  concluidas: number;
  canceladas: number;
  criticas: number;
}

// ========================
// SERVIÇO
// ========================

/**
 * @deprecated DemandaService está obsoleto - Use ticketService.ts
 * 
 * Este service permanecerá funcional por período de transição,
 * mas console.warn() será emitido em cada chamada.
 */
class DemandaService {
  private readonly baseUrl = '/demandas';

  /**
   * @deprecated Use ticketService.listar({ tipo: 'suporte' })
   */
  async listar(): Promise<Demanda[]> {
    console.warn('[DEPRECATED] demandaService.listar() - Use ticketService.listar({ tipo })');
    const response = await api.get(this.baseUrl);
    return response.data.data || response.data;
  }

  /**
   * @deprecated Use ticketService.buscarPorId(id)
   */
  async buscarPorId(id: string): Promise<Demanda> {
    console.warn('[DEPRECATED] demandaService.buscarPorId() - Use ticketService.buscarPorId()');
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.data || response.data;
  }

  /**
   * @deprecated Use ticketService.listar({ ticketId })
   */
  async buscarPorTicket(ticketId: string): Promise<Demanda | null> {
    console.warn('[DEPRECATED] demandaService.buscarPorTicket() - Use ticketService');
    try {
      const response = await api.get(`${this.baseUrl}/ticket/${ticketId}`);
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * @deprecated Use ticketService.listar({ clienteId })
   */
  async buscarPorCliente(clienteId: string): Promise<Demanda[]> {
    console.warn('[DEPRECATED] demandaService.buscarPorCliente() - Use ticketService');
    const response = await api.get(`${this.baseUrl}/cliente/${clienteId}`);
    return response.data.data || response.data;
  }

  /**
   * @deprecated Use ticketService.listar({ busca: telefone })
   */
  async buscarPorTelefone(telefone: string): Promise<Demanda[]> {
    console.warn('[DEPRECATED] demandaService.buscarPorTelefone() - Use ticketService');
    const response = await api.get(`${this.baseUrl}/telefone/${telefone}`);
    return response.data.data || response.data;
  }

  /**
   * @deprecated Use ticketService.listar({ status })
   */
  async buscarPorStatus(status: StatusDemanda): Promise<Demanda[]> {
    console.warn('[DEPRECATED] demandaService.buscarPorStatus() - Use ticketService.listar({ status })');
    const response = await api.get(`${this.baseUrl}/status/${status}`);
    return response.data.data || response.data;
  }

  /**
   * @deprecated Use ticketService.criar({ tipo, titulo, descricao, ... })
   */
  async criar(dto: CreateDemandaDto): Promise<Demanda> {
    console.warn('[DEPRECATED] demandaService.criar() - Use ticketService.criar() com campo tipo');
    const response = await api.post(this.baseUrl, dto);
    return response.data.data || response.data;
  }

  // Converter ticket em demanda (PRINCIPAL)
  async converterTicket(ticketId: string, dto: ConvertTicketDto = {}): Promise<Demanda> {
    const response = await api.post(`${this.baseUrl}/converter-ticket/${ticketId}`, dto);
    return response.data.data || response.data;
  }

  // Atualizar demanda
  async atualizar(id: string, dto: Partial<CreateDemandaDto>): Promise<Demanda> {
    const response = await api.patch(`${this.baseUrl}/${id}`, dto);
    return response.data.data || response.data;
  }

  // Atribuir responsável
  async atribuirResponsavel(id: string, responsavelId: string): Promise<Demanda> {
    const response = await api.patch(`${this.baseUrl}/${id}/responsavel`, { responsavelId });
    return response.data.data || response.data;
  }

  // Atualizar status
  async atualizarStatus(id: string, status: StatusDemanda): Promise<Demanda> {
    const response = await api.patch(`${this.baseUrl}/${id}/status`, { status });
    return response.data.data || response.data;
  }

  // Iniciar atendimento
  async iniciar(id: string): Promise<Demanda> {
    const response = await api.patch(`${this.baseUrl}/${id}/iniciar`);
    return response.data.data || response.data;
  }

  // Concluir demanda
  async concluir(id: string): Promise<Demanda> {
    const response = await api.patch(`${this.baseUrl}/${id}/concluir`);
    return response.data.data || response.data;
  }

  // Cancelar demanda
  async cancelar(id: string): Promise<Demanda> {
    const response = await api.patch(`${this.baseUrl}/${id}/cancelar`);
    return response.data.data || response.data;
  }

  // Deletar demanda
  async deletar(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  // Contar demandas urgentes por cliente
  async contarUrgentesPorCliente(clienteId: string): Promise<number> {
    const response = await api.get(`${this.baseUrl}/cliente/${clienteId}/count`);
    return response.data.data?.count || response.data.count || 0;
  }

  // Obter estatísticas
  async obterStats(): Promise<DemandaStats> {
    const demandas = await this.listar();

    return {
      total: demandas.length,
      abertas: demandas.filter(d => d.status === 'aberta').length,
      emAndamento: demandas.filter(d => d.status === 'em_andamento').length,
      aguardandoCliente: demandas.filter(d => d.status === 'aguardando_cliente').length,
      concluidas: demandas.filter(d => d.status === 'concluida').length,
      canceladas: demandas.filter(d => d.status === 'cancelada').length,
      criticas: demandas.filter(d => d.prioridade === 'critica').length,
    };
  }
}

// ========================
// HELPERS
// ========================

export const tipoLabels: Record<TipoDemanda, string> = {
  tecnica: 'Técnica',
  comercial: 'Comercial',
  suporte: 'Suporte',
  financeira: 'Financeira',
  integracao: 'Integração',
  treinamento: 'Treinamento',
  outra: 'Outra',
};

export const statusLabels: Record<StatusDemanda, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  aguardando_cliente: 'Aguardando Cliente',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const prioridadeLabels: Record<PrioridadeDemanda, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const tipoColors: Record<TipoDemanda, string> = {
  tecnica: 'bg-blue-100 text-blue-800',
  comercial: 'bg-green-100 text-green-800',
  suporte: 'bg-purple-100 text-purple-800',
  financeira: 'bg-yellow-100 text-yellow-800',
  integracao: 'bg-indigo-100 text-indigo-800',
  treinamento: 'bg-pink-100 text-pink-800',
  outra: 'bg-gray-100 text-gray-800',
};

export const statusColors: Record<StatusDemanda, string> = {
  aberta: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  aguardando_cliente: 'bg-orange-100 text-orange-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

export const prioridadeColors: Record<PrioridadeDemanda, string> = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

export const demandaService = new DemandaService();
export default demandaService;
