/**
 * 🔐 Validador de Transições de Status de Tickets
 *
 * Garante que apenas transições válidas sejam permitidas
 */

import { StatusTicket } from '../entities/ticket.entity';

/**
 * Mapa de transições permitidas
 * Cada status tem uma lista de próximos status válidos
 */
export const TRANSICOES_PERMITIDAS: Record<StatusTicket, StatusTicket[]> = {
  [StatusTicket.FILA]: [
    StatusTicket.EM_ATENDIMENTO,
    StatusTicket.ENCERRADO,
    StatusTicket.CANCELADO,
  ],
  [StatusTicket.EM_ATENDIMENTO]: [
    StatusTicket.AGUARDANDO_CLIENTE,
    StatusTicket.AGUARDANDO_INTERNO,
    StatusTicket.CONCLUIDO,
    StatusTicket.ENCERRADO,
    StatusTicket.FILA,
  ],
  [StatusTicket.AGUARDANDO_CLIENTE]: [
    StatusTicket.EM_ATENDIMENTO,
    StatusTicket.CONCLUIDO,
    StatusTicket.ENCERRADO,
    StatusTicket.CANCELADO,
  ],
  [StatusTicket.AGUARDANDO_INTERNO]: [
    StatusTicket.EM_ATENDIMENTO,
    StatusTicket.CONCLUIDO,
    StatusTicket.ENCERRADO,
    StatusTicket.CANCELADO,
  ],
  [StatusTicket.ENVIO_ATIVO]: [
    StatusTicket.EM_ATENDIMENTO,
    StatusTicket.AGUARDANDO_CLIENTE,
    StatusTicket.ENCERRADO,
  ],
  [StatusTicket.CONCLUIDO]: [StatusTicket.ENCERRADO, StatusTicket.FILA],
  [StatusTicket.ENCERRADO]: [StatusTicket.FILA],
  [StatusTicket.CANCELADO]: [StatusTicket.FILA],
};

/**
 * Valida se uma transição de status é permitida
 *
 * @param statusAtual Status atual do ticket
 * @param novoStatus Novo status desejado
 * @returns true se a transição é válida
 */
export function validarTransicaoStatus(
  statusAtual: StatusTicket,
  novoStatus: StatusTicket,
): boolean {
  // Se status não mudou, sempre válido
  if (statusAtual === novoStatus) {
    return true;
  }

  const transicoesPermitidas = TRANSICOES_PERMITIDAS[statusAtual];

  if (!transicoesPermitidas) {
    return false;
  }

  return transicoesPermitidas.includes(novoStatus);
}

/**
 * Obtém lista de próximos status válidos
 *
 * @param statusAtual Status atual do ticket
 * @returns Array de status válidos para transição
 */
export function obterProximosStatusValidos(statusAtual: StatusTicket): StatusTicket[] {
  return TRANSICOES_PERMITIDAS[statusAtual] || [];
}

/**
 * Gera mensagem de erro amigável para transição inválida
 *
 * @param statusAtual Status atual do ticket
 * @param novoStatus Novo status tentado
 * @returns Mensagem de erro descritiva
 */
export function gerarMensagemErroTransicao(
  statusAtual: StatusTicket,
  novoStatus: StatusTicket,
): string {
  const statusValidos = obterProximosStatusValidos(statusAtual);

  if (statusValidos.length === 0) {
    return `Ticket no status "${statusAtual}" não pode ser alterado.`;
  }

  return (
    `Transição inválida: "${statusAtual}" → "${novoStatus}". ` +
    `Status válidos a partir de "${statusAtual}": ${statusValidos.join(', ')}`
  );
}

/**
 * Regras de negócio para cada transição
 */
export const REGRAS_TRANSICAO: Record<string, string> = {
  [`${StatusTicket.FILA}_${StatusTicket.EM_ATENDIMENTO}`]: 'Ticket assumido pelo atendente',
  [`${StatusTicket.EM_ATENDIMENTO}_${StatusTicket.AGUARDANDO_CLIENTE}`]:
    'Aguardando resposta do cliente',
  [`${StatusTicket.EM_ATENDIMENTO}_${StatusTicket.AGUARDANDO_INTERNO}`]:
    'Aguardando resposta interna',
  [`${StatusTicket.EM_ATENDIMENTO}_${StatusTicket.CONCLUIDO}`]: 'Atendimento concluído',
  [`${StatusTicket.AGUARDANDO_CLIENTE}_${StatusTicket.EM_ATENDIMENTO}`]:
    'Cliente respondeu, retomando atendimento',
  [`${StatusTicket.CONCLUIDO}_${StatusTicket.ENCERRADO}`]: 'Atendimento encerrado',
  [`${StatusTicket.ENCERRADO}_${StatusTicket.FILA}`]: 'Ticket reaberto para nova solicitação',
};

/**
 * Obtém descrição da transição
 */
export function obterDescricaoTransicao(
  statusAtual: StatusTicket,
  novoStatus: StatusTicket,
): string {
  const chave = `${statusAtual}_${novoStatus}`;
  return REGRAS_TRANSICAO[chave] || `Transição de ${statusAtual} para ${novoStatus}`;
}
