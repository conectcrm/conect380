/**
 * Servidor de E-mail - ConectCRM Backend
 * Processa envio de e-mails reais usando Nodemailer
 * Suporte para Gmail SMTP, SendGrid, AWS SES, e SMTP customizado
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3800;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Endpoint para Gmail SMTP
 */
app.post('/api/email/gmail', async (req, res) => {
  try {
    const { to, cc, bcc, subject, html, text, config } = req.body;

    // Validar se as credenciais foram fornecidas
    const user = config?.user || process.env.GMAIL_USER;
    const password = config?.password || process.env.GMAIL_PASSWORD;

    if (!user || !password) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais do Gmail não fornecidas. Verifique o usuário e senha.'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: password
      }
    });

    const info = await transporter.sendMail({
      from: `"ConectCRM" <${user}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html
    });

    console.log('✅ E-mail enviado via Gmail:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      provider: 'gmail'
    });

  } catch (error) {
    console.error('❌ Erro Gmail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para SendGrid
 */
app.post('/api/email/sendgrid', async (req, res) => {
  try {
    const { to, cc, bcc, subject, html, text, apiKey } = req.body;

    // Configurar API Key se fornecida
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }

    const msg = {
      to,
      cc,
      bcc,
      from: process.env.SENDGRID_FROM_EMAIL || 'contato@conectcrm.com',
      subject,
      text,
      html
    };

    const response = await sgMail.send(msg);

    console.log('✅ E-mail enviado via SendGrid:', response[0].headers['x-message-id']);

    res.json({
      success: true,
      messageId: response[0].headers['x-message-id'],
      provider: 'sendgrid'
    });

  } catch (error) {
    console.error('❌ Erro SendGrid:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para SMTP customizado
 */
app.post('/api/email/smtp', async (req, res) => {
  try {
    const { to, cc, bcc, subject, html, text, config } = req.body;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true para 465, false para outras portas
      auth: {
        user: config.user,
        pass: config.password
      }
    });

    const info = await transporter.sendMail({
      from: `"ConectCRM" <${config.user}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html
    });

    console.log('✅ E-mail enviado via SMTP:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      provider: 'smtp'
    });

  } catch (error) {
    console.error('❌ Erro SMTP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para testar configuração
 */
app.post('/api/email/test', async (req, res) => {
  try {
    const { provider, config, testEmail } = req.body;

    let result;

    switch (provider) {
      case 'gmail':
        result = await testGmail(config, testEmail);
        break;
      case 'sendgrid':
        result = await testSendGrid(config, testEmail);
        break;
      case 'smtp':
        result = await testSMTP(config, testEmail);
        break;
      default:
        throw new Error('Provedor não suportado');
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Funções de teste
 */
async function testGmail(config, testEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.user,
      pass: config.password
    }
  });

  // Verificar configuração
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"ConectCRM Teste" <${config.user}>`,
    to: testEmail,
    subject: 'Teste ConectCRM - Gmail SMTP',
    html: `
      <h2>✅ Teste de E-mail ConectCRM</h2>
      <p>Se você recebeu este e-mail, sua configuração do Gmail está funcionando!</p>
      <p><strong>Provedor:</strong> Gmail SMTP</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <hr>
      <p><em>Este é um e-mail de teste do sistema ConectCRM.</em></p>
    `
  });

  return {
    success: true,
    messageId: info.messageId,
    provider: 'gmail'
  };
}

async function testSendGrid(config, testEmail) {
  sgMail.setApiKey(config.apiKey);

  const msg = {
    to: testEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'contato@conectcrm.com',
    subject: 'Teste ConectCRM - SendGrid',
    html: `
      <h2>✅ Teste de E-mail ConectCRM</h2>
      <p>Se você recebeu este e-mail, sua configuração do SendGrid está funcionando!</p>
      <p><strong>Provedor:</strong> SendGrid</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <hr>
      <p><em>Este é um e-mail de teste do sistema ConectCRM.</em></p>
    `
  };

  const response = await sgMail.send(msg);

  return {
    success: true,
    messageId: response[0].headers['x-message-id'],
    provider: 'sendgrid'
  };
}

async function testSMTP(config, testEmail) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password
    }
  });

  // Verificar configuração
  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"ConectCRM Teste" <${config.user}>`,
    to: testEmail,
    subject: 'Teste ConectCRM - SMTP',
    html: `
      <h2>✅ Teste de E-mail ConectCRM</h2>
      <p>Se você recebeu este e-mail, sua configuração SMTP está funcionando!</p>
      <p><strong>Provedor:</strong> SMTP (${config.host})</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <hr>
      <p><em>Este é um e-mail de teste do sistema ConectCRM.</em></p>
    `
  });

  return {
    success: true,
    messageId: info.messageId,
    provider: 'smtp'
  };
}

/**
 * Endpoint de status
 */
app.get('/api/email/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    providers: {
      gmail: !!process.env.GMAIL_USER,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      smtp: true
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de E-mail rodando na porta ${PORT}`);
  console.log(`📧 Endpoints disponíveis:`);
  console.log(`   POST /api/email/gmail`);
  console.log(`   POST /api/email/sendgrid`);
  console.log(`   POST /api/email/smtp`);
  console.log(`   POST /api/email/test`);
  console.log(`   GET  /api/email/status`);
});

module.exports = app;
