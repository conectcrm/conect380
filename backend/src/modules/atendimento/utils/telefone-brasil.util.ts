/**
 * ========================================
 * UTILITÁRIO: Normalização de Telefones Brasileiros
 * ========================================
 * 
 * Contexto: Em 2015-2017, o Brasil adicionou o dígito 9 no início
 * de todos os números de celular móvel.
 * 
 * Formato correto:
 * - Internacional: +55 (DDD) 9XXXX-XXXX
 * - Limpo: 55 + DDD (2 dígitos) + 9 + número (8 dígitos) = 13 dígitos
 * - Sem código país: DDD + 9 + número = 11 dígitos
 * 
 * Exemplos:
 * - +55 62 99668-9991  → 5562996689991 (13 dígitos com +55)
 * - (62) 99668-9991    → 62996689991   (11 dígitos sem +55)
 * ========================================
 */

export class TelefoneBrasilUtil {
  /**
   * Remove todos os caracteres não numéricos do telefone
   */
  static limparTelefone(telefone: string): string {
    return telefone.replace(/\D/g, '');
  }

  /**
   * Detecta se o número já tem o dígito 9 do celular
   */
  static temDigito9(numeroLimpo: string): boolean {
    // Remove código do país (55) se presente
    const semPais = numeroLimpo.startsWith('55')
      ? numeroLimpo.substring(2)
      : numeroLimpo;

    // Deve ter 11 dígitos (DDD 2 + 9 + número 8)
    if (semPais.length !== 11) return false;

    // O terceiro dígito deve ser 9 (após DDD de 2 dígitos)
    return semPais.charAt(2) === '9';
  }

  /**
   * Adiciona o dígito 9 se necessário (números antigos sem o 9)
   * 
   * ⚠️ IMPORTANTE: Alguns números antigos realmente NÃO TÊM o 9!
   * Esta função agora é mais conservadora:
   * - Só adiciona o 9 se o número tem EXATAMENTE 10 dígitos (DDD + 8 dígitos)
   * - Se o número já tem 11 dígitos, MANTÉM COMO ESTÁ (mesmo sem 9 no terceiro dígito)
   */
  static adicionarDigito9SeNecessario(numeroLimpo: string): string {
    // Remove código do país se presente
    const comPais = numeroLimpo.startsWith('55');
    const semPais = comPais ? numeroLimpo.substring(2) : numeroLimpo;

    // ✅ Se já tem 11 dígitos, MANTÉM ORIGINAL (pode ser número sem 9 legítimo)
    if (semPais.length === 11) {
      return numeroLimpo; // ⚠️ Não força adição do 9!
    }

    // ✅ Se tem 10 dígitos (DDD 2 + número 8), adiciona o 9
    if (semPais.length === 10) {
      const ddd = semPais.substring(0, 2);
      const numero = semPais.substring(2);
      const corrigido = `${ddd}9${numero}`;

      return comPais ? `55${corrigido}` : corrigido;
    }

    // ✅ Qualquer outro tamanho: retorna original sem modificar
    return numeroLimpo;
  }

  /**
   * Normaliza o número de telefone brasileiro para o formato WhatsApp
   * 
   * @param telefone - Número em qualquer formato
   * @param incluirCodigoPais - Se deve incluir o código do país (55)
   * @returns Número normalizado
   * 
   * Exemplos:
   * - normalizarParaWhatsApp('(62) 9668-9991') → '62996689991' (adiciona o 9)
   * - normalizarParaWhatsApp('62 99668-9991') → '62996689991'
   * - normalizarParaWhatsApp('+55 62 99668-9991') → '5562996689991'
   * - normalizarParaWhatsApp('556296689991') → '5562996689991' (corrige)
   */
  static normalizarParaWhatsApp(telefone: string, incluirCodigoPais: boolean = true): string {
    if (!telefone) return '';

    // 1. Limpar o número (remover formatação)
    let numeroLimpo = this.limparTelefone(telefone);

    // 2. Adicionar dígito 9 se necessário
    numeroLimpo = this.adicionarDigito9SeNecessario(numeroLimpo);

    // 3. Garantir que tem o código do país
    if (incluirCodigoPais && !numeroLimpo.startsWith('55')) {
      numeroLimpo = `55${numeroLimpo}`;
    }

    // 4. Validação final: deve ter 13 dígitos (com +55) ou 11 (sem +55)
    const tamanhoEsperado = incluirCodigoPais ? 13 : 11;
    if (numeroLimpo.length !== tamanhoEsperado) {
      console.warn(`⚠️  [TelefoneBrasil] Número com tamanho inesperado: ${numeroLimpo} (esperado: ${tamanhoEsperado})`);
    }

    return numeroLimpo;
  }

  /**
   * Valida se o número está no formato correto
   * 
   * ⚠️ ATUALIZADO: Aceita números com ou sem o dígito 9
   * Alguns números antigos realmente não têm o 9 e são válidos na whitelist
   */
  static validarNumero(numeroLimpo: string): { valido: boolean; erro?: string } {
    if (!numeroLimpo) {
      return { valido: false, erro: 'Número vazio' };
    }

    // Remove código do país se presente
    const comPais = numeroLimpo.startsWith('55');
    const semPais = comPais ? numeroLimpo.substring(2) : numeroLimpo;

    // Deve ter 11 dígitos (DDD 2 + [9 opcional] + número 8 ou 9)
    if (semPais.length !== 11) {
      return {
        valido: false,
        erro: `Número deve ter 11 dígitos (tem ${semPais.length})`
      };
    }

    // DDD deve estar entre 11 e 99
    const ddd = parseInt(semPais.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return {
        valido: false,
        erro: `DDD inválido: ${ddd}`
      };
    }

    // ✅ REMOVIDO: Não exige mais o dígito 9 no terceiro dígito
    // Aceita números com ou sem o 9 (compatibilidade com números antigos)

    return { valido: true };
  }

  /**
   * Formata o número para exibição amigável
   * 
   * Exemplos:
   * - 5562996689991 → +55 (62) 99668-9991 (com 9)
   * - 556284709519  → +55 (62) 8470-9519  (sem 9, número antigo)
   */
  static formatarParaExibicao(numeroLimpo: string): string {
    if (!numeroLimpo) return '';

    // Remove código do país se presente
    const comPais = numeroLimpo.startsWith('55');
    const semPais = comPais ? numeroLimpo.substring(2) : numeroLimpo;

    if (semPais.length !== 11) {
      return numeroLimpo; // Retorna original se inválido
    }

    const ddd = semPais.substring(0, 2);

    // ✅ Detecta se tem o dígito 9 (terceiro dígito deve ser 9)
    const tem9 = semPais.charAt(2) === '9';

    if (tem9) {
      // Formato: (62) 99668-9991 (9 dígitos após DDD)
      const digito9 = semPais.substring(2, 3);
      const primeiraParte = semPais.substring(3, 7);
      const segundaParte = semPais.substring(7, 11);

      return comPais
        ? `+55 (${ddd}) ${digito9}${primeiraParte}-${segundaParte}`
        : `(${ddd}) ${digito9}${primeiraParte}-${segundaParte}`;
    } else {
      // Formato: (62) 8470-9519 (8 dígitos após DDD, número antigo)
      const primeiraParte = semPais.substring(2, 6);
      const segundaParte = semPais.substring(6, 11);

      return comPais
        ? `+55 (${ddd}) ${primeiraParte}-${segundaParte}`
        : `(${ddd}) ${primeiraParte}-${segundaParte}`;
    }
  }

  /**
   * Detecta e corrige números antigos (sem o dígito 9)
   * Retorna objeto com informações sobre a correção
   */
  static detectarECorrigir(telefone: string): {
    original: string;
    corrigido: string;
    foiCorrigido: boolean;
    validacao: { valido: boolean; erro?: string };
  } {
    const original = this.limparTelefone(telefone);
    const corrigido = this.normalizarParaWhatsApp(telefone);
    const foiCorrigido = original !== corrigido;
    const validacao = this.validarNumero(corrigido);

    return {
      original,
      corrigido,
      foiCorrigido,
      validacao,
    };
  }
}

/**
 * ========================================
 * EXEMPLOS DE USO:
 * ========================================
 * 
 * // Normalizar para envio WhatsApp
 * const numero = TelefoneBrasilUtil.normalizarParaWhatsApp('(62) 9668-9991');
 * // → '5562996689991' (adiciona código país + dígito 9)
 * 
 * // Validar número
 * const validacao = TelefoneBrasilUtil.validarNumero('5562996689991');
 * // → { valido: true }
 * 
 * // Detectar e corrigir
 * const resultado = TelefoneBrasilUtil.detectarECorrigir('556296689991');
 * // → {
 * //     original: '556296689991',
 * //     corrigido: '5562996689991',
 * //     foiCorrigido: true,
 * //     validacao: { valido: true }
 * //   }
 * 
 * // Formatar para exibição
 * const formatado = TelefoneBrasilUtil.formatarParaExibicao('5562996689991');
 * // → '+55 (62) 99668-9991'
 * ========================================
 */
