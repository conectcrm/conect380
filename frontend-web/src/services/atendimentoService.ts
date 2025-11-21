import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface Ticket {
  id: string;
  numero: number;
  empresaId: string;
  clienteId?: string;
  canalId: string;
  filaId?: string;
  atendenteId?: string;
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'PENDENTE' | 'RESOLVIDO' | 'FECHADO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  assunto?: string;
  descricao?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  contatoOnline?: boolean; // ✅ Status online/offline do contato
  contatoLastActivity?: string; // ✅ Última atividade do contato
  mensagensNaoLidas?: number; // ✅ BONUS: Contador de mensagens não lidas
  ultimaMensagemEm?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Mensagem {
  id: string;
  ticketId: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'ARQUIVO' | 'LOCALIZACAO';
  conteudo: string;
  remetente: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  atendenteId?: string;
  identificadorExterno?: string;
  anexos?: any;
  metadata?: any;
  criadoEm: string;
}

export interface EnviarMensagemRequest {
  ticketId: string;
  telefone: string;
  mensagem: string;
}

export interface EnviarMensagemResponse {
  success: boolean;
  messageId: string;
  mensagemId: string;
  ticketStatus: string;
}

class AtendimentoService {
  /**
   * Buscar todos os tickets de uma empresa
   * 🔐 SEGURANÇA: empresaId agora vem do JWT no backend
   */
  async listarTickets(
    filtros?: {
      status?: string[];
      atendenteId?: string;
      canalId?: string;
      prioridade?: string;
      dataInicio?: string;
      dataFim?: string;
      busca?: string;
    }
  ): Promise<Ticket[]> {
    try {
      const params = new URLSearchParams();
      // 🔐 empresaId removido - vem do JWT automaticamente no backend

      if (filtros?.status?.length) {
        params.append('status', filtros.status.join(','));
      }
      if (filtros?.atendenteId) {
        params.append('atendenteId', filtros.atendenteId);
      }
      if (filtros?.canalId) {
        params.append('canalId', filtros.canalId);
      }
      if (filtros?.prioridade) {
        params.append('prioridade', filtros.prioridade);
      }
      if (filtros?.dataInicio) {
        params.append('dataInicio', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        params.append('dataFim', filtros.dataFim);
      }
      if (filtros?.busca) {
        params.append('busca', filtros.busca);
      }

      const response = await axios.get<{ success: boolean; data: Ticket[]; total: number }>(
        `${API_URL}/api/atendimento/tickets?${params.toString()}`
      );

      return response.data.data || [];
    } catch (error) {
      console.error('[AtendimentoService] Erro ao listar tickets:', error);
      throw error;
    }
  }

  /**
   * Buscar um ticket específico por ID
   */
  async buscarTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await axios.get<{ success: boolean; data: Ticket }>(
        `${API_URL}/api/atendimento/tickets/${ticketId}`
      );

      return response.data.data;
    } catch (error) {
      console.error('[AtendimentoService] Erro ao buscar ticket:', error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de um ticket
   */
  async listarMensagens(
    ticketId: string,
    limite?: number,
    offset?: number
  ): Promise<Mensagem[]> {
    try {
      const params = new URLSearchParams();
      params.append('ticketId', ticketId);

      if (limite) {
        params.append('limite', limite.toString());
      }
      if (offset) {
        params.append('offset', offset.toString());
      }

      const response = await axios.get<{ success: boolean; data: Mensagem[]; total: number }>(
        `${API_URL}/api/atendimento/mensagens?${params.toString()}`
      );

      return response.data.data || [];
    } catch (error) {
      console.error('[AtendimentoService] Erro ao listar mensagens:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem via WhatsApp
   */
  async enviarMensagemWhatsApp(
    empresaId: string,
    dados: EnviarMensagemRequest
  ): Promise<EnviarMensagemResponse> {
    try {
      const response = await axios.post<EnviarMensagemResponse>(
        `${API_URL}/api/atendimento/webhooks/whatsapp/${empresaId}/enviar`,
        dados
      );

      return response.data;
    } catch (error) {
      console.error('[AtendimentoService] Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do ticket
   */
  async atualizarStatusTicket(
    ticketId: string,
    status: Ticket['status']
  ): Promise<Ticket> {
    try {
      const response = await axios.patch<Ticket>(
        `${API_URL}/api/atendimento/tickets/${ticketId}/status`,
        { status }
      );

      return response.data;
    } catch (error) {
      console.error('[AtendimentoService] Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Atribuir ticket para um atendente
   */
  async atribuirTicket(
    ticketId: string,
    atendenteId: string
  ): Promise<Ticket> {
    try {
      const response = await axios.patch<Ticket>(
        `${API_URL}/api/atendimento/tickets/${ticketId}/atribuir`,
        { atendenteId }
      );

      return response.data;
    } catch (error) {
      console.error('[AtendimentoService] Erro ao atribuir ticket:', error);
      throw error;
    }
  }

  /**
   * Atualizar prioridade do ticket
   */
  async atualizarPrioridadeTicket(
    ticketId: string,
    prioridade: Ticket['prioridade']
  ): Promise<Ticket> {
    try {
      const response = await axios.patch<Ticket>(
        `${API_URL}/api/atendimento/tickets/${ticketId}/prioridade`,
        { prioridade }
      );

      return response.data;
    } catch (error) {
      console.error('[AtendimentoService] Erro ao atualizar prioridade:', error);
      throw error;
    }
  }
}

export const atendimentoService = new AtendimentoService();
