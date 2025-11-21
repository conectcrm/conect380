import { Injectable } from '@nestjs/common';

/**
 * 🎭 Mocks de Serviços Externos para Testes E2E
 * 
 * Evita chamadas reais a APIs externas durante testes:
 * - WhatsApp API
 * - OpenAI
 * - Anthropic
 * - SendGrid
 * - Twilio
 */

/**
 * 📱 Mock do WhatsApp Service
 */
@Injectable()
export class MockWhatsAppService {
  async enviarMensagem(telefone: string, mensagem: string): Promise<any> {
    return {
      id: `mock-msg-${Date.now()}`,
      status: 'sent',
      timestamp: new Date(),
      to: telefone,
      body: mensagem,
    };
  }

  async enviarMensagemComBotoes(telefone: string, corpo: string, botoes: any[]): Promise<any> {
    return {
      id: `mock-interactive-${Date.now()}`,
      status: 'sent',
      timestamp: new Date(),
      to: telefone,
      interactive: { type: 'button', body: corpo, action: { buttons: botoes } },
    };
  }

  async enviarMidia(telefone: string, tipo: string, url: string, caption?: string): Promise<any> {
    return {
      id: `mock-media-${Date.now()}`,
      status: 'sent',
      timestamp: new Date(),
      to: telefone,
      type: tipo,
      url,
      caption,
    };
  }

  async verificarStatus(messageId: string): Promise<string> {
    return 'delivered';
  }
}

/**
 * 🤖 Mock do OpenAI Service
 */
@Injectable()
export class MockOpenAIService {
  async gerarResposta(prompt: string, context?: any): Promise<string> {
    return `Mock OpenAI response para: ${prompt.substring(0, 50)}...`;
  }

  async analisarIntencao(mensagem: string): Promise<{ intencao: string; confianca: number }> {
    return {
      intencao: 'suporte_tecnico',
      confianca: 0.95,
    };
  }

  async extrairEntidades(texto: string): Promise<any[]> {
    return [
      { tipo: 'produto', valor: 'Teste Product', confianca: 0.9 },
      { tipo: 'problema', valor: 'Erro de conexão', confianca: 0.85 },
    ];
  }
}

/**
 * 🧠 Mock do Anthropic Service (Claude)
 */
@Injectable()
export class MockAnthropicService {
  async gerarResposta(prompt: string, context?: any): Promise<string> {
    return `Mock Anthropic (Claude) response para: ${prompt.substring(0, 50)}...`;
  }

  async analisarSentimento(texto: string): Promise<{ sentimento: string; score: number }> {
    return {
      sentimento: 'neutro',
      score: 0.5,
    };
  }
}

/**
 * 📧 Mock do SendGrid Service
 */
@Injectable()
export class MockSendGridService {
  async enviarEmail(to: string, subject: string, html: string): Promise<any> {
    return {
      id: `mock-email-${Date.now()}`,
      status: 'sent',
      to,
      subject,
    };
  }

  async enviarEmailTemplate(to: string, templateId: string, data: any): Promise<any> {
    return {
      id: `mock-email-tpl-${Date.now()}`,
      status: 'sent',
      to,
      templateId,
    };
  }
}

/**
 * 📞 Mock do Twilio Service
 */
@Injectable()
export class MockTwilioService {
  async enviarSMS(telefone: string, mensagem: string): Promise<any> {
    return {
      sid: `mock-sms-${Date.now()}`,
      status: 'sent',
      to: telefone,
      body: mensagem,
    };
  }

  async fazerLigacao(telefone: string, urlAudio: string): Promise<any> {
    return {
      sid: `mock-call-${Date.now()}`,
      status: 'initiated',
      to: telefone,
    };
  }
}

/**
 * 🎯 Provider configuration para testes E2E
 * 
 * Usar nos módulos de teste:
 * ```typescript
 * providers: [
 *   ...getMockProviders(),
 *   // ... outros providers
 * ]
 * ```
 */
export function getMockProviders() {
  return [
    {
      provide: 'WhatsAppService',
      useClass: MockWhatsAppService,
    },
    {
      provide: 'OpenAIService',
      useClass: MockOpenAIService,
    },
    {
      provide: 'AnthropicService',
      useClass: MockAnthropicService,
    },
    {
      provide: 'SendGridService',
      useClass: MockSendGridService,
    },
    {
      provide: 'TwilioService',
      useClass: MockTwilioService,
    },
  ];
}
