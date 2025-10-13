/**
 * Interface comum para providers de IA (OpenAI, Anthropic, etc)
 */
export interface AIProvider {
  /**
   * Nome do provider
   */
  getName(): string;

  /**
   * Gera uma resposta baseada no contexto
   */
  gerarResposta(prompt: string, options?: AIGenerateOptions): Promise<AIResponse>;

  /**
   * Analisa o sentimento de um texto
   */
  analisarSentimento(texto: string): Promise<SentimentoAnalise>;

  /**
   * Detecta a intenção do usuário
   */
  detectarIntencao(texto: string, contexto?: any): Promise<IntencaoAnalise>;

  /**
   * Classifica o ticket em categorias
   */
  classificarTicket(
    assunto: string,
    descricao: string,
    mensagens?: string[],
  ): Promise<ClassificacaoAnalise>;

  /**
   * Gera embeddings para RAG
   */
  gerarEmbedding(texto: string): Promise<number[]>;
}

export interface AIGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  contexto?: any;
  baseConhecimento?: string[];
}

export interface AIResponse {
  resposta: string;
  modelo: string;
  tokensUsados: number;
  custoEstimado: number;
  tempoGeracaoMs: number;
  metadados?: any;
}

export interface SentimentoAnalise {
  sentimento: 'muito_positivo' | 'positivo' | 'neutro' | 'negativo' | 'muito_negativo';
  score: number; // 0-100
  confianca: number; // 0-100
  emocoes?: string[]; // ['frustrado', 'ansioso', 'satisfeito']
  urgencia?: 'baixa' | 'media' | 'alta' | 'urgente';
}

export interface IntencaoAnalise {
  intencao: string; // 'compra', 'suporte', 'cancelamento', 'reclamacao', etc
  score: number; // 0-100
  confianca: number; // 0-100
  acoes_sugeridas?: string[];
}

export interface ClassificacaoAnalise {
  categoria: string; // 'tecnico', 'financeiro', 'comercial', 'suporte'
  subcategoria?: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  score: number; // 0-100
  tags_sugeridas?: string[];
}
