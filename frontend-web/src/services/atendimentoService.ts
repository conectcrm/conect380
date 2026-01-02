import api from './api';
import { getErrorMessage } from '../utils/errorHandling';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  total?: number;
};

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
  anexos?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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
  async listarTickets(filtros?: {
    status?: string[];
    atendenteId?: string;
    canalId?: string;
    prioridade?: string;
    dataInicio?: string;
    dataFim?: string;
    busca?: string;
  }): Promise<Ticket[]> {
    try {
      const params: Record<string, string> = {};

      if (filtros?.status?.length) {
        params.status = filtros.status.join(',');
      }
      if (filtros?.atendenteId) {
        params.atendenteId = filtros.atendenteId;
      }
      if (filtros?.canalId) {
        params.canalId = filtros.canalId;
      }
      if (filtros?.prioridade) {
        params.prioridade = filtros.prioridade;
      }
      if (filtros?.dataInicio) {
        params.dataInicio = filtros.dataInicio;
      }
      if (filtros?.dataFim) {
        params.dataFim = filtros.dataFim;
      }
      if (filtros?.busca) {
        params.busca = filtros.busca;
      }

      const response = await api.get<ApiResponse<Ticket[]>>('/api/atendimento/tickets', {
        params,
      });

      return response.data?.data ?? [];
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao listar tickets:', err);
      throw new Error(getErrorMessage(err, 'Erro ao listar tickets'));
    }
  }

  /**
   * Buscar um ticket específico por ID
   */
  async buscarTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await api.get<ApiResponse<Ticket>>(`/api/atendimento/tickets/${ticketId}`);

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      return ticket;
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao buscar ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao buscar ticket'));
    }
  }

  /**
   * Buscar mensagens de um ticket
   */
  async listarMensagens(ticketId: string, limite?: number, offset?: number): Promise<Mensagem[]> {
    try {
      const params: Record<string, string> = { ticketId };

      if (limite) {
        params.limite = limite.toString();
      }
      if (offset) {
        params.offset = offset.toString();
      }

      const response = await api.get<ApiResponse<Mensagem[]>>('/api/atendimento/mensagens', {
        params,
      });

      return response.data?.data ?? [];
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao listar mensagens:', err);
      throw new Error(getErrorMessage(err, 'Erro ao listar mensagens'));
    }
  }

  /**
   * Enviar mensagem via WhatsApp
   */
  async enviarMensagemWhatsApp(
    empresaId: string,
    dados: EnviarMensagemRequest,
  ): Promise<EnviarMensagemResponse> {
    try {
      const response = await api.post<ApiResponse<EnviarMensagemResponse>>(
        `/api/atendimento/webhooks/whatsapp/${empresaId}/enviar`,
        dados,
      );

      const payload = response.data?.data;

      if (!payload) {
        throw new Error('Resposta inválida ao enviar mensagem');
      }

      return payload;
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao enviar mensagem:', err);
      throw new Error(getErrorMessage(err, 'Erro ao enviar mensagem via WhatsApp'));
    }
  }

  /**
   * Atualizar status do ticket
   */
  async atualizarStatusTicket(ticketId: string, status: Ticket['status']): Promise<Ticket> {
    try {
      const response = await api.patch<Ticket>(`/api/atendimento/tickets/${ticketId}/status`, {
        status,
      });

      return response.data;
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao atualizar status:', err);
      throw new Error(getErrorMessage(err, 'Erro ao atualizar status do ticket'));
    }
  }

  /**
   * Atribuir ticket para um atendente
   */
  async atribuirTicket(ticketId: string, atendenteId: string): Promise<Ticket> {
    try {
      const response = await api.patch<Ticket>(`/api/atendimento/tickets/${ticketId}/atribuir`, {
        atendenteId,
      });

      return response.data;
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao atribuir ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao atribuir ticket'));
    }
  }

  /**
   * Atualizar prioridade do ticket
   */
  async atualizarPrioridadeTicket(
    ticketId: string,
    prioridade: Ticket['prioridade'],
  ): Promise<Ticket> {
    try {
      const response = await api.patch<Ticket>(`/api/atendimento/tickets/${ticketId}/prioridade`, {
        prioridade,
      });

      return response.data;
    } catch (err: unknown) {
      console.error('[AtendimentoService] Erro ao atualizar prioridade:', err);
      throw new Error(getErrorMessage(err, 'Erro ao atualizar prioridade do ticket'));
    }
  }
}

export const atendimentoService = new AtendimentoService();
