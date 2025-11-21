import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface IAConfig {
  provider: 'openai' | 'azure';
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
}

export interface IAResponse {
  resposta: string;
  confianca: number;
  requerAtendimentoHumano: boolean;
  metadata?: {
    tokensUsados?: number;
    tempo?: number;
    model?: string;
  };
}

export interface ContextoConversa {
  ticketId: string;
  clienteNome?: string;
  empresaNome?: string;
  historico: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  metadata?: Record<string, any>;
}

@Injectable()
export class IAService {
  private readonly logger = new Logger(IAService.name);
  private openaiClient: OpenAI | null = null;
  private config: IAConfig;
  private systemPrompt: string;

  // Cache de respostas (simples, para produção use Redis)
  private respostaCache = new Map<string, { resposta: IAResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private configService: ConfigService) {
    this.initializeConfig();
    this.initializeClient();
  }

  private initializeConfig() {
    this.config = {
      provider: this.configService.get<'openai' | 'azure'>('IA_PROVIDER', 'openai'),
      model: this.configService.get<string>('IA_MODEL', 'gpt-4o-mini'),
      temperature: parseFloat(this.configService.get<string>('IA_TEMPERATURE', '0.7')),
      maxTokens: parseInt(this.configService.get<string>('IA_MAX_TOKENS', '500'), 10),
      contextWindow: parseInt(this.configService.get<string>('IA_CONTEXT_WINDOW', '10'), 10),
    };

    this.systemPrompt = this.configService.get<string>(
      'IA_SYSTEM_PROMPT',
      this.getDefaultSystemPrompt(),
    );

    this.logger.log(`IA configurada: provider=${this.config.provider}, model=${this.config.model}`);
  }

  private initializeClient() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY não configurada. Serviço de IA desabilitado.');
      return;
    }

    try {
      if (this.config.provider === 'openai') {
        this.openaiClient = new OpenAI({
          apiKey,
        });
      } else if (this.config.provider === 'azure') {
        const azureEndpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
        const azureApiVersion = this.configService.get<string>(
          'AZURE_OPENAI_API_VERSION',
          '2024-02-01',
        );

        if (!azureEndpoint) {
          throw new Error('AZURE_OPENAI_ENDPOINT não configurado');
        }

        this.openaiClient = new OpenAI({
          apiKey,
          baseURL: `${azureEndpoint}/openai/deployments/${this.config.model}`,
          defaultQuery: { 'api-version': azureApiVersion },
          defaultHeaders: { 'api-key': apiKey },
        });
      }

      this.logger.log('Cliente OpenAI inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar cliente OpenAI:', error);
      this.openaiClient = null;
    }
  }

  private getDefaultSystemPrompt(): string {
    return `Você é um assistente virtual inteligente de atendimento ao cliente da empresa ConectCRM.

**Suas responsabilidades:**
1. Responder perguntas dos clientes de forma clara, educada e objetiva
2. Fornecer informações sobre produtos, serviços e políticas da empresa
3. Ajudar na resolução de problemas técnicos simples
4. Coletar informações para tickets de suporte

**Diretrizes de comportamento:**
- Seja sempre educado, empático e profissional
- Use linguagem clara e evite jargões técnicos complexos
- Se não souber a resposta, admita e sugira contato com atendimento humano
- Para questões complexas, sensíveis ou que exijam decisões, encaminhe para atendimento humano
- Mantenha as respostas concisas (máximo 3 parágrafos)
- Use emojis com moderação para tornar a conversa mais amigável 😊

**Quando encaminhar para atendimento humano:**
- Reclamações sérias ou solicitações de reembolso
- Questões jurídicas ou contratuais
- Problemas técnicos complexos
- Cliente demonstra frustração ou insatisfação
- Solicitações que exigem acesso a dados sensíveis

**Formato de resposta:**
- Responda diretamente ao cliente em tom conversacional
- Se precisar encaminhar, seja transparente: "Vou transferir você para um atendente humano que poderá ajudar melhor."`;
  }

  /**
   * Gera resposta automática usando IA
   */
  async gerarResposta(contexto: ContextoConversa): Promise<IAResponse> {
    if (!this.openaiClient) {
      this.logger.warn('Cliente IA não disponível. Retornando resposta padrão.');
      return this.getFallbackResponse();
    }

    // Verificar cache
    const cacheKey = this.getCacheKey(contexto);
    const cached = this.respostaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug('Resposta recuperada do cache');
      return cached.resposta;
    }

    const startTime = Date.now();

    try {
      // Preparar mensagens para a API
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: this.buildSystemPrompt(contexto) },
        ...this.prepareConversationHistory(contexto),
      ];

      // Chamar API OpenAI
      const completion = await this.openaiClient.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        presence_penalty: 0.6, // Evitar repetições
        frequency_penalty: 0.3,
      });

      const resposta = completion.choices[0]?.message?.content || '';
      const tokensUsados = completion.usage?.total_tokens || 0;
      const tempo = Date.now() - startTime;

      // Analisar se requer atendimento humano
      const requerAtendimentoHumano = this.detectaNecessidadeAtendimentoHumano(resposta, contexto);

      const iaResponse: IAResponse = {
        resposta: resposta.trim(),
        confianca: this.calcularConfianca(completion, contexto),
        requerAtendimentoHumano,
        metadata: {
          tokensUsados,
          tempo,
          model: this.config.model,
        },
      };

      // Armazenar em cache
      this.respostaCache.set(cacheKey, { resposta: iaResponse, timestamp: Date.now() });

      this.logger.log(
        `Resposta IA gerada: ${tokensUsados} tokens, ${tempo}ms, confiança=${iaResponse.confianca.toFixed(2)}`,
      );

      return iaResponse;
    } catch (error) {
      this.logger.error('Erro ao gerar resposta IA:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Constrói o prompt do sistema com contexto adicional
   */
  private buildSystemPrompt(contexto: ContextoConversa): string {
    let prompt = this.systemPrompt;

    if (contexto.clienteNome) {
      prompt += `\n\n**Contexto atual:**\n- Cliente: ${contexto.clienteNome}`;
    }

    if (contexto.empresaNome) {
      prompt += `\n- Empresa: ${contexto.empresaNome}`;
    }

    if (contexto.metadata) {
      const metadataStr = Object.entries(contexto.metadata)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');
      if (metadataStr) {
        prompt += `\n${metadataStr}`;
      }
    }

    return prompt;
  }

  /**
   * Prepara histórico de conversa (limitado por contextWindow)
   */
  private prepareConversationHistory(contexto: ContextoConversa): ChatCompletionMessageParam[] {
    const historico = contexto.historico || [];
    const limite = this.config.contextWindow;

    // Pegar as últimas N mensagens
    const historicoLimitado = historico.slice(-limite);

    return historicoLimitado.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  /**
   * Detecta se a resposta indica necessidade de atendimento humano
   */
  private detectaNecessidadeAtendimentoHumano(
    resposta: string,
    contexto: ContextoConversa,
  ): boolean {
    const palavrasChave = [
      'atendente humano',
      'transferir',
      'encaminhar',
      'não consigo',
      'não posso',
      'desculpe',
      'lamento',
      'supervisor',
      'gerente',
    ];

    const respostaLower = resposta.toLowerCase();
    const temPalavraChave = palavrasChave.some((palavra) => respostaLower.includes(palavra));

    // Verificar se cliente demonstra frustração
    const ultimaMensagemCliente = contexto.historico
      .slice()
      .reverse()
      .find((msg) => msg.role === 'user');

    if (ultimaMensagemCliente) {
      const mensagemLower = ultimaMensagemCliente.content.toLowerCase();
      const palavrasFrustracao = [
        'péssimo',
        'horrível',
        'terrível',
        'reclamação',
        'absurdo',
        'revoltado',
        'insatisfeito',
        'cancelar',
        'processo',
      ];

      const temFrustracao = palavrasFrustracao.some((palavra) => mensagemLower.includes(palavra));

      if (temFrustracao) {
        return true;
      }
    }

    return temPalavraChave;
  }

  /**
   * Calcula nível de confiança da resposta (0-1)
   */
  private calcularConfianca(completion: any, contexto: ContextoConversa): number {
    // Fatores que influenciam a confiança:
    // 1. Finish reason (se completou normalmente)
    // 2. Tamanho da resposta (muito curta = baixa confiança)
    // 3. Quantidade de contexto disponível

    let confianca = 0.7; // Base

    const finishReason = completion.choices[0]?.finish_reason;
    if (finishReason === 'stop') {
      confianca += 0.2; // Completou normalmente
    } else if (finishReason === 'length') {
      confianca -= 0.1; // Atingiu limite de tokens
    }

    const resposta = completion.choices[0]?.message?.content || '';
    if (resposta.length < 20) {
      confianca -= 0.2; // Resposta muito curta
    } else if (resposta.length > 100) {
      confianca += 0.1; // Resposta detalhada
    }

    // Mais contexto = mais confiança
    if (contexto.historico.length > 3) {
      confianca += 0.05;
    }

    return Math.max(0, Math.min(1, confianca)); // Garantir range [0, 1]
  }

  /**
   * Retorna resposta padrão quando IA não está disponível
   */
  private getFallbackResponse(): IAResponse {
    return {
      resposta:
        'Olá! Agradeço seu contato. No momento, nosso sistema inteligente está temporariamente indisponível. Um atendente humano irá responder sua mensagem em breve. Por favor, aguarde! 😊',
      confianca: 0,
      requerAtendimentoHumano: true,
      metadata: {
        tokensUsados: 0,
        tempo: 0,
        model: 'fallback',
      },
    };
  }

  /**
   * Gera chave de cache baseada no contexto
   */
  private getCacheKey(contexto: ContextoConversa): string {
    const ultimaMensagem = contexto.historico[contexto.historico.length - 1];
    return `${contexto.ticketId}_${ultimaMensagem?.content.substring(0, 50)}`;
  }

  /**
   * Limpa cache expirado
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.respostaCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.respostaCache.delete(key);
      }
    }
  }

  /**
   * Retorna estatísticas do serviço
   */
  getStats() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      cacheSize: this.respostaCache.size,
      isEnabled: this.openaiClient !== null,
    };
  }
}
