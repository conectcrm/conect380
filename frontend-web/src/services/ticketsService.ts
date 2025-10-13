import axios from 'axios';
import { StatusTicket, PrioridadeTicket } from '../types/ticket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Interface para filtros ao listar tickets
 */
export interface TicketFiltros {
  empresaId: string;
  status?: string | string[];
  canalId?: string;
  limite?: number;
  pagina?: number;
}

/**
 * Interface do ticket retornado pela API
 */
export interface Ticket {
  id: string;
  numero: number;
  assunto?: string;
  status: StatusTicket;
  prioridade: PrioridadeTicket;
  canalId: string;
  clienteId: string;
  atendenteId?: string;
  mensagensNaoLidas: number;
  ultimaMensagemEm?: string;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos (se incluídos)
  cliente?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };
  atendente?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  canal?: {
    id: string;
    nome: string;
    tipo: string;
  };
}

/**
 * Resposta da API ao listar tickets
 */
export interface ListarTicketsResposta {
  success: boolean;
  data: Ticket[];
  total: number;
  pagina: number;
  limite: number;
}

/**
 * Resposta da API ao buscar um ticket específico
 */
export interface BuscarTicketResposta {
  success: boolean;
  data: Ticket;
}

/**
 * DTO para atualizar status de um ticket
 */
export interface AtualizarStatusDto {
  status: StatusTicket;
  atendenteId?: string;
}

/**
 * DTO para atualizar prioridade de um ticket
 */
export interface AtualizarPrioridadeDto {
  prioridade: PrioridadeTicket;
}

/**
 * DTO para atribuir atendente a um ticket
 */
export interface AtribuirAtendenteDto {
  atendenteId: string;
}

/**
 * Service para interagir com a API de tickets
 */
class TicketsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Lista tickets com filtros opcionais
   */
  async listar(filtros: TicketFiltros): Promise<ListarTicketsResposta> {
    try {
      const params = new URLSearchParams();
      params.append('empresaId', filtros.empresaId);

      if (filtros.status) {
        if (Array.isArray(filtros.status)) {
          filtros.status.forEach(s => params.append('status', s));
        } else {
          params.append('status', filtros.status);
        }
      }

      if (filtros.canalId) {
        params.append('canalId', filtros.canalId);
      }

      if (filtros.limite) {
        params.append('limite', filtros.limite.toString());
      }

      if (filtros.pagina) {
        params.append('pagina', filtros.pagina.toString());
      }

      const response = await axios.get<ListarTicketsResposta>(
        `${API_URL}/api/atendimento/tickets?${params.toString()}`,
        this.getAuthHeaders()
      );

      console.log('✅ Tickets listados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar tickets:', error);
      throw error;
    }
  }

  /**
   * Busca um ticket específico por ID
   */
  async buscar(ticketId: string, empresaId: string): Promise<BuscarTicketResposta> {
    try {
      const response = await axios.get<BuscarTicketResposta>(
        `${API_URL}/api/atendimento/tickets/${ticketId}?empresaId=${empresaId}`,
        this.getAuthHeaders()
      );

      console.log('✅ Ticket encontrado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar ticket:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um ticket
   */
  async atualizarStatus(
    ticketId: string,
    empresaId: string,
    dados: AtualizarStatusDto
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await axios.patch<BuscarTicketResposta>(
        `${API_URL}/api/atendimento/tickets/${ticketId}/status?empresaId=${empresaId}`,
        dados,
        this.getAuthHeaders()
      );

      console.log('✅ Status do ticket atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar status do ticket:', error);
      throw error;
    }
  }

  /**
   * Atualiza a prioridade de um ticket
   */
  async atualizarPrioridade(
    ticketId: string,
    empresaId: string,
    dados: AtualizarPrioridadeDto
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await axios.patch<BuscarTicketResposta>(
        `${API_URL}/api/atendimento/tickets/${ticketId}/prioridade?empresaId=${empresaId}`,
        dados,
        this.getAuthHeaders()
      );

      console.log('✅ Prioridade do ticket atualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar prioridade do ticket:', error);
      throw error;
    }
  }

  /**
   * Atribui um atendente a um ticket
   */
  async atribuirAtendente(
    ticketId: string,
    empresaId: string,
    dados: AtribuirAtendenteDto
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await axios.patch<BuscarTicketResposta>(
        `${API_URL}/api/atendimento/tickets/${ticketId}/atribuir?empresaId=${empresaId}`,
        dados,
        this.getAuthHeaders()
      );

      console.log('✅ Atendente atribuído ao ticket:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atribuir atendente ao ticket:', error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
export const ticketsService = new TicketsService();
