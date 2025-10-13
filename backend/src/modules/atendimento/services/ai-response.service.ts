import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';

/**
 * 🤖 SERVIÇO DE RESPOSTAS AUTOMÁTICAS COM IA
 * 
 * Este serviço integra com OpenAI (GPT) ou Anthropic (Claude)
 * para gerar respostas automáticas inteligentes
 */
@Injectable()
export class AIResponseService {
  private readonly logger = new Logger(AIResponseService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private integracaoRepo: Repository<IntegracoesConfig>,
  ) { }

  /**
   * Gera resposta automática usando IA
   */
  async gerarResposta(
    empresaId: string,
    mensagemCliente: string,
    contexto?: {
      nomeCliente?: string;
      historico?: string[];
      empresaNome?: string;
    },
  ): Promise<{ resposta: string; provedor: string }> {
    try {
      this.logger.log(`🤖 Gerando resposta com IA para empresa ${empresaId}`);

      // Buscar configuração de IA
      const configOpenAI = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'openai', ativo: true },
      });

      const configAnthropic = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'anthropic', ativo: true },
      });

      // Decidir qual IA usar (prioridade: OpenAI > Anthropic)
      if (configOpenAI && configOpenAI.credenciais?.openai_api_key) {
        return await this.gerarRespostaOpenAI(
          configOpenAI.credenciais,
          mensagemCliente,
          contexto,
        );
      } else if (configAnthropic && configAnthropic.credenciais?.anthropic_api_key) {
        return await this.gerarRespostaAnthropic(
          configAnthropic.credenciais,
          mensagemCliente,
          contexto,
        );
      } else {
        this.logger.warn('⚠️  Nenhuma IA configurada, usando resposta padrão');
        return {
          resposta: 'Olá! Obrigado por entrar em contato. Um de nossos atendentes responderá em breve.',
          provedor: 'default',
        };
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar resposta com IA: ${error.message}`, error.stack);
      // Resposta de fallback em caso de erro
      return {
        resposta: 'Olá! Recebemos sua mensagem e responderemos em breve.',
        provedor: 'fallback',
      };
    }
  }

  /**
   * Gera resposta usando OpenAI (GPT)
   */
  private async gerarRespostaOpenAI(
    credenciais: any,
    mensagem: string,
    contexto?: any,
  ): Promise<{ resposta: string; provedor: string }> {
    try {
      const apiKey = credenciais.openai_api_key;
      const modelo = credenciais.openai_model || 'gpt-4o-mini';

      this.logger.log(`🔵 Usando OpenAI (${modelo})`);

      // Construir prompt do sistema
      const systemPrompt = this.construirPromptSistema(contexto);

      // Construir histórico de conversação
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mensagem },
      ];

      // Chamar API OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: modelo,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const resposta = response.data.choices[0].message.content.trim();

      this.logger.log(`✅ Resposta gerada com sucesso (${resposta.length} caracteres)`);

      return {
        resposta,
        provedor: 'openai',
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao chamar OpenAI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera resposta usando Anthropic (Claude)
   */
  private async gerarRespostaAnthropic(
    credenciais: any,
    mensagem: string,
    contexto?: any,
  ): Promise<{ resposta: string; provedor: string }> {
    try {
      const apiKey = credenciais.anthropic_api_key;
      const modelo = credenciais.anthropic_model || 'claude-3-5-sonnet-20241022';

      this.logger.log(`🟣 Usando Anthropic (${modelo})`);

      // Construir prompt do sistema
      const systemPrompt = this.construirPromptSistema(contexto);

      // Chamar API Anthropic
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: modelo,
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            { role: 'user', content: mensagem },
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const resposta = response.data.content[0].text.trim();

      this.logger.log(`✅ Resposta gerada com sucesso (${resposta.length} caracteres)`);

      return {
        resposta,
        provedor: 'anthropic',
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao chamar Anthropic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Constrói prompt do sistema com contexto
   */
  private construirPromptSistema(contexto?: any): string {
    const empresaNome = contexto?.empresaNome || 'ConectCRM';
    const nomeCliente = contexto?.nomeCliente || 'Cliente';

    return `Você é um assistente de atendimento inteligente da ${empresaNome}.

Seu objetivo é fornecer respostas úteis, profissionais e amigáveis aos clientes.

DIRETRIZES:
- Seja educado e profissional
- Responda de forma clara e objetiva
- Se não souber a resposta, ofereça transferir para um atendente humano
- Mantenha respostas concisas (máximo 3 parágrafos)
- Use emojis ocasionalmente para tornar a conversa mais amigável
- Identifique a intenção do cliente e ofereça soluções

CONTEXTO DO ATENDIMENTO:
- Cliente: ${nomeCliente}
- Empresa: ${empresaNome}
- Canal: WhatsApp

RESPOSTAS PROIBIDAS:
- Nunca invente informações
- Nunca prometa coisas que não pode cumprir
- Nunca seja rude ou desrespeitoso

Responda sempre em português do Brasil.`;
  }

  /**
   * Verifica se deve acionar IA automaticamente
   */
  async deveAcionarIA(empresaId: string): Promise<boolean> {
    try {
      // Verificar se há IA configurada e ativa
      const configOpenAI = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'openai', ativo: true },
      });

      const configAnthropic = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'anthropic', ativo: true },
      });

      // Verificar se resposta automática está habilitada
      const respostaAutomatica = configOpenAI?.credenciais?.auto_responder ||
        configAnthropic?.credenciais?.auto_responder ||
        false;

      return (configOpenAI || configAnthropic) && respostaAutomatica;

    } catch (error) {
      this.logger.error(`Erro ao verificar IA: ${error.message}`);
      return false;
    }
  }
}
