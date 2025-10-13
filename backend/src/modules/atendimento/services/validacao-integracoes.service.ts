import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Serviço para validar credenciais de integrações antes de salvar
 * Evita salvar configurações inválidas no banco de dados
 */
@Injectable()
export class ValidacaoIntegracoesService {
  private readonly logger = new Logger(ValidacaoIntegracoesService.name);

  /**
   * Valida credenciais do WhatsApp Business API
   */
  async validarWhatsApp(credenciais: {
    whatsapp_api_token: string;
    whatsapp_phone_number_id: string;
  }): Promise<{ valido: boolean; mensagem: string; detalhes?: any }> {
    try {
      const { whatsapp_api_token, whatsapp_phone_number_id } = credenciais;

      if (!whatsapp_api_token || !whatsapp_phone_number_id) {
        return {
          valido: false,
          mensagem: 'API Token e Phone Number ID são obrigatórios',
        };
      }

      // Testar API do WhatsApp
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}`,
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
          },
          timeout: 10000,
        },
      );

      if (response.status === 200 && response.data) {
        this.logger.log('✅ Credenciais WhatsApp válidas');
        return {
          valido: true,
          mensagem: 'Credenciais válidas',
          detalhes: {
            phoneNumber: response.data.display_phone_number,
            verifiedName: response.data.verified_name,
            quality: response.data.quality_rating,
          },
        };
      }

      return {
        valido: false,
        mensagem: 'Resposta inválida da API WhatsApp',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao validar WhatsApp:', error.message);

      if (error.response?.status === 401) {
        return {
          valido: false,
          mensagem: 'Token de acesso inválido ou expirado',
        };
      }

      if (error.response?.status === 404) {
        return {
          valido: false,
          mensagem: 'Phone Number ID não encontrado',
        };
      }

      return {
        valido: false,
        mensagem: `Erro ao validar: ${error.message}`,
      };
    }
  }

  /**
   * Valida credenciais do OpenAI
   */
  async validarOpenAI(credenciais: {
    openai_api_key: string;
    openai_model?: string;
  }): Promise<{ valido: boolean; mensagem: string; detalhes?: any }> {
    try {
      const { openai_api_key, openai_model } = credenciais;

      if (!openai_api_key) {
        return {
          valido: false,
          mensagem: 'API Key é obrigatória',
        };
      }

      // Validar formato da chave
      if (!openai_api_key.startsWith('sk-')) {
        return {
          valido: false,
          mensagem: 'API Key deve começar com "sk-"',
        };
      }

      // Testar API com uma requisição simples
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${openai_api_key}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data?.data) {
        // Verificar se o modelo solicitado existe
        const models = response.data.data.map((m: any) => m.id);
        const modeloExiste =
          !openai_model || models.includes(openai_model);

        this.logger.log('✅ Credenciais OpenAI válidas');
        return {
          valido: true,
          mensagem: modeloExiste
            ? 'Credenciais válidas'
            : 'API Key válida, mas modelo não encontrado',
          detalhes: {
            modelosDisponiveis: models.filter((m: string) =>
              m.startsWith('gpt-'),
            ),
            modeloSolicitado: openai_model,
            modeloValido: modeloExiste,
          },
        };
      }

      return {
        valido: false,
        mensagem: 'Resposta inválida da API OpenAI',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao validar OpenAI:', error.message);

      if (error.response?.status === 401) {
        return {
          valido: false,
          mensagem: 'API Key inválida',
        };
      }

      if (error.response?.status === 429) {
        return {
          valido: false,
          mensagem: 'Limite de requisições atingido. Tente novamente mais tarde.',
        };
      }

      return {
        valido: false,
        mensagem: `Erro ao validar: ${error.message}`,
      };
    }
  }

  /**
   * Valida credenciais do Anthropic Claude
   */
  async validarAnthropic(credenciais: {
    anthropic_api_key: string;
    anthropic_model?: string;
  }): Promise<{ valido: boolean; mensagem: string; detalhes?: any }> {
    try {
      const { anthropic_api_key, anthropic_model } = credenciais;

      if (!anthropic_api_key) {
        return {
          valido: false,
          mensagem: 'API Key é obrigatória',
        };
      }

      // Validar formato da chave
      if (!anthropic_api_key.startsWith('sk-ant-')) {
        return {
          valido: false,
          mensagem: 'API Key deve começar com "sk-ant-"',
        };
      }

      // Testar API com uma requisição simples (listar mensagens não funciona, então fazemos um teste de modelo)
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: anthropic_model || 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          headers: {
            'x-api-key': anthropic_api_key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.status === 200 && response.data) {
        this.logger.log('✅ Credenciais Anthropic válidas');
        return {
          valido: true,
          mensagem: 'Credenciais válidas',
          detalhes: {
            modelo: anthropic_model || 'claude-3-5-sonnet-20241022',
            resposta: response.data,
          },
        };
      }

      return {
        valido: false,
        mensagem: 'Resposta inválida da API Anthropic',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao validar Anthropic:', error.message);

      if (error.response?.status === 401) {
        return {
          valido: false,
          mensagem: 'API Key inválida',
        };
      }

      if (error.response?.status === 400) {
        return {
          valido: false,
          mensagem: 'Modelo inválido ou parâmetros incorretos',
        };
      }

      if (error.response?.status === 429) {
        return {
          valido: false,
          mensagem: 'Limite de requisições atingido',
        };
      }

      return {
        valido: false,
        mensagem: `Erro ao validar: ${error.message}`,
      };
    }
  }

  /**
   * Valida credenciais do Telegram Bot
   */
  async validarTelegram(credenciais: {
    telegram_bot_token: string;
  }): Promise<{ valido: boolean; mensagem: string; detalhes?: any }> {
    try {
      const { telegram_bot_token } = credenciais;

      if (!telegram_bot_token) {
        return {
          valido: false,
          mensagem: 'Bot Token é obrigatório',
        };
      }

      // Validar formato (deve ter : no meio)
      if (!telegram_bot_token.includes(':')) {
        return {
          valido: false,
          mensagem: 'Formato de token inválido. Deve conter ":"',
        };
      }

      // Testar API do Telegram
      const response = await axios.get(
        `https://api.telegram.org/bot${telegram_bot_token}/getMe`,
        {
          timeout: 10000,
        },
      );

      if (response.data?.ok && response.data?.result) {
        const bot = response.data.result;
        this.logger.log('✅ Credenciais Telegram válidas');
        return {
          valido: true,
          mensagem: 'Credenciais válidas',
          detalhes: {
            botId: bot.id,
            botUsername: bot.username,
            botFirstName: bot.first_name,
            canJoinGroups: bot.can_join_groups,
            canReadAllGroupMessages: bot.can_read_all_group_messages,
          },
        };
      }

      return {
        valido: false,
        mensagem: 'Resposta inválida da API Telegram',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao validar Telegram:', error.message);

      if (error.response?.status === 401 || error.response?.status === 404) {
        return {
          valido: false,
          mensagem: 'Bot Token inválido',
        };
      }

      return {
        valido: false,
        mensagem: `Erro ao validar: ${error.message}`,
      };
    }
  }

  /**
   * Valida credenciais do Twilio
   */
  async validarTwilio(credenciais: {
    twilio_account_sid: string;
    twilio_auth_token: string;
  }): Promise<{ valido: boolean; mensagem: string; detalhes?: any }> {
    try {
      const { twilio_account_sid, twilio_auth_token } = credenciais;

      if (!twilio_account_sid || !twilio_auth_token) {
        return {
          valido: false,
          mensagem: 'Account SID e Auth Token são obrigatórios',
        };
      }

      // Validar formato do Account SID
      if (!twilio_account_sid.startsWith('AC')) {
        return {
          valido: false,
          mensagem: 'Account SID deve começar com "AC"',
        };
      }

      // Testar API do Twilio
      const auth = Buffer.from(
        `${twilio_account_sid}:${twilio_auth_token}`,
      ).toString('base64');

      const response = await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}.json`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 10000,
        },
      );

      if (response.status === 200 && response.data) {
        this.logger.log('✅ Credenciais Twilio válidas');
        return {
          valido: true,
          mensagem: 'Credenciais válidas',
          detalhes: {
            accountSid: response.data.sid,
            friendlyName: response.data.friendly_name,
            status: response.data.status,
            type: response.data.type,
          },
        };
      }

      return {
        valido: false,
        mensagem: 'Resposta inválida da API Twilio',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao validar Twilio:', error.message);

      if (error.response?.status === 401) {
        return {
          valido: false,
          mensagem: 'Account SID ou Auth Token inválidos',
        };
      }

      return {
        valido: false,
        mensagem: `Erro ao validar: ${error.message}`,
      };
    }
  }

  /**
   * Validação centralizada - detecta tipo e chama validador específico
   */
  async validarIntegracao(
    tipo: string,
    credenciais: Record<string, any>,
  ): Promise<{ valido: boolean; mensagem: string; detalhes?: any }> {
    switch (tipo.toLowerCase()) {
      case 'whatsapp':
        return this.validarWhatsApp(credenciais as any);
      case 'openai':
        return this.validarOpenAI(credenciais as any);
      case 'anthropic':
        return this.validarAnthropic(credenciais as any);
      case 'telegram':
        return this.validarTelegram(credenciais as any);
      case 'twilio':
        return this.validarTwilio(credenciais as any);
      default:
        return {
          valido: false,
          mensagem: `Tipo de integração não suportado: ${tipo}`,
        };
    }
  }

  /**
   * 📱 Testa envio de mensagem WhatsApp
   */
  async testarEnvioMensagem(
    tipo: string,
    numero: string,
    mensagem: string,
    credenciais: Record<string, any>,
  ): Promise<{ sucesso: boolean; messageId?: string; detalhes?: any }> {
    if (tipo.toLowerCase() !== 'whatsapp') {
      throw new Error('Apenas WhatsApp suportado no momento');
    }

    try {
      const { whatsapp_api_token, whatsapp_phone_number_id } = credenciais;

      if (!whatsapp_api_token || !whatsapp_phone_number_id) {
        throw new Error('Credenciais WhatsApp incompletas');
      }

      // Limpar número (remover caracteres especiais)
      const numeroLimpo = numero.replace(/\D/g, '');

      // Enviar mensagem via WhatsApp Business API
      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numeroLimpo,
          type: 'text',
          text: {
            body: mensagem,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      if (response.status === 200 && response.data.messages) {
        this.logger.log('✅ Mensagem de teste enviada com sucesso');
        return {
          sucesso: true,
          messageId: response.data.messages[0].id,
          detalhes: response.data,
        };
      }

      throw new Error('Resposta inesperada da API WhatsApp');
    } catch (error) {
      this.logger.error('❌ Erro ao enviar mensagem de teste:', error.message);

      if (error.response?.status === 401) {
        throw new Error('Token de acesso inválido ou expirado');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error?.message || 'Requisição inválida';
        throw new Error(`Erro na requisição: ${errorMessage}`);
      }

      if (error.response?.status === 403) {
        throw new Error('Permissão negada. Verifique se o número tem permissão para receber mensagens');
      }

      throw new Error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }
}

