import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { IntegracoesConfig } from '../entities/integracoes-config.entity';
import { Canal, TipoCanal, StatusCanal } from '../entities/canal.entity';
import { AIResponseService } from './ai-response.service';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { TicketService } from './ticket.service';
import { MensagemService } from './mensagem.service';
import { RemetenteMensagem, TipoMensagem } from '../entities/mensagem.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { TriagemBotService } from '../../triagem/services/triagem-bot.service';
import { WhatsAppInteractiveService } from './whatsapp-interactive.service';

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
    private interactiveService: WhatsAppInteractiveService,
    private ticketService: TicketService,
    private mensagemService: MensagemService,
    private atendimentoGateway: AtendimentoGateway,
    @Inject(forwardRef(() => TriagemBotService))
    private triagemBotService: TriagemBotService,
  ) {}

  private maskPhone(phone?: string): string {
    if (!phone) return '[telefone]';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '[telefone]';
    const suffix = digits.slice(-4);
    return `${'*'.repeat(Math.max(digits.length - 4, 4))}${suffix}`;
  }

  private summarizeText(text?: string, max: number = 60): string {
    if (!text) return '[vazio]';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '[vazio]';
    return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
  }

  private summarizeWebhookPayload(payload: any): Record<string, unknown> {
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    return {
      object: payload?.object || null,
      entryCount: Array.isArray(payload?.entry) ? payload.entry.length : 0,
      messages: Array.isArray(value?.messages) ? value.messages.length : 0,
      statuses: Array.isArray(value?.statuses) ? value.statuses.length : 0,
    };
  }

  async validarTokenVerificacao(empresaId: string, verifyToken: string): Promise<boolean> {
    try {
      // 1. Tentar validar com token do .env (fallback)
      const tokenEnv = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
      if (verifyToken === tokenEnv) {
        this.logger.log(`âœ… Token validado via .env`);
        return true;
      }

      // 2. Tentar buscar do banco de dados
      const integracao = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!integracao) {
        this.logger.warn(
          `âš ï¸  IntegraÃ§Ã£o nÃ£o encontrada para empresa ${empresaId}, usando token padrÃ£o`,
        );
        return verifyToken === tokenEnv;
      }

      const tokenEsperado = integracao.credenciais?.whatsapp_webhook_verify_token;

      if (!tokenEsperado) {
        this.logger.warn(`âš ï¸  Token nÃ£o configurado no banco, usando token padrÃ£o`);
        return verifyToken === tokenEnv;
      }

      const valido = verifyToken === tokenEsperado;
      this.logger.log(`${valido ? 'âœ…' : 'âŒ'} Token validado via banco de dados`);
      return valido;
    } catch (error) {
      this.logger.error('Erro ao validar token:', error.message);
      // Em caso de erro, validar pelo .env
      const tokenEnv = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
      return verifyToken === tokenEnv;
    }
  }

  async validarAssinatura(
    empresaId: string,
    payload: any,
    signature: string,
    rawBody?: Buffer,
  ): Promise<boolean> {
    try {
      if (!signature) return false;

      const integracao = await this.integracaoRepo.findOne({
        where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
      });

      if (!integracao) return false;

      const appSecret = integracao.credenciais?.whatsapp_app_secret;
      if (!appSecret) return process.env.NODE_ENV === 'development';

      const payloadBuffer = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(JSON.stringify(payload));
      const expectedSignature =
        'sha256=' + createHmac('sha256', appSecret).update(payloadBuffer).digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Erro ao validar assinatura:', error.message);
      return false;
    }
  }

  async processar(empresaId: string, payload: any): Promise<any> {
    try {
      this.logger.log(`ðŸ“¨ Processando webhook - Empresa: ${empresaId}`);
      this.logger.debug(`Payload resumo: ${JSON.stringify(this.summarizeWebhookPayload(payload))}`);

      // Validar estrutura do payload
      if (!payload.object || payload.object !== 'whatsapp_business_account') {
        this.logger.warn('âš ï¸  Payload nÃ£o Ã© do WhatsApp Business');
        return { success: false, message: 'Payload invÃ¡lido' };
      }

      if (!payload.entry || payload.entry.length === 0) {
        this.logger.warn('âš ï¸  Nenhuma entrada no payload');
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
      this.logger.error(`âŒ Erro ao processar webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  async receberEntradaWebhook(input: {
    empresaIdHint: string;
    payload: any;
    signature: string;
    rawBody?: Buffer;
  }): Promise<{ success: boolean; empresaId: string; message?: string }> {
    const empresaId = input.empresaIdHint;
    const assinaturaValida = await this.validarAssinatura(
      empresaId,
      input.payload,
      input.signature,
      input.rawBody,
    );

    if (!assinaturaValida) {
      return {
        success: false,
        empresaId,
        message: 'Assinatura invalida',
      };
    }

    await this.processar(empresaId, input.payload);

    return {
      success: true,
      empresaId,
    };
  }

  /**
   * Processa mensagem recebida do WhatsApp
   */
  private async processarMensagem(empresaId: string, message: any, value: any): Promise<void> {

    this.logger.debug(`Webhook mensagem recebida empresa=${empresaId} resumo=${JSON.stringify({ tipo: message?.type || null, messageId: message?.id || null, hasText: Boolean(message?.text?.body), phoneNumberId: value?.metadata?.phone_number_id || null })}`);
    try {
      const {
        from, // NÃºmero do remetente
        id: messageId, // ID da mensagem
        timestamp, // Timestamp da mensagem
        type, // Tipo: text, image, video, audio, document, etc.
      } = message;


      this.logger.log(`ðŸ“© Nova mensagem recebida`);
      this.logger.log(`   De: ${this.maskPhone(from)}`);
      this.logger.log(`   ID: ${messageId}`);
      this.logger.log(`   Tipo: ${type}`);

      // Extrair conteÃºdo baseado no tipo
      let conteudo = '';

      if (type === 'text') {
        conteudo = message.text?.body || '';
      } else if (type === 'interactive') {
        // âœ¨ Processar resposta de botÃ£o interativo
        const interactive = message.interactive;
        if (interactive?.type === 'button_reply') {
          // Resposta de Reply Button
          conteudo = interactive.button_reply?.id || interactive.button_reply?.title || '';
          this.logger.log(`Resposta de bot?o: ${this.summarizeText(conteudo, 40)}`);
        } else if (interactive?.type === 'list_reply') {
          // Resposta de List Message
          conteudo = interactive.list_reply?.id || interactive.list_reply?.title || '';
          this.logger.log(`Resposta de lista: ${this.summarizeText(conteudo, 40)}`);
        }
      } else if (type === 'image') {
        conteudo = `[Imagem] ${message.image?.caption || ''}`;
      } else if (type === 'video') {
        conteudo = `[VÃ­deo] ${message.video?.caption || ''}`;
      } else if (type === 'audio') {
        // âœ¨ Ãudio: sem texto, apenas player visual
        conteudo = '';
      } else if (type === 'document') {
        conteudo = `[Documento] ${message.document?.filename || ''}`;
      } else if (type === 'location') {
        conteudo = `[LocalizaÃ§Ã£o] ${message.location?.latitude}, ${message.location?.longitude}`;
      } else if (type === 'contacts') {
        conteudo = '[Contato]';
      } else {
        conteudo = `[${type}]`;
      }

      this.logger.log(`   Conte?do: ${this.summarizeText(conteudo, 80)}`);


      // 1. Buscar phone_number_id para encontrar o canal
      const phoneNumberId = value?.metadata?.phone_number_id;


      if (!phoneNumberId) {
        this.logger.debug(`âŒ [WEBHOOK DEBUG] Phone Number ID nÃ£o encontrado - ABORTANDO`);
        this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        this.logger.warn(`âš ï¸  Phone Number ID nÃ£o encontrado no payload`);
        await this.senderService.marcarComoLida(empresaId, messageId);
        return;
      }

      // 2. Buscar canal pelo phone_number_id
      this.logger.debug(`ðŸ” [WEBHOOK DEBUG] Buscando canal...`);
      const canal = await this.buscarCanalPorPhoneNumberId(empresaId, phoneNumberId);

      this.logger.debug(
        `ðŸ“‹ [WEBHOOK DEBUG] Canal encontrado: ${canal ? JSON.stringify({ id: canal.id, nome: canal.nome, tipo: canal.tipo }) : 'NULL'}`,
      );

      if (!canal) {
        this.logger.debug(`âŒ [WEBHOOK DEBUG] Canal nÃ£o encontrado - ABORTANDO`);
        this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        this.logger.warn(`âš ï¸  Canal nÃ£o encontrado para phone_number_id: ${phoneNumberId}`);
        await this.senderService.marcarComoLida(empresaId, messageId);
        return;
      }

      this.logger.debug(`âœ… [WEBHOOK DEBUG] Canal OK - prosseguindo...`);
      this.logger.log(`ðŸ“± Canal encontrado: ${canal.nome} (${canal.id})`);

      // 3. Antes de qualquer aÃ§Ã£o, verificar se Ã© resposta de CSAT
      const resultadoCsat = await this.ticketService.registrarRespostaCsat({
        empresaId,
        telefone: from,
        mensagem: conteudo,
      });

      if (resultadoCsat.registrado) {
        this.logger.log(
          `â­ Resposta CSAT registrada (nota ${resultadoCsat.nota}) para contato ${from}`,
        );

        await this.senderService.marcarComoLida(empresaId, messageId);

        try {
          await this.senderService.enviarMensagem(
            empresaId,
            from,
            'Muito obrigado pela sua avaliaÃ§Ã£o! Sua opiniÃ£o Ã© essencial para continuarmos melhorando. ðŸ˜Š',
          );
        } catch (erroAgradecimento) {
          this.logger.warn(
            `âš ï¸ Falha ao enviar agradecimento do CSAT: ${erroAgradecimento.message}`,
          );
        }

        this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        return;
      }

      // 4. Enviar para triagem bot antes de seguir com atendimento humano
      this.logger.debug(
        `Contacts resumo: ${JSON.stringify({
          total: Array.isArray(value?.contacts) ? value.contacts.length : 0,
          hasProfileName: Boolean(value?.contacts?.[0]?.profile?.name),
          hasProfilePhoto: Boolean(
            value?.contacts?.[0]?.profile?.photo_url ||
              value?.contacts?.[0]?.profile?.photo ||
              value?.contacts?.[0]?.profile?.profile_pic_url ||
              value?.contacts?.[0]?.profile?.profile_pic,
          ),
        })}`,
      );

      const contatoProfile = value?.contacts?.[0]?.profile || {};
      const nomeCliente = contatoProfile?.name || from;
      const fotoCliente =
        contatoProfile?.photo_url ||
        contatoProfile?.photo ||
        contatoProfile?.profile_pic_url ||
        contatoProfile?.profile_pic ||
        contatoProfile?.profilePicUrl ||
        contatoProfile?.profilePic ||
        null;

      this.logger.debug(
        `Identificacao cliente (resumo): ${JSON.stringify({
          nomeFromProfile: this.summarizeText(value?.contacts?.[0]?.profile?.name, 30),
          fallbackTelefone: this.maskPhone(from),
          nomeFinal: this.summarizeText(nomeCliente, 30),
          hasFotoPayload: Boolean(fotoCliente),
        })}`,
      );

      // ðŸ†• Se nÃ£o houver foto no payload, tentar buscar na API do WhatsApp
      let fotoFinal = fotoCliente;
      if (!fotoCliente) {
        this.logger.debug(`ðŸ” [WEBHOOK DEBUG] Foto nÃ£o veio no payload - buscando na API...`);
        try {
          fotoFinal = await this.senderService.buscarFotoPerfilContato(empresaId, from);
          this.logger.debug(`Foto obtida da API: ${fotoFinal ? '[disponivel]' : '[nao encontrada]'}`);
        } catch (error) {
          this.logger.debug(`âš ï¸ [WEBHOOK DEBUG] Erro ao buscar foto: ${error.message}`);
        }
      }

      let triagemTicketId: string = null;
      let triagemProcessada = false;

      try {
        const triagemPayload = {
          from,
          body: conteudo,
          name: nomeCliente,
          messageId,
          canalId: canal.id, // UUID do canal, nÃ£o phone_number_id
        };

        const resultadoTriagem = await this.triagemBotService.processarMensagemWhatsApp(
          empresaId,
          triagemPayload,
        );

        this.logger.debug(
          `Resultado triagem (resumo): ${JSON.stringify({
            ignorado: Boolean(resultadoTriagem?.ignorado),
            temResposta: Boolean(resultadoTriagem?.resposta),
            finalizado: Boolean(resultadoTriagem?.resposta?.finalizado),
            ticketId: resultadoTriagem?.resposta?.ticketId || null,
            usarBotoes: Boolean(resultadoTriagem?.resposta?.usarBotoes),
            tipoBotao: resultadoTriagem?.resposta?.tipoBotao || null,
            opcoes: Array.isArray(resultadoTriagem?.resposta?.opcoes) ? resultadoTriagem.resposta.opcoes.length : 0,
          })}`,
        );

        if (resultadoTriagem?.ignorado) {
          this.logger.debug('ðŸ¤– TriagemBot ignorou mensagem, seguindo com atendimento padrÃ£o.');
        }

        if (resultadoTriagem?.resposta) {
          triagemProcessada = true;
          const resposta = resultadoTriagem.resposta;
          triagemTicketId = resposta.ticketId || null;

          this.logger.debug(
            `Resposta triagem resumo: ${JSON.stringify({
              finalizado: Boolean(resposta.finalizado),
              ticketId: resposta.ticketId || null,
              usarBotoes: Boolean(resposta.usarBotoes),
              tipoBotao: resposta.tipoBotao || null,
              opcoes: Array.isArray(resposta.opcoes) ? resposta.opcoes.length : 0,
              mensagemPreview: this.summarizeText(resposta.mensagem, 80),
            })}`,
          );
          this.logger.debug(
            `ðŸ” [DEBUG] usarBotoes: ${resposta.usarBotoes}, tipoBotao: ${resposta.tipoBotao}, opcoes: ${resposta.opcoes?.length || 0}`,
          );

          if (resposta.mensagem && resposta.mensagem.trim().length > 0) {
            try {
              // âœ¨ Enviar com botÃµes interativos se disponÃ­vel
              if (resposta.usarBotoes && resposta.opcoes && resposta.opcoes.length > 0) {
                this.logger.debug(`âœ… [DEBUG] CondiÃ§Ã£o de botÃµes ATIVADA! Tipo: ${resposta.tipoBotao}`);

                if (resposta.tipoBotao === 'reply' && resposta.opcoes.length <= 3) {
                  // Reply Buttons (atÃ© 3)
                  const botoes = resposta.opcoes.map((op) => ({
                    id: op.valor,
                    titulo: op.texto,
                  }));

                  this.logger.debug(
                    `Enviando Reply Buttons (resumo): ${JSON.stringify({
                      total: botoes.length,
                      titulos: botoes.map((b) => this.summarizeText(b.titulo, 20)),
                    })}`,
                  );

                  const resultadoEnvio = await this.interactiveService.enviarMensagemComBotoes(
                    empresaId,
                    from,
                    resposta.mensagem,
                    botoes,
                  );

                  if (resultadoEnvio?.sucesso) {
                    this.logger.log('ðŸ”˜ Resposta com botÃµes interativos enviada.');
                  } else {
                    this.logger.warn(
                      'âš ï¸ Falha ao enviar botÃµes interativos. Utilizando fallback em texto.',
                    );
                    const mensagemFallback = this.montarMensagemFallbackTriagem(resposta);
                    await this.senderService.enviarMensagem(empresaId, from, mensagemFallback);
                    this.logger.log('ðŸ’¬ Resposta de texto enviada apÃ³s fallback.');
                  }
                } else if (resposta.tipoBotao === 'list' && resposta.opcoes.length <= 10) {
                  // List Message (atÃ© 10)
                  const opcoes = resposta.opcoes.map((op) => ({
                    id: op.valor,
                    titulo: op.texto,
                    descricao: op.descricao,
                  }));

                  this.logger.debug(
                    `Enviando List Message (resumo): ${JSON.stringify({
                      total: opcoes.length,
                      titulos: opcoes.map((o) => this.summarizeText(o.titulo, 20)),
                    })}`,
                  );

                  const resultadoEnvio = await this.interactiveService.enviarMensagemComLista(
                    empresaId,
                    from,
                    resposta.mensagem,
                    'Escolha uma opÃ§Ã£o',
                    opcoes,
                  );

                  if (resultadoEnvio?.sucesso) {
                    this.logger.log('ðŸ“‹ Resposta com lista interativa enviada.');
                  } else {
                    this.logger.warn(
                      'âš ï¸ Falha ao enviar lista interativa. Utilizando fallback em texto.',
                    );
                    const mensagemFallback = this.montarMensagemFallbackTriagem(resposta);
                    await this.senderService.enviarMensagem(empresaId, from, mensagemFallback);
                    this.logger.log('ðŸ’¬ Resposta de texto enviada apÃ³s fallback.');
                  }
                } else {
                  // Fallback para mensagem de texto
                  this.logger.debug(
                    `âš ï¸ [DEBUG] Fallback para texto (tipoBotao: ${resposta.tipoBotao}, opcoes: ${resposta.opcoes.length})`,
                  );
                  await this.senderService.enviarMensagem(empresaId, from, resposta.mensagem);
                  this.logger.log('ðŸ’¬ Resposta de texto enviada (fallback).');
                }
              } else {
                // Mensagem de texto simples
                this.logger.debug(
                  `â„¹ï¸ [DEBUG] Enviando texto simples (usarBotoes: ${resposta.usarBotoes}, opcoes: ${resposta.opcoes?.length || 0})`,
                );
                await this.senderService.enviarMensagem(empresaId, from, resposta.mensagem);
                this.logger.log('ðŸ¤– Resposta automÃ¡tica da triagem enviada.');
              }
            } catch (erroEnvio) {
              this.logger.error(`âŒ Falha ao enviar resposta da triagem: ${erroEnvio.message}`);
              this.logger.error(`âŒ [DEBUG] Stack:`, erroEnvio.stack);
            }
          }

          if (!resposta.finalizado) {
            this.logger.log(
              'ðŸ•‘ Triagem em andamento - atendimento humano aguardarÃ¡ nova interaÃ§Ã£o.',
            );
            await this.senderService.marcarComoLida(empresaId, messageId);
            this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            return;
          }

          if (resposta.finalizado && !triagemTicketId) {
            this.logger.log(
              'âœ… Triagem finalizada sem ticket - nenhuma aÃ§Ã£o adicional necessÃ¡ria.',
            );
            await this.senderService.marcarComoLida(empresaId, messageId);
            this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            return;
          }
        }
      } catch (erroTriagem) {
        this.logger.warn(`âš ï¸ Falha ao processar triagem: ${erroTriagem.message}`);
      }

      if (triagemProcessada && !triagemTicketId) {
        this.logger.log('ðŸ¤– Triagem tratou a interaÃ§Ã£o sem gerar ticket.');
        await this.senderService.marcarComoLida(empresaId, messageId);
        this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        return;
      }

      this.logger.debug(`ðŸŽ« [WEBHOOK DEBUG] Chamando ticketService.buscarOuCriarTicket...`);

      let ticket;
      if (triagemTicketId) {
        try {
          ticket = await this.ticketService.buscarPorId(triagemTicketId, empresaId);
          this.logger.debug(
            `âœ… [WEBHOOK DEBUG] Ticket recuperado da triagem: ${JSON.stringify({ id: ticket.id, numero: ticket.numero })}`,
          );
        } catch (erroBusca) {
          this.logger.error(
            `âŒ Falha ao recuperar ticket da triagem (${triagemTicketId}): ${erroBusca.message}`,
          );
        }
      }

      if (!ticket) {
        const ticketCriado = await this.ticketService.buscarOuCriarTicket({
          empresaId,
          canalId: canal.id,
          clienteNumero: from,
          clienteNome: nomeCliente,
          clienteFoto: fotoFinal || undefined,
          assunto: conteudo.substring(0, 100) || 'Novo atendimento',
          origem: 'WHATSAPP',
        });

        // âœ… CORREÃ‡ÃƒO: Verificar se Ã© um ticket realmente NOVO (recÃ©m-criado)
        const ehTicketNovo =
          ticketCriado && new Date().getTime() - new Date(ticketCriado.createdAt).getTime() < 5000;

        if (ehTicketNovo) {
          this.logger.log(`ðŸ†• Ticket NOVO criado! Notificando via WebSocket...`);
          // Notificar atendentes sobre novo ticket
          this.atendimentoGateway.notificarNovoTicket(ticketCriado);
        }

        ticket = ticketCriado;
      }

      this.logger.debug(
        `âœ… [WEBHOOK DEBUG] Ticket retornado: ${ticket ? JSON.stringify({ id: ticket.id, numero: ticket.numero }) : 'NULL'}`,
      );
      this.logger.log(`ðŸŽ« Ticket: ${ticket.id} (NÃºmero: ${ticket.numero})`);

      // 5. Salvar mensagem
      this.logger.debug(`ðŸ’¾ [WEBHOOK DEBUG] Salvando mensagem no banco...`);
      this.logger.debug(`   ticketId: ${ticket.id}`);
      this.logger.debug(`   tipo original: ${type}`);

      // Mapear tipo do WhatsApp para TipoMensagem
      let tipoMensagem: TipoMensagem = TipoMensagem.TEXTO;
      if (type === 'text') tipoMensagem = TipoMensagem.TEXTO;
      else if (type === 'image') tipoMensagem = TipoMensagem.IMAGEM;
      else if (type === 'audio') tipoMensagem = TipoMensagem.AUDIO;
      else if (type === 'video') tipoMensagem = TipoMensagem.VIDEO;
      else if (type === 'document') tipoMensagem = TipoMensagem.DOCUMENTO;
      else if (type === 'location') tipoMensagem = TipoMensagem.LOCALIZACAO;

      this.logger.debug(`   tipo mapeado: ${tipoMensagem}`);

      const mensagem = await this.mensagemService.salvar({
        ticketId: ticket.id,
        tipo: tipoMensagem,
        remetente: RemetenteMensagem.CLIENTE,
        conteudo,
        idExterno: messageId,
        midia: message[type], // Dados originais da mÃ­dia (se houver)
      }, empresaId);

      this.logger.debug(`âœ… [WEBHOOK DEBUG] Mensagem salva: ${mensagem ? mensagem.id : 'NULL'}`);
      this.logger.log(`ðŸ’¾ Mensagem salva: ${mensagem.id}`);

      // 6. Atualizar Ãºltima mensagem do ticket
      this.logger.debug(`ðŸ”„ [WEBHOOK DEBUG] Atualizando Ãºltima mensagem do ticket...`);
      await this.ticketService.atualizarUltimaMensagem(ticket.id);

      // 7. Notificar atendentes via WebSocket
      this.logger.debug(`ðŸ“¢ [WEBHOOK DEBUG] Notificando via WebSocket...`);
      this.logger.debug(`   mensagem.id: ${mensagem.id}`);

      // ðŸ”§ Transformar mensagem para formato esperado pelo frontend
      const mensagemFormatada: any = this.mensagemService.formatarMensagemParaFrontend(mensagem, {
        fotoContato: ticket.contatoFoto || fotoFinal || null,
        atendenteId: ticket.atendenteId || null,
      });

      mensagemFormatada.criadoEm = mensagem.createdAt;
      mensagemFormatada.status = mensagemFormatada.status || 'lido';

      if (mensagemFormatada.audio) {
        this.logger.debug(
          `Audio final (resumo): ${JSON.stringify({
            hasUrl: Boolean(mensagemFormatada.audio.url),
            hasDownloadUrl: Boolean(mensagemFormatada.audio.downloadUrl),
            duracao: mensagemFormatada.audio.duracao ?? null,
            nome: this.summarizeText(mensagemFormatada.audio.nome, 30),
          })}`,
        );
      } else if (mensagemFormatada.anexos?.length) {
        this.logger.debug(
          `Anexos finais (resumo): ${JSON.stringify(
            mensagemFormatada.anexos.map((anexo: any) => ({
              nome: this.summarizeText(anexo.nome, 30),
              tipo: anexo.tipo,
              hasUrl: Boolean(anexo.url),
              hasDownloadUrl: Boolean(anexo.downloadUrl),
            })),
          )}`,
        );
      }

      this.atendimentoGateway.notificarNovaMensagem(mensagemFormatada);

      this.logger.debug(`âœ… [WEBHOOK DEBUG] WebSocket notificado com sucesso`);
      this.logger.debug('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

      this.logger.log(`ðŸ”” NotificaÃ§Ã£o enviada via WebSocket`);

      // 8. Marcar mensagem como lida
      await this.senderService.marcarComoLida(empresaId, messageId);

      // 9. Verificar se deve acionar IA para resposta automÃ¡tica
      const deveUsarIA = await this.aiService.deveAcionarIA(empresaId);

      if (deveUsarIA && type === 'text' && conteudo) {
        this.logger.log(`ðŸ¤– Acionando IA para resposta automÃ¡tica`);

        try {
          // Gerar resposta com IA
          const { resposta, provedor } = await this.aiService.gerarResposta(empresaId, conteudo, {
            nomeCliente,
            empresaNome: 'ConectCRM',
          });

          this.logger.log(`âœ… Resposta gerada pela IA (${provedor})`);
          this.logger.log(`   Resposta: ${this.summarizeText(resposta, 100)}`);

          // Enviar resposta automÃ¡tica
          const resultadoEnvio = await this.senderService.enviarMensagem(empresaId, from, resposta);

          if (resultadoEnvio.sucesso) {
            this.logger.log(`âœ… Resposta automÃ¡tica enviada!`);

            // Salvar resposta da IA no banco
            await this.mensagemService.salvar({
              ticketId: ticket.id,
              tipo: TipoMensagem.TEXTO,
              remetente: RemetenteMensagem.BOT as string,
              conteudo: resposta,
              idExterno: resultadoEnvio.messageId,
            }, empresaId);

            this.logger.log(`ðŸ’¾ Resposta IA salva no banco`);
          } else {
            this.logger.error(`âŒ Falha ao enviar resposta: ${resultadoEnvio.erro}`);
          }
        } catch (errorIA) {
          this.logger.error(`âŒ Erro ao processar IA: ${errorIA.message}`);
          // Enviar mensagem padrÃ£o em caso de erro
          await this.senderService.enviarMensagem(
            empresaId,
            from,
            'OlÃ¡! Recebemos sua mensagem e responderemos em breve. Obrigado!',
          );
        }
      } else {
        this.logger.log(`â„¹ï¸  IA nÃ£o configurada ou desabilitada, mensagem apenas registrada`);
      }

      // Log de sucesso
      this.logger.log(`âœ… Mensagem processada: ${messageId}`);
    } catch (error) {
      this.logger.error(`âŒ Erro ao processar mensagem: ${error.message}`, error.stack);
    }
  }

  private montarMensagemFallbackTriagem(resposta: {
    mensagem?: string;
    opcoes?: Array<{ texto: string; descricao?: string }>;
  }): string {
    const mensagemBase = resposta?.mensagem ? String(resposta.mensagem).trim() : '';
    const opcoes = Array.isArray(resposta?.opcoes) ? resposta.opcoes : [];

    if (opcoes.length === 0) {
      return mensagemBase.length > 0
        ? mensagemBase
        : 'Por favor, escolha uma das opÃ§Ãµes disponÃ­veis.';
    }

    const linhasOpcoes = opcoes.map((opcao, index) => {
      const titulo = opcao?.texto ? String(opcao.texto).trim() : `OpÃ§Ã£o ${index + 1}`;
      const descricao = opcao?.descricao ? ` - ${String(opcao.descricao).trim()}` : '';
      return `${index + 1}. ${titulo}${descricao}`;
    });

    const corpoOpcoes = linhasOpcoes.join('\n');
    const mensagemOrientacao = '\n\nEnvie o nÃºmero da opÃ§Ã£o desejada ou digite SAIR para cancelar.';

    if (mensagemBase.length === 0) {
      return `${corpoOpcoes}${mensagemOrientacao}`;
    }

    return `${mensagemBase}\n\n${corpoOpcoes}${mensagemOrientacao}`;
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

      this.logger.log(`ðŸ“¬ Status de mensagem atualizado`);
      this.logger.log(`   ID: ${messageId}`);
      this.logger.log(`   Status: ${statusType}`);
      this.logger.log(`   Para: ${this.maskPhone(recipient_id)}`);

      // TODO: Atualizar status da mensagem no banco de dados
      // TODO: Notificar via WebSocket sobre atualizaÃ§Ã£o de status

      this.logger.log(`âœ… Status processado: ${messageId} -> ${statusType}`);
    } catch (error) {
      this.logger.error(`âŒ Erro ao processar status: ${error.message}`, error.stack);
    }
  }

  /**
   * Busca canal pelo phone_number_id do WhatsApp
   */
  private async buscarCanalPorPhoneNumberId(
    empresaId: string,
    phoneNumberId: string,
  ): Promise<Canal | null> {
    try {
      const phoneIdNormalizado = (phoneNumberId || '').trim();
      if (!phoneIdNormalizado) {
        return null;
      }

      // Buscar canal onde a configuraÃ§Ã£o contenha o phone_number_id
      const canais = await this.canalRepo.find({
        where: { empresaId, tipo: TipoCanal.WHATSAPP },
      });

      for (const canal of canais) {
        const configuracao = canal.configuracao || {};
        const credenciais = (configuracao as any)?.credenciais || {};
        const phoneId = String(credenciais.whatsapp_phone_number_id || '').trim();
        const phoneIdAlternativo = String(
          (configuracao as any)?.whatsapp_phone_number_id ||
            (configuracao as any)?.phone_number_id ||
            '',
        ).trim();

        const canalAtivo = Boolean(canal.ativo) || canal.status === StatusCanal.ATIVO;
        const matchPhoneId =
          (phoneId && phoneId === phoneIdNormalizado) ||
          (phoneIdAlternativo && phoneIdAlternativo === phoneIdNormalizado);

        if (canalAtivo && matchPhoneId) {
          return canal;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`âŒ Erro ao buscar canal: ${error.message}`);
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
   * Extrai informaÃ§Ãµes de mÃ­dia da mensagem
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


