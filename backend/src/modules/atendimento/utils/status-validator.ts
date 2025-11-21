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
  [StatusTicket.ABERTO]: [
    StatusTicket.EM_ATENDIMENTO,
    StatusTicket.FECHADO, // Pode fechar direto se for spam/duplicado
  ],
  [StatusTicket.EM_ATENDIMENTO]: [
    StatusTicket.AGUARDANDO,
    StatusTicket.RESOLVIDO,
    StatusTicket.ABERTO, // Pode voltar para fila se necessário
  ],
  [StatusTicket.AGUARDANDO]: [
    StatusTicket.EM_ATENDIMENTO,
    StatusTicket.RESOLVIDO,
    StatusTicket.FECHADO, // Pode fechar se cliente não responder
  ],
  [StatusTicket.RESOLVIDO]: [
    StatusTicket.FECHADO,
    StatusTicket.ABERTO, // Cliente pode reabrir
  ],
  [StatusTicket.FECHADO]: [
    StatusTicket.ABERTO, // Reabertura
  ],
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
  [`${StatusTicket.ABERTO}_${StatusTicket.EM_ATENDIMENTO}`]: 'Ticket assumido pelo atendente',

  [`${StatusTicket.EM_ATENDIMENTO}_${StatusTicket.AGUARDANDO}`]:
    'Aguardando resposta do cliente ou informações adicionais',

  [`${StatusTicket.EM_ATENDIMENTO}_${StatusTicket.RESOLVIDO}`]:
    'Problema resolvido, aguardando confirmação do cliente',

  [`${StatusTicket.AGUARDANDO}_${StatusTicket.EM_ATENDIMENTO}`]:
    'Cliente respondeu, retomando atendimento',

  [`${StatusTicket.RESOLVIDO}_${StatusTicket.FECHADO}`]:
    'Cliente confirmou resolução, arquivando ticket',

  [`${StatusTicket.FECHADO}_${StatusTicket.ABERTO}`]:
    'Ticket reaberto por nova solicitação do cliente',

  [`${StatusTicket.RESOLVIDO}_${StatusTicket.ABERTO}`]:
    'Cliente não ficou satisfeito, reabrindo ticket',
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
