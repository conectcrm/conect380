/**
 * 🔍 Utilitário de validação para formulários de coleta de dados
 */

export interface ValidationResult {
  valido: boolean;
  erro?: string;
  valorNormalizado?: string;
}

export class ValidationUtil {
  /**
   * Valida formato de e-mail
   */
  static validarEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        valido: false,
        erro: 'E-mail não pode estar vazio',
      };
    }

    const emailTrimmed = email.trim();

    if (emailTrimmed.length === 0) {
      return {
        valido: false,
        erro: 'E-mail não pode estar vazio',
      };
    }

    // Regex robusto para validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailTrimmed)) {
      return {
        valido: false,
        erro: 'Formato de e-mail inválido. Exemplo: seunome@empresa.com',
      };
    }

    // Validações adicionais
    if (emailTrimmed.length > 254) {
      return {
        valido: false,
        erro: 'E-mail muito longo (máximo 254 caracteres)',
      };
    }

    const [local, domain] = emailTrimmed.split('@');

    if (local.length > 64) {
      return {
        valido: false,
        erro: 'Parte local do e-mail muito longa (máximo 64 caracteres)',
      };
    }

    if (domain.length < 3) {
      return {
        valido: false,
        erro: 'Domínio do e-mail inválido',
      };
    }

    return {
      valido: true,
      valorNormalizado: emailTrimmed.toLowerCase(),
    };
  }

  /**
   * Valida nome (mínimo 2 caracteres, apenas letras e espaços)
   */
  static validarNome(nome: string, campo: string = 'Nome'): ValidationResult {
    if (!nome || typeof nome !== 'string') {
      return {
        valido: false,
        erro: `${campo} não pode estar vazio`,
      };
    }

    const nomeTrimmed = nome.trim();

    if (nomeTrimmed.length < 2) {
      return {
        valido: false,
        erro: `${campo} deve ter pelo menos 2 caracteres`,
      };
    }

    if (nomeTrimmed.length > 100) {
      return {
        valido: false,
        erro: `${campo} muito longo (máximo 100 caracteres)`,
      };
    }

    // Permitir letras, espaços, hífens e apóstrofos
    const nomeRegex = /^[a-záàâãéèêíïóôõöúçñA-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ'\-\s]+$/;

    if (!nomeRegex.test(nomeTrimmed)) {
      return {
        valido: false,
        erro: `${campo} deve conter apenas letras`,
      };
    }

    return {
      valido: true,
      valorNormalizado: this.capitalizarNome(nomeTrimmed),
    };
  }

  /**
   * Valida nome de empresa (mais flexível que nome pessoal)
   */
  static validarEmpresa(empresa: string): ValidationResult {
    if (!empresa || typeof empresa !== 'string') {
      return {
        valido: false,
        erro: 'Nome da empresa não pode estar vazio',
      };
    }

    const empresaTrimmed = empresa.trim();

    if (empresaTrimmed.length < 2) {
      return {
        valido: false,
        erro: 'Nome da empresa deve ter pelo menos 2 caracteres',
      };
    }

    if (empresaTrimmed.length > 200) {
      return {
        valido: false,
        erro: 'Nome da empresa muito longo (máximo 200 caracteres)',
      };
    }

    return {
      valido: true,
      valorNormalizado: empresaTrimmed,
    };
  }

  /**
   * Valida telefone (formato brasileiro)
   */
  static validarTelefone(telefone: string): ValidationResult {
    if (!telefone || typeof telefone !== 'string') {
      return {
        valido: false,
        erro: 'Telefone não pode estar vazio',
      };
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');

    // Aceitar formatos:
    // 11 dígitos: 11987654321 (celular com 9 dígitos)
    // 10 dígitos: 1134567890 (fixo)
    // 13 dígitos: 5511987654321 (com DDI Brasil)
    // 12 dígitos: 551134567890 (com DDI Brasil fixo)
    if (![10, 11, 12, 13].includes(telefoneLimpo.length)) {
      return {
        valido: false,
        erro: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)',
      };
    }

    return {
      valido: true,
      valorNormalizado: telefoneLimpo,
    };
  }

  /**
   * Capitaliza nome próprio (primeira letra de cada palavra maiúscula)
   */
  private static capitalizarNome(nome: string): string {
    const palavrasMinusculas = ['de', 'da', 'do', 'das', 'dos', 'e'];

    return nome
      .toLowerCase()
      .split(' ')
      .map((palavra, index) => {
        // Primeira palavra sempre maiúscula
        if (index === 0) {
          return palavra.charAt(0).toUpperCase() + palavra.slice(1);
        }

        // Palavras pequenas em minúscula (exceto se forem a primeira)
        if (palavrasMinusculas.includes(palavra)) {
          return palavra;
        }

        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
      })
      .join(' ');
  }

  /**
   * Normaliza resposta do usuário (remove espaços extras, etc)
   */
  static normalizarResposta(texto: string): string {
    if (!texto || typeof texto !== 'string') {
      return '';
    }

    return texto.trim().replace(/\s+/g, ' ');
  }

  /**
   * Detecta se usuário quer cancelar (palavras-chave)
   */
  static isRespostaCancelamento(texto: string): boolean {
    if (!texto || typeof texto !== 'string') {
      return false;
    }

    const textoNormalizado = texto.trim().toLowerCase();
    const palavrasCancelamento = [
      'sair',
      'cancelar',
      'voltar',
      'desistir',
      'parar',
      'cancel',
      'exit',
      'quit',
    ];

    return palavrasCancelamento.includes(textoNormalizado);
  }
}
