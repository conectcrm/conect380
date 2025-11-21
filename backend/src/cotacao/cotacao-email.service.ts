import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class CotacaoEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    // Configuração Gmail SMTP (ou outro provedor)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || process.env.SMTP_USER,
        pass: process.env.GMAIL_PASSWORD || process.env.SMTP_PASS,
      },
    });

    console.log('📧 Serviço de email de cotações configurado');
  }

  /**
   * Envia email de notificação de cotação aprovada
   */
  async notificarCotacaoAprovada(
    cotacao: any,
    aprovador: any,
    justificativa?: string,
  ): Promise<boolean> {
    try {
      // Email do criador da cotação
      const emailDestino = cotacao.criadoPorUser?.email;

      console.log('🔍 DEBUG - Dados da cotação:', {
        numero: cotacao.numero,
        criadoPor: cotacao.criadoPor,
        criadoPorUserEmail: cotacao.criadoPorUser?.email,
        criadoPorUserNome: cotacao.criadoPorUser?.nome,
        emailDestino,
      });

      if (!emailDestino) {
        console.warn('⚠️ Email do criador não encontrado, notificação não enviada');
        return false;
      }

      console.log(`📤 Enviando notificação de aprovação da cotação #${cotacao.numero} para ${emailDestino}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: emailDestino,
        subject: `✅ Cotação #${cotacao.numero} foi APROVADA!`,
        html: this.gerarTemplateAprovacao(cotacao, aprovador, justificativa),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de aprovação enviado:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de aprovação:', error);
      return false;
    }
  }

  /**
   * Envia email de notificação de cotação reprovada
   */
  async notificarCotacaoReprovada(
    cotacao: any,
    aprovador: any,
    justificativa: string,
  ): Promise<boolean> {
    try {
      // Email do criador da cotação
      const emailDestino = cotacao.criadoPorUser?.email;

      console.log('🔍 DEBUG - Dados da cotação (reprovação):', {
        numero: cotacao.numero,
        criadoPor: cotacao.criadoPor,
        criadoPorUserEmail: cotacao.criadoPorUser?.email,
        criadoPorUserNome: cotacao.criadoPorUser?.nome,
        emailDestino,
      });

      if (!emailDestino) {
        console.warn('⚠️ Email do criador não encontrado, notificação não enviada');
        return false;
      }

      console.log(`📤 Enviando notificação de reprovação da cotação #${cotacao.numero} para ${emailDestino}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: emailDestino,
        subject: `❌ Cotação #${cotacao.numero} foi REPROVADA`,
        html: this.gerarTemplateReprovacao(cotacao, aprovador, justificativa),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de reprovação enviado:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de reprovação:', error);
      return false;
    }
  }

  /**
   * Template HTML para email de aprovação
   */
  private gerarTemplateAprovacao(
    cotacao: any,
    aprovador: any,
    justificativa?: string,
  ): string {
    const dataAprovacao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px; }
    .info-box { background: #F0FDF4; border-left: 4px solid #16A34A; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #6B7280; }
    .value { color: #111827; }
    .justificativa { background: #F9FAFB; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #E5E7EB; }
    .button { display: inline-block; background: #16A34A; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #15803D; }
    .footer { background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">✅</div>
      <h1>Cotação Aprovada!</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>Temos uma ótima notícia! Sua cotação foi <strong style="color: #16A34A;">APROVADA</strong>.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Cotação:</span>
          <span class="value">#${cotacao.numero}</span>
        </div>
        <div class="info-row">
          <span class="label">Empresa:</span>
          <span class="value">${cotacao.empresa?.nome || cotacao.nomeEmpresa || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Valor Total:</span>
          <span class="value">R$ ${cotacao.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
        </div>
        <div class="info-row">
          <span class="label">Aprovado por:</span>
          <span class="value">${aprovador.nome || aprovador.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Data de Aprovação:</span>
          <span class="value">${dataAprovacao}</span>
        </div>
      </div>

      ${justificativa ? `
      <div class="justificativa">
        <strong>Justificativa do Aprovador:</strong>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${justificativa}</p>
      </div>
      ` : ''}

      <p>Você já pode prosseguir com as próximas etapas do processo.</p>

      <center>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/comercial/cotacoes" class="button">
          Ver Cotação no Sistema
        </a>
      </center>
    </div>
    <div class="footer">
      <p>Este é um email automático do Conect CRM. Por favor, não responda.</p>
      <p>&copy; ${new Date().getFullYear()} Conect CRM - Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template HTML para email de reprovação
   */
  private gerarTemplateReprovacao(
    cotacao: any,
    aprovador: any,
    justificativa: string,
  ): string {
    const dataReprovacao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px; }
    .info-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #6B7280; }
    .value { color: #111827; }
    .justificativa { background: #FEF2F2; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #FEE2E2; }
    .justificativa-title { color: #DC2626; font-weight: bold; margin-bottom: 10px; }
    .button { display: inline-block; background: #DC2626; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #B91C1C; }
    .footer { background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">❌</div>
      <h1>Cotação Reprovada</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>Informamos que sua cotação foi <strong style="color: #DC2626;">REPROVADA</strong>.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Cotação:</span>
          <span class="value">#${cotacao.numero}</span>
        </div>
        <div class="info-row">
          <span class="label">Empresa:</span>
          <span class="value">${cotacao.empresa?.nome || cotacao.nomeEmpresa || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Valor Total:</span>
          <span class="value">R$ ${cotacao.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
        </div>
        <div class="info-row">
          <span class="label">Reprovado por:</span>
          <span class="value">${aprovador.nome || aprovador.email}</span>
        </div>
        <div class="info-row">
          <span class="label">Data de Reprovação:</span>
          <span class="value">${dataReprovacao}</span>
        </div>
      </div>

      <div class="justificativa">
        <div class="justificativa-title">📋 Motivo da Reprovação:</div>
        <p style="margin: 0; white-space: pre-wrap;">${justificativa}</p>
      </div>

      <p>Por favor, revise os pontos mencionados e, se necessário, crie uma nova cotação considerando o feedback recebido.</p>

      <center>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/comercial/cotacoes" class="button">
          Ver Cotação no Sistema
        </a>
      </center>
    </div>
    <div class="footer">
      <p>Este é um email automático do Conect CRM. Por favor, não responda.</p>
      <p>&copy; ${new Date().getFullYear()} Conect CRM - Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
