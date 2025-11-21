import { Injectable, Logger } from '@nestjs/common';
import { IAService, ContextoConversa } from '../ia/ia.service';
import { ConfigService } from '@nestjs/config';

export interface MensagemParaIA {
  ticketId: string;
  clienteNome?: string;
  empresaNome?: string;
  conteudo: string;
  historicoMensagens?: Array<{
    direcao: 'enviada' | 'recebida';
    conteudo: string;
    criadoEm: Date;
  }>;
}

@Injectable()
export class IAAutoRespostaService {
  private readonly logger = new Logger(IAAutoRespostaService.name);
  private readonly isEnabled: boolean;
  private readonly minConfianca: number;

  constructor(
    private readonly iaService: IAService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<string>('IA_AUTO_RESPOSTA_ENABLED', 'true') === 'true';
    this.minConfianca = parseFloat(this.configService.get<string>('IA_MIN_CONFIANCA', '0.6'));

    this.logger.log(
      `Auto-resposta IA: ${this.isEnabled ? 'Habilitada' : 'Desabilitada'} (confiança mínima: ${this.minConfianca})`,
    );
  }

  /**
   * Processa mensagem e gera resposta automática se apropriado
   */
  async processarMensagem(mensagem: MensagemParaIA): Promise<{
    deveResponder: boolean;
    resposta?: string;
    confianca?: number;
    requerAtendimentoHumano?: boolean;
    metadata?: any;
  }> {
    if (!this.isEnabled) {
      this.logger.debug('Auto-resposta desabilitada');
      return { deveResponder: false };
    }

    try {
      // Preparar contexto para IA
      const contexto = this.prepararContexto(mensagem);

      // Gerar resposta
      const iaResponse = await this.iaService.gerarResposta(contexto);

      this.logger.log(
        `Resposta IA gerada para ticket ${mensagem.ticketId}: confiança=${iaResponse.confianca.toFixed(2)}, requerHumano=${iaResponse.requerAtendimentoHumano}`,
      );

      // Decidir se deve responder automaticamente
      const deveResponder = this.deveResponderAutomaticamente(iaResponse);

      return {
        deveResponder,
        resposta: iaResponse.resposta,
        confianca: iaResponse.confianca,
        requerAtendimentoHumano: iaResponse.requerAtendimentoHumano,
        metadata: iaResponse.metadata,
      };
    } catch (error) {
      this.logger.error('Erro ao processar mensagem para IA:', error);
      return { deveResponder: false };
    }
  }

  /**
   * Prepara contexto de conversa para IA
   */
  private prepararContexto(mensagem: MensagemParaIA): ContextoConversa {
    const historico: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // Adicionar histórico de mensagens
    if (mensagem.historicoMensagens && mensagem.historicoMensagens.length > 0) {
      for (const msg of mensagem.historicoMensagens) {
        historico.push({
          role: msg.direcao === 'recebida' ? 'user' : 'assistant',
          content: msg.conteudo,
        });
      }
    }

    // Adicionar mensagem atual
    historico.push({
      role: 'user',
      content: mensagem.conteudo,
    });

    return {
      ticketId: mensagem.ticketId,
      clienteNome: mensagem.clienteNome,
      empresaNome: mensagem.empresaNome,
      historico,
    };
  }

  /**
   * Decide se deve responder automaticamente baseado em regras
   */
  private deveResponderAutomaticamente(iaResponse: any): boolean {
    // Regra 1: Se requer atendimento humano, não responder automaticamente
    if (iaResponse.requerAtendimentoHumano) {
      this.logger.debug('Não responder: requer atendimento humano');
      return false;
    }

    // Regra 2: Se confiança está abaixo do mínimo, não responder
    if (iaResponse.confianca < this.minConfianca) {
      this.logger.debug(
        `Não responder: confiança ${iaResponse.confianca.toFixed(2)} < mínimo ${this.minConfianca}`,
      );
      return false;
    }

    // Regra 3: Se resposta está vazia, não responder
    if (!iaResponse.resposta || iaResponse.resposta.trim().length < 10) {
      this.logger.debug('Não responder: resposta vazia ou muito curta');
      return false;
    }

    return true;
  }

  /**
   * Retorna estatísticas do serviço
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      minConfianca: this.minConfianca,
      iaStats: this.iaService.getStats(),
    };
  }
}
