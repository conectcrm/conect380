/**
 * 💬 Atendimento Service - Comunicação com API
 * 
 * Gerencia todas as operações relacionadas ao atendimento omnichannel:
 * - Conversações (tickets)
 * - Mensagens
 * - Contatos
 * - Transferências
 * - Encerramentos
 */

import { api } from '../../../../services/api';
import { 
  Ticket, 
  Mensagem, 
  Contato, 
  CanalTipo, 
  StatusAtendimento,
  Demanda,
  NotaCliente,
  HistoricoAtendimento
} from '../types';
import { 
  NovoAtendimentoData 
} from '../modals/NovoAtendimentoModal';
import { 
  TransferenciaData 
} from '../modals/TransferirAtendimentoModal';
import { 
  EncerramentoData 
} from '../modals/EncerrarAtendimentoModal';
import {
  ContatoEditado
} from '../modals/EditarContatoModal';
import {
  NovaDemanda
} from '../modals/AbrirDemandaModal';

// ===== INTERFACES DE REQUEST/RESPONSE =====

export interface ListarTicketsParams {
  status?: StatusAtendimento;
  canal?: CanalTipo;
  atendenteId?: string;
  busca?: string;
  page?: number;
  limit?: number;
}

export interface ListarTicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListarMensagensParams {
  ticketId: string;
  page?: number;
  limit?: number;
}

export interface ListarMensagensResponse {
  data: Mensagem[];
  total: number;
  page: number;
}

export interface EnviarMensagemParams {
  ticketId: string;
  conteudo: string;
  anexos?: File[];
  audio?: {
    blob: Blob;
    duracao: number;
  };
}

export interface CriarTicketResponse {
  ticket: Ticket;
  mensagem?: Mensagem;
}

export interface TransferirTicketResponse {
  ticket: Ticket;
  notificado: boolean;
}

export interface EncerrarTicketResponse {
  ticket: Ticket;
  followUp?: {
    id: string;
    dataAgendamento: Date;
  };
  csatEnviado: boolean;
}

export interface BuscarContatosParams {
  busca: string;
  limit?: number;
}

export interface BuscarClientesParams {
  busca: string;
  limit?: number;
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email?: string;
  telefone?: string;
  contatosVinculados: number;
}

// ===== SERVIÇO =====

class AtendimentoService {
  private baseUrl = '/api/atendimento';

  // ========== TICKETS ==========

  /**
   * Lista todos os tickets com filtros
   */
  async listarTickets(params: ListarTicketsParams = {}): Promise<ListarTicketsResponse> {
    try {
      const response = await api.get<ListarTicketsResponse>(`${this.baseUrl}/tickets`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar tickets:', error);
      throw error;
    }
  }

  /**
   * Busca um ticket específico por ID
   */
  async buscarTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await api.get<Ticket>(`${this.baseUrl}/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar ticket:', error);
      throw error;
    }
  }

  /**
   * Cria um novo ticket de atendimento
   */
  async criarTicket(dados: NovoAtendimentoData): Promise<CriarTicketResponse> {
    try {
      const response = await api.post<CriarTicketResponse>(`${this.baseUrl}/tickets`, dados);
      console.log('✅ Ticket criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }
  }

  /**
   * Transfere ticket para outro atendente
   */
  async transferirTicket(
    ticketId: string, 
    dados: TransferenciaData
  ): Promise<TransferirTicketResponse> {
    try {
      const response = await api.post<TransferirTicketResponse>(
        `${this.baseUrl}/tickets/${ticketId}/transferir`,
        dados
      );
      console.log('✅ Ticket transferido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao transferir ticket:', error);
      throw error;
    }
  }

  /**
   * Encerra um ticket
   */
  async encerrarTicket(
    ticketId: string,
    dados: EncerramentoData
  ): Promise<EncerrarTicketResponse> {
    try {
      const response = await api.post<EncerrarTicketResponse>(
        `${this.baseUrl}/tickets/${ticketId}/encerrar`,
        dados
      );
      console.log('✅ Ticket encerrado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao encerrar ticket:', error);
      throw error;
    }
  }

  /**
   * Reabre um ticket encerrado
   */
  async reabrirTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await api.post<Ticket>(`${this.baseUrl}/tickets/${ticketId}/reabrir`);
      console.log('✅ Ticket reaberto:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao reabrir ticket:', error);
      throw error;
    }
  }

  // ========== MENSAGENS ==========

  /**
   * Lista mensagens de um ticket
   */
  async listarMensagens(params: ListarMensagensParams): Promise<ListarMensagensResponse> {
    try {
      const response = await api.get<ListarMensagensResponse>(
        `${this.baseUrl}/tickets/${params.ticketId}/mensagens`,
        { params: { page: params.page, limit: params.limit } }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar mensagens:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async enviarMensagem(params: EnviarMensagemParams): Promise<Mensagem> {
    try {
      const formData = new FormData();
      formData.append('conteudo', params.conteudo);

      // Anexos de arquivo
      if (params.anexos && params.anexos.length > 0) {
        params.anexos.forEach((arquivo, index) => {
          formData.append(`anexos[${index}]`, arquivo);
        });
      }

      // Áudio
      if (params.audio) {
        formData.append('audio', params.audio.blob, 'audio.webm');
        formData.append('duracao', params.audio.duracao.toString());
      }

      const response = await api.post<Mensagem>(
        `${this.baseUrl}/tickets/${params.ticketId}/mensagens`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Mensagem enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async marcarComoLidas(ticketId: string, mensagemIds: string[]): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/tickets/${ticketId}/mensagens/marcar-lidas`, {
        mensagemIds,
      });
      console.log('✅ Mensagens marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }

  // ========== CONTATOS ==========

  /**
   * Busca contatos por nome/telefone
   */
  async buscarContatos(params: BuscarContatosParams): Promise<Contato[]> {
    try {
      const response = await api.get<Contato[]>(`${this.baseUrl}/contatos/buscar`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar contatos:', error);
      throw error;
    }
  }

  /**
   * Cria um novo contato
   */
  async criarContato(dados: Omit<Contato, 'id' | 'online'>): Promise<Contato> {
    try {
      const response = await api.post<Contato>(`${this.baseUrl}/contatos`, dados);
      console.log('✅ Contato criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar contato:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um contato
   */
  async atualizarContato(contatoId: string, dados: ContatoEditado): Promise<Contato> {
    try {
      const response = await api.put<Contato>(`${this.baseUrl}/contatos/${contatoId}`, dados);
      console.log('✅ Contato atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar contato:', error);
      throw error;
    }
  }

  /**
   * Vincula contato a um cliente CRM
   */
  async vincularCliente(contatoId: string, clienteId: string): Promise<Contato> {
    try {
      const response = await api.post<Contato>(
        `${this.baseUrl}/contatos/${contatoId}/vincular-cliente`,
        { clienteId }
      );
      console.log('✅ Cliente vinculado ao contato:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao vincular cliente:', error);
      throw error;
    }
  }

  // ========== CLIENTES CRM ==========

  /**
   * Busca clientes CRM por nome/CNPJ
   */
  async buscarClientes(params: BuscarClientesParams): Promise<Cliente[]> {
    try {
      const response = await api.get<Cliente[]>(`/api/clientes/buscar`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      throw error;
    }
  }

  // ========== HISTÓRICO ==========

  /**
   * Busca histórico de atendimentos de um contato
   */
  async buscarHistorico(contatoId: string): Promise<HistoricoAtendimento[]> {
    try {
      const response = await api.get<HistoricoAtendimento[]>(
        `${this.baseUrl}/contatos/${contatoId}/historico`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // ========== DEMANDAS ==========

  /**
   * Cria uma demanda vinculada ao ticket
   */
  async criarDemanda(ticketId: string, dados: NovaDemanda): Promise<Demanda> {
    try {
      const response = await api.post<Demanda>(
        `${this.baseUrl}/tickets/${ticketId}/demandas`,
        dados
      );
      console.log('✅ Demanda criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar demanda:', error);
      throw error;
    }
  }

  /**
   * Lista demandas de um contato
   */
  async listarDemandas(contatoId: string): Promise<Demanda[]> {
    try {
      const response = await api.get<Demanda[]>(
        `${this.baseUrl}/contatos/${contatoId}/demandas`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar demandas:', error);
      throw error;
    }
  }

  // ========== NOTAS ==========

  /**
   * Cria uma nota no atendimento
   */
  async criarNota(ticketId: string, conteudo: string, importante: boolean): Promise<NotaCliente> {
    try {
      const response = await api.post<NotaCliente>(
        `${this.baseUrl}/tickets/${ticketId}/notas`,
        { conteudo, importante }
      );
      console.log('✅ Nota criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar nota:', error);
      throw error;
    }
  }

  /**
   * Lista notas de um contato
   */
  async listarNotas(contatoId: string): Promise<NotaCliente[]> {
    try {
      const response = await api.get<NotaCliente[]>(
        `${this.baseUrl}/contatos/${contatoId}/notas`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar notas:', error);
      throw error;
    }
  }

  /**
   * Exclui uma nota
   */
  async excluirNota(notaId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/notas/${notaId}`);
      console.log('✅ Nota excluída');
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      throw error;
    }
  }

  // ========== ATENDENTES ==========

  /**
   * Lista atendentes disponíveis para transferência
   */
  async listarAtendentes(): Promise<Array<{
    id: string;
    nome: string;
    foto?: string;
    status: 'online' | 'ocupado' | 'offline';
    atendimentosAtivos: number;
  }>> {
    try {
      const response = await api.get(`${this.baseUrl}/atendentes`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar atendentes:', error);
      throw error;
    }
  }

  // ========== TEMPLATES E RESPOSTAS RÁPIDAS ==========

  /**
   * Lista templates de mensagem
   */
  async listarTemplates(): Promise<Array<{
    id: string;
    titulo: string;
    conteudo: string;
    categoria: string;
  }>> {
    try {
      const response = await api.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar templates:', error);
      throw error;
    }
  }

  // ========== ESTATÍSTICAS ==========

  /**
   * Busca estatísticas do atendimento
   */
  async buscarEstatisticas(): Promise<{
    totalAbertos: number;
    totalResolvidos: number;
    totalRetornos: number;
    tempoMedioAtendimento: number;
    satisfacaoMedia: number;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/estatisticas`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

export const atendimentoService = new AtendimentoService();
