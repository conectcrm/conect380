import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { Canal, TipoCanal } from '../entities/canal.entity';
import { AIResponseService } from './ai-response.service';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { TicketService } from './ticket.service';
import { MensagemService } from './mensagem.service';
import { RemetenteMensagem, TipoMensagem } from '../entities/mensagem.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    @InjectRepository(IntegracoesConfig)
    private integracaoRepo: Repository<IntegracoesConfig>,
    @InjectRepository(Canal)
    private canalRepo: Repository<Canal>,
    private aiService: AIResponseService,
    private senderService: WhatsAppSenderService,
    private ticketService: TicketService,
    private mensagemService: MensagemService,
    private atendimentoGateway: AtendimentoGateway,
  ) { }

  async validarTokenVerificacao(empresaId: string, verifyToken: string): Promise<boolean> {
    try {
      // 1. Tentar validar com token do .env (fallback)
      const tokenEnv = process.env.WHATSAPP_VERIFY_TOKEN || 'conectcrm_webhook_token_123';
      if (verifyToken === tokenEnv) {
        this.logger.log(`✅ Token validado via .env`);
        return true;
      }

      // 2. Tentar buscar do banco de dados
      const integracao = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!integracao) {
        this.logger.warn(`⚠️  Integração não encontrada para empresa ${empresaId}, usando token padrão`);
        return verifyToken === tokenEnv;
      }

      const tokenEsperado = integracao.credenciais?.whatsapp_webhook_verify_token;

      if (!tokenEsperado) {
        this.logger.warn(`⚠️  Token não configurado no banco, usando token padrão`);
        return verifyToken === tokenEnv;
      }

      const valido = verifyToken === tokenEsperado;
      this.logger.log(`${valido ? '✅' : '❌'} Token validado via banco de dados`);
      return valido;

    } catch (error) {
      this.logger.error('Erro ao validar token:', error.message);
      // Em caso de erro, validar pelo .env
      const tokenEnv = process.env.WHATSAPP_VERIFY_TOKEN || 'conectcrm_webhook_token_123';
      return verifyToken === tokenEnv;
    }
  }

  async validarAssinatura(empresaId: string, payload: any, signature: string): Promise<boolean> {
    try {
      if (!signature) return false;

      const integracao = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!integracao) return false;

      const appSecret = integracao.credenciais?.whatsapp_app_secret;
      if (!appSecret) return process.env.NODE_ENV === 'development';

      const payloadString = JSON.stringify(payload);
      const expectedSignature = 'sha256=' + createHmac('sha256', appSecret)
        .update(payloadString)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Erro ao validar assinatura:', error.message);
      return false;
    }
  }

  async processar(empresaId: string, payload: any): Promise<any> {
    try {
      this.logger.log(`📨 Processando webhook - Empresa: ${empresaId}`);
      this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

      // Validar estrutura do payload
      if (!payload.object || payload.object !== 'whatsapp_business_account') {
        this.logger.warn('⚠️  Payload não é do WhatsApp Business');
        return { success: false, message: 'Payload inválido' };
      }

      if (!payload.entry || payload.entry.length === 0) {
        this.logger.warn('⚠️  Nenhuma entrada no payload');
        return { success: false, message: 'Sem entradas' };
      }

      // Processar cada entrada
      for (const entry of payload.entry) {
        if (!entry.changes || entry.changes.length === 0) continue;

        for (const change of entry.changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;

          // Processar mensagens recebidas
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              await this.processarMensagem(empresaId, message, value);
            }
          }

          // Processar status de mensagens enviadas
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await this.processarStatus(empresaId, status);
            }
          }
        }
      }

      return { success: true, message: 'Webhook processado com sucesso' };

    } catch (error) {
      this.logger.error(`❌ Erro ao processar webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Processa mensagem recebida do WhatsApp
   */
  private async processarMensagem(
    empresaId: string,
    message: any,
    value: any,
  ): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 [WEBHOOK DEBUG] Iniciando processarMensagem');
    console.log(`   empresaId: ${empresaId}`);
    console.log(`   message:`, JSON.stringify(message, null, 2));
    console.log(`   value:`, JSON.stringify(value, null, 2));

    try {
      const {
        from, // Número do remetente
        id: messageId, // ID da mensagem
        timestamp, // Timestamp da mensagem
        type, // Tipo: text, image, video, audio, document, etc.
      } = message;

      console.log(`📩 [WEBHOOK DEBUG] Dados extraídos:`);
      console.log(`   from: ${from}`);
      console.log(`   messageId: ${messageId}`);
      console.log(`   type: ${type}`);

      this.logger.log(`📩 Nova mensagem recebida`);
      this.logger.log(`   De: ${from}`);
      this.logger.log(`   ID: ${messageId}`);
      this.logger.log(`   Tipo: ${type}`);

      // Extrair conteúdo baseado no tipo
      let conteudo = '';

      if (type === 'text') {
        conteudo = message.text?.body || '';
      } else if (type === 'image') {
        conteudo = `[Imagem] ${message.image?.caption || ''}`;
      } else if (type === 'video') {
        conteudo = `[Vídeo] ${message.video?.caption || ''}`;
      } else if (type === 'audio') {
        conteudo = '[Áudio]';
      } else if (type === 'document') {
        conteudo = `[Documento] ${message.document?.filename || ''}`;
      } else if (type === 'location') {
        conteudo = `[Localização] ${message.location?.latitude}, ${message.location?.longitude}`;
      } else if (type === 'contacts') {
        conteudo = '[Contato]';
      } else {
        conteudo = `[${type}]`;
      }

      this.logger.log(`   Conteúdo: ${conteudo}`);

      console.log(`📄 [WEBHOOK DEBUG] Conteúdo extraído: "${conteudo}"`);

      // 1. Buscar phone_number_id para encontrar o canal
      const phoneNumberId = value?.metadata?.phone_number_id;

      console.log(`📱 [WEBHOOK DEBUG] phone_number_id: ${phoneNumberId}`);

      if (!phoneNumberId) {
        console.log(`❌ [WEBHOOK DEBUG] Phone Number ID não encontrado - ABORTANDO`);
        console.log('═══════════════════════════════════════════════════════════');
        this.logger.warn(`⚠️  Phone Number ID não encontrado no payload`);
        await this.senderService.marcarComoLida(empresaId, messageId);
        return;
      }

      // 2. Buscar canal pelo phone_number_id
      console.log(`🔍 [WEBHOOK DEBUG] Buscando canal...`);
      const canal = await this.buscarCanalPorPhoneNumberId(empresaId, phoneNumberId);

      console.log(`📋 [WEBHOOK DEBUG] Canal encontrado: ${canal ? JSON.stringify({ id: canal.id, nome: canal.nome, tipo: canal.tipo }) : 'NULL'}`);

      if (!canal) {
        console.log(`❌ [WEBHOOK DEBUG] Canal não encontrado - ABORTANDO`);
        console.log('═══════════════════════════════════════════════════════════');
        this.logger.warn(`⚠️  Canal não encontrado para phone_number_id: ${phoneNumberId}`);
        await this.senderService.marcarComoLida(empresaId, messageId);
        return;
      }

      console.log(`✅ [WEBHOOK DEBUG] Canal OK - prosseguindo...`);
      this.logger.log(`📱 Canal encontrado: ${canal.nome} (${canal.id})`);

      // 3. Buscar ou criar ticket
      const nomeCliente = value?.contacts?.[0]?.profile?.name || from;

      console.log(`🎫 [WEBHOOK DEBUG] Chamando ticketService.buscarOuCriarTicket...`);
      console.log(`   nomeCliente: ${nomeCliente}`);
      console.log(`   assunto: ${conteudo.substring(0, 100)}`);

      const ticket = await this.ticketService.buscarOuCriarTicket({
        empresaId,
        canalId: canal.id,
        clienteNumero: from,
        clienteNome: nomeCliente,
        assunto: conteudo.substring(0, 100) || 'Novo atendimento',
        origem: 'WHATSAPP',
      });

      console.log(`✅ [WEBHOOK DEBUG] Ticket retornado: ${ticket ? JSON.stringify({ id: ticket.id, numero: ticket.numero }) : 'NULL'}`);
      this.logger.log(`🎫 Ticket: ${ticket.id} (Número: ${ticket.numero})`);

      // 4. Salvar mensagem
      console.log(`💾 [WEBHOOK DEBUG] Salvando mensagem no banco...`);
      console.log(`   ticketId: ${ticket.id}`);
      console.log(`   tipo original: ${type}`);
      console.log(`   conteudo: ${conteudo.substring(0, 50)}...`);

      // Mapear tipo do WhatsApp para TipoMensagem
      let tipoMensagem: TipoMensagem = TipoMensagem.TEXTO;
      if (type === 'text') tipoMensagem = TipoMensagem.TEXTO;
      else if (type === 'image') tipoMensagem = TipoMensagem.IMAGEM;
      else if (type === 'audio') tipoMensagem = TipoMensagem.AUDIO;
      else if (type === 'video') tipoMensagem = TipoMensagem.VIDEO;
      else if (type === 'document') tipoMensagem = TipoMensagem.DOCUMENTO;
      else if (type === 'location') tipoMensagem = TipoMensagem.LOCALIZACAO;

      console.log(`   tipo mapeado: ${tipoMensagem}`);

      const mensagem = await this.mensagemService.salvar({
        ticketId: ticket.id,
        tipo: tipoMensagem,
        remetente: RemetenteMensagem.CLIENTE,
        conteudo,
        idExterno: messageId,
        midia: message[type], // Dados originais da mídia (se houver)
      });

      console.log(`✅ [WEBHOOK DEBUG] Mensagem salva: ${mensagem ? mensagem.id : 'NULL'}`);
      this.logger.log(`💾 Mensagem salva: ${mensagem.id}`);

      // 5. Atualizar última mensagem do ticket
      console.log(`🔄 [WEBHOOK DEBUG] Atualizando última mensagem do ticket...`);
      await this.ticketService.atualizarUltimaMensagem(ticket.id);

      // 6. Notificar atendentes via WebSocket
      console.log(`📢 [WEBHOOK DEBUG] Notificando via WebSocket...`);
      console.log(`   mensagem.id: ${mensagem.id}`);

      this.atendimentoGateway.notificarNovaMensagem(mensagem);

      console.log(`✅ [WEBHOOK DEBUG] WebSocket notificado com sucesso`);
      console.log('═══════════════════════════════════════════════════════════');

      this.logger.log(`🔔 Notificação enviada via WebSocket`);

      // 7. Marcar mensagem como lida
      await this.senderService.marcarComoLida(empresaId, messageId);

      // 8. Verificar se deve acionar IA para resposta automática
      const deveUsarIA = await this.aiService.deveAcionarIA(empresaId);

      if (deveUsarIA && type === 'text' && conteudo) {
        this.logger.log(`🤖 Acionando IA para resposta automática`);

        try {
          // Gerar resposta com IA
          const { resposta, provedor } = await this.aiService.gerarResposta(
            empresaId,
            conteudo,
            {
              nomeCliente,
              empresaNome: 'ConectCRM',
            },
          );

          this.logger.log(`✅ Resposta gerada pela IA (${provedor})`);
          this.logger.log(`   Resposta: ${resposta.substring(0, 100)}...`);

          // Enviar resposta automática
          const resultadoEnvio = await this.senderService.enviarMensagem(
            empresaId,
            from,
            resposta,
          );

          if (resultadoEnvio.sucesso) {
            this.logger.log(`✅ Resposta automática enviada!`);

            // Salvar resposta da IA no banco
            await this.mensagemService.salvar({
              ticketId: ticket.id,
              tipo: TipoMensagem.TEXTO,
              remetente: RemetenteMensagem.BOT as string,
              conteudo: resposta,
              idExterno: resultadoEnvio.messageId,
            });

            this.logger.log(`💾 Resposta IA salva no banco`);
          } else {
            this.logger.error(`❌ Falha ao enviar resposta: ${resultadoEnvio.erro}`);
          }

        } catch (errorIA) {
          this.logger.error(`❌ Erro ao processar IA: ${errorIA.message}`);
          // Enviar mensagem padrão em caso de erro
          await this.senderService.enviarMensagem(
            empresaId,
            from,
            'Olá! Recebemos sua mensagem e responderemos em breve. Obrigado!',
          );
        }
      } else {
        this.logger.log(`ℹ️  IA não configurada ou desabilitada, mensagem apenas registrada`);
      }

      // Log de sucesso
      this.logger.log(`✅ Mensagem processada: ${messageId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao processar mensagem: ${error.message}`, error.stack);
    }
  }

  /**
   * Processa status de mensagem enviada (entregue, lida, etc.)
   */
  private async processarStatus(empresaId: string, status: any): Promise<void> {
    try {
      const {
        id: messageId,
        status: statusType, // sent, delivered, read, failed
        timestamp,
        recipient_id,
      } = status;

      this.logger.log(`📬 Status de mensagem atualizado`);
      this.logger.log(`   ID: ${messageId}`);
      this.logger.log(`   Status: ${statusType}`);
      this.logger.log(`   Para: ${recipient_id}`);

      // TODO: Atualizar status da mensagem no banco de dados
      // TODO: Notificar via WebSocket sobre atualização de status

      this.logger.log(`✅ Status processado: ${messageId} -> ${statusType}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao processar status: ${error.message}`, error.stack);
    }
  }

  /**
   * Busca canal pelo phone_number_id do WhatsApp
   */
  private async buscarCanalPorPhoneNumberId(empresaId: string, phoneNumberId: string): Promise<Canal | null> {
    try {
      // Buscar canal onde a configuração contenha o phone_number_id
      const canais = await this.canalRepo.find({
        where: { empresaId, tipo: TipoCanal.WHATSAPP, ativo: true },
      });

      for (const canal of canais) {
        const phoneId = canal.configuracao?.credenciais?.whatsapp_phone_number_id;
        if (phoneId === phoneNumberId) {
          return canal;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar canal: ${error.message}`);
      return null;
    }
  }

  /**
   * Mapeia tipo de mensagem do WhatsApp para o enum do sistema
   */
  private mapearTipoMensagem(tipo: string): string {
    const mapa: Record<string, string> = {
      text: TipoMensagem.TEXTO,
      image: TipoMensagem.IMAGEM,
      audio: TipoMensagem.AUDIO,
      video: TipoMensagem.VIDEO,
      document: TipoMensagem.DOCUMENTO,
      location: TipoMensagem.LOCALIZACAO,
    };

    return mapa[tipo] || TipoMensagem.TEXTO;
  }

  /**
   * Extrai informações de mídia da mensagem
   */
  private extrairMidia(message: any, tipo: string): any {
    if (tipo === 'text') return null;

    const midia: any = {};

    if (tipo === 'image' && message.image) {
      midia.id = message.image.id;
      midia.mime_type = message.image.mime_type;
      midia.caption = message.image.caption;
      midia.sha256 = message.image.sha256;
    } else if (tipo === 'video' && message.video) {
      midia.id = message.video.id;
      midia.mime_type = message.video.mime_type;
      midia.caption = message.video.caption;
      midia.sha256 = message.video.sha256;
    } else if (tipo === 'audio' && message.audio) {
      midia.id = message.audio.id;
      midia.mime_type = message.audio.mime_type;
      midia.sha256 = message.audio.sha256;
    } else if (tipo === 'document' && message.document) {
      midia.id = message.document.id;
      midia.mime_type = message.document.mime_type;
      midia.filename = message.document.filename;
      midia.caption = message.document.caption;
      midia.sha256 = message.document.sha256;
    } else if (tipo === 'location' && message.location) {
      midia.latitude = message.location.latitude;
      midia.longitude = message.location.longitude;
      midia.name = message.location.name;
      midia.address = message.location.address;
    }

    return Object.keys(midia).length > 0 ? midia : null;
  }
}

