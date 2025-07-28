/**
 * Utilitários para geração de tokens
 */

/**
 * Gera um token numérico de 6 dígitos para acesso ao portal
 * @returns string com 6 dígitos numéricos
 */
export function gerarTokenNumerico(): string {
  // Gera um número aleatório de 6 dígitos (100000 a 999999)
  const token = Math.floor(Math.random() * 900000) + 100000;
  return token.toString();
}

/**
 * Valida se um token é um número de 6 dígitos
 * @param token Token a ser validado
 * @returns true se o token é válido
 */
export function validarTokenNumerico(token: string): boolean {
  // Verifica se é exatamente 6 dígitos numéricos
  const regex = /^\d{6}$/;
  return regex.test(token);
}

/**
 * Formata um token para exibição (adiciona espaços para melhor legibilidade)
 * @param token Token de 6 dígitos
 * @returns Token formatado (ex: "123 456")
 */
export function formatarTokenParaExibicao(token: string): string {
  if (!validarTokenNumerico(token)) {
    return token; // Retorna como está se não for válido
  }

  // Adiciona espaço no meio: 123456 -> 123 456
  return `${token.substring(0, 3)} ${token.substring(3)}`;
}

/**
 * Remove formatação do token (remove espaços)
 * @param tokenFormatado Token formatado com espaços
 * @returns Token limpo de 6 dígitos
 */
export function limparFormatacaoToken(tokenFormatado: string): string {
  return tokenFormatado.replace(/\s/g, '');
}
