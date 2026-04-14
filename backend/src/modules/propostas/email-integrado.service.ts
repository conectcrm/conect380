import { Injectable, Inject, forwardRef } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmpresaConfigService } from '../empresas/services/empresa-config.service';

export interface EmailEnvioResultado {
  sucesso: boolean;
  simulado: boolean;
  motivo:
    | 'enviado_real'
    | 'smtp_nao_configurado'
    | 'email_ficticio'
    | 'emails_desabilitados'
    | 'erro_envio';
  detalhes?: string;
}

export interface EmailEntregaDiagnostico {
  operacional: boolean;
  simulado: boolean;
  status: 'ok' | 'alerta' | 'bloqueio';
  detalhe: string;
  smtpConfigured: boolean;
  emailsEnabled: boolean;
  source: 'empresa' | 'env';
  modoProducao: boolean;
}

@Injectable()
export class EmailIntegradoService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(forwardRef(() => require('./propostas.service').PropostasService))
    private propostasService?: any,
    private readonly empresaConfigService?: EmpresaConfigService,
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

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) {
        return message;
      }
    }

    return fallbackMessage;
  }

  private setupTransporter() {
    const user = this.resolveEnvSmtpUser();
    const pass = this.resolveEnvSmtpPassword();
    const host = this.resolveEnvSmtpHost();

    if (host && user && pass) {
      this.transporter = this.buildTransporterFromSmtpConfig(
        host,
        this.resolveEnvSmtpPort(),
        user,
        pass,
      );
      this.log('Servico de email integrado configurado com SMTP global');
      return;
    }

    // Fallback historico para ambientes que ainda usam Gmail service.
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user || undefined,
        pass: pass || undefined,
      },
    });

    this.log('Servico de email integrado configurado');
  }

  private isProductionEnv(): boolean {
    const runtime = String(process.env.NODE_ENV || process.env.APP_ENV || '').toLowerCase();
    return runtime === 'production';
  }

  private hasEnvSmtpConfig(): boolean {
    const user = this.resolveEnvSmtpUser();
    const pass = this.resolveEnvSmtpPassword();
    return Boolean(user && pass);
  }

  private resolveEnvSmtpUser(): string {
    return String(process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  }

  private resolveEnvSmtpPassword(): string {
    return String(
      process.env.GMAIL_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
    ).trim();
  }

  private resolveEnvSmtpHost(): string {
    return String(process.env.SMTP_HOST || '').trim();
  }

  private resolveEnvSmtpPort(): number {
    const parsed = parseInt(String(process.env.SMTP_PORT || '587'), 10);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
      return 587;
    }
    return parsed;
  }

  private buildTransporterFromSmtpConfig(
    host: string,
    port: number,
    user: string,
    pass: string,
  ): nodemailer.Transporter {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  private async resolveEmailTransportContext(empresaId?: string): Promise<{
    transporter: nodemailer.Transporter;
    fromAddress: string;
    smtpConfigured: boolean;
    emailsEnabled: boolean;
    source: 'empresa' | 'env';
  }> {
    if (empresaId && this.empresaConfigService) {
      try {
        const empresaSmtp = await this.empresaConfigService.getSmtpRuntimeConfig(empresaId);

        if (!empresaSmtp.emailsHabilitados) {
          return {
            transporter: this.transporter,
            fromAddress:
              process.env.EMAIL_FROM ||
              empresaSmtp.user ||
              process.env.GMAIL_USER ||
              process.env.SMTP_USER ||
              'conectcrm@gmail.com',
            smtpConfigured: false,
            emailsEnabled: false,
            source: 'empresa',
          };
        }

        if (empresaSmtp.host && empresaSmtp.user && empresaSmtp.pass) {
          return {
            transporter: this.buildTransporterFromSmtpConfig(
              empresaSmtp.host,
              empresaSmtp.port || 587,
              empresaSmtp.user,
              empresaSmtp.pass,
            ),
            fromAddress: empresaSmtp.user || process.env.EMAIL_FROM || 'conectcrm@gmail.com',
            smtpConfigured: true,
            emailsEnabled: true,
            source: 'empresa',
          };
        }

        this.warn(
          `SMTP da empresa ${empresaId} incompleto. Fallback para configuracao global do ambiente.`,
        );
      } catch (error: any) {
        this.warn(
          `Falha ao ler SMTP da empresa ${empresaId}. Fallback para ambiente: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
        );
      }
    }

    const envUser = this.resolveEnvSmtpUser();

    return {
      transporter: this.transporter,
      fromAddress: process.env.EMAIL_FROM || envUser || 'conectcrm@gmail.com',
      smtpConfigured: this.hasEnvSmtpConfig(),
      emailsEnabled: true,
      source: 'env',
    };
  }

  private isFakeEmail(email: string): boolean {
    const normalized = String(email || '').toLowerCase();
    return (
      normalized.includes('@cliente.com') ||
      normalized.includes('@cliente.temp') ||
      normalized.includes('@email.com') ||
      normalized.includes('@exemplo.') ||
      normalized.includes('@test.') ||
      normalized.includes('@ficticio.')
    );
  }

  private async syncStatusAfterSend(
    propostaId: string | undefined,
    emailCliente: string,
    linkPortal: string,
  ): Promise<void> {
    if (!propostaId || !this.propostasService) {
      return;
    }

    try {
      await this.propostasService.marcarComoEnviada(propostaId, emailCliente, linkPortal);
      this.log('Status automaticamente atualizado para "enviada"');
    } catch (statusError: any) {
      this.warn(
        `Erro ao atualizar status automaticamente: ${this.resolveErrorMessage(statusError, 'erro desconhecido')}`,
      );
      // Nao falhar o envio por causa do status.
    }
  }

  /**
   * Envia email de notificacao de proposta aceita
   */
  async notificarPropostaAceita(dadosProposta: any): Promise<boolean> {
    try {
      this.log(`Enviando notificacao de proposta aceita: ${dadosProposta.numero}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: 'vendas@conectcrm.com', // Email da equipe
        subject: `Proposta ${dadosProposta.numero} foi ACEITA`,
        html: this.gerarTemplateAceitacao(dadosProposta),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.log('Email de aceitacao enviado:', result.messageId);
      return true;
    } catch (error) {
      this.error(
        `Erro ao enviar email de aceitacao: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
      return false;
    }
  }

  /**
   * Envia email de notificacao de proposta rejeitada
   */
  async notificarPropostaRejeitada(dadosProposta: any): Promise<boolean> {
    try {
      this.log(`Enviando notificacao de proposta rejeitada: ${dadosProposta.numero}`);

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        },
        to: 'vendas@conectcrm.com', // Email da equipe
        subject: `Proposta ${dadosProposta.numero} foi REJEITADA`,
        html: this.gerarTemplateRejeicao(dadosProposta),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.log('Email de rejeicao enviado:', result.messageId);
      return true;
    } catch (error) {
      this.error(
        `Erro ao enviar email de rejeicao: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
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
    empresaId?: string,
  ): Promise<boolean> {
    try {
      this.log(`Enviando proposta para cliente: ${emailCliente}`);

      const fakeEmail = this.isFakeEmail(emailCliente);
      const transportContext = await this.resolveEmailTransportContext(empresaId);

      if (fakeEmail) {
        this.warn(`[EMAIL FICTICIO] Envio simulado para: ${emailCliente}`);
        await this.syncStatusAfterSend(propostaId, emailCliente, linkPortal);
        return true;
      }

      if (!transportContext.emailsEnabled) {
        this.warn(`E-mails desabilitados na configuracao da empresa ${empresaId || '[sem-id]'}.`);
        return false;
      }

      if (!transportContext.smtpConfigured && !this.isProductionEnv()) {
        this.warn('SMTP nao configurado no ambiente local. Envio de proposta sera simulado.');
        await this.syncStatusAfterSend(propostaId, emailCliente, linkPortal);
        return true;
      }

      if (!transportContext.smtpConfigured) {
        this.error(
          'SMTP nao configurado. Defina GMAIL_USER/GMAIL_PASSWORD ou SMTP_USER/SMTP_PASS (ou SMTP_PASSWORD).',
        );
        return false;
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Conect CRM',
          address: transportContext.fromAddress,
        },
        to: emailCliente,
        subject: `Proposta ${this.resolvePropostaNumero(dadosProposta)} - ${this.resolvePropostaTitulo(dadosProposta)}`,
        html: this.gerarTemplateProposta(
          dadosProposta,
          linkPortal,
          await this.resolveEmailBranding(empresaId, dadosProposta),
        ),
      };

      this.log('[EMAIL TEMPLATE] proposta_email_v2');
      const result = await transportContext.transporter.sendMail(mailOptions);
      this.log('Proposta enviada por email:', result.messageId);

      // Sincronizacao automatica: marcar como enviada apos sucesso no envio.
      await this.syncStatusAfterSend(propostaId, emailCliente, linkPortal);

      return true;
    } catch (error) {
      this.error(`Erro ao enviar proposta: ${this.resolveErrorMessage(error, 'erro desconhecido')}`);
      return false;
    }
  }

  /**
   * Testa configuracao de email
   */
  async testarConfiguracao(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.log('Configuracao de email valida');
      return true;
    } catch (error) {
      this.error(
        `Erro na configuracao de email: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
      return false;
    }
  }

  async obterDiagnosticoEntregaEmail(empresaId?: string): Promise<EmailEntregaDiagnostico> {
    const transportContext = await this.resolveEmailTransportContext(empresaId);
    const modoProducao = this.isProductionEnv();

    if (!transportContext.emailsEnabled) {
      return {
        operacional: false,
        simulado: false,
        status: 'bloqueio',
        detalhe:
          `Envio de e-mails desabilitado na configuracao da empresa ` +
          `${empresaId || '[sem-id]'}.`,
        smtpConfigured: transportContext.smtpConfigured,
        emailsEnabled: transportContext.emailsEnabled,
        source: transportContext.source,
        modoProducao,
      };
    }

    if (transportContext.smtpConfigured) {
      return {
        operacional: true,
        simulado: false,
        status: 'ok',
        detalhe:
          transportContext.source === 'empresa'
            ? 'SMTP da empresa configurado para envio real de cobrancas.'
            : 'SMTP global do ambiente configurado para envio real de cobrancas.',
        smtpConfigured: transportContext.smtpConfigured,
        emailsEnabled: transportContext.emailsEnabled,
        source: transportContext.source,
        modoProducao,
      };
    }

    if (!modoProducao) {
      return {
        operacional: true,
        simulado: true,
        status: 'alerta',
        detalhe:
          'SMTP nao configurado. Neste ambiente nao-producao os envios serao simulados.',
        smtpConfigured: transportContext.smtpConfigured,
        emailsEnabled: transportContext.emailsEnabled,
        source: transportContext.source,
        modoProducao,
      };
    }

    return {
      operacional: false,
      simulado: false,
      status: 'bloqueio',
      detalhe:
        'SMTP nao configurado para producao. Defina SMTP_HOST/SMTP_USER/SMTP_PASS (ou SMTP_PASSWORD).',
      smtpConfigured: transportContext.smtpConfigured,
      emailsEnabled: transportContext.emailsEnabled,
      source: transportContext.source,
      modoProducao,
    };
  }

  /**
   * Envia email generico
   */
  async enviarEmailGenerico(
    emailData: {
      to: string;
      cc?: string;
      subject: string;
      html: string;
      text?: string;
    },
    empresaId?: string,
  ): Promise<boolean> {
    const resultado = await this.enviarEmailGenericoDetalhado(emailData, empresaId);
    return resultado.sucesso;
  }

  async enviarEmailGenericoDetalhado(
    emailData: {
      to: string;
      cc?: string;
      subject: string;
      html: string;
      text?: string;
    },
    empresaId?: string,
  ): Promise<EmailEnvioResultado> {
    try {
      this.log(`[EMAIL GENERICO] Enviando para: ${emailData.to}`);
      this.log(`[EMAIL GENERICO] Assunto: ${emailData.subject}`);

      const isFakeEmail =
        emailData.to.includes('@cliente.temp') ||
        emailData.to.includes('@exemplo.') ||
        emailData.to.includes('@test.');

      if (isFakeEmail) {
        this.log(`[EMAIL FICTICIO] Detectado email ficticio: ${emailData.to}`);
        this.log('[EMAIL FICTICIO] Simulando envio bem-sucedido (email nao sera enviado)');
        return {
          sucesso: true,
          simulado: true,
          motivo: 'email_ficticio',
          detalhes: `Destinatario ${emailData.to} identificado como email ficticio`,
        };
      }

      const transportContext = await this.resolveEmailTransportContext(empresaId);

      if (!transportContext.emailsEnabled) {
        this.warn(`E-mails desabilitados na configuracao da empresa ${empresaId || '[sem-id]'}.`);
        return {
          sucesso: false,
          simulado: false,
          motivo: 'emails_desabilitados',
          detalhes: `Emails desabilitados para empresa ${empresaId || '[sem-id]'}`,
        };
      }

      if (!transportContext.smtpConfigured && !this.isProductionEnv()) {
        this.warn('SMTP nao configurado no ambiente local. Envio generico sera simulado.');
        return {
          sucesso: true,
          simulado: true,
          motivo: 'smtp_nao_configurado',
          detalhes: `SMTP nao configurado (origem=${transportContext.source})`,
        };
      }

      if (!transportContext.smtpConfigured) {
        this.error(
          'SMTP nao configurado. Defina GMAIL_USER/GMAIL_PASSWORD ou SMTP_USER/SMTP_PASS (ou SMTP_PASSWORD).',
        );
        return {
          sucesso: false,
          simulado: false,
          motivo: 'smtp_nao_configurado',
          detalhes: 'SMTP nao configurado para envio em producao',
        };
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'ConectCRM',
          address: transportContext.fromAddress,
        },
        to: emailData.to,
        cc: emailData.cc || undefined,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      };

      this.log('[EMAIL REAL] Configuracoes do envio:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html,
        hasText: !!mailOptions.text,
        smtp_configured: transportContext.smtpConfigured,
        source: transportContext.source,
      });

      const result = await transportContext.transporter.sendMail(mailOptions);

      this.log('[EMAIL REAL] Email enviado com sucesso!', {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      });

      return {
        sucesso: true,
        simulado: false,
        motivo: 'enviado_real',
      };
    } catch (error) {
      const err = error as any;
      this.error('[EMAIL ERRO] Erro ao enviar email generico:', err);
      this.error('[EMAIL ERRO] Detalhes:', {
        message: err?.message,
        code: err?.code,
        command: err?.command,
        response: err?.response,
      });
      return {
        sucesso: false,
        simulado: false,
        motivo: 'erro_envio',
        detalhes: err?.message || String(err),
      };
    }
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private sanitizeHtml(value: unknown): string {
    return this.normalizeText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const normalized = trimmed.replace(/\./g, '').replace(',', '.');
      const numeric = Number(normalized);
      if (Number.isFinite(numeric)) {
        return numeric;
      }

      const fallback = Number(trimmed.replace(',', '.'));
      return Number.isFinite(fallback) ? fallback : null;
    }

    return null;
  }

  private formatCurrencyBRL(value: unknown): string {
    const numeric = this.toFiniteNumber(value);
    if (numeric === null) {
      return 'A definir';
    }

    return numeric.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private formatDateBR(value: unknown): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('pt-BR');
  }

  private normalizeHexColor(value: unknown, fallback = '#159A9C'): string {
    const color = this.normalizeText(value);
    return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) ? color : fallback;
  }

  private resolvePropostaNumero(proposta: any): string {
    return this.normalizeText(proposta?.numero || proposta?.codigo || proposta?.id) || 'N/A';
  }

  private resolvePropostaTitulo(proposta: any): string {
    return (
      this.normalizeText(
        proposta?.titulo ||
          proposta?.assunto ||
          proposta?.nome ||
          proposta?.descricao ||
          proposta?.empresa?.nome,
      ) || 'Proposta Comercial'
    );
  }

  private resolvePropostaValor(proposta: any): unknown {
    return proposta?.valor ?? proposta?.total ?? proposta?.valorTotal ?? proposta?.subtotal;
  }

  private resolveClienteNome(proposta: any): string {
    const clienteObjeto = proposta?.cliente;
    if (clienteObjeto && typeof clienteObjeto === 'object') {
      const nomeObjeto = this.normalizeText(clienteObjeto?.nome);
      if (nomeObjeto) {
        return nomeObjeto;
      }
    }

    const nome = this.normalizeText(
      proposta?.clienteNome ||
        proposta?.nomeCliente ||
        (typeof clienteObjeto === 'string' ? clienteObjeto : ''),
    );
    return nome || 'cliente';
  }

  private resolveFormaPagamento(proposta: any): string {
    return (
      this.normalizeText(
        proposta?.formaPagamento || proposta?.condicaoPagamento || proposta?.pagamento,
      ) || 'A combinar'
    );
  }

  private resolveValidadeTexto(proposta: any): string {
    const dataValidade = this.formatDateBR(
      proposta?.dataValidade || proposta?.dataVencimento || proposta?.data_vencimento,
    );
    if (dataValidade) {
      return dataValidade;
    }

    const validadeDias = this.toFiniteNumber(proposta?.validadeDias);
    if (validadeDias && validadeDias > 0) {
      return `${Math.round(validadeDias)} dias`;
    }

    return '30 dias';
  }

  private getInitials(value: string): string {
    const normalized = this.normalizeText(value);
    if (!normalized) {
      return 'CC';
    }

    const initials = normalized
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'CC';
  }

  private async resolveEmailBranding(
    empresaId?: string,
    proposta?: any,
  ): Promise<{
    empresaNome: string;
    logoUrl: string | null;
    corPrimaria: string;
    site: string | null;
  }> {
    const fallback = {
      empresaNome:
        this.normalizeText(
          proposta?.empresa?.nome || proposta?.empresaNome || process.env.EMAIL_FROM_NAME,
        ) || 'Conect CRM',
      logoUrl: this.normalizeText(proposta?.empresa?.logo || proposta?.logoUrl) || null,
      corPrimaria: this.normalizeHexColor(proposta?.empresa?.corPrimaria || proposta?.corPrimaria),
      site: this.normalizeText(proposta?.empresa?.site || proposta?.site) || null,
    };

    if (!empresaId || !this.empresaConfigService) {
      return fallback;
    }

    try {
      const config = await this.empresaConfigService.getByEmpresaId(empresaId);
      return {
        empresaNome: fallback.empresaNome,
        logoUrl: this.normalizeText(config?.logoUrl) || fallback.logoUrl,
        corPrimaria: this.normalizeHexColor(config?.corPrimaria || fallback.corPrimaria),
        site: this.normalizeText(config?.site) || fallback.site,
      };
    } catch (error) {
      this.warn(
        `Falha ao carregar branding da empresa ${empresaId}: ${this.resolveErrorMessage(error, 'erro desconhecido')}`,
      );
      return fallback;
    }
  }

  private gerarTemplateAceitacao(proposta: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>Proposta Aceita</h1>
        </div>

        <div style="padding: 20px; background: #f9fafb;">
          <h2>Otimas noticias!</h2>
          <p>A proposta <strong>${this.sanitizeHtml(this.resolvePropostaNumero(proposta))}</strong> foi aceita pelo cliente.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalhes da Proposta:</h3>
            <ul>
              <li><strong>Cliente:</strong> ${this.sanitizeHtml(this.resolveClienteNome(proposta))}</li>
              <li><strong>T&iacute;tulo:</strong> ${this.sanitizeHtml(this.resolvePropostaTitulo(proposta))}</li>
              <li><strong>Valor:</strong> ${this.sanitizeHtml(this.formatCurrencyBRL(this.resolvePropostaValor(proposta)))}</li>
              <li><strong>Data de Aceite:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            </ul>
          </div>

          <div style="background: #eff6ff; padding: 15px; border-radius: 8px;">
            <h4>Proximos Passos:</h4>
            <ol>
              <li>Entrar em contato com o cliente em ate 2 horas</li>
              <li>Preparar e enviar o contrato</li>
              <li>Agendar reuniao de kickoff</li>
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
          <h1>Proposta Rejeitada</h1>
        </div>

        <div style="padding: 20px; background: #f9fafb;">
          <h2>Infelizmente...</h2>
          <p>A proposta <strong>${this.sanitizeHtml(this.resolvePropostaNumero(proposta))}</strong> foi rejeitada pelo cliente.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalhes da Proposta:</h3>
            <ul>
              <li><strong>Cliente:</strong> ${this.sanitizeHtml(this.resolveClienteNome(proposta))}</li>
              <li><strong>T&iacute;tulo:</strong> ${this.sanitizeHtml(this.resolvePropostaTitulo(proposta))}</li>
              <li><strong>Valor:</strong> ${this.sanitizeHtml(this.formatCurrencyBRL(this.resolvePropostaValor(proposta)))}</li>
              <li><strong>Data de Rejeicao:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            </ul>
          </div>

          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca;">
            <h4>Proximos Passos:</h4>
            <ol>
              <li>Entrar em contato com o cliente para entender os motivos</li>
              <li>Solicitar feedback sobre a proposta</li>
              <li>Avaliar possibilidade de nova proposta</li>
              <li>Atualizar CRM com observacoes</li>
            </ol>
          </div>

          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p><strong>Dica:</strong> Use este feedback para melhorar futuras propostas!</p>
          </div>
        </div>
      </div>
    `;
  }

  private gerarTemplateProposta(
    proposta: any,
    linkPortal: string,
    branding: {
      empresaNome: string;
      logoUrl: string | null;
      corPrimaria: string;
      site: string | null;
    },
  ): string {
    const numero = this.sanitizeHtml(this.resolvePropostaNumero(proposta));
    const titulo = this.sanitizeHtml(this.resolvePropostaTitulo(proposta));
    const valor = this.sanitizeHtml(this.formatCurrencyBRL(this.resolvePropostaValor(proposta)));
    const validade = this.sanitizeHtml(this.resolveValidadeTexto(proposta));
    const formaPagamento = this.sanitizeHtml(this.resolveFormaPagamento(proposta));
    const clienteNome = this.sanitizeHtml(this.resolveClienteNome(proposta));
    const empresaNome = this.sanitizeHtml(branding.empresaNome);
    const portalLink = this.normalizeText(linkPortal) || '#';
    const portalLinkSafe = this.sanitizeHtml(portalLink);
    const siteSafe = this.sanitizeHtml(branding.site || '');
    const corPrimaria = this.normalizeHexColor(branding.corPrimaria, '#159A9C');
    const corPrimariaSafe = this.sanitizeHtml(corPrimaria);
    const logoUrl = this.normalizeText(branding.logoUrl || '');
    const logoSafe = this.sanitizeHtml(logoUrl);
    const logoHtml = logoUrl
      ? `<img src="${logoSafe}" alt="${empresaNome}" style="max-height: 42px; max-width: 180px; display: block;" />`
      : `<div style="width: 42px; height: 42px; border-radius: 50%; background: #e8f4f4; color: ${corPrimariaSafe}; font-weight: 700; font-size: 16px; line-height: 42px; text-align: center;">${this.sanitizeHtml(this.getInitials(branding.empresaNome))}</div>`;

    return `
      <!-- template: proposta_email_v2 -->
      <div style="margin: 0; padding: 0; background: #eef3f8; font-family: Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; padding: 20px 12px;">
          <div style="background: #ffffff; border: 1px solid #dce6ef; border-radius: 14px; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #edf2f7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    ${logoHtml}
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <div style="font-size: 12px; color: #5b6b7a; text-transform: uppercase; letter-spacing: 0.6px;">${empresaNome}</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1d2a35; margin-top: 4px;">Nova Proposta Comercial</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="height: 4px; background: ${corPrimariaSafe};"></div>

            <div style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1d2a35;">Ol&aacute;, ${clienteNome}!</p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #3d4f60; line-height: 1.6;">
                Preparamos uma proposta personalizada para voc&ecirc;. Confira os detalhes e acesse o portal para avaliar.
              </p>

              <div style="background: #f8fbff; border: 1px solid #dce6ef; border-radius: 12px; padding: 16px;">
                <div style="font-size: 15px; font-weight: 700; color: #1d2a35; margin-bottom: 12px;">Resumo da proposta</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; color: #627383; font-size: 13px;">N&uacute;mero</td>
                    <td style="padding: 6px 0; color: #1d2a35; font-size: 14px; font-weight: 700; text-align: right;">${numero}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #627383; font-size: 13px;">T&iacute;tulo</td>
                    <td style="padding: 6px 0; color: #1d2a35; font-size: 14px; font-weight: 700; text-align: right;">${titulo}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #627383; font-size: 13px;">Valor total</td>
                    <td style="padding: 6px 0; color: #0f766e; font-size: 16px; font-weight: 700; text-align: right;">${valor}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #627383; font-size: 13px;">Validade</td>
                    <td style="padding: 6px 0; color: #1d2a35; font-size: 14px; font-weight: 700; text-align: right;">${validade}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #627383; font-size: 13px;">Forma de pagamento</td>
                    <td style="padding: 6px 0; color: #1d2a35; font-size: 14px; font-weight: 700; text-align: right;">${formaPagamento}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 26px 0 18px;">
                <a href="${portalLinkSafe}"
                   style="background: ${corPrimariaSafe}; color: #ffffff; padding: 14px 28px;
                          text-decoration: none; border-radius: 10px; display: inline-block;
                          font-size: 15px; font-weight: 700;">
                  Visualizar proposta completa
                </a>
              </div>

              <div style="background: #fffbeb; border: 1px solid #f3d38c; border-radius: 10px; padding: 12px 14px; color: #744210; font-size: 13px; line-height: 1.5;">
                Esta proposta permanece dispon&iacute;vel por ${validade}. Use o bot&atilde;o acima para revisar, aceitar ou solicitar ajustes.
              </div>
            </div>

            <div style="padding: 14px 24px; border-top: 1px solid #edf2f7; background: #fafcff;">
              <p style="margin: 0; font-size: 12px; color: #607182;">
                Em caso de d&uacute;vidas, responda este e-mail.
                ${siteSafe ? ` Site: ${siteSafe}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
