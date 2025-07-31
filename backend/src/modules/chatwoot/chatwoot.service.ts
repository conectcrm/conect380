import { Injectable } from '@nestjs/common';
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
    content: string;
    file_type: string;
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

@Injectable()
export class ChatwootService {
  private apiClient: AxiosInstance;
  private config: ChatwootConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.CHATWOOT_BASE_URL || 'http://localhost:3000',
      accessToken: process.env.CHATWOOT_ACCESS_TOKEN || '',
      accountId: Number(process.env.CHATWOOT_ACCOUNT_ID) || 1,
      inboxId: Number(process.env.CHATWOOT_INBOX_ID) || 1
    };

    this.apiClient = axios.create({
      baseURL: `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}`,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        console.warn('⚠️ CHATWOOT_ACCESS_TOKEN não configurado');
        return false;
      }

      // Testar conexão básica com a API
      const response = await this.apiClient.get('/profile');

      if (response.status === 200 && response.data) {
        console.log('✅ Chatwoot conectado:', response.data.name || 'Usuário válido');

        // Verificar se a inbox existe
        try {
          const inboxResponse = await this.apiClient.get(`/inboxes/${this.config.inboxId}`);
          if (inboxResponse.status === 200) {
            console.log(`✅ Inbox ${this.config.inboxId} encontrada:`, inboxResponse.data.name);
            return true;
          }
        } catch (inboxError) {
          console.warn(`⚠️ Inbox ${this.config.inboxId} não encontrada ou sem acesso`);
          // Listar inboxes disponíveis
          try {
            const inboxesResponse = await this.apiClient.get('/inboxes');
            console.log('📋 Inboxes disponíveis:', inboxesResponse.data.map((inbox: any) => ({
              id: inbox.id,
              name: inbox.name,
              channel_type: inbox.channel_type
            })));
          } catch (listError) {
            console.warn('❌ Erro ao listar inboxes:', listError.message);
          }
          return false;
        }
      }

      return false;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Chatwoot não está rodando. Verifique se está em:', this.config.baseUrl);
      } else if (error.response?.status === 401) {
        console.error('❌ Token de acesso inválido. Verifique CHATWOOT_ACCESS_TOKEN');
      } else if (error.response?.status === 403) {
        console.error('❌ Sem permissão. Verifique se o token tem acesso à conta:', this.config.accountId);
      } else {
        console.error('❌ Erro de conexão Chatwoot:', error.message);
      }
      return false;
    }
  }

  async findOrCreateContact(contactData: ChatwootContact): Promise<ChatwootContact> {
    try {
      if (contactData.phone_number) {
        const searchResponse = await this.apiClient.get('/contacts/search', {
          params: { q: contactData.phone_number }
        });

        if (searchResponse.data?.payload?.length > 0) {
          console.log('📞 Contato encontrado no Chatwoot:', searchResponse.data.payload[0]);
          return searchResponse.data.payload[0];
        }
      }

      const createResponse = await this.apiClient.post('/contacts', contactData);
      console.log('✅ Novo contato criado no Chatwoot:', createResponse.data.payload);
      return createResponse.data.payload;
    } catch (error) {
      console.error('❌ Erro ao buscar/criar contato:', error);
      throw error;
    }
  }

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

  async enviarProposta(dadosProposta: PropostaChatwootData): Promise<boolean> {
    try {
      console.log('🚀 Iniciando envio de proposta via Chatwoot...');

      const phoneFormatted = this.formatPhoneNumber(dadosProposta.clienteWhatsApp);

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

      const conversation = await this.createConversation(contact.id!, {
        type: 'proposta_comercial',
        proposta_numero: dadosProposta.propostaNumero,
        valor_total: dadosProposta.valorTotal
      });

      const mensagem = dadosProposta.mensagemPersonalizada || this.gerarMensagemProposta(dadosProposta);

      await this.sendMessage(conversation.id!, {
        content: mensagem,
        message_type: 'outgoing'
      });

      if (dadosProposta.pdfBuffer) {
        try {
          await this.sendMessage(conversation.id!, {
            content: `📎 Documento anexado: Proposta ${dadosProposta.propostaNumero}`,
            message_type: 'outgoing',
            attachments: [{
              content: dadosProposta.pdfBuffer.toString('base64'),
              file_type: 'file',
              file_name: `Proposta_${dadosProposta.propostaNumero}.pdf`
            }]
          });
        } catch (pdfError) {
          console.warn('⚠️ Erro ao anexar PDF, continuando sem anexo:', pdfError);
        }
      }

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

  async getMessages(conversationId: number): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/conversations/${conversationId}/messages`);
      return response.data.payload;
    } catch (error) {
      console.error('❌ Erro ao obter mensagens:', error);
      return [];
    }
  }

  async resolveConversation(conversationId: number): Promise<void> {
    try {
      await this.apiClient.post(`/conversations/${conversationId}/toggle_status`);
      console.log('✅ Conversa resolvida:', conversationId);
    } catch (error) {
      console.error('❌ Erro ao resolver conversa:', error);
    }
  }

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

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    return `+${cleaned}`;
  }

  private getValueRange(valor: number): string {
    if (valor < 1000) return 'baixo';
    if (valor < 10000) return 'medio';
    if (valor < 50000) return 'alto';
    return 'premium';
  }
}
