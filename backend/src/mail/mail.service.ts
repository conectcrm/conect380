import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async enviarEmailVerificacao(dados: {
    to: string;
    empresa: string;
    usuario: string;
    url: string;
  }): Promise<void> {
    const { to, empresa, usuario, url } = dados;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ativar Conta - Conect CRM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #159A9C, #0F7B7D); color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            background: #159A9C; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Conect CRM!</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${usuario}</strong>,</p>
            
            <p>Obrigado por escolher o Conect CRM para <strong>${empresa}</strong>!</p>
            
            <p>Para ativar sua conta e começar a usar nosso sistema, clique no botão abaixo:</p>
            
            <div style="text-align: center;">
              <a href="${url}" class="button">Ativar Minha Conta</a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #159A9C;">${url}</p>
            
            <p><strong>⚠️ Este link expira em 24 horas.</strong></p>
            
            <hr style="margin: 30px 0;">
            
            <h3>🚀 O que você pode fazer com o Conect CRM:</h3>
            <ul>
              <li>✅ Gerenciar seus clientes de forma inteligente</li>
              <li>✅ Controlar produtos e estoque</li>
              <li>✅ Acompanhar vendas e comissões</li>
              <li>✅ Dashboard com métricas em tempo real</li>
              <li>✅ Sistema de notificações avançado</li>
            </ul>
            
            <p><strong>Período Trial:</strong> Sua conta inclui 30 dias gratuitos para você testar todas as funcionalidades!</p>
          </div>
          
          <div class="footer">
            <p>Conect CRM - Sistema de Gestão Inteligente</p>
            <p>Precisa de ajuda? <a href="mailto:suporte@conectcrm.com" style="color: #159A9C;">suporte@conectcrm.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Conect CRM" <${process.env.SMTP_USER}>`,
      to,
      subject: `🎉 Ative sua conta no Conect CRM - ${empresa}`,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de verificação enviado para: ${to}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }

  async enviarEmailBoasVindas(dados: {
    to: string;
    empresa: string;
    usuario: string;
    subdominio: string;
  }): Promise<void> {
    const { to, empresa, usuario, subdominio } = dados;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Conta Ativada - Conect CRM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #159A9C, #0F7B7D); color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            background: #159A9C; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
          .info-box { background: #e8f5f5; padding: 20px; border-left: 4px solid #159A9C; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Conta Ativada com Sucesso!</h1>
          </div>
          
          <div class="content">
            <p>Parabéns <strong>${usuario}</strong>!</p>
            
            <p>Sua conta da empresa <strong>${empresa}</strong> foi ativada com sucesso!</p>
            
            <div class="info-box">
              <h3>📋 Informações da sua conta:</h3>
              <ul>
                <li><strong>Empresa:</strong> ${empresa}</li>
                <li><strong>Subdomínio:</strong> ${subdominio}.conectcrm.com</li>
                <li><strong>Status:</strong> Trial (30 dias grátis)</li>
                <li><strong>Acesso:</strong> Administrador</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Acessar o Sistema</a>
            </div>
            
            <h3>🎯 Próximos passos:</h3>
            <ol>
              <li>Faça login no sistema</li>
              <li>Configure o perfil da sua empresa</li>
              <li>Adicione seus primeiros clientes</li>
              <li>Cadastre seus produtos</li>
              <li>Convide outros usuários</li>
            </ol>
            
            <p><strong>💡 Dica:</strong> Acesse nosso centro de ajuda para tutoriais e melhores práticas!</p>
          </div>
          
          <div class="footer">
            <p>Conect CRM - Sistema de Gestão Inteligente</p>
            <p>Precisa de ajuda? <a href="mailto:suporte@conectcrm.com" style="color: #159A9C;">suporte@conectcrm.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Conect CRM" <${process.env.SMTP_USER}>`,
      to,
      subject: `🚀 Bem-vindo ao Conect CRM - ${empresa}`,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de boas-vindas enviado para: ${to}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      throw error;
    }
  }

  async enviarEmailRecuperacaoSenha(dados: {
    to: string;
    usuario: string;
    empresa?: string;
    resetLink: string;
    expiracaoHoras: number;
  }): Promise<void> {
    const { to, usuario, empresa, resetLink, expiracaoHoras } = dados;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recuperar Senha - Conect CRM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #002333; background: #f4f7fb; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px; }
          .card { background: #ffffff; border-radius: 12px; box-shadow: 0 12px 40px rgba(21, 154, 156, 0.12); overflow: hidden; }
          .header { background: linear-gradient(135deg, #159A9C, #0F7B7D); color: white; padding: 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 32px; }
          .content p { margin: 0 0 16px 0; }
          .button {
            display: inline-block;
            background: #159A9C;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            margin: 16px 0;
            font-weight: bold;
          }
          .link { word-break: break-all; color: #159A9C; }
          .footer { padding: 24px 32px 32px 32px; background: #DEEFE7; color: #002333; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Recupere sua senha</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${usuario}</strong>,</p>
              <p>Recebemos um pedido para redefinir a senha da sua conta${empresa ? ` da empresa <strong>${empresa}</strong>` : ''} no <strong>Conect CRM</strong>.</p>
              <p>Para criar uma nova senha, clique no botão abaixo:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Criar nova senha</a>
              </p>
              <p>Se preferir, copie e cole este link no seu navegador:</p>
              <p class="link">${resetLink}</p>
              <p><strong>Importante:</strong> este link expira em ${expiracaoHoras} hora${expiracaoHoras > 1 ? 's' : ''}. Depois desse prazo, você poderá solicitar um novo link.</p>
              <p>Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança. Sua senha atual continuará válida.</p>
            </div>
            <div class="footer">
              <p>Ficou com dúvidas? Fale com nosso time pelo e-mail <a href="mailto:suporte@conectcrm.com">suporte@conectcrm.com</a>.</p>
              <p>Conect CRM • Plataforma inteligente de relacionamento com clientes.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Conect CRM" <${process.env.SMTP_USER}>`,
      to,
      subject: '🔐 Redefinição de senha no Conect CRM',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de recuperação de senha enviado para: ${to}`);
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação de senha:', error);
      throw error;
    }
  }
}
