import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
}

/**
 * 🔐 SERVIÇO CENTRALIZADO DE CONFIGURAÇÃO WHATSAPP
 * 
 * Fonte única de verdade para credenciais WhatsApp Business API.
 * SEMPRE lê do banco de dados, nunca de variáveis de ambiente.
 * 
 * @example
 * const credentials = await this.whatsappConfigService.getCredentials(empresaId);
 * console.log(credentials.phoneNumberId); // "704423209430762"
 */
@Injectable()
export class WhatsAppConfigService {
  private readonly logger = new Logger(WhatsAppConfigService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private readonly integracaoRepo: Repository<IntegracoesConfig>,
  ) {}

  /**
   * Busca credenciais WhatsApp da empresa
   * 
   * @param empresaId - ID da empresa
   * @returns Credenciais WhatsApp ou null se não configurado
   * @throws Error se configuração existe mas está incompleta
   */
  async getCredentials(empresaId: string): Promise<WhatsAppCredentials | null> {
    this.logger.log(`🔍 Buscando credenciais WhatsApp para empresa: ${empresaId}`);

    const config = await this.integracaoRepo.findOne({
      where: { 
        empresaId, 
        tipo: 'whatsapp_business_api', 
        ativo: true 
      },
    });

    if (!config) {
      this.logger.warn(`⚠️ Nenhuma configuração WhatsApp ativa encontrada para empresa ${empresaId}`);
      return null;
    }

    this.logger.log(`✅ Configuração encontrada: ${config.id}`);

    const {
      whatsapp_api_token,
      whatsapp_phone_number_id,
      whatsapp_business_account_id,
    } = config.credenciais || {};

    // Fallback para colunas legadas (retrocompatibilidade)
    const accessToken = whatsapp_api_token || config.whatsappApiToken;
    const phoneNumberId = whatsapp_phone_number_id || config.whatsappPhoneNumberId;
    const businessAccountId = whatsapp_business_account_id || config.whatsappBusinessAccountId;

    if (!accessToken || !phoneNumberId) {
      this.logger.error(`❌ Credenciais WhatsApp incompletas para empresa ${empresaId}`);
      this.logger.error(`   Token presente: ${!!accessToken}`);
      this.logger.error(`   Phone ID presente: ${!!phoneNumberId}`);
      
      throw new Error(
        `Configuração WhatsApp incompleta. ` +
        `Acesse a tela de Integrações e configure: ` +
        `${!accessToken ? 'Access Token' : ''} ${!phoneNumberId ? 'Phone Number ID' : ''}`
      );
    }

    this.logger.log(`✅ Credenciais validadas com sucesso`);
    this.logger.log(`   Phone Number ID: ${phoneNumberId}`);
    if (businessAccountId) {
      this.logger.log(`   Business Account ID: ${businessAccountId}`);
    }

    return {
      accessToken,
      phoneNumberId,
      businessAccountId,
    };
  }

  /**
   * Verifica se empresa tem WhatsApp configurado
   * 
   * @param empresaId - ID da empresa
   * @returns true se configurado e válido
   */
  async isConfigured(empresaId: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(empresaId);
      return credentials !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca credenciais com tratamento de erro amigável
   * 
   * @param empresaId - ID da empresa
   * @param contexto - Contexto para logging (ex: "envio de mensagem")
   * @returns Credenciais ou lança erro com mensagem amigável
   */
  async getCredentialsOrFail(
    empresaId: string, 
    contexto: string
  ): Promise<WhatsAppCredentials> {
    const credentials = await this.getCredentials(empresaId);

    if (!credentials) {
      const mensagem = 
        `WhatsApp não configurado para esta empresa. ` +
        `Configure na tela de Integrações antes de ${contexto}.`;
      
      this.logger.error(`❌ ${mensagem} (Empresa: ${empresaId})`);
      throw new Error(mensagem);
    }

    return credentials;
  }
}
