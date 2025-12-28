import api from './api';
import { getErrorMessage } from '../utils/errorHandling';
import {
  StatusTicket,
  PrioridadeTicket,
  SeveridadeTicket,
  NivelAtendimentoTicket,
} from '../types/ticket';

type ApiListResponse<T> = {
  success: boolean;
  data: T;
  total?: number;
  pagina?: number;
  limite?: number;
};

export type StatusTicketApi = 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO' | 'FILA' | 'AGUARDANDO_CLIENTE' | 'AGUARDANDO_INTERNO' | 'CONCLUIDO' | 'CANCELADO' | 'ENCERRADO';
export type PrioridadeTicketApi = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type SeveridadeTicketApi = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type NivelAtendimentoTicketApi = 'N1' | 'N2' | 'N3';

/**
 * Tipo do ticket - Sprint 1: Unificação Tickets + Demandas
 */
export type TipoTicket = 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';

/**
 * Labels para exibição dos tipos de ticket
 */
export const tipoTicketLabels: Record<TipoTicket, string> = {
  tecnica: 'Técnica',
  comercial: 'Comercial',
  financeira: 'Financeira',
  suporte: 'Suporte',
  reclamacao: 'Reclamação',
  solicitacao: 'Solicitação',
  outros: 'Outros'
};

/**
 * Cores para badges de tipo de ticket
 */
export const tipoTicketColors: Record<TipoTicket, string> = {
  tecnica: 'blue',
  comercial: 'green',
  financeira: 'yellow',
  suporte: 'purple',
  reclamacao: 'red',
  solicitacao: 'cyan',
  outros: 'gray'
};

export

/**
 * Interface para filtros ao listar tickets
 * Sprint 1: Adicionado filtro por tipo
 */
export interface TicketFiltros {
  empresaId: string;
  status?: string | string[];
  canalId?: string;
  prioridade?: PrioridadeTicket | PrioridadeTicketApi;
  severity?: SeveridadeTicket | SeveridadeTicketApi;
  assignedLevel?: NivelAtendimentoTicket | NivelAtendimentoTicketApi;
  filaId?: string;
  atendenteId?: string;
  contatoId?: string;
  busca?: string;
  limite?: number;
  pagina?: number;
  /** Filtrar por tipo de ticket (Sprint 1: Unificação) */
  tipo?: TipoTicket;
  /** Filtrar por responsável (Sprint 1) */
  responsavelId?: string;
  /** Filtrar por autor (Sprint 1) */
  autorId?: string;
}

/**
 * Interface do ticket retornado pela API
 * Sprint 1: Unificação Tickets + Demandas - 7 novos campos adicionados
 */
export interface Ticket {
  id: string;
  numero: number;
  assunto?: string;
  status: StatusTicketApi | StatusTicket;
  prioridade: PrioridadeTicketApi | PrioridadeTicket;
  severity: SeveridadeTicketApi;
  assignedLevel: NivelAtendimentoTicketApi;
  escalationReason?: string;
  escalationAt?: string;
  slaTargetMinutes?: number;
  slaExpiresAt?: string;
  canalId: string;
  filaId?: string;
  clienteId: string;
  atendenteId?: string;
  mensagensNaoLidas: number;
  ultimaMensagemEm?: string;
  createdAt: string;
  updatedAt: string;
  empresaId?: string;

  // === Campos Novos - Sprint 1: Unificação Tickets + Demandas ===
  /** Título do ticket (alternativa ao assunto) */
  titulo?: string;
  /** Descrição completa do ticket */
  descricao?: string;
  /** Tipo do ticket (técnica, comercial, suporte, etc) */
  tipo?: TipoTicket;
  /** Data de vencimento/prazo do ticket */
  dataVencimento?: string;
  /** ID do usuário responsável pelo ticket */
  responsavelId?: string;
  /** ID do usuário que criou o ticket */
  autorId?: string;
  // === Fim Campos Novos ===

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
  /** Usuário responsável pelo ticket (Sprint 1) */
  responsavel?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  /** Usuário que criou o ticket (Sprint 1) */
  autor?: {
    id: string;
    nome: string;
    avatar?: string;
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

export interface EscalarTicketDto {
  level: NivelAtendimentoTicket | NivelAtendimentoTicketApi;
  reason: string;
  slaTargetMinutes?: number;
  slaExpiresAt?: string | Date;
}

export interface DesescalarTicketDto {
  reason?: string;
}

export interface ReatribuirTicketDto {
  filaId?: string;
  atendenteId?: string;
  assignedLevel?: NivelAtendimentoTicket | NivelAtendimentoTicketApi;
  severity?: SeveridadeTicket | SeveridadeTicketApi;
}

const normalizarStatusParaApi = (status?: string | StatusTicket): StatusTicketApi | undefined => {
  if (!status) return undefined;
  const valor = status.toString().toLowerCase();
  const mapa: Record<string, StatusTicketApi> = {
    aguardando: 'AGUARDANDO',
    pendente: 'AGUARDANDO',
    em_atendimento: 'EM_ATENDIMENTO',
    resolvido: 'RESOLVIDO',
    fechado: 'FECHADO',
    aberto: 'AGUARDANDO',
  };
  return mapa[valor] ?? undefined;
};

const normalizarPrioridadeParaApi = (
  prioridade?: PrioridadeTicket | PrioridadeTicketApi,
): PrioridadeTicketApi | undefined => {
  if (!prioridade) return undefined;
  const valor = prioridade.toString().toLowerCase();
  const mapa: Record<string, PrioridadeTicketApi> = {
    baixa: 'BAIXA',
    normal: 'MEDIA',
    media: 'MEDIA',
    alta: 'ALTA',
    urgente: 'URGENTE',
  };
  return mapa[valor] ?? undefined;
};

const normalizarSeveridadeParaApi = (
  severidade?: SeveridadeTicket | SeveridadeTicketApi,
): SeveridadeTicketApi | undefined => {
  if (!severidade) return undefined;
  const valor = severidade.toString().toLowerCase();
  const mapa: Record<string, SeveridadeTicketApi> = {
    baixa: 'BAIXA',
    media: 'MEDIA',
    alta: 'ALTA',
    critica: 'CRITICA',
  };
  return mapa[valor] ?? undefined;
};

const normalizarNivelParaApi = (
  nivel?: NivelAtendimentoTicket | NivelAtendimentoTicketApi,
): NivelAtendimentoTicketApi | undefined => {
  if (!nivel) return undefined;
  const valor = nivel.toString().toLowerCase();
  const mapa: Record<string, NivelAtendimentoTicketApi> = {
    n1: 'N1',
    n2: 'N2',
    n3: 'N3',
  };
  return mapa[valor] ?? undefined;
};

/**
 * Service para interagir com a API de tickets
 */
class TicketsService {
  /**
   * Lista tickets com filtros opcionais
   */
  async listar(filtros: TicketFiltros): Promise<ListarTicketsResposta> {
    try {
      const params = new URLSearchParams();
      params.append('empresaId', filtros.empresaId);

      const statusArray = Array.isArray(filtros.status) ? filtros.status : filtros.status ? [filtros.status] : [];
      statusArray
        .map((s) => normalizarStatusParaApi(s))
        .filter((s): s is StatusTicketApi => Boolean(s))
        .forEach((s) => params.append('status', s));

      const prioridade = normalizarPrioridadeParaApi(filtros.prioridade);
      if (prioridade) {
        params.append('prioridade', prioridade);
      }

      const severity = normalizarSeveridadeParaApi(filtros.severity);
      if (severity) {
        params.append('severity', severity);
      }

      const assignedLevel = normalizarNivelParaApi(filtros.assignedLevel);
      if (assignedLevel) {
        params.append('assignedLevel', assignedLevel);
      }

      if (filtros.canalId) {
        params.append('canalId', filtros.canalId);
      }

      if (filtros.filaId) {
        params.append('filaId', filtros.filaId);
      }

      if (filtros.atendenteId) {
        params.append('atendenteId', filtros.atendenteId);
      }

      if (filtros.contatoId) {
        params.append('contatoId', filtros.contatoId);
      }

      if (filtros.busca) {
        params.append('busca', filtros.busca);
      }

      // Sprint 1: Filtros novos (tipo, responsavelId, autorId)
      if (filtros.tipo) {
        params.append('tipo', filtros.tipo);
      }

      if (filtros.responsavelId) {
        params.append('responsavelId', filtros.responsavelId);
      }

      if (filtros.autorId) {
        params.append('autorId', filtros.autorId);
      }

      if (filtros.limite) {
        params.append('limite', filtros.limite.toString());
      }

      if (filtros.pagina) {
        params.append('pagina', filtros.pagina.toString());
      }

      const response = await api.get<ApiListResponse<Ticket[]>>('/api/atendimento/tickets', {
        params: Object.fromEntries(params),
      });

      const data = response.data?.data ?? [];

      return {
        success: response.data?.success ?? true,
        data,
        total: response.data?.total ?? data.length,
        pagina: response.data?.pagina ?? filtros.pagina ?? 1,
        limite: response.data?.limite ?? filtros.limite ?? data.length,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao listar tickets:', err);
      throw new Error(getErrorMessage(err, 'Erro ao listar tickets'));
    }
  }

  /**
   * Busca um ticket específico por ID
   */
  async buscar(ticketId: string, empresaId: string): Promise<BuscarTicketResposta> {
    try {
      const response = await api.get<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}`,
        {
          params: { empresaId },
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao buscar ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao buscar ticket'));
    }
  }

  /**
   * Atualiza o status de um ticket
   */
  async atualizarStatus(
    ticketId: string,
    empresaId: string,
    dados: AtualizarStatusDto,
  ): Promise<BuscarTicketResposta> {
    try {
      const statusApi = normalizarStatusParaApi(dados.status);
      if (!statusApi) {
        throw new Error('Status inválido');
      }

      const response = await api.patch<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/status`,
        {
          ...dados,
          status: statusApi,
          empresaId,
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao atualizar status');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao atualizar status do ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao atualizar status do ticket'));
    }
  }

  /**
   * Atualiza a prioridade de um ticket
   */
  async atualizarPrioridade(
    ticketId: string,
    empresaId: string,
    dados: AtualizarPrioridadeDto,
  ): Promise<BuscarTicketResposta> {
    try {
      const prioridadeApi = normalizarPrioridadeParaApi(dados.prioridade);
      if (!prioridadeApi) {
        throw new Error('Prioridade inválida');
      }

      const response = await api.patch<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/prioridade`,
        {
          ...dados,
          prioridade: prioridadeApi,
          empresaId,
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao atualizar prioridade');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao atualizar prioridade do ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao atualizar prioridade do ticket'));
    }
  }

  /**
   * Atribui um atendente a um ticket
   */
  async atribuirAtendente(
    ticketId: string,
    empresaId: string,
    dados: AtribuirAtendenteDto,
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await api.patch<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/atribuir`,
        {
          ...dados,
          empresaId,
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao atribuir atendente');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao atribuir atendente ao ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao atribuir atendente ao ticket'));
    }
  }

  async escalar(
    ticketId: string,
    empresaId: string,
    dados: EscalarTicketDto,
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await api.post<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/escalar`,
        {
          ...dados,
          level: normalizarNivelParaApi(dados.level),
          slaExpiresAt: dados.slaExpiresAt ? new Date(dados.slaExpiresAt).toISOString() : undefined,
          empresaId,
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao escalonar ticket');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao escalonar ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao escalonar ticket'));
    }
  }

  async desescalar(
    ticketId: string,
    empresaId: string,
    dados: DesescalarTicketDto,
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await api.post<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/desescalar`,
        {
          ...dados,
          empresaId,
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao desescalonar ticket');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao desescalonar ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao desescalonar ticket'));
    }
  }

  async reatribuir(
    ticketId: string,
    empresaId: string,
    dados: ReatribuirTicketDto,
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await api.patch<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/reatribuir`,
        {
          ...dados,
          assignedLevel: normalizarNivelParaApi(dados.assignedLevel),
          severity: normalizarSeveridadeParaApi(dados.severity),
          empresaId,
        },
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao reatribuir ticket');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao reatribuir ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao reatribuir ticket'));
    }
  }

  /**
   * Transfere um ticket para outro atendente
   */
  async transferir(
    ticketId: string,
    dados: {
      atendenteId: string;
      motivo: string;
      notaInterna?: string;
    },
  ): Promise<BuscarTicketResposta> {
    try {
      const response = await api.post<ApiListResponse<Ticket>>(
        `/api/atendimento/tickets/${ticketId}/transferir`,
        dados,
      );

      const ticket = response.data?.data;

      if (!ticket) {
        throw new Error('Resposta inválida ao transferir ticket');
      }

      return {
        success: response.data?.success ?? true,
        data: ticket,
      };
    } catch (err: unknown) {
      console.error('❌ Erro ao transferir ticket:', err);
      throw new Error(getErrorMessage(err, 'Erro ao transferir ticket'));
    }
  }
}

// Exportar instância única (singleton)
export const ticketsService = new TicketsService();
