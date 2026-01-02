import {
  Ticket as TicketAPI,
  SeveridadeTicketApi,
  NivelAtendimentoTicketApi,
} from '../services/ticketsService';
import {
  StatusTicket,
  PrioridadeTicket,
  SeveridadeTicket,
  NivelAtendimentoTicket,
} from '../types/ticket';

/**
 * Interface do ticket usado pelos componentes visuais
 */
export interface TicketComponente {
  id: string;
  numero: number | string;
  empresaId: string;
  clienteId?: string;
  canalId: string;
  filaId?: string;
  atendenteId?: string;
  status: string;
  prioridade: string;
  assunto?: string;
  descricao?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  clienteNome?: string;
  clienteVip?: boolean;
  severity?: string;
  assignedLevel?: string;
  escalationReason?: string;
  escalationAt?: string | Date;
  slaTargetMinutes?: number;
  slaExpiresAt?: string | Date;
  ultimaMensagemEm?: string | Date;
  ultimaMensagem?: string;
  mensagensNaoLidas?: number;
  criadoEm: Date | string;
  atualizadoEm?: Date | string;
  filaId?: string;
}

/**
 * Converte um ticket da API para o formato usado pelos componentes
 */
export function converterTicketAPIParaComponente(ticketAPI: TicketAPI): TicketComponente {
  return {
    id: ticketAPI.id,
    numero: ticketAPI.numero,
    empresaId: ticketAPI.empresaId || ticketAPI.canalId,
    clienteId: ticketAPI.clienteId,
    canalId: ticketAPI.canalId,
    filaId: ticketAPI.filaId,
    atendenteId: ticketAPI.atendenteId,
    status: converterStatusAPIParaComponente(ticketAPI.status),
    prioridade: converterPrioridadeAPIParaComponente(ticketAPI.prioridade),
    severity: converterSeveridadeAPIParaComponente(ticketAPI.severity as SeveridadeTicketApi),
    assignedLevel: converterNivelAPIParaComponente(ticketAPI.assignedLevel as NivelAtendimentoTicketApi),
    escalationReason: ticketAPI.escalationReason,
    escalationAt: ticketAPI.escalationAt,
    slaTargetMinutes: ticketAPI.slaTargetMinutes,
    slaExpiresAt: ticketAPI.slaExpiresAt,
    assunto: ticketAPI.assunto,
    contatoNome: ticketAPI.cliente?.nome,
    contatoTelefone: ticketAPI.cliente?.telefone,
    clienteNome: ticketAPI.cliente?.nome,
    clienteVip: false, // TODO: Implementar lógica VIP
    ultimaMensagemEm: ticketAPI.ultimaMensagemEm || ticketAPI.updatedAt,
    mensagensNaoLidas: ticketAPI.mensagensNaoLidas || 0,
    criadoEm: ticketAPI.createdAt,
    atualizadoEm: ticketAPI.updatedAt,
  };
}

/**
 * Converte status da API para o formato do componente
 */
function converterStatusAPIParaComponente(status: StatusTicket | string): string {
  const valor = status?.toString().toUpperCase();
  const mapeamento: Record<string, string> = {
    AGUARDANDO: 'aguardando',
    ABERTO: 'aguardando',
    PENDENTE: 'aguardando',
    EM_ATENDIMENTO: 'em_atendimento',
    RESOLVIDO: 'resolvido',
    FECHADO: 'fechado',
  };

  return mapeamento[valor || ''] || 'aguardando';
}

/**
 * Converte prioridade da API para o formato do componente
 */
function converterPrioridadeAPIParaComponente(prioridade: PrioridadeTicket | string): string {
  const valor = prioridade?.toString().toLowerCase();
  const mapeamento: Record<string, string> = {
    baixa: 'baixa',
    normal: 'media',
    media: 'media',
    alta: 'alta',
    urgente: 'alta',
  };

  return mapeamento[valor || ''] || 'media';
}

function converterSeveridadeAPIParaComponente(severity?: SeveridadeTicketApi | string): string {
  const valor = severity?.toString().toLowerCase();
  const mapeamento: Record<string, string> = {
    baixa: SeveridadeTicket.BAIXA,
    media: SeveridadeTicket.MEDIA,
    alta: SeveridadeTicket.ALTA,
    critica: SeveridadeTicket.CRITICA,
  };

  return mapeamento[valor || ''] || SeveridadeTicket.MEDIA;
}

function converterNivelAPIParaComponente(level?: NivelAtendimentoTicketApi | string): string {
  const valor = level?.toString().toLowerCase();
  const mapeamento: Record<string, string> = {
    n1: NivelAtendimentoTicket.N1,
    n2: NivelAtendimentoTicket.N2,
    n3: NivelAtendimentoTicket.N3,
  };

  return mapeamento[valor || ''] || NivelAtendimentoTicket.N1;
}

/**
 * Converte status do componente para a API
 */
export function converterStatusComponenteParaAPI(status: string): StatusTicket {
  const mapeamento: Record<string, StatusTicket> = {
    aguardando: StatusTicket.AGUARDANDO,
    em_atendimento: StatusTicket.EM_ATENDIMENTO,
    aberto: StatusTicket.AGUARDANDO,
    resolvido: StatusTicket.RESOLVIDO,
    fechado: StatusTicket.FECHADO,
  };

  return mapeamento[status] || StatusTicket.AGUARDANDO;
}

/**
 * Converte prioridade do componente para a API
 */
export function converterPrioridadeComponenteParaAPI(prioridade: string): PrioridadeTicket {
  const mapeamento: Record<string, PrioridadeTicket> = {
    baixa: PrioridadeTicket.BAIXA,
    media: PrioridadeTicket.NORMAL,
    normal: PrioridadeTicket.NORMAL,
    alta: PrioridadeTicket.ALTA,
    urgente: PrioridadeTicket.URGENTE,
  };

  return mapeamento[prioridade] || PrioridadeTicket.NORMAL;
}
