/**
 * Status possíveis para um ticket
 */
export enum StatusTicket {
  AGUARDANDO = 'aguardando',
  EM_ATENDIMENTO = 'em_atendimento',
  PENDENTE = 'pendente',
  RESOLVIDO = 'resolvido',
  FECHADO = 'fechado',
}

/**
 * Prioridades possíveis para um ticket
 */
export enum PrioridadeTicket {
  BAIXA = 'baixa',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

/**
 * Tradução de status para exibição
 */
export const StatusTicketLabel: Record<StatusTicket, string> = {
  [StatusTicket.AGUARDANDO]: 'Aguardando',
  [StatusTicket.EM_ATENDIMENTO]: 'Em Atendimento',
  [StatusTicket.PENDENTE]: 'Pendente',
  [StatusTicket.RESOLVIDO]: 'Resolvido',
  [StatusTicket.FECHADO]: 'Fechado',
};

/**
 * Tradução de prioridade para exibição
 */
export const PrioridadeTicketLabel: Record<PrioridadeTicket, string> = {
  [PrioridadeTicket.BAIXA]: 'Baixa',
  [PrioridadeTicket.NORMAL]: 'Normal',
  [PrioridadeTicket.ALTA]: 'Alta',
  [PrioridadeTicket.URGENTE]: 'Urgente',
};

/**
 * Cores para cada status (Tailwind CSS)
 */
export const StatusTicketColor: Record<StatusTicket, string> = {
  [StatusTicket.AGUARDANDO]: 'bg-yellow-100 text-yellow-800',
  [StatusTicket.EM_ATENDIMENTO]: 'bg-blue-100 text-blue-800',
  [StatusTicket.PENDENTE]: 'bg-orange-100 text-orange-800',
  [StatusTicket.RESOLVIDO]: 'bg-green-100 text-green-800',
  [StatusTicket.FECHADO]: 'bg-gray-100 text-gray-800',
};

/**
 * Cores para cada prioridade (Tailwind CSS)
 */
export const PrioridadeTicketColor: Record<PrioridadeTicket, string> = {
  [PrioridadeTicket.BAIXA]: 'bg-gray-100 text-gray-800',
  [PrioridadeTicket.NORMAL]: 'bg-blue-100 text-blue-800',
  [PrioridadeTicket.ALTA]: 'bg-orange-100 text-orange-800',
  [PrioridadeTicket.URGENTE]: 'bg-red-100 text-red-800',
};
