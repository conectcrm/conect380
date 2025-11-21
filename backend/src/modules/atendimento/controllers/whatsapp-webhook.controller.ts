import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';
import { MensagemService } from '../services/mensagem.service';
import { TicketService } from '../services/ticket.service';
import { StatusTicket } from '../entities/ticket.entity';
import { RemetenteMensagem } from '../entities/mensagem.entity'; // ✨ NOVO: Import do enum

/**
 * 📱 WEBHOOK WHATSAPP BUSINESS API
 *
 * Este controller lida com callbacks da WhatsApp Business API:
 * - Verificação do webhook (GET)
 * - Recebimento de mensagens e status (POST)
 *
 * Documentação oficial:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */
@Controller('api/atendimento/webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly webhookService: WhatsAppWebhookService,
    private readonly senderService: WhatsAppSenderService,
    private readonly mensagemService: MensagemService,
    private readonly ticketService: TicketService,
  ) {}

  /**
   * GET /api/atendimento/webhooks/whatsapp
   *
   * Endpoint de verificação do webhook (Facebook/Meta Verification)
   * Chamado pelo Meta durante a configuração do webhook
   * ⚠️ DEPRECATED: Use /api/atendimento/webhooks/whatsapp/:empresaId
   */
  @Get()
  async verificarWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`📋 Verificação de webhook recebida`);
    this.logger.log(`Mode: ${mode}, Token: ${verifyToken}, Challenge: ${challenge}`);

    try {
      // 1. Validar modo de subscrição
      if (mode !== 'subscribe') {
        this.logger.warn(`❌ Modo inválido: ${mode}`);
        return res.status(HttpStatus.FORBIDDEN).send('Modo inválido');
      }

      // 2. Validar token de verificação (usando empresa padrão UUID)
      const empresaId = process.env.DEFAULT_EMPRESA_ID || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const tokenValido = await this.webhookService.validarTokenVerificacao(empresaId, verifyToken);

      if (!tokenValido) {
        this.logger.warn(`❌ Token de verificação inválido: ${verifyToken}`);
        return res.status(HttpStatus.FORBIDDEN).send('Token inválido');
      }

      // 3. Retornar challenge para confirmar webhook
      this.logger.log(`✅ Webhook verificado com sucesso!`);
      return res.status(HttpStatus.OK).send(challenge);
    } catch (error) {
      this.logger.error(`Erro na verificação do webhook: ${error.message}`, error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Erro interno');
    }
  }

  /**
   * GET /api/atendimento/webhooks/whatsapp/:empresaId
   *
   * Endpoint de verificação do webhook com empresaId específico
   */
  @Get(':empresaId')
  async verificarWebhookEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`📋 Verificação de webhook - Empresa: ${empresaId}`);

    try {
      // 1. Validar modo de subscrição
      if (mode !== 'subscribe') {
        this.logger.warn(`❌ Modo inválido: ${mode}`);
        return res.status(HttpStatus.FORBIDDEN).send('Modo inválido');
      }

      // 2. Validar token de verificação
      const tokenValido = await this.webhookService.validarTokenVerificacao(empresaId, verifyToken);

      if (!tokenValido) {
        this.logger.warn(`❌ Token de verificação inválido para empresa ${empresaId}`);
        return res.status(HttpStatus.FORBIDDEN).send('Token inválido');
      }

      // 3. Retornar challenge para confirmar webhook
      this.logger.log(`✅ Webhook verificado com sucesso - Empresa: ${empresaId}`);
      return res.status(HttpStatus.OK).send(challenge);
    } catch (error) {
      this.logger.error(`Erro na verificação do webhook: ${error.message}`, error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Erro interno');
    }
  }

  /**
   * POST /api/atendimento/webhooks/whatsapp
   *
   * Endpoint para receber eventos do WhatsApp (empresa padrão)
   * ⚠️ DEPRECATED: Use /api/atendimento/webhooks/whatsapp/:empresaId
   * Este endpoint tenta identificar a empresa pelo phone_number_id do payload
   */
  @Post()
  async receberWebhook(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      // Tentar extrair phone_number_id do payload para identificar empresa
      const empresaId: string =
        process.env.DEFAULT_EMPRESA_ID || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      try {
        const phoneNumberId = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
        if (phoneNumberId) {
          this.logger.log(`🔍 Phone Number ID detectado: ${phoneNumberId}`);
          // TODO: Buscar empresaId pelo phoneNumberId no banco
          // Por enquanto, usar o UUID padrão fixo
        }
      } catch (e) {
        this.logger.warn(`⚠️  Não foi possível extrair phone_number_id do payload`);
      }

      this.logger.log(`📩 Webhook recebido - Empresa: ${empresaId}`);
      this.logger.debug(`Payload: ${JSON.stringify(body).substring(0, 200)}...`);

      // Processar webhook de forma assíncrona
      setImmediate(async () => {
        try {
          await this.webhookService.processar(empresaId, body);
        } catch (error) {
          this.logger.error(`Erro ao processar webhook (async): ${error.message}`, error.stack);
        }
      });

      // Retornar 200 OK imediatamente
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Webhook recebido',
      });
    } catch (error) {
      this.logger.error(`Erro ao receber webhook: ${error.message}`, error.stack);

      // Sempre retornar 200 para evitar reenvios do Meta
      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'Erro processado',
      });
    }
  }

  /**
   * POST /webhooks/whatsapp/:empresaId/test
   *
   * Endpoint para testar webhook manualmente (desenvolvimento)
   * ⚠️ DEVE VIR ANTES DE @Post(':empresaId') para evitar conflito de rotas
   */
  @Post(':empresaId/test')
  async testarWebhook(@Param('empresaId') empresaId: string, @Body() body: any) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 [WEBHOOK TEST] Endpoint atingido!');
    console.log(`📋 [WEBHOOK TEST] Empresa ID: ${empresaId}`);
    console.log(`📦 [WEBHOOK TEST] Body: ${JSON.stringify(body, null, 2)}`);
    console.log('═══════════════════════════════════════════════════════════');

    this.logger.log(`🧪 Teste de webhook - Empresa: ${empresaId}`);

    try {
      console.log('🔄 [WEBHOOK TEST] Chamando webhookService.processar...');
      const resultado = await this.webhookService.processar(empresaId, body);
      console.log(`✅ [WEBHOOK TEST] Processamento concluído:`, resultado);

      return {
        success: true,
        message: 'Webhook processado (teste)',
        data: resultado,
      };
    } catch (error) {
      console.error('❌ [WEBHOOK TEST] Erro ao processar:', error);
      this.logger.error(`Erro no teste de webhook: ${error.message}`);

      return {
        success: false,
        message: error.message,
        error: error.stack,
      };
    }
  }

  /**
   * POST /api/atendimento/webhooks/whatsapp/:empresaId
   *
   * Endpoint para receber eventos do WhatsApp (empresa específica)
   */
  @Post(':empresaId')
  async receberWebhookEmpresa(
    @Param('empresaId') empresaId: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // 1. Log do webhook recebido (sem dados sensíveis)
      this.logger.log(`📩 Webhook recebido - Empresa: ${empresaId}`);
      this.logger.debug(`Payload: ${JSON.stringify(body).substring(0, 200)}...`);

      // 2. Validar assinatura (X-Hub-Signature-256)
      const signature = req.headers['x-hub-signature-256'] as string;
      const assinaturaValida = await this.webhookService.validarAssinatura(
        empresaId,
        body,
        signature,
      );

      if (!assinaturaValida) {
        this.logger.warn(`❌ Assinatura inválida - Empresa: ${empresaId}`);
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Assinatura inválida',
        });
      }

      // 3. Processar webhook de forma assíncrona
      // Importante: Responder imediatamente (200 OK) para não causar timeout
      // O Meta espera resposta rápida, processamento pode ser feito depois
      setImmediate(async () => {
        try {
          await this.webhookService.processar(empresaId, body);
        } catch (error) {
          this.logger.error(`Erro ao processar webhook (async): ${error.message}`, error.stack);
        }
      });

      // 4. Retornar 200 OK imediatamente
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Webhook recebido',
      });
    } catch (error) {
      this.logger.error(`Erro ao receber webhook: ${error.message}`, error.stack);

      // Sempre retornar 200 para evitar reenvios do Meta
      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'Erro processado',
      });
    }
  }

  /**
   * POST /api/atendimento/webhooks/whatsapp/:empresaId/enviar
   *
   * 📤 ENDPOINT DE ENVIO DE MENSAGENS
   *
   * Permite que o frontend envie mensagens para clientes via WhatsApp Business API
   *
   * Body:
   * {
   *   "ticketId": "uuid-do-ticket",
   *   "telefone": "5511999999999",
   *   "mensagem": "Olá! Como posso ajudar?"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "messageId": "wamid.xxx",
   *   "mensagemId": "uuid-da-mensagem-no-banco"
   * }
   */
  @Post(':empresaId/enviar')
  async enviarMensagem(
    @Param('empresaId') empresaId: string,
    @Body()
    body: {
      ticketId: string;
      telefone: string;
      mensagem: string;
    },
    @Res() res: Response,
  ) {
    try {
      this.logger.log('📤 Requisição de envio de mensagem recebida');
      this.logger.log(`   Empresa: ${empresaId}`);
      this.logger.log(`   Ticket: ${body.ticketId}`);
      this.logger.log(`   Para: ${body.telefone}`);
      this.logger.log(`   Mensagem: ${body.mensagem.substring(0, 50)}...`);

      // Validações
      if (!body.ticketId || !body.telefone || !body.mensagem) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Campos obrigatórios: ticketId, telefone, mensagem',
        });
      }

      // 1. Verificar se ticket existe
      const ticket = await this.ticketService.buscarPorId(body.ticketId);
      if (!ticket) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Ticket não encontrado',
        });
      }

      // 2. Enviar mensagem via WhatsApp Business API
      const resultadoEnvio = await this.senderService.enviarMensagem(
        empresaId,
        body.telefone,
        body.mensagem,
      );

      if (!resultadoEnvio.sucesso) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Erro ao enviar mensagem via WhatsApp',
          erro: resultadoEnvio.erro,
        });
      }

      this.logger.log(`✅ Mensagem enviada via API: ${resultadoEnvio.messageId}`);

      // 3. Salvar mensagem no banco
      const mensagemSalva = await this.mensagemService.salvar({
        ticketId: body.ticketId,
        tipo: 'TEXTO',
        conteudo: body.mensagem,
        remetente: RemetenteMensagem.ATENDENTE, // ✅ CORRIGIDO: Usando enum ao invés de string
        idExterno: resultadoEnvio.messageId,
      });

      this.logger.log(`💾 Mensagem salva no banco: ${mensagemSalva.id}`);

      // 4. Atualizar timestamp do ticket
      await this.ticketService.atualizarUltimaMensagem(body.ticketId);

      // 5. Atualizar status do ticket para EM_ATENDIMENTO se estiver ABERTO
      if (ticket.status === StatusTicket.ABERTO) {
        await this.ticketService.atualizarStatus(body.ticketId, StatusTicket.EM_ATENDIMENTO);
        this.logger.log(`🔄 Status do ticket atualizado: ABERTO → EM_ATENDIMENTO`);
      }

      this.logger.log('✅ Mensagem enviada e registrada com sucesso!');

      // 6. Retornar sucesso
      return res.status(HttpStatus.OK).json({
        success: true,
        messageId: resultadoEnvio.messageId,
        mensagemId: mensagemSalva.id,
        ticketStatus:
          ticket.status === StatusTicket.ABERTO ? StatusTicket.EM_ATENDIMENTO : ticket.status,
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`, error.stack);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erro interno ao enviar mensagem',
        erro: error.message,
      });
    }
  }
}
