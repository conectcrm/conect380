/**
 * Interface base para todos os adapters de canal
 */
export interface BaseChannelAdapter {
  /**
   * Nome do adapter
   */
  getName(): string;

  /**
   * Inicializa o adapter com as configurações
   */
  initialize(config: ChannelConfig): Promise<void>;

  /**
   * Envia mensagem de texto
   */
  enviarMensagem(destinatario: string, mensagem: string, opcoes?: EnviarMensagemOpcoes): Promise<MensagemEnviada>;

  /**
   * Envia mídia (imagem, áudio, vídeo, documento)
   */
  enviarMidia(destinatario: string, midia: MidiaParaEnviar): Promise<MensagemEnviada>;

  /**
   * Marca mensagem como lida
   */
  marcarComoLida(mensagemId: string): Promise<void>;

  /**
   * Obtém status de uma mensagem
   */
  getStatusMensagem(mensagemId: string): Promise<StatusMensagem>;

  /**
   * Processa webhook recebido do canal
   */
  processarWebhook(payload: any): Promise<WebhookProcessado>;

  /**
   * Valida webhook (verifica assinatura/token)
   */
  validarWebhook(payload: any, signature?: string): boolean;

  /**
   * Verifica se o adapter está ativo e configurado
   */
  isAtivo(): boolean;
}

export interface ChannelConfig {
  canalId: string;
  empresaId: string;
  tipo: string;
  provider: string;
  credenciais: Record<string, any>;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface EnviarMensagemOpcoes {
  replyTo?: string; // ID da mensagem que está respondendo
  template?: string; // Template do WhatsApp Business
  templateParams?: Record<string, string>;
  prioridade?: 'normal' | 'alta';
}

export interface MidiaParaEnviar {
  tipo: 'imagem' | 'audio' | 'video' | 'documento';
  url?: string; // URL pública da mídia
  arquivo?: Buffer; // Buffer do arquivo
  nome?: string;
  legenda?: string;
  mimetype?: string;
}

export interface MensagemEnviada {
  identificadorExterno: string; // ID no sistema externo
  status: 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro';
  timestamp: Date;
  erro?: string;
  metadados?: any;
}

export interface StatusMensagem {
  status: 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro';
  timestamp: Date;
  erro?: string;
}

export interface WebhookProcessado {
  tipo: 'mensagem' | 'status' | 'outro';
  identificadorExterno: string;
  remetente: string; // Telefone, username, email, etc
  conteudo?: string;
  midia?: {
    tipo: string;
    url: string;
    nome?: string;
  };
  timestamp: Date;
  status?: StatusMensagem;
  metadados?: any;
}
