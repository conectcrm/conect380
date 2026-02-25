import { Injectable, Inject, forwardRef } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailIntegradoService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(forwardRef(() => require('./propostas.service').PropostasService))
    private propostasService?: any,
  ) {
    this.setupTransporter();
  }

  private isTestEnv(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test';
  }

  private shouldLogInTest(kind: 'info' | 'warn' | 'error'): boolean {
    if (!this.isTestEnv()) return true;

    if (kind === 'error') {
      return process.env.EMAIL_INTEGRADO_ERRORS_IN_TEST === 'true';
    }

    return process.env.EMAIL_INTEGRADO_LOGS_IN_TEST === 'true';
  }

  private log(...args: unknown[]) {
    if (!this.shouldLogInTest('info')) return;
    console.log(...args);
  }

  private warn(...args: unknown[]) {
    if (!this.shouldLogInTest('warn')) return;
    console.warn(...args);
  }

  private error(...args: unknown[]) {
    if (!this.shouldLogInTest('error')) return;
    console.error(...args);
  }

  private setupTransporter() {
    // Configuração Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || process.env.SMTP_USER,
        pass: process.env.GMAIL_PASSWORD || process.env.SMTP_PASS,
      },
    });

    this.log('📧 Serviço de email integrado configurado');
  }

  /**
   * Envia email de notificação de proposta aceita
   */
  async notificarPropostaAceita(dadosProposta: any): Promise<boolean> {
    try {
      this.log(`📤 Enviando notificação de proposta aceita: ${dadosProposta.numero}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: 'vendas@conectcrm.com', // Email da equipe
        subject: `✅ Proposta ${dadosProposta.numero} foi ACEITA!`,
        html: this.gerarTemplateAceitacao(dadosProposta),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.log('✅ Email de aceitação enviado:', result.messageId);
      return true;
    } catch (error) {
      this.error('❌ Erro ao enviar email de aceitação:', error);
      return false;
    }
  }

  /**
   * Envia email de notificação de proposta rejeitada
   */
  async notificarPropostaRejeitada(dadosProposta: any): Promise<boolean> {
    try {
      this.log(`📤 Enviando notificação de proposta rejeitada: ${dadosProposta.numero}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: 'vendas@conectcrm.com', // Email da equipe
        subject: `❌ Proposta ${dadosProposta.numero} foi REJEITADA`,
        html: this.gerarTemplateRejeicao(dadosProposta),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.log('✅ Email de rejeição enviado:', result.messageId);
      return true;
    } catch (error) {
      this.error('❌ Erro ao enviar email de rejeição:', error);
      return false;
    }
  }

  /**
   * Envia email de proposta para cliente
   */
  async enviarPropostaPorEmail(
    dadosProposta: any,
    emailCliente: string,
    linkPortal: string,
    propostaId?: string,
  ): Promise<boolean> {
    try {
      this.log(`📤 Enviando proposta para cliente: ${emailCliente}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: emailCliente,
        subject: `📋 Proposta ${dadosProposta.numero} - ${dadosProposta.titulo}`,
        html: this.gerarTemplateProposta(dadosProposta, linkPortal),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.log('✅ Proposta enviada por email:', result.messageId);

      // 🔄 SINCRONIZAÇÃO AUTOMÁTICA: Marcar como enviada após sucesso no envio
      if (propostaId && this.propostasService) {
        try {
          await this.propostasService.marcarComoEnviada(propostaId, emailCliente, linkPortal);
          this.log(`✅ Status automaticamente atualizado para "enviada"`);
        } catch (statusError) {
          this.warn(`⚠️ Erro ao atualizar status automaticamente:`, statusError.message);
          // Não falhar o envio por causa do status
        }
      }

      return true;
    } catch (error) {
      this.error('❌ Erro ao enviar proposta:', error);
      return false;
    }
  }

  /**
   * Testa configuração de email
   */
  async testarConfiguracao(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.log('✅ Configuração de email válida');
      return true;
    } catch (error) {
      this.error('❌ Erro na configuração de email:', error);
      return false;
    }
  }

  /**
   * Envia email genérico
   */
  async enviarEmailGenerico(emailData: {
    to: string;
    cc?: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    try {
      this.log(`📤 [EMAIL GENÉRICO] Enviando para: ${emailData.to}`);
      this.log(`📤 [EMAIL GENÉRICO] Assunto: ${emailData.subject}`);

      // ✅ VALIDAÇÃO: Verificar se é email fictício
      const isFakeEmail =
        emailData.to.includes('@cliente.temp') ||
        emailData.to.includes('@exemplo.') ||
        emailData.to.includes('@test.');

      if (isFakeEmail) {
        this.log(`⚠️ [EMAIL FICTÍCIO] Detectado email fictício: ${emailData.to}`);
        this.log(`⚠️ [EMAIL FICTÍCIO] Simulando envio bem-sucedido (email não será enviado)`);
        // Simular sucesso para emails fictícios - não enviar email real
        return true;
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'ConectCRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER || 'conectcrm@gmail.com',
        },
        to: emailData.to,
        cc: emailData.cc || undefined,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''), // Fallback para texto simples
      };

      this.log(`📤 [EMAIL REAL] Configurações do envio:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html,
        hasText: !!mailOptions.text,
        smtp_configured: !!process.env.GMAIL_USER,
      });

      const result = await this.transporter.sendMail(mailOptions);

      this.log('✅ [EMAIL REAL] Email enviado com sucesso!', {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      });

      return true;
    } catch (error) {
      this.error('❌ [EMAIL ERRO] Erro ao enviar email genérico:', error);
      this.error('❌ [EMAIL ERRO] Detalhes:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
      });
      return false;
    }
  }

  private gerarTemplateAceitacao(proposta: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>🎉 Proposta Aceita!</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Ótimas notícias!</h2>
          <p>A proposta <strong>${proposta.numero}</strong> foi aceita pelo cliente.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalhes da Proposta:</h3>
            <ul>
              <li><strong>Cliente:</strong> ${proposta.cliente}</li>
              <li><strong>Título:</strong> ${proposta.titulo}</li>
              <li><strong>Valor:</strong> R$ ${proposta.valor?.toLocaleString('pt-BR')}</li>
              <li><strong>Data de Aceite:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            </ul>
          </div>
          
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
            <h4>📋 Próximos Passos:</h4>
            <ol>
              <li>Entrar em contato com o cliente em até 2 horas</li>
              <li>Preparar e enviar o contrato</li>
              <li>Agendar reunião de kickoff</li>
              <li>Atualizar status no CRM</li>
            </ol>
          </div>
        </div>
      </div>
    `;
  }

  private gerarTemplateRejeicao(proposta: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>❌ Proposta Rejeitada</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Infelizmente...</h2>
          <p>A proposta <strong>${proposta.numero}</strong> foi rejeitada pelo cliente.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalhes da Proposta:</h3>
            <ul>
              <li><strong>Cliente:</strong> ${proposta.cliente}</li>
              <li><strong>Título:</strong> ${proposta.titulo}</li>
              <li><strong>Valor:</strong> R$ ${proposta.valor?.toLocaleString('pt-BR')}</li>
              <li><strong>Data de Rejeição:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            </ul>
          </div>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca;">
            <h4>🔄 Próximos Passos:</h4>
            <ol>
              <li>Entrar em contato com o cliente para entender os motivos</li>
              <li>Solicitar feedback sobre a proposta</li>
              <li>Avaliar possibilidade de nova proposta</li>
              <li>Atualizar CRM com observações</li>
            </ol>
          </div>

          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>💡 Dica:</strong> Use este feedback para melhorar futuras propostas!</p>
          </div>
        </div>
      </div>
    `;
  }

  private gerarTemplateProposta(proposta: any, linkPortal: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>📋 Nova Proposta</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Olá!</h2>
          <p>Recebemos sua solicitação e preparamos uma proposta personalizada para você.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalhes da Proposta:</h3>
            <ul>
              <li><strong>Número:</strong> ${proposta.numero}</li>
              <li><strong>Título:</strong> ${proposta.titulo}</li>
              <li><strong>Valor:</strong> R$ ${proposta.valor?.toLocaleString('pt-BR')}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${linkPortal}" 
               style="background: #10b981; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;
                      font-weight: bold;">
              🔍 Visualizar Proposta Completa
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <p><strong>⏰ Esta proposta é válida por 30 dias</strong></p>
            <p>Clique no botão acima para aceitar ou rejeitar a proposta.</p>
          </div>
        </div>
      </div>
    `;
  }
}

