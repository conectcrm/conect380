import axios, { AxiosInstance } from 'axios';

export interface ChatwootConfig {
  baseUrl: string;
  accessToken: string;
  accountId: number;
  inboxId: number;
}

export interface ChatwootContact {
  id?: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  custom_attributes?: Record<string, any>;
}

export interface ChatwootMessage {
  content: string;
  message_type: 'incoming' | 'outgoing';
  private?: boolean;
  attachments?: Array<{
    content: string; // base64
    file_type: string; // 'file', 'image', 'video', 'audio'
    file_name: string;
  }>;
}

export interface ChatwootConversation {
  id?: number;
  account_id: number;
  inbox_id: number;
  contact_id: number;
  status: 'open' | 'resolved' | 'pending';
  assignee_id?: number;
  custom_attributes?: Record<string, any>;
  labels?: string[];
}

export interface PropostaChatwootData {
  clienteNome: string;
  clienteWhatsApp: string;
  clienteEmail?: string;
  propostaNumero: string;
  valorTotal: number;
  empresaNome: string;
  pdfBuffer?: Buffer;
  mensagemPersonalizada?: string;
}

class ChatwootService {
  private config: ChatwootConfig;
  private apiClient: AxiosInstance;

  constructor(config: ChatwootConfig) {
    this.config = config;
    this.apiClient = axios.create({
      baseURL: `${config.baseUrl}/api/v1/accounts/${config.accountId}`,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // 1. Buscar ou criar contato
  async findOrCreateContact(contactData: ChatwootContact): Promise<ChatwootContact> {
    try {
      // Tentar buscar contato existente por telefone
      if (contactData.phone_number) {
        const searchResponse = await this.apiClient.get('/contacts/search', {
          params: { q: contactData.phone_number }
        });

        if (searchResponse.data?.payload?.length > 0) {
          console.log('📞 Contato encontrado no Chatwoot:', searchResponse.data.payload[0]);
          return searchResponse.data.payload[0];
        }
      }

      // Criar novo contato
      const createResponse = await this.apiClient.post('/contacts', contactData);
      console.log('✅ Novo contato criado no Chatwoot:', createResponse.data.payload);
      return createResponse.data.payload;
    } catch (error) {
      console.error('❌ Erro ao buscar/criar contato:', error);
      throw error;
    }
  }

  // 2. Criar nova conversa
  async createConversation(contactId: number, customAttributes?: Record<string, any>): Promise<ChatwootConversation> {
    try {
      const conversationData: ChatwootConversation = {
        account_id: this.config.accountId,
        inbox_id: this.config.inboxId,
        contact_id: contactId,
        status: 'open',
        custom_attributes: customAttributes || {}
      };

      const response = await this.apiClient.post('/conversations', conversationData);
      console.log('💬 Nova conversa criada:', response.data.payload);
      return response.data.payload;
    } catch (error) {
      console.error('❌ Erro ao criar conversa:', error);
      throw error;
    }
  }

  // 3. Enviar mensagem
  async sendMessage(conversationId: number, messageData: ChatwootMessage): Promise<any> {
    try {
      const response = await this.apiClient.post(`/conversations/${conversationId}/messages`, messageData);
      console.log('📤 Mensagem enviada:', response.data.payload);
      return response.data.payload;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // 4. Upload de anexo
  async uploadAttachment(file: File | Buffer, fileName: string): Promise<string> {
    try {
      const formData = new FormData();

      if (Buffer.isBuffer(file)) {
        const blob = new Blob([file], { type: 'application/pdf' });
        formData.append('attachment', blob, fileName);
      } else {
        formData.append('attachment', file, fileName);
      }

      const response = await this.apiClient.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📎 Anexo enviado:', response.data);
      return response.data.file_url;
    } catch (error) {
      console.error('❌ Erro ao enviar anexo:', error);
      throw error;
    }
  }

  // 5. Enviar proposta completa
  async enviarProposta(dadosProposta: PropostaChatwootData): Promise<boolean> {
    try {
      console.log('🚀 Iniciando envio de proposta via Chatwoot...');

      // 1. Formatar telefone
      const phoneFormatted = this.formatPhoneNumber(dadosProposta.clienteWhatsApp);

      // 2. Buscar ou criar contato
      const contact = await this.findOrCreateContact({
        name: dadosProposta.clienteNome,
        email: dadosProposta.clienteEmail,
        phone_number: phoneFormatted,
        identifier: `proposta_${dadosProposta.propostaNumero}`,
        custom_attributes: {
          proposta_numero: dadosProposta.propostaNumero,
          valor_proposta: dadosProposta.valorTotal,
          empresa: dadosProposta.empresaNome
        }
      });

      // 3. Criar conversa
      const conversation = await this.createConversation(contact.id!, {
        type: 'proposta_comercial',
        proposta_numero: dadosProposta.propostaNumero,
        valor_total: dadosProposta.valorTotal
      });

      // 4. Preparar mensagem
      const mensagem = dadosProposta.mensagemPersonalizada || this.gerarMensagemProposta(dadosProposta);

      // 5. Enviar mensagem principal
      await this.sendMessage(conversation.id!, {
        content: mensagem,
        message_type: 'outgoing'
      });

      // 6. Enviar PDF se disponível
      if (dadosProposta.pdfBuffer) {
        try {
          const fileName = `Proposta_${dadosProposta.propostaNumero}.pdf`;
          const attachmentUrl = await this.uploadAttachment(dadosProposta.pdfBuffer, fileName);

          await this.sendMessage(conversation.id!, {
            content: `📎 Documento anexado: Proposta ${dadosProposta.propostaNumero}`,
            message_type: 'outgoing',
            attachments: [{
              content: dadosProposta.pdfBuffer.toString('base64'),
              file_type: 'file',
              file_name: fileName
            }]
          });
        } catch (pdfError) {
          console.warn('⚠️ Erro ao anexar PDF, continuando sem anexo:', pdfError);
        }
      }

      // 7. Adicionar labels
      await this.addLabelsToConversation(conversation.id!, [
        'proposta-comercial',
        `valor-${this.getValueRange(dadosProposta.valorTotal)}`,
        'aguardando-resposta'
      ]);

      console.log(`✅ Proposta ${dadosProposta.propostaNumero} enviada via Chatwoot para ${dadosProposta.clienteNome}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao enviar proposta via Chatwoot:', error);
      throw error;
    }
  }

  // 6. Adicionar labels à conversa
  async addLabelsToConversation(conversationId: number, labels: string[]): Promise<void> {
    try {
      await this.apiClient.post(`/conversations/${conversationId}/labels`, {
        labels: labels
      });
      console.log('🏷️ Labels adicionadas:', labels);
    } catch (error) {
      console.warn('⚠️ Erro ao adicionar labels:', error);
    }
  }

  // 7. Gerar mensagem padrão
  private gerarMensagemProposta(dados: PropostaChatwootData): string {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(dados.valorTotal);

    return `🎯 *Nova Proposta Comercial*

👋 Olá *${dados.clienteNome}*!

📋 Enviamos sua proposta comercial:
• *Número:* ${dados.propostaNumero}
• *Valor Total:* ${valorFormatado}
• *Empresa:* ${dados.empresaNome}

📎 O arquivo PDF com todos os detalhes está anexado.

✅ *Próximos Passos:*
• Analise a proposta com calma
• Entre em contato conosco para esclarecimentos
• Confirme sua aprovação quando estiver pronto

📞 *Dúvidas?* Responda esta mensagem!

---
_Enviado automaticamente pelo sistema ${dados.empresaNome}_`;
  }

  // 8. Formatar número de telefone
  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    return `+${cleaned}`;
  }

  // 9. Determinar faixa de valor para labels
  private getValueRange(valor: number): string {
    if (valor < 1000) return 'baixo';
    if (valor < 10000) return 'medio';
    if (valor < 50000) return 'alto';
    return 'premium';
  }

  // 10. Obter conversas
  async getConversations(params?: {
    status?: 'open' | 'resolved' | 'pending';
    assignee_id?: number;
    labels?: string[];
    page?: number;
  }): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/conversations', { params });
      return response.data.data.payload;
    } catch (error) {
      console.error('❌ Erro ao obter conversas:', error);
      return [];
    }
  }

  // 11. Obter mensagens de uma conversa
  async getMessages(conversationId: number): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/conversations/${conversationId}/messages`);
      return response.data.payload;
    } catch (error) {
      console.error('❌ Erro ao obter mensagens:', error);
      return [];
    }
  }

  // 12. Resolver conversa
  async resolveConversation(conversationId: number): Promise<void> {
    try {
      await this.apiClient.post(`/conversations/${conversationId}/toggle_status`);
      console.log('✅ Conversa resolvida:', conversationId);
    } catch (error) {
      console.error('❌ Erro ao resolver conversa:', error);
    }
  }

  // 13. Atribuir conversa a agente
  async assignConversation(conversationId: number, agentId: number): Promise<void> {
    try {
      await this.apiClient.patch(`/conversations/${conversationId}`, {
        assignee_id: agentId
      });
      console.log('👤 Conversa atribuída ao agente:', agentId);
    } catch (error) {
      console.error('❌ Erro ao atribuir conversa:', error);
    }
  }

  // 14. Teste de conexão
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/profile');
      console.log('✅ Conexão com Chatwoot OK:', response.data.name);
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão com Chatwoot:', error);
      return false;
    }
  }
}

// Configuração padrão (deve ser configurável)
const defaultConfig: ChatwootConfig = {
  baseUrl: process.env.CHATWOOT_BASE_URL || 'http://localhost:3000',
  accessToken: process.env.CHATWOOT_ACCESS_TOKEN || '',
  accountId: Number(process.env.CHATWOOT_ACCOUNT_ID) || 1,
  inboxId: Number(process.env.CHATWOOT_INBOX_ID) || 1
};

// Instância singleton
export const chatwootService = new ChatwootService(defaultConfig);
export default chatwootService;
