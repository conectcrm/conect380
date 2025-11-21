import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { RespostaBot, BotOption } from '../types/triagem-bot.types';
import { WhatsAppSenderService } from '../../atendimento/services/whatsapp-sender.service';

/**
 * 📤 Serviço de envio de respostas do bot de triagem
 * Adapta RespostaBot para diferentes canais (WhatsApp, Telegram, etc)
 */
@Injectable()
export class TriagemMessageSenderService {
  private readonly logger = new Logger(TriagemMessageSenderService.name);

  constructor(
    @Inject(forwardRef(() => WhatsAppSenderService))
    private readonly whatsappSender: WhatsAppSenderService,
  ) {}

  /**
   * Envia resposta do bot para o cliente
   */
  async enviarResposta(
    empresaId: string,
    telefone: string,
    resposta: RespostaBot,
    canal: string = 'whatsapp',
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string }> {
    try {
      this.logger.log(`📤 Enviando resposta via ${canal} para ${telefone}`);

      if (canal === 'whatsapp') {
        return await this.enviarViaWhatsApp(empresaId, telefone, resposta);
      }

      // Fallback para outros canais
      this.logger.warn(`⚠️ Canal ${canal} não suportado, usando fallback`);
      return { sucesso: false, erro: `Canal ${canal} não implementado` };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao enviar resposta: ${error.message}`);
      return { sucesso: false, erro: error.message };
    }
  }

  /**
   * Envia resposta via WhatsApp com suporte a botões interativos
   */
  private async enviarViaWhatsApp(
    empresaId: string,
    telefone: string,
    resposta: RespostaBot,
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string }> {
    const { mensagem, opcoes, usarBotoes, tipoBotao } = resposta;

    // Se não há opções, enviar mensagem simples
    if (!opcoes || opcoes.length === 0) {
      this.logger.log('📝 Enviando mensagem de texto simples');
      return await this.whatsappSender.enviarMensagem(empresaId, telefone, mensagem);
    }

    // Decidir tipo de interação baseado na quantidade de opções e configuração
    const usarInterativo = usarBotoes !== false; // Default: true

    if (!usarInterativo) {
      // Fallback: texto numerado
      return await this.enviarFallbackTexto(empresaId, telefone, mensagem, opcoes);
    }

    // Até 3 opções: usar botões interativos
    if (opcoes.length <= 3) {
      this.logger.log('🔘 Usando botões interativos (máx 3 opções)');
      return await this.enviarComBotoes(empresaId, telefone, mensagem, opcoes);
    }

    // 4-10 opções: usar lista interativa
    if (opcoes.length <= 10) {
      this.logger.log('📋 Usando lista interativa (4-10 opções)');
      return await this.enviarComLista(empresaId, telefone, mensagem, opcoes);
    }

    // Mais de 10: fallback texto numerado
    this.logger.warn(
      `⚠️ ${opcoes.length} opções excede limite do WhatsApp (10). Usando fallback texto.`,
    );
    return await this.enviarFallbackTexto(empresaId, telefone, mensagem, opcoes);
  }

  /**
   * Envia mensagem com botões interativos (até 3)
   */
  private async enviarComBotoes(
    empresaId: string,
    telefone: string,
    mensagem: string,
    opcoes: BotOption[],
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string }> {
    const botoes = opcoes.slice(0, 3).map((opcao, index) => ({
      id: opcao.valor || String(index + 1),
      title: this.truncarTexto(opcao.texto, 20), // WhatsApp limita a 20 caracteres
    }));

    return await this.whatsappSender.enviarMensagemComBotoes(empresaId, telefone, mensagem, botoes);
  }

  /**
   * Envia mensagem com lista interativa (até 10)
   */
  private async enviarComLista(
    empresaId: string,
    telefone: string,
    mensagem: string,
    opcoes: BotOption[],
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string }> {
    const itens = opcoes.slice(0, 10).map((opcao, index) => ({
      id: opcao.valor || String(index + 1),
      title: this.truncarTexto(opcao.texto, 24), // Lista permite até 24 caracteres
      description: opcao.descricao ? this.truncarTexto(opcao.descricao, 72) : undefined,
    }));

    return await this.whatsappSender.enviarMensagemComLista(
      empresaId,
      telefone,
      mensagem,
      'Escolha uma opção',
      itens,
    );
  }

  /**
   * Fallback: mensagem com texto numerado
   */
  private async enviarFallbackTexto(
    empresaId: string,
    telefone: string,
    mensagem: string,
    opcoes: BotOption[],
  ): Promise<{ sucesso: boolean; messageId?: string; erro?: string }> {
    const linhasOpcoes = opcoes.map((opcao, index) => {
      const numero = index + 1;
      const emoji = this.obterEmoji(numero);
      return `${emoji} ${numero} - ${opcao.texto}`;
    });

    const mensagemCompleta = `${mensagem}\n\n${linhasOpcoes.join('\n')}\n\n_Digite o número da opção desejada_`;

    return await this.whatsappSender.enviarMensagem(empresaId, telefone, mensagemCompleta);
  }

  /**
   * Trunca texto respeitando limite de caracteres
   */
  private truncarTexto(texto: string, limite: number): string {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite - 3) + '...';
  }

  /**
   * Retorna emoji correspondente ao número
   */
  private obterEmoji(numero: number): string {
    const emojis: Record<number, string> = {
      1: '1️⃣',
      2: '2️⃣',
      3: '3️⃣',
      4: '4️⃣',
      5: '5️⃣',
      6: '6️⃣',
      7: '7️⃣',
      8: '8️⃣',
      9: '9️⃣',
      10: '🔟',
    };
    return emojis[numero] || `${numero}.`;
  }
}
