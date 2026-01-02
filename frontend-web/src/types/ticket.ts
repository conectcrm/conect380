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

export enum SeveridadeTicket {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export enum NivelAtendimentoTicket {
  N1 = 'n1',
  N2 = 'n2',
  N3 = 'n3',
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

export const SeveridadeTicketLabel: Record<SeveridadeTicket, string> = {
  [SeveridadeTicket.BAIXA]: 'Baixa',
  [SeveridadeTicket.MEDIA]: 'Média',
  [SeveridadeTicket.ALTA]: 'Alta',
  [SeveridadeTicket.CRITICA]: 'Crítica',
};

export const NivelAtendimentoTicketLabel: Record<NivelAtendimentoTicket, string> = {
  [NivelAtendimentoTicket.N1]: 'Nível 1',
  [NivelAtendimentoTicket.N2]: 'Nível 2',
  [NivelAtendimentoTicket.N3]: 'Nível 3',
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

export const SeveridadeTicketColor: Record<SeveridadeTicket, string> = {
  [SeveridadeTicket.BAIXA]: 'bg-gray-100 text-gray-800',
  [SeveridadeTicket.MEDIA]: 'bg-blue-100 text-blue-800',
  [SeveridadeTicket.ALTA]: 'bg-orange-100 text-orange-800',
  [SeveridadeTicket.CRITICA]: 'bg-red-100 text-red-800',
};

export const NivelAtendimentoTicketColor: Record<NivelAtendimentoTicket, string> = {
  [NivelAtendimentoTicket.N1]: 'bg-green-100 text-green-800',
  [NivelAtendimentoTicket.N2]: 'bg-yellow-100 text-yellow-800',
  [NivelAtendimentoTicket.N3]: 'bg-purple-100 text-purple-800',
};
