/**
 * Serviço de Envio de Emails
 * Responsável por enviar propostas, contratos e notificações
 */

export interface EmailTemplate {
  id: string;
  nome: string;
  assunto: string;
  corpo: string;
  variaveis: string[];
}

export interface EmailEnvio {
  para: string[];
  copia?: string[];
  copiaOculta?: string[];
  assunto: string;
  corpo: string;
  anexos?: {
    nome: string;
    tipo: string;
    dados: string; // base64
  }[];
  templateId?: string;
  variaveis?: Record<string, any>;
}

export interface EmailLog {
  id: string;
  para: string[];
  assunto: string;
  status: 'enviado' | 'pendente' | 'erro' | 'lido';
  dataEnvio: Date;
  dataLeitura?: Date;
  erro?: string;
  propostaId?: string;
  contratoId?: string;
}

class EmailService {
  private readonly API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  private readonly baseUrl = `${this.API_URL}/email`;

  // Templates predefinidos
  private templates: EmailTemplate[] = [
    {
      id: 'proposta-envio',
      nome: 'Envio de Proposta',
      assunto: 'Proposta Comercial {{numeroProposta}} - {{nomeEmpresa}}',
      corpo: `
        Prezado(a) {{nomeCliente}},

        Segue em anexo nossa proposta comercial {{numeroProposta}} conforme sua solicitação.

        **Detalhes da Proposta:**
        - Valor Total: {{valorTotal}}
        - Validade: {{validadeDias}} dias
        - Prazo de Entrega: {{prazoEntrega}}

        Para aceitar esta proposta, acesse o link abaixo:
        {{linkAceite}}

        Em caso de dúvidas, entre em contato conosco.

        Atenciosamente,
        {{nomeVendedor}}
        {{emailVendedor}}
        {{telefoneVendedor}}
      `,
      variaveis: ['nomeCliente', 'numeroProposta', 'nomeEmpresa', 'valorTotal', 'validadeDias', 'prazoEntrega', 'linkAceite', 'nomeVendedor', 'emailVendedor', 'telefoneVendedor']
    },
    {
      id: 'proposta-aprovada',
      nome: 'Proposta Aprovada',
      assunto: 'Proposta {{numeroProposta}} Aprovada - Próximos Passos',
      corpo: `
        Prezado(a) {{nomeCliente}},

        Agradecemos por aprovar nossa proposta {{numeroProposta}}!

        **Próximos Passos:**
        1. Geração do contrato (em até 1 dia útil)
        2. Envio para assinatura
        3. Início da execução dos serviços

        Nosso time entrará em contato em breve para dar continuidade ao processo.

        Atenciosamente,
        {{nomeVendedor}}
      `,
      variaveis: ['nomeCliente', 'numeroProposta', 'nomeVendedor']
    },
    {
      id: 'contrato-envio',
      nome: 'Envio de Contrato',
      assunto: 'Contrato {{numeroContrato}} para Assinatura',
      corpo: `
        Prezado(a) {{nomeCliente}},

        Segue em anexo o contrato {{numeroContrato}} para sua assinatura.

        **Instruções:**
        1. Revise todos os termos e condições
        2. Assine eletronicamente através do link: {{linkAssinatura}}
        3. Ou imprima, assine e envie digitalizado

        **Prazo para assinatura:** {{prazoAssinatura}} dias

        Atenciosamente,
        {{nomeVendedor}}
      `,
      variaveis: ['nomeCliente', 'numeroContrato', 'linkAssinatura', 'prazoAssinatura', 'nomeVendedor']
    }
  ];

  async enviarEmail(email: EmailEnvio): Promise<{ id: string; status: string }> {
    try {
      // Simular envio via API
      const response = await fetch(`${this.baseUrl}/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar email');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro no envio de email:', error);
      // Fallback: simular envio local
      return this.simularEnvio(email);
    }
  }

  async enviarProposta(propostaId: string, dadosProposta: any, anexoPdf: string): Promise<void> {
    const template = this.templates.find(t => t.id === 'proposta-envio')!;

    const variaveis = {
      nomeCliente: dadosProposta.cliente.nome,
      numeroProposta: dadosProposta.numeroProposta,
      nomeEmpresa: dadosProposta.empresa.nome,
      valorTotal: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dadosProposta.valorTotal),
      validadeDias: dadosProposta.validadeDias || 30,
      prazoEntrega: dadosProposta.prazoEntrega || '30 dias úteis',
      linkAceite: `${window.location.origin}/proposta/aceite/${propostaId}`,
      nomeVendedor: dadosProposta.vendedor.nome,
      emailVendedor: dadosProposta.vendedor.email,
      telefoneVendedor: dadosProposta.vendedor.telefone || ''
    };

    const email: EmailEnvio = {
      para: [dadosProposta.cliente.email],
      assunto: this.processarTemplate(template.assunto, variaveis),
      corpo: this.processarTemplate(template.corpo, variaveis),
      anexos: [{
        nome: `Proposta_${dadosProposta.numeroProposta}.pdf`,
        tipo: 'application/pdf',
        dados: anexoPdf
      }],
      templateId: template.id,
      variaveis
    };

    await this.enviarEmail(email);

    // Salvar log do envio
    await this.salvarLogEmail({
      id: `email_${Date.now()}`,
      para: email.para,
      assunto: email.assunto,
      status: 'enviado',
      dataEnvio: new Date(),
      propostaId
    });
  }

  async enviarContratoAssinatura(contratoId: string, dadosContrato: any, anexoPdf: string): Promise<void> {
    const template = this.templates.find(t => t.id === 'contrato-envio')!;

    const variaveis = {
      nomeCliente: dadosContrato.cliente.nome,
      numeroContrato: dadosContrato.numeroContrato,
      linkAssinatura: `${window.location.origin}/contrato/assinatura/${contratoId}`,
      prazoAssinatura: 15,
      nomeVendedor: dadosContrato.vendedor.nome
    };

    const email: EmailEnvio = {
      para: [dadosContrato.cliente.email],
      assunto: this.processarTemplate(template.assunto, variaveis),
      corpo: this.processarTemplate(template.corpo, variaveis),
      anexos: [{
        nome: `Contrato_${dadosContrato.numeroContrato}.pdf`,
        tipo: 'application/pdf',
        dados: anexoPdf
      }],
      templateId: template.id,
      variaveis
    };

    await this.enviarEmail(email);

    await this.salvarLogEmail({
      id: `email_${Date.now()}`,
      para: email.para,
      assunto: email.assunto,
      status: 'enviado',
      dataEnvio: new Date(),
      contratoId
    });
  }

  async notificarAprovacaoProposta(propostaId: string, dadosProposta: any): Promise<void> {
    console.log('🔍 INÍCIO: notificarAprovacaoProposta', { propostaId, dadosProposta });
    
    try {
      console.log('📧 Enviando notificação de aprovação via backend integrado...');
      
      // Tentar usar o backend integrado primeiro
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log('🌐 API_URL configurada:', API_URL);
      
      const payload = {
        numero: dadosProposta.numeroProposta || dadosProposta.numero || propostaId,
        titulo: dadosProposta.titulo || `Proposta ${propostaId}`,
        cliente: dadosProposta.cliente?.nome || dadosProposta.cliente || 'Cliente',
        valor: dadosProposta.valor || dadosProposta.valorTotal || 0,
        status: 'aprovada',
        dataAceite: new Date().toISOString()
      };
      
      console.log('📦 Payload a ser enviado:', payload);
      console.log('🎯 URL da requisição:', `${API_URL}/email/notificar-aceite`);
      
      const response = await fetch(`${API_URL}/email/notificar-aceite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email enviado via backend integrado:', result);
        return;
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Backend integrado falhou:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ ERRO DETALHADO na notificação:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // Se for um erro de rede específico, logar mais detalhes
      if (error.message === 'Failed to fetch') {
        console.error('🔥 FAILED TO FETCH DETECTADO:', {
          'API_URL': process.env.REACT_APP_API_URL || 'http://localhost:3001',
          'Browser': navigator.userAgent,
          'Online': navigator.onLine,
          'Location': window.location.href,
          'Timestamp': new Date().toISOString()
        });
      }
      
      console.warn('⚠️ Erro no backend integrado, usando método original:', error);
    }

    // Fallback para método original
    const template = this.templates.find(t => t.id === 'proposta-aprovada')!;

    const variaveis = {
      nomeCliente: dadosProposta.cliente?.nome || dadosProposta.cliente || 'Cliente',
      numeroProposta: dadosProposta.numeroProposta || dadosProposta.numero || propostaId,
      nomeVendedor: dadosProposta.vendedor?.nome || 'Equipe ConectCRM'
    };

    const email: EmailEnvio = {
      para: [dadosProposta.cliente?.email || 'cliente@exemplo.com'],
      copia: [dadosProposta.vendedor?.email || 'vendas@conectcrm.com'],
      assunto: this.processarTemplate(template.assunto, variaveis),
      corpo: this.processarTemplate(template.corpo, variaveis),
      templateId: template.id,
      variaveis
    };

    await this.enviarEmail(email);
  }

  async obterLogsEmail(filtros?: { propostaId?: string; contratoId?: string }): Promise<EmailLog[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.propostaId) params.append('propostaId', filtros.propostaId);
      if (filtros?.contratoId) params.append('contratoId', filtros.contratoId);

      const response = await fetch(`${this.baseUrl}/logs?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar logs de email:', error);
      return [];
    }
  }

  async marcarComoLido(emailId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logs/${emailId}/lido`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Erro ao marcar email como lido:', error);
    }
  }

  private processarTemplate(template: string, variaveis: Record<string, any>): string {
    let resultado = template;

    Object.entries(variaveis).forEach(([chave, valor]) => {
      const regex = new RegExp(`{{${chave}}}`, 'g');
      resultado = resultado.replace(regex, String(valor));
    });

    return resultado;
  }

  private async simularEnvio(email: EmailEnvio): Promise<{ id: string; status: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📧 Email simulado enviado:', {
      para: email.para,
      assunto: email.assunto,
      anexos: email.anexos?.length || 0
    });

    return {
      id: `email_${Date.now()}`,
      status: 'enviado'
    };
  }

  private async salvarLogEmail(log: EmailLog): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log)
      });
    } catch (error) {
      console.error('Erro ao salvar log de email:', error);
      // Salvar no localStorage como fallback
      const logs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
      logs.push(log);
      localStorage.setItem('emailLogs', JSON.stringify(logs));
    }
  }

  getTemplates(): EmailTemplate[] {
    return this.templates;
  }

  async criarTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
    const novoTemplate: EmailTemplate = {
      ...template,
      id: `template_${Date.now()}`
    };

    this.templates.push(novoTemplate);
    return novoTemplate;
  }
}

export const emailService = new EmailService();
