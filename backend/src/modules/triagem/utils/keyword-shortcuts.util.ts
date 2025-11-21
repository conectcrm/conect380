/**
 * Utilitário para detectar atalhos de palavras-chave
 * Permite que usuários escrevam livremente ao invés de apenas usar menus
 * 
 * Exemplo: "quero boleto" → detecta automaticamente núcleo Financeiro
 */

export interface ShortcutMatch {
  nucleoCodigo?: string;
  departamentoCodigo?: string;
  acao?: string;
  etapaId?: string;
  confianca: number;
  palavrasEncontradas?: string[];
  categoria: string;
}

export class KeywordShortcuts {
  /**
   * Mapa de atalhos: categoria → palavras-chave
   */
  private static readonly ATALHOS = {
    financeiro: {
      keywords: [
        'boleto', 'fatura', 'pagamento', 'cobrança', 'cobranca', 'nota fiscal',
        'nf', 'danfe', '2 via', '2via', 'segunda via', 'vencimento', 'venceu',
        'débito', 'debito', 'crédito', 'credito', 'cancelar assinatura',
        'reembolso', 'dinheiro', 'pagar', 'valor', 'preço', 'preco',
        'mensalidade', 'anuidade', 'cobrando', 'cartão', 'cartao', 'pix'
      ],
      tipo: 'nucleo' as const,
      codigo: 'NUC_FINANCEIRO',
      confianca: 0.9,
    },
    suporte: {
      keywords: [
        'erro', 'bug', 'problema', 'não funciona', 'nao funciona', 'lento',
        'travou', 'travando', 'caiu', 'offline', 'integração', 'integracao',
        'api', 'webhook', 'suporte', 'técnico', 'tecnico', 'ajuda', 'dúvida',
        'duvida', 'como fazer', 'tutorial', 'não consigo', 'nao consigo',
        'não abre', 'nao abre', 'quebrou', 'parou', 'instável', 'instavel'
      ],
      tipo: 'nucleo' as const,
      codigo: 'NUC_SUPORTE',
      confianca: 0.85,
    },
    comercial: {
      keywords: [
        'plano', 'upgrade', 'downgrade', 'proposta', 'orçamento', 'orcamento',
        'contratar', 'renovar', 'contrato', 'preço', 'preco', 'valor',
        'demonstração', 'demonstracao', 'demo', 'apresentação', 'apresentacao',
        'trial', 'teste', 'testar', 'conhecer', 'comprar', 'vender',
        'novidades', 'recursos', 'funcionalidades', 'plano novo'
      ],
      tipo: 'nucleo' as const,
      codigo: 'NUC_COMERCIAL',
      confianca: 0.88,
    },
    humano: {
      keywords: [
        'humano', 'atendente', 'pessoa', 'gente', 'falar com alguém',
        'falar com alguem', 'representante', 'operador', 'não quero bot',
        'nao quero bot', 'sair do bot', 'chat humano', 'atendimento humano',
        'quero uma pessoa', 'alguém real', 'alguem real'
      ],
      tipo: 'acao' as const,
      acao: 'transferir_geral',
      confianca: 0.95,
    },
    status: {
      keywords: [
        'status', 'protocolo', 'ticket', 'número', 'numero', 'chamado',
        'acompanhar', 'andamento', 'atendimento', 'meu ticket', 'meu protocolo',
        'consultar', 'verificar', 'onde está', 'onde esta', 'solicitação',
        'solicitacao', 'abertura', 'aberto'
      ],
      tipo: 'etapa' as const,
      etapaId: 'coleta-protocolo',
      confianca: 0.85,
    },
    sair: {
      keywords: [
        'sair', 'cancelar', 'desistir', 'não quero mais', 'nao quero mais',
        'deixa pra lá', 'deixa pra la', 'esquece', 'depois', 'agora não',
        'agora nao', 'tchau', 'até logo', 'ate logo', 'obrigado', 'valeu'
      ],
      tipo: 'acao' as const,
      acao: 'finalizar',
      confianca: 0.9,
    },
  };

  /**
   * Detecta o primeiro atalho encontrado na mensagem
   * Retorna null se nenhum atalho for detectado
   */
  static detectar(mensagem: string): ShortcutMatch | null {
    const texto = this.normalizarTexto(mensagem);

    for (const [categoria, config] of Object.entries(this.ATALHOS)) {
      for (const keyword of config.keywords) {
        const keywordNormalizado = this.normalizarTexto(keyword);

        // Busca palavra/frase completa (word boundary)
        const regex = new RegExp(`\\b${this.escapeRegex(keywordNormalizado)}\\b`, 'i');

        if (regex.test(texto)) {
          return this.construirMatch(categoria, config, [keyword]);
        }
      }
    }

    return null;
  }

  /**
   * Detecta múltiplos atalhos e retorna ordenado por relevância
   * Útil para sugerir opções quando há ambiguidade
   */
  static detectarMultiplos(mensagem: string, limite: number = 3): ShortcutMatch[] {
    const texto = this.normalizarTexto(mensagem);
    const matches: Map<string, { config: any; palavras: string[]; score: number }> = new Map();

    for (const [categoria, config] of Object.entries(this.ATALHOS)) {
      let score = 0;
      const palavrasEncontradas: string[] = [];

      for (const keyword of config.keywords) {
        const keywordNormalizado = this.normalizarTexto(keyword);
        const regex = new RegExp(`\\b${this.escapeRegex(keywordNormalizado)}\\b`, 'i');

        if (regex.test(texto)) {
          score += 1;
          palavrasEncontradas.push(keyword);
        }
      }

      if (score > 0) {
        matches.set(categoria, { config, palavras: palavrasEncontradas, score });
      }
    }

    // Converter para array e ordenar por score
    const resultados = Array.from(matches.entries())
      .map(([categoria, data]) => ({
        ...this.construirMatch(categoria, data.config, data.palavras),
        confianca: Math.min(0.98, data.config.confianca + (data.score * 0.03)),
      }))
      .sort((a, b) => b.confianca - a.confianca)
      .slice(0, limite);

    return resultados;
  }

  /**
   * Verifica se a mensagem contém palavras de urgência
   */
  static detectarUrgencia(mensagem: string): boolean {
    const palavrasUrgencia = [
      'urgente', 'agora', 'imediato', 'rápido', 'rapido',
      'já', 'ja', 'crítico', 'critico', 'parado', 'emergência',
      'emergencia', 'socorro', 'ajuda urgente'
    ];

    const texto = this.normalizarTexto(mensagem);

    return palavrasUrgencia.some(palavra => {
      const regex = new RegExp(`\\b${this.escapeRegex(palavra)}\\b`, 'i');
      return regex.test(texto);
    });
  }

  /**
   * Verifica se a mensagem expressa frustração/insatisfação
   */
  static detectarFrustracao(mensagem: string): boolean {
    const palavrasFrustracao = [
      'ridículo', 'ridiculo', 'péssimo', 'pessimo', 'horrível', 'horrivel',
      'nunca funciona', 'sempre quebra', 'não aguento', 'nao aguento',
      'cansado', 'frustrado', 'irritado', 'indignado', 'revoltado',
      'absurdo', 'inadmissível', 'inadmissivel', 'inaceitável', 'inaceitavel'
    ];

    const texto = this.normalizarTexto(mensagem);

    return palavrasFrustracao.some(palavra => {
      const regex = new RegExp(`\\b${this.escapeRegex(palavra)}\\b`, 'i');
      return regex.test(texto);
    });
  }

  // ========== Métodos Privados ==========

  private static construirMatch(
    categoria: string,
    config: any,
    palavras: string[],
  ): ShortcutMatch {
    const match: ShortcutMatch = {
      categoria,
      confianca: config.confianca,
      palavrasEncontradas: palavras,
    };

    if (config.tipo === 'nucleo') {
      match.nucleoCodigo = config.codigo;
    } else if (config.tipo === 'acao') {
      match.acao = config.acao;
    } else if (config.tipo === 'etapa') {
      match.etapaId = config.etapaId;
    }

    return match;
  }

  /**
   * Normaliza texto: lowercase, remove acentos, múltiplos espaços
   */
  private static normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' ') // Múltiplos espaços → 1 espaço
      .trim();
  }

  /**
   * Escapa caracteres especiais de regex
   */
  private static escapeRegex(texto: string): string {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Retorna sugestão de mensagem quando múltiplos atalhos são detectados
   */
  static gerarMensagemAmbiguidade(matches: ShortcutMatch[]): string {
    if (matches.length === 0) return '';

    const opcoes = matches.map((match, idx) => {
      let descricao = '';

      if (match.nucleoCodigo) {
        const nomes = {
          NUC_FINANCEIRO: 'Financeiro',
          NUC_SUPORTE: 'Suporte Técnico',
          NUC_COMERCIAL: 'Comercial',
        };
        descricao = nomes[match.nucleoCodigo] || match.nucleoCodigo;
      } else if (match.acao === 'transferir_geral') {
        descricao = 'Falar com atendente humano';
      } else if (match.acao === 'finalizar') {
        descricao = 'Cancelar atendimento';
      }

      return `${idx + 1}️⃣ ${descricao}`;
    }).join('\n');

    return `Entendi! Você pode estar se referindo a:\n\n${opcoes}\n\nQual opção você prefere?`;
  }
}
