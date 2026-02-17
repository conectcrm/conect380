/**
 * Configuração de E-mail - Serviços Reais
 * Suporte para Gmail SMTP, SendGrid, AWS SES, e outros
 */

export interface EmailConfig {
  provider: 'gmail' | 'sendgrid' | 'aws-ses' | 'nodemailer';
  config: any;
}

export interface EmailProvider {
  name: string;
  description: string;
  setup: string;
  limits: string;
}

const awsSesEnabled = process.env.REACT_APP_ENABLE_AWS_SES === 'true';

// Configurações dos provedores de e-mail
export const EMAIL_PROVIDERS: Record<string, EmailProvider> = {
  gmail: {
    name: 'Gmail SMTP',
    description: 'Usar sua conta do Gmail para enviar e-mails',
    setup: 'Ativar "Acesso a apps menos seguros" ou usar "Senhas de app"',
    limits: '500 e-mails/dia (gratuito)',
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Serviço profissional de e-mail marketing',
    setup: 'Criar conta gratuita e obter API Key',
    limits: '100 e-mails/dia (gratuito)',
  },
  ...(awsSesEnabled
    ? {
        'aws-ses': {
          name: 'Amazon SES',
          description: 'Serviço de e-mail da Amazon Web Services',
          setup: 'Conta AWS e configurar SES',
          limits: '200 e-mails/dia (gratuito nos primeiros 12 meses)',
        },
      }
    : {}),
  nodemailer: {
    name: 'Nodemailer SMTP',
    description: 'Configuração SMTP personalizada',
    setup: 'Configurar servidor SMTP customizado',
    limits: 'Depende do provedor SMTP',
  },
};
export const DEFAULT_EMAIL_PROVIDER = 'gmail';
export const getAllowedEmailProviders = (): string[] => Object.keys(EMAIL_PROVIDERS);
export const resolveEmailProvider = (provider?: string): string => {
  const normalizedProvider = (provider || '').trim();
  return getAllowedEmailProviders().includes(normalizedProvider)
    ? normalizedProvider
    : DEFAULT_EMAIL_PROVIDER;
};
// Configurações padrão para desenvolvimento
export const EMAIL_CONFIG: Record<string, EmailConfig> = {
  // Gmail SMTP - Mais fácil para começar
  gmail: {
    provider: 'gmail',
    config: {
      service: 'gmail',
      auth: {
        user: process.env.REACT_APP_EMAIL_USER || 'seu-email@gmail.com',
        pass: process.env.REACT_APP_EMAIL_PASSWORD || 'sua-senha-de-app',
      },
    },
  },

  // SendGrid - Mais profissional
  sendgrid: {
    provider: 'sendgrid',
    config: {
      apiKey: process.env.REACT_APP_SENDGRID_API_KEY || 'sua-api-key-sendgrid',
    },
  },

  // AWS SES
  awsSes: {
    provider: 'aws-ses',
    config: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    },
  },

  // SMTP Customizado
  smtp: {
    provider: 'nodemailer',
    config: {
      host: process.env.REACT_APP_SMTP_HOST || 'smtp.gmail.com',
      port: process.env.REACT_APP_SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.REACT_APP_SMTP_USER || '',
        pass: process.env.REACT_APP_SMTP_PASSWORD || '',
      },
    },
  },
};

// Template de e-mail para proposta
export const TEMPLATE_PROPOSTA_EMAIL = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta Comercial</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #159A9C;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #159A9C;
            margin-bottom: 10px;
        }
        .token-box {
            background: linear-gradient(135deg, #159A9C, #0F7B7D);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
        }
        .token {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .info-box {
            background-color: #f0f9ff;
            border-left: 4px solid #159A9C;
            padding: 15px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: #159A9C;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            border-top: 2px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
        }
        .highlight {
            color: #159A9C;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{nomeEmpresa}}</div>
            <h1>Nova Proposta Comercial</h1>
        </div>

        <p>Olá <strong>{{nomeCliente}}</strong>,</p>

        <p>Temos o prazer de enviar nossa proposta comercial <strong>#{{numeroProposta}}</strong> para sua análise.</p>

        <div class="token-box">
            <div>🔐 Seu código de acesso:</div>
            <div class="token">{{token}}</div>
            <div style="font-size: 14px; margin-top: 10px;">
                Use este código para acessar sua proposta no portal do cliente
            </div>
        </div>

        <div class="info-box">
            <strong>📋 Detalhes da Proposta:</strong><br>
            • <strong>Número:</strong> {{numeroProposta}}<br>
            • <strong>Valor Total:</strong> {{valorTotal}}<br>
            • <strong>Validade:</strong> {{dataValidade}}<br>
            • <strong>Vendedor:</strong> {{nomeVendedor}}
        </div>

        <p style="text-align: center;">
            <a href="{{linkPortal}}" class="button">
                🌐 Acessar Portal do Cliente
            </a>
        </p>

        <div class="info-box">
            <strong>💡 Como acessar:</strong><br>
            1. Clique no botão acima ou acesse: <span class="highlight">{{linkPortal}}</span><br>
            2. Digite o código de acesso: <span class="highlight">{{token}}</span><br>
            3. Visualize todos os detalhes da proposta<br>
            4. Aceite ou solicite alterações diretamente no portal
        </div>

        <p>Nossa proposta foi elaborada especialmente para atender suas necessidades. Caso tenha dúvidas, entre em contato conosco.</p>

        <p>Atenciosamente,<br>
        <strong>{{nomeVendedor}}</strong><br>
        {{emailVendedor}}<br>
        {{telefoneVendedor}}</p>

        <div class="footer">
            <p><strong>{{nomeEmpresa}}</strong></p>
            <p>{{enderecoEmpresa}}</p>
            <p>📞 {{telefoneEmpresa}} | 📧 {{emailEmpresa}}</p>
            <hr>
            <p style="font-size: 12px; color: #999;">
                Este e-mail foi enviado automaticamente pelo sistema ConectCRM. 
                Não responda este e-mail, entre em contato diretamente com seu vendedor.
            </p>
        </div>
    </div>
</body>
</html>
`;

export default {
  EMAIL_PROVIDERS,
  EMAIL_CONFIG,
  TEMPLATE_PROPOSTA_EMAIL,
};

