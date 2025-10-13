import { Ticket as TicketAPI } from '../services/ticketsService';
import { StatusTicket, PrioridadeTicket } from '../types/ticket';

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
  ultimaMensagemEm?: string | Date;
  ultimaMensagem?: string;
  mensagensNaoLidas?: number;
  criadoEm: Date | string;
  atualizadoEm?: Date | string;
}

/**
 * Converte um ticket da API para o formato usado pelos componentes
 */
export function converterTicketAPIParaComponente(ticketAPI: TicketAPI): TicketComponente {
  return {
    id: ticketAPI.id,
    numero: ticketAPI.numero,
    empresaId: ticketAPI.canalId, // Usando canalId como empresaId temporariamente
    clienteId: ticketAPI.clienteId,
    canalId: ticketAPI.canalId,
    atendenteId: ticketAPI.atendenteId,
    status: converterStatusAPIParaComponente(ticketAPI.status),
    prioridade: converterPrioridadeAPIParaComponente(ticketAPI.prioridade),
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
function converterStatusAPIParaComponente(status: StatusTicket): string {
  const mapeamento: Record<StatusTicket, string> = {
    [StatusTicket.AGUARDANDO]: 'aguardando',
    [StatusTicket.EM_ATENDIMENTO]: 'em_atendimento',
    [StatusTicket.PENDENTE]: 'aguardando',
    [StatusTicket.RESOLVIDO]: 'resolvido',
    [StatusTicket.FECHADO]: 'fechado',
  };

  return mapeamento[status] || 'aberto';
}

/**
 * Converte prioridade da API para o formato do componente
 */
function converterPrioridadeAPIParaComponente(prioridade: PrioridadeTicket): string {
  const mapeamento: Record<PrioridadeTicket, string> = {
    [PrioridadeTicket.BAIXA]: 'baixa',
    [PrioridadeTicket.NORMAL]: 'media',
    [PrioridadeTicket.ALTA]: 'alta',
    [PrioridadeTicket.URGENTE]: 'alta',
  };

  return mapeamento[prioridade] || 'media';
}

/**
 * Converte status do componente para a API
 */
export function converterStatusComponenteParaAPI(status: string): StatusTicket {
  const mapeamento: Record<string, StatusTicket> = {
    'aguardando': StatusTicket.AGUARDANDO,
    'em_atendimento': StatusTicket.EM_ATENDIMENTO,
    'aberto': StatusTicket.AGUARDANDO,
    'resolvido': StatusTicket.RESOLVIDO,
    'fechado': StatusTicket.FECHADO,
  };

  return mapeamento[status] || StatusTicket.AGUARDANDO;
}

/**
 * Converte prioridade do componente para a API
 */
export function converterPrioridadeComponenteParaAPI(prioridade: string): PrioridadeTicket {
  const mapeamento: Record<string, PrioridadeTicket> = {
    'baixa': PrioridadeTicket.BAIXA,
    'media': PrioridadeTicket.NORMAL,
    'normal': PrioridadeTicket.NORMAL,
    'alta': PrioridadeTicket.ALTA,
    'urgente': PrioridadeTicket.URGENTE,
  };

  return mapeamento[prioridade] || PrioridadeTicket.NORMAL;
}
