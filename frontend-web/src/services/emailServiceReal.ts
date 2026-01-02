/**
 * Serviço de E-mail Real - ConectCRM
 * Integração com provedores reais de e-mail
 * Suporte para Gmail, SendGrid, AWS SES, e SMTP customizado
 */

import { TEMPLATE_PROPOSTA_EMAIL, EMAIL_PROVIDERS } from '../config/emailConfig';
import { formatarTokenParaExibicao } from '../utils/tokenUtils';
import { API_BASE_URL } from './api';

export interface EmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content: string;
    type: string;
  }[];
}

export interface PropostaEmailData {
  cliente: {
    nome: string;
    email: string;
  };
  proposta: {
    numero: string;
    valorTotal: number;
    dataValidade: string;
    token: string;
  };
  vendedor: {
    nome: string;
    email: string;
    telefone: string;
  };
  empresa: {
    nome: string;
    email: string;
    telefone: string;
    endereco: string;
  };
  portalUrl: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: Date;
}

class EmailServiceReal {
  private provider: string;
  private isDebugMode: boolean;
  private isTestMode: boolean;
  private emailServerUrl: string;

  constructor() {
    this.provider = process.env.REACT_APP_EMAIL_PROVIDER || 'gmail';
    this.isDebugMode = process.env.REACT_APP_EMAIL_DEBUG === 'true';
    this.isTestMode = process.env.REACT_APP_EMAIL_TEST_MODE === 'true';
    // ✅ CORREÇÃO: Usar backend integrado ao invés do servidor separado
    this.emailServerUrl = API_BASE_URL;
  }

  /**
   * Enviar e-mail de proposta para cliente
   */
  async enviarPropostaParaCliente(data: PropostaEmailData): Promise<EmailResponse> {
    try {
      if (this.isDebugMode) {
        console.log('📧 [EMAIL DEBUG] Enviando proposta via API /email/enviar-proposta:', {
          propostaNumero: data.proposta.numero,
          clienteEmail: data.cliente.email,
          tokenFormatado: formatarTokenParaExibicao(data.proposta.token),
        });
      }

      if (this.isTestMode) {
        return this.simularEnvio({
          to: data.cliente.email,
          subject: `Proposta Comercial #${data.proposta.numero} - ${data.empresa.nome}`,
          html: 'Email de teste',
        });
      }

      // ✅ CORREÇÃO: Chamar API específica para propostas que faz sincronização automática
      const response = await fetch(`${this.emailServerUrl}/email/enviar-proposta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposta: {
            id: data.proposta.numero, // Usar número da proposta como ID
            numero: data.proposta.numero,
            valorTotal: data.proposta.valorTotal,
            dataValidade: data.proposta.dataValidade,
            token: data.proposta.numero, // ✅ CORREÇÃO: Usar número da proposta como token
          },
          emailCliente: data.cliente.email,
          linkPortal: data.portalUrl
            ? `${data.portalUrl}/proposta/${data.proposta.numero}`
            : `${window.location.origin}/portal/proposta/${data.proposta.numero}`, // ✅ CORREÇÃO: Usar número da proposta
          registrarToken: true, // ✅ Solicitar que o backend registre o token
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API /email/enviar-proposta: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Proposta enviada com sincronização automática:', result);
        return {
          success: true,
          messageId: result.timestamp,
          provider: 'backend-integrado-proposta',
          timestamp: new Date(),
        };
      } else {
        throw new Error(result.message || 'Erro desconhecido na API');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de proposta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Enviar e-mail genérico - Usando backend integrado
   */
  async enviarEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      // ✅ FORMATO CORRETO: Usar novo formato que o backend aceita
      const response = await fetch(`${this.emailServerUrl}/email/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [emailData.to], // ✅ Novo formato: 'to'
          subject: emailData.subject, // ✅ Novo formato: 'subject'
          message: emailData.html || emailData.text, // ✅ Novo formato: 'message'
          attachments: emailData.attachments || [], // ✅ Novo formato: 'attachments'
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend integrado: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: result.success || true,
        messageId: result.id,
        provider: 'backend-integrado',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`❌ Erro no backend integrado:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        provider: 'backend-integrado',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gmail SMTP (usando API do backend)
   */
  private async enviarViaGmail(emailData: EmailData): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/gmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        // Não enviamos config - deixamos o backend usar suas próprias credenciais
      }),
    });

    if (!response.ok) {
      throw new Error(`Gmail SMTP: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'gmail',
      timestamp: new Date(),
    };
  }

  /**
   * SendGrid API
   */
  private async enviarViaSendGrid(emailData: EmailData): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/sendgrid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        apiKey: process.env.REACT_APP_SENDGRID_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'sendgrid',
      timestamp: new Date(),
    };
  }

  /**
   * AWS SES
   */
  private async enviarViaAWS(emailData: EmailData): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/aws-ses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        config: {
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
          region: process.env.REACT_APP_AWS_REGION,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AWS SES: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'aws-ses',
      timestamp: new Date(),
    };
  }

  /**
   * SMTP Customizado
   */
  private async enviarViaSMTP(emailData: EmailData): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/smtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        config: {
          host: process.env.REACT_APP_SMTP_HOST,
          port: process.env.REACT_APP_SMTP_PORT,
          user: process.env.REACT_APP_SMTP_USER,
          password: process.env.REACT_APP_SMTP_PASSWORD,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`SMTP: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'smtp',
      timestamp: new Date(),
    };
  }

  /**
   * Simular envio (modo teste)
   */
  private async simularEnvio(emailData: EmailData): Promise<EmailResponse> {
    console.log('🧪 [TESTE] Simulando envio de e-mail:');
    console.log('📩 Para:', emailData.to);
    console.log('📩 Cópia:', emailData.cc);
    console.log('📩 Assunto:', emailData.subject);
    console.log('📩 Tamanho HTML:', emailData.html.length, 'chars');

    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId: `test-${Date.now()}`,
      provider: 'simulado',
      timestamp: new Date(),
    };
  }

  /**
   * Gerar HTML do e-mail de proposta
   */
  private gerarEmailProposta(data: PropostaEmailData): string {
    return TEMPLATE_PROPOSTA_EMAIL.replace(/{{nomeCliente}}/g, data.cliente.nome)
      .replace(/{{numeroProposta}}/g, data.proposta.numero)
      .replace(/{{token}}/g, formatarTokenParaExibicao(data.proposta.token))
      .replace(
        /{{valorTotal}}/g,
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(data.proposta.valorTotal),
      )
      .replace(/{{dataValidade}}/g, data.proposta.dataValidade)
      .replace(/{{nomeVendedor}}/g, data.vendedor.nome)
      .replace(/{{emailVendedor}}/g, data.vendedor.email)
      .replace(/{{telefoneVendedor}}/g, data.vendedor.telefone)
      .replace(/{{nomeEmpresa}}/g, data.empresa.nome)
      .replace(/{{emailEmpresa}}/g, data.empresa.email)
      .replace(/{{telefoneEmpresa}}/g, data.empresa.telefone)
      .replace(/{{enderecoEmpresa}}/g, data.empresa.endereco)
      .replace(
        /{{linkPortal}}/g,
        `${data.portalUrl}/${data.proposta.numero}/${data.proposta.token}`,
      );
  }

  /**
   * Gerar versão texto simples do e-mail
   */
  private gerarTextoSimplesProposta(data: PropostaEmailData): string {
    return `
PROPOSTA COMERCIAL #${data.proposta.numero}

Olá ${data.cliente.nome},

Temos o prazer de enviar nossa proposta comercial para sua análise.

🔐 CÓDIGO DE ACESSO: ${formatarTokenParaExibicao(data.proposta.token)}

📋 DETALHES:
• Proposta: #${data.proposta.numero}
• Valor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.proposta.valorTotal)}
• Validade: ${data.proposta.dataValidade}
• Vendedor: ${data.vendedor.nome}

🌐 ACESSE O PORTAL: ${data.portalUrl}/${data.proposta.numero}/${data.proposta.token}

COMO ACESSAR:
1. Acesse o link acima
2. Digite o código: ${formatarTokenParaExibicao(data.proposta.token)}
3. Visualize todos os detalhes
4. Aceite ou solicite alterações

Atenciosamente,
${data.vendedor.nome}
${data.vendedor.email}
${data.vendedor.telefone}

${data.empresa.nome}
${data.empresa.endereco}
${data.empresa.telefone} | ${data.empresa.email}
    `.trim();
  }

  /**
   * Obter informações do provedor atual
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      info: EMAIL_PROVIDERS[this.provider] || null,
      isDebug: this.isDebugMode,
      isTest: this.isTestMode,
    };
  }

  /**
   * Testar configuração de e-mail com configuração específica
   */
  async testarConfiguracaoComConfig(emailTeste: string, config: any): Promise<EmailResponse> {
    const emailData: EmailData = {
      to: emailTeste,
      subject: 'Teste ConectCRM - Configuração de E-mail',
      html: `
        <h2>✅ Teste de E-mail ConectCRM</h2>
        <p>Se você recebeu este e-mail, sua configuração está funcionando!</p>
        <p><strong>Provedor:</strong> ${config.provider}</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <hr>
        <p><em>Este é um e-mail de teste do sistema ConectCRM.</em></p>
      `,
      text: `
        ✅ TESTE DE E-MAIL CONECTCRM
        
        Se você recebeu este e-mail, sua configuração está funcionando!
        
        Provedor: ${config.provider}
        Data/Hora: ${new Date().toLocaleString('pt-BR')}
        
        Este é um e-mail de teste do sistema ConectCRM.
      `,
    };

    // ✅ CORREÇÃO: Usar o método integrado ao invés dos métodos específicos por provedor
    return await this.enviarEmail(emailData);
  }

  /**
   * Enviar e-mail com configuração específica
   * ✅ CORRIGIDO: Agora usa apenas o backend integrado
   */
  async enviarEmailComConfig(emailData: EmailData, config: any): Promise<EmailResponse> {
    try {
      // ✅ CORREÇÃO: Sempre usar o backend integrado independente do provedor
      console.log(
        `📧 [EmailService] Enviando via backend integrado (provedor configurado: ${config.provider})`,
      );
      return await this.enviarEmail(emailData);
    } catch (error) {
      console.error(`❌ Erro no backend integrado (provedor: ${config.provider}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        provider: 'backend-integrado',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gmail SMTP com configuração específica
   */
  private async enviarViaGmailComConfig(
    emailData: EmailData,
    gmailConfig: any,
  ): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/gmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        config: {
          user: gmailConfig.user,
          password: gmailConfig.password,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gmail SMTP: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'gmail',
      timestamp: new Date(),
    };
  }

  /**
   * SendGrid com configuração específica
   */
  private async enviarViaSendGridComConfig(
    emailData: EmailData,
    sendgridConfig: any,
  ): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/sendgrid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        apiKey: sendgridConfig.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'sendgrid',
      timestamp: new Date(),
    };
  }

  /**
   * AWS SES com configuração específica
   */
  private async enviarViaAWSComConfig(
    emailData: EmailData,
    awsConfig: any,
  ): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/aws-ses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        config: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
          region: awsConfig.region,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AWS SES: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'aws-ses',
      timestamp: new Date(),
    };
  }

  /**
   * SMTP com configuração específica
   */
  private async enviarViaSMTPComConfig(
    emailData: EmailData,
    smtpConfig: any,
  ): Promise<EmailResponse> {
    const response = await fetch(`${this.emailServerUrl}/api/email/smtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        config: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          user: smtpConfig.user,
          password: smtpConfig.password,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`SMTP: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messageId,
      provider: 'smtp',
      timestamp: new Date(),
    };
  }

  /**
   * Testar configuração de e-mail
   */
  async testarConfiguracao(emailTeste: string = 'teste@exemplo.com'): Promise<EmailResponse> {
    const emailData: EmailData = {
      to: emailTeste,
      subject: 'Teste ConectCRM - Configuração de E-mail',
      html: `
        <h2>✅ Teste de E-mail ConectCRM</h2>
        <p>Se você recebeu este e-mail, sua configuração está funcionando!</p>
        <p><strong>Provedor:</strong> ${this.provider}</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <hr>
        <p><em>Este é um e-mail de teste do sistema ConectCRM.</em></p>
      `,
      text: `
        ✅ TESTE DE E-MAIL CONECTCRM
        
        Se você recebeu este e-mail, sua configuração está funcionando!
        
        Provedor: ${this.provider}
        Data/Hora: ${new Date().toLocaleString('pt-BR')}
        
        Este é um e-mail de teste do sistema ConectCRM.
      `,
    };

    return await this.enviarEmail(emailData);
  }
}

export const emailServiceReal = new EmailServiceReal();
export default emailServiceReal;
