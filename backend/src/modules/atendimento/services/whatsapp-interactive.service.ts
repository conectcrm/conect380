import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { TelefoneBrasilUtil } from '../utils/telefone-brasil.util';

/**
 * 🔘 SERVIÇO DE MENSAGENS INTERATIVAS WHATSAPP
 *
 * Este serviço envia mensagens com botões e listas interativas
 * via WhatsApp Business API
 */
@Injectable()
export class WhatsAppInteractiveService {
  private readonly logger = new Logger(WhatsAppInteractiveService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private integracaoRepo: Repository<IntegracoesConfig>,
  ) {}

  /**
   * Envia mensagem com botões interativos (Reply Buttons - até 3 botões)
   */
  async enviarMensagemComBotoes(
    empresaId: string,
    para: string,
    mensagem: string,
    botoes: Array<{ id: string; titulo: string }>,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    try {
      // Limitar a 3 botões (limitação da API do WhatsApp)
      if (botoes.length > 3) {
        this.logger.warn(
          `⚠️ WhatsApp suporta apenas 3 botões. Usando primeiros 3 de ${botoes.length}`,
        );
        botoes = botoes.slice(0, 3);
      }

      this.logger.log(`🔘 Enviando mensagem com botões interativos`);
      this.logger.log(`   Para: ${para}`);
      this.logger.log(`   Botões: ${botoes.map((b) => b.titulo).join(', ')}`);

      const config = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }

      const credenciais = config.credenciais as any;
      const whatsapp_api_token = credenciais?.whatsapp_api_token;
      const whatsapp_phone_number_id = credenciais?.whatsapp_phone_number_id;

      if (!whatsapp_api_token || !whatsapp_phone_number_id) {
        throw new Error('Token ou Phone Number ID não configurados');
      }

      const numeroParaEnviar = TelefoneBrasilUtil.detectarECorrigir(para).corrigido;
      const apiUrl = `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`;

      const response = await axios.post(
        apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numeroParaEnviar,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: mensagem,
            },
            action: {
              buttons: botoes.map((btn) => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.titulo.substring(0, 20), // Máximo 20 caracteres
                },
              })),
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`✅ Mensagem com botões enviada! ID: ${messageId}`);

      return {
        sucesso: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem com botões: ${error.message}`);

      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error(`🔍 Resposta WhatsApp API:`);
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }

      return {
        sucesso: false,
        erro: error.message,
        detalhes: error.response?.data || undefined,
      };
    }
  }

  /**
   * Envia mensagem com lista interativa (List Message - até 10 opções)
   */
  async enviarMensagemComLista(
    empresaId: string,
    para: string,
    mensagem: string,
    tituloLista: string,
    opcoes: Array<{ id: string; titulo: string; descricao?: string }>,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    try {
      if (opcoes.length > 10) {
        this.logger.warn(
          `⚠️ WhatsApp suporta apenas 10 opções em lista. Usando primeiras 10 de ${opcoes.length}`,
        );
        opcoes = opcoes.slice(0, 10);
      }

      this.logger.log(`📋 Enviando mensagem com lista interativa`);
      this.logger.log(`   Para: ${para}`);
      this.logger.log(`   Opções: ${opcoes.length}`);

      const config = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }

      const credenciais = config.credenciais as any;
      const whatsapp_api_token = credenciais?.whatsapp_api_token;
      const whatsapp_phone_number_id = credenciais?.whatsapp_phone_number_id;

      if (!whatsapp_api_token || !whatsapp_phone_number_id) {
        throw new Error('Token ou Phone Number ID não configurados');
      }

      const numeroParaEnviar = TelefoneBrasilUtil.detectarECorrigir(para).corrigido;
      const apiUrl = `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`;

      const response = await axios.post(
        apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numeroParaEnviar,
          type: 'interactive',
          interactive: {
            type: 'list',
            body: {
              text: mensagem,
            },
            action: {
              button: tituloLista.substring(0, 20), // Máximo 20 caracteres
              sections: [
                {
                  title: 'Opções',
                  rows: opcoes.map((opt) => ({
                    id: opt.id,
                    title: opt.titulo.substring(0, 24), // Máximo 24 caracteres
                    description: opt.descricao ? opt.descricao.substring(0, 72) : undefined, // Máximo 72 caracteres
                  })),
                },
              ],
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`✅ Mensagem com lista enviada! ID: ${messageId}`);

      return {
        sucesso: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem com lista: ${error.message}`);

      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error(`🔍 Resposta WhatsApp API:`);
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }

      return {
        sucesso: false,
        erro: error.message,
        detalhes: error.response?.data || undefined,
      };
    }
  }
}
