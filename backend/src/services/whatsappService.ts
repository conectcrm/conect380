import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { Logger } from '@nestjs/common';

export interface WhatsAppStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  qrCode?: string;
  clientInfo?: Client['info'];
  lastConnected?: Date;
}

export interface WhatsAppMessage {
  to: string; // Número no formato: 5511999999999
  message: string;
  media?: {
    data: Buffer;
    mimetype: string;
    filename: string;
  };
}

export interface WhatsAppPropostaData {
  clienteNome: string;
  clienteWhatsApp: string;
  propostaNumero: string;
  valorTotal: number;
  empresaNome: string;
  pdfBuffer?: Buffer;
  mensagemPersonalizada?: string;
}

class WhatsAppService {
  private client: Client | null = null;
  private readonly logger = new Logger(WhatsAppService.name);
  private status: WhatsAppStatus = {
    isConnected: false,
    isAuthenticated: false,
  };
  private qrCodeCallbacks: ((qr: string) => void)[] = [];
  private statusCallbacks: ((status: WhatsAppStatus) => void)[] = [];

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    // Cria cliente com autenticação local
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'conectcrm-whatsapp',
        dataPath: './whatsapp-session',
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.client) return;

    // QR Code para autenticação
    this.client.on('qr', async (qr) => {
      this.logger.log('📱 QR Code gerado para WhatsApp');

      try {
        const qrCodeData = await QRCode.toDataURL(qr);
        this.status.qrCode = qrCodeData;

        // Notifica todos os callbacks
        this.qrCodeCallbacks.forEach((callback) => callback(qrCodeData));
        this.notifyStatusChange();
      } catch (error) {
        this.logger.error('❌ Erro ao gerar QR Code', error instanceof Error ? error.stack : null);
      }
    });

    // Cliente pronto
    this.client.on('ready', () => {
      this.logger.log('✅ WhatsApp conectado com sucesso!');
      this.status = {
        isConnected: true,
        isAuthenticated: true,
        qrCode: undefined,
        clientInfo: this.client?.info,
        lastConnected: new Date(),
      };
      this.notifyStatusChange();
    });

    // Cliente autenticado
    this.client.on('authenticated', () => {
      this.logger.log('🔐 WhatsApp autenticado');
      this.status.isAuthenticated = true;
      this.notifyStatusChange();
    });

    // Falha na autenticação
    this.client.on('auth_failure', (msg) => {
      this.logger.error(`❌ Falha na autenticação WhatsApp: ${msg}`);
      this.status = {
        isConnected: false,
        isAuthenticated: false,
      };
      this.notifyStatusChange();
    });

    // Desconectado
    this.client.on('disconnected', (reason) => {
      this.logger.warn(`🔌 WhatsApp desconectado: ${reason}`);
      this.status = {
        isConnected: false,
        isAuthenticated: false,
      };
      this.notifyStatusChange();
    });

    // Mensagem recebida (para logs)
    this.client.on('message', (message) => {
      this.logger.debug(`📨 Mensagem recebida: ${message.from} ${message.body}`);
    });
  }

  // Inicializar cliente
  async initialize(): Promise<void> {
    if (!this.client) {
      this.initializeClient();
    }

    try {
      await this.client?.initialize();
      this.logger.log('🚀 Cliente WhatsApp inicializado');
    } catch (error) {
      this.logger.error(
        '❌ Erro ao inicializar WhatsApp',
        error instanceof Error ? error.stack : null,
      );
      throw error;
    }
  }

  // Parar cliente
  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.status = {
        isConnected: false,
        isAuthenticated: false,
      };
      this.notifyStatusChange();
      this.logger.log('🛑 Cliente WhatsApp parado');
    }
  }

  // Registrar callback para QR Code
  onQRCode(callback: (qr: string) => void): void {
    this.qrCodeCallbacks.push(callback);
  }

  // Registrar callback para mudanças de status
  onStatusChange(callback: (status: WhatsAppStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  // Notificar mudanças de status
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach((callback) => callback(this.status));
  }

  // Obter status atual
  getStatus(): WhatsAppStatus {
    return { ...this.status };
  }

  // Enviar mensagem simples
  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.client || !this.status.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      // Formatar número no padrão internacional
      const formattedNumber = this.formatPhoneNumber(to);

      await this.client.sendMessage(formattedNumber, message);
      this.logger.log(`✅ Mensagem enviada para ${formattedNumber}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Erro ao enviar mensagem', error instanceof Error ? error.stack : null);
      throw error;
    }
  }

  // Enviar mensagem com mídia
  async sendMessageWithMedia(data: WhatsAppMessage): Promise<boolean> {
    if (!this.client || !this.status.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(data.to);

      if (data.media) {
        // Criar objeto de mídia
        const media = new MessageMedia(
          data.media.mimetype,
          data.media.data.toString('base64'),
          data.media.filename,
        );

        await this.client.sendMessage(formattedNumber, media, {
          caption: data.message,
        });
      } else {
        await this.client.sendMessage(formattedNumber, data.message);
      }

      this.logger.log(`✅ Mensagem com mídia enviada para ${formattedNumber}`);
      return true;
    } catch (error) {
      this.logger.error(
        '❌ Erro ao enviar mensagem com mídia',
        error instanceof Error ? error.stack : null,
      );
      throw error;
    }
  }

  // Enviar proposta via WhatsApp
  async enviarProposta(dadosProposta: WhatsAppPropostaData): Promise<boolean> {
    try {
      // Mensagem padrão da proposta
      const mensagem =
        dadosProposta.mensagemPersonalizada || this.gerarMensagemProposta(dadosProposta);

      // Dados para envio
      const messageData: WhatsAppMessage = {
        to: dadosProposta.clienteWhatsApp,
        message: mensagem,
      };

      // Adicionar PDF se fornecido
      if (dadosProposta.pdfBuffer) {
        messageData.media = {
          data: dadosProposta.pdfBuffer,
          mimetype: 'application/pdf',
          filename: `Proposta_${dadosProposta.propostaNumero}.pdf`,
        };
      }

      const sucesso = await this.sendMessageWithMedia(messageData);

      if (sucesso) {
        this.logger.log(
          `📋 Proposta ${dadosProposta.propostaNumero} enviada via WhatsApp para ${dadosProposta.clienteNome}`,
        );
      }

      return sucesso;
    } catch (error) {
      this.logger.error(
        '❌ Erro ao enviar proposta via WhatsApp',
        error instanceof Error ? error.stack : null,
      );
      throw error;
    }
  }

  // Gerar mensagem padrão da proposta
  private gerarMensagemProposta(dados: WhatsAppPropostaData): string {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(dados.valorTotal);

    return `🎯 *Nova Proposta Comercial*

👋 Olá *${dados.clienteNome}*!

📋 Enviamos sua proposta comercial:
• *Número:* ${dados.propostaNumero}
• *Valor Total:* ${valorFormatado}
• *Empresa:* ${dados.empresaNome}

📎 O arquivo PDF com todos os detalhes está anexado acima.

✅ *Próximos Passos:*
• Analise a proposta com calma
• Entre em contato conosco para esclarecimentos
• Confirme sua aprovação quando estiver pronto

📞 *Dúvidas?* Responda esta mensagem!

---
_Enviado automaticamente pelo sistema ${dados.empresaNome}_`;
  }

  // Verificar se número é válido
  async isValidNumber(phoneNumber: string): Promise<boolean> {
    if (!this.client || !this.status.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const numberId = await this.client.getNumberId(formattedNumber);
      return !!numberId;
    } catch (error) {
      this.logger.error('❌ Erro ao verificar número', error instanceof Error ? error.stack : null);
      return false;
    }
  }

  // Formatar número de telefone
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Se não tem código do país, adiciona Brasil (55)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    // Adiciona @c.us para formato WhatsApp
    return cleaned + '@c.us';
  }

  // Obter informações do cliente conectado
  getClientInfo(): Client['info'] | null {
    return this.client?.info || null;
  }

  // Obter chats
  async getChats(): Promise<ReturnType<Client['getChats']>> {
    if (!this.client || !this.status.isConnected) {
      return [];
    }

    try {
      const chats = await this.client.getChats();
      return chats.slice(0, 10); // Primeiros 10 chats
    } catch (error) {
      this.logger.error('❌ Erro ao obter chats', error instanceof Error ? error.stack : null);
      return [];
    }
  }

  // Verificar se cliente está online
  isReady(): boolean {
    return this.status.isConnected && this.status.isAuthenticated;
  }
}

// Instância singleton
export const whatsappService = new WhatsAppService();
export default whatsappService;
