import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { TipoMensagem } from '../entities/mensagem.entity';

interface PrepararEnvioResult {
  provedor: 'sendgrid' | 'ses' | 'smtp';
  apiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

interface EnvioEmailPayload {
  para: string;
  assunto: string;
  corpo: string;
  corpoHtml?: string;
  anexos?: Array<{
    filename: string;
    content: string | Buffer; // base64 ou buffer
    type?: string; // mime type
  }>;
  replyTo?: string;
}

/**
 * 📧 SERVIÇO DE ENVIO DE E-MAILS
 *
 * Responsável por enviar e-mails via SendGrid, AWS SES ou SMTP
 * Similar ao WhatsAppSenderService
 */
@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private readonly integracaoRepo: Repository<IntegracoesConfig>,
  ) {}

  /**
   * Prepara credenciais e configurações de e-mail
   */
  private async prepararEnvioEmail(
    empresaId: string,
    descricaoEnvio: string,
  ): Promise<PrepararEnvioResult> {
    this.logger.log(`📧 Preparando envio de e-mail (${descricaoEnvio})`);

    const config = await this.integracaoRepo.findOne({
      where: { empresaId, tipo: 'email', ativo: true },
    });

    if (!config) {
      throw new Error('Configuração de e-mail não encontrada');
    }

    this.logger.log(`🔍 Configuração encontrada: ${config.id}`);

    const { provedor, sendgrid_api_key, aws_ses_config, smtp_config, from_email, from_name } =
      config.credenciais || {};

    const prov = (provedor || 'sendgrid') as 'sendgrid' | 'ses' | 'smtp';

    if (!from_email) {
      throw new Error('E-mail remetente (from_email) não configurado');
    }

    // Validar credenciais conforme provedor
    if (prov === 'sendgrid' && !sendgrid_api_key) {
      throw new Error('SendGrid API Key não configurada');
    }

    if (prov === 'ses' && !aws_ses_config) {
      throw new Error('AWS SES não configurada');
    }

    if (prov === 'smtp' && !smtp_config) {
      throw new Error('SMTP não configurado');
    }

    return {
      provedor: prov,
      apiKey: sendgrid_api_key,
      smtpConfig: smtp_config,
      from: from_email,
      fromName: from_name || 'ConectCRM',
    };
  }

  /**
   * Envia e-mail via SendGrid API
   */
  private async enviarViaSendGrid(
    config: PrepararEnvioResult,
    payload: EnvioEmailPayload,
  ): Promise<string> {
    this.logger.log(`📧 Enviando via SendGrid para: ${payload.para}`);

    const sendgridPayload: any = {
      personalizations: [
        {
          to: [{ email: payload.para }],
          subject: payload.assunto,
        },
      ],
      from: {
        email: config.from,
        name: config.fromName,
      },
      content: [
        {
          type: 'text/plain',
          value: payload.corpo,
        },
      ],
    };

    // Adicionar HTML se disponível
    if (payload.corpoHtml) {
      sendgridPayload.content.push({
        type: 'text/html',
        value: payload.corpoHtml,
      });
    }

    // Adicionar reply-to se disponível
    if (payload.replyTo) {
      sendgridPayload.reply_to = {
        email: payload.replyTo,
      };
    }

    // Adicionar anexos se disponíveis
    if (payload.anexos && payload.anexos.length > 0) {
      sendgridPayload.attachments = payload.anexos.map((anexo) => ({
        filename: anexo.filename,
        content:
          typeof anexo.content === 'string' ? anexo.content : anexo.content.toString('base64'),
        type: anexo.type || 'application/octet-stream',
        disposition: 'attachment',
      }));
    }

    try {
      const response = await axios.post('https://api.sendgrid.com/v3/mail/send', sendgridPayload, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ E-mail enviado via SendGrid! Status: ${response.status}`);

      // SendGrid retorna X-Message-Id no header
      const messageId = response.headers['x-message-id'] || `sendgrid_${Date.now()}`;
      return messageId;
    } catch (error) {
      this.logger.error('❌ Erro ao enviar via SendGrid:', error.response?.data || error.message);
      throw new Error(`Falha ao enviar e-mail via SendGrid: ${error.message}`);
    }
  }

  /**
   * Envia e-mail via SMTP (para implementar futuramente)
   */
  private async enviarViaSMTP(
    config: PrepararEnvioResult,
    payload: EnvioEmailPayload,
  ): Promise<string> {
    this.logger.warn('⚠️ SMTP ainda não implementado. Use SendGrid por enquanto.');
    throw new Error('SMTP não implementado. Configure SendGrid.');
  }

  /**
   * Envia e-mail via AWS SES (para implementar futuramente)
   */
  private async enviarViaSES(
    config: PrepararEnvioResult,
    payload: EnvioEmailPayload,
  ): Promise<string> {
    this.logger.warn('⚠️ AWS SES ainda não implementado. Use SendGrid por enquanto.');
    throw new Error('AWS SES não implementado. Configure SendGrid.');
  }

  /**
   * 📤 MÉTODO PRINCIPAL: Envia e-mail de texto
   */
  async enviarTexto(
    empresaId: string,
    para: string,
    assunto: string,
    corpo: string,
    replyTo?: string,
  ): Promise<string> {
    this.logger.log(`📧 [enviarTexto] Para: ${para}, Assunto: "${assunto}"`);

    const config = await this.prepararEnvioEmail(empresaId, 'texto');

    const payload: EnvioEmailPayload = {
      para,
      assunto,
      corpo,
      replyTo,
    };

    switch (config.provedor) {
      case 'sendgrid':
        return this.enviarViaSendGrid(config, payload);
      case 'smtp':
        return this.enviarViaSMTP(config, payload);
      case 'ses':
        return this.enviarViaSES(config, payload);
      default:
        throw new Error(`Provedor desconhecido: ${config.provedor}`);
    }
  }

  /**
   * 📤 Envia e-mail HTML (com formatação)
   */
  async enviarHtml(
    empresaId: string,
    para: string,
    assunto: string,
    corpoTexto: string,
    corpoHtml: string,
    replyTo?: string,
  ): Promise<string> {
    this.logger.log(`📧 [enviarHtml] Para: ${para}, Assunto: "${assunto}"`);

    const config = await this.prepararEnvioEmail(empresaId, 'html');

    const payload: EnvioEmailPayload = {
      para,
      assunto,
      corpo: corpoTexto,
      corpoHtml,
      replyTo,
    };

    switch (config.provedor) {
      case 'sendgrid':
        return this.enviarViaSendGrid(config, payload);
      case 'smtp':
        return this.enviarViaSMTP(config, payload);
      case 'ses':
        return this.enviarViaSES(config, payload);
      default:
        throw new Error(`Provedor desconhecido: ${config.provedor}`);
    }
  }

  /**
   * 📎 Envia e-mail com anexos
   */
  async enviarComAnexos(
    empresaId: string,
    para: string,
    assunto: string,
    corpo: string,
    anexos: Array<{
      filename: string;
      content: string | Buffer;
      type?: string;
    }>,
    replyTo?: string,
  ): Promise<string> {
    this.logger.log(`📧 [enviarComAnexos] Para: ${para}, Anexos: ${anexos.length}`);

    const config = await this.prepararEnvioEmail(empresaId, 'anexo');

    const payload: EnvioEmailPayload = {
      para,
      assunto,
      corpo,
      anexos,
      replyTo,
    };

    switch (config.provedor) {
      case 'sendgrid':
        return this.enviarViaSendGrid(config, payload);
      case 'smtp':
        return this.enviarViaSMTP(config, payload);
      case 'ses':
        return this.enviarViaSES(config, payload);
      default:
        throw new Error(`Provedor desconhecido: ${config.provedor}`);
    }
  }

  /**
   * 🧪 Testa configuração de e-mail
   */
  async testarConfiguracao(empresaId: string, emailTeste: string): Promise<boolean> {
    this.logger.log(`🧪 Testando configuração de e-mail enviando para: ${emailTeste}`);

    try {
      await this.enviarTexto(
        empresaId,
        emailTeste,
        '✅ Teste de Configuração - ConectCRM',
        'Este é um e-mail de teste para validar a configuração do canal de e-mail.\n\nSe você recebeu esta mensagem, sua configuração está funcionando corretamente!',
      );

      this.logger.log('✅ E-mail de teste enviado com sucesso!');
      return true;
    } catch (error) {
      this.logger.error('❌ Falha ao testar configuração:', error.message);
      throw error;
    }
  }
}
