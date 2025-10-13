import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { TelefoneBrasilUtil } from '../utils/telefone-brasil.util';

/**
 * 📤 SERVIÇO DE ENVIO DE MENSAGENS WHATSAPP
 * 
 * Este serviço envia mensagens via WhatsApp Business API
 * 
 * ✨ NOVO: Normalização automática de telefones brasileiros
 * - Adiciona dígito 9 automaticamente se necessário
 * - Valida formato correto (11 dígitos)
 * - Garante compatibilidade com WhatsApp API
 */
@Injectable()
export class WhatsAppSenderService {
  private readonly logger = new Logger(WhatsAppSenderService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private integracaoRepo: Repository<IntegracoesConfig>,
  ) { }

  /**
   * Envia mensagem de texto via WhatsApp
   */
  async enviarMensagem(
    empresaId: string,
    para: string,
    mensagem: string,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string; detalhes?: any }> {
    try {
      this.logger.log(`📤 Enviando mensagem WhatsApp`);
      this.logger.log(`   Empresa: ${empresaId}`);
      this.logger.log(`   Para: ${para}`);
      this.logger.log(`   Mensagem: ${mensagem.substring(0, 50)}...`);

      // Buscar configuração do WhatsApp
      const config = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }

      this.logger.log(`🔍 DEBUG: Configuração encontrada: ${config.id}`);
      this.logger.log(`🔍 DEBUG: Campo credenciais existe? ${!!config.credenciais}`);
      this.logger.log(`🔍 DEBUG: Tipo de credenciais: ${typeof config.credenciais}`);
      if (config.credenciais) {
        this.logger.log(`🔍 DEBUG: Token presente? ${!!config.credenciais.whatsapp_api_token}`);
        if (config.credenciais.whatsapp_api_token) {
          const tokenLength = config.credenciais.whatsapp_api_token.length;
          const tokenPreview = `${config.credenciais.whatsapp_api_token.substring(0, 20)}...${config.credenciais.whatsapp_api_token.substring(config.credenciais.whatsapp_api_token.length - 20)}`;
          this.logger.log(`🔍 DEBUG: Token (${tokenLength} chars): ${tokenPreview}`);
        }
        this.logger.log(`🔍 DEBUG: Phone ID presente? ${!!config.credenciais.whatsapp_phone_number_id}`);
        if (config.credenciais.whatsapp_phone_number_id) {
          this.logger.log(`🔍 DEBUG: Phone ID: ${config.credenciais.whatsapp_phone_number_id}`);
        }
      }

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
      } = config.credenciais || {};

      if (!whatsapp_api_token || !whatsapp_phone_number_id) {
        this.logger.error('❌ Credenciais incompletas!');
        this.logger.error(`   Token presente: ${!!whatsapp_api_token}`);
        this.logger.error(`   Phone ID presente: ${!!whatsapp_phone_number_id}`);
        throw new Error('Credenciais WhatsApp incompletas');
      }

      // 📱 NORMALIZAR NÚMERO DE TELEFONE BRASILEIRO
      this.logger.log(`📱 Normalizando número de telefone...`);
      this.logger.log(`   Original: ${para}`);

      const resultado = TelefoneBrasilUtil.detectarECorrigir(para);

      this.logger.log(`   Limpo: ${resultado.original}`);
      this.logger.log(`   Corrigido: ${resultado.corrigido}`);
      this.logger.log(`   Foi corrigido? ${resultado.foiCorrigido ? '✅ SIM (adicionou dígito 9)' : '✅ NÃO (já estava correto)'}`);
      this.logger.log(`   Validação: ${resultado.validacao.valido ? '✅ VÁLIDO' : `❌ INVÁLIDO - ${resultado.validacao.erro}`}`);

      if (!resultado.validacao.valido) {
        this.logger.warn(`⚠️  Número potencialmente inválido, mas tentando enviar mesmo assim...`);
      }

      const numeroParaEnviar = resultado.corrigido;
      this.logger.log(`📤 Enviando para: ${numeroParaEnviar}`);
      this.logger.log(`   Formatado: ${TelefoneBrasilUtil.formatarParaExibicao(numeroParaEnviar)}`);

      // Enviar mensagem via API
      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          to: numeroParaEnviar, // ✨ NOVO: usa número normalizado com dígito 9
          type: 'text',
          text: {
            body: mensagem,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const messageId = response.data.messages[0]?.id;

      this.logger.log(`✅ Mensagem enviada com sucesso! ID: ${messageId}`);

      return {
        sucesso: true,
        messageId,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);

      // Log detalhado do erro para debug
      if (error.response) {
        this.logger.error(`🔍 Status: ${error.response.status}`);
        this.logger.error(`🔍 Resposta WhatsApp API:`);
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }

      this.logger.error(error.stack);

      return {
        sucesso: false,
        erro: error.message,
        detalhes: error.response?.data || undefined,
      };
    }
  }

  /**
   * Marca mensagem como lida
   */
  async marcarComoLida(
    empresaId: string,
    messageId: string,
  ): Promise<{ sucesso: boolean }> {
    try {
      // Buscar configuração do WhatsApp
      const config = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!config) {
        throw new Error('Configuração WhatsApp não encontrada');
      }

      const {
        whatsapp_api_token,
        whatsapp_phone_number_id,
      } = config.credenciais || {};

      // Marcar como lida
      await axios.post(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            'Authorization': `Bearer ${whatsapp_api_token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      this.logger.log(`✅ Mensagem marcada como lida: ${messageId}`);

      return { sucesso: true };

    } catch (error) {
      this.logger.error(`❌ Erro ao marcar como lida: ${error.message}`);
      return { sucesso: false };
    }
  }
}
