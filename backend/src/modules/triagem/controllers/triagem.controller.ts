import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Delete,
  Logger,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { Public } from '../../../modules/auth/decorators/public.decorator';
import { TriagemBotService, ResultadoProcessamentoWebhook } from '../services/triagem-bot.service';
import { IniciarTriagemDto, ResponderTriagemDto } from '../dto';
import * as crypto from 'crypto';

@Controller('triagem')
export class TriagemController {
  private readonly logger = new Logger(TriagemController.name);

  constructor(private readonly triagemBotService: TriagemBotService) {}

  /**
   * POST /triagem/iniciar
   * Inicia uma nova sessão de triagem
   */
  @Post('iniciar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async iniciar(@Request() req, @Body() iniciarDto: IniciarTriagemDto) {
    const empresaId = req.user.empresa_id;
    return this.triagemBotService.iniciarTriagem(empresaId, iniciarDto);
  }

  /**
   * POST /triagem/responder
   * Processa resposta do usuário na triagem
   */
  @Post('responder')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async responder(@Request() req, @Body() responderDto: ResponderTriagemDto) {
    const empresaId = req.user.empresa_id;
    return this.triagemBotService.processarResposta(empresaId, responderDto);
  }

  /**
   * GET /triagem/sessao/:telefone
   * Busca sessão ativa por telefone
   */
  @Get('sessao/:telefone')
  @UseGuards(JwtAuthGuard)
  async buscarSessao(@Request() req, @Param('telefone') telefone: string) {
    const empresaId = req.user.empresa_id;
    const sessao = await this.triagemBotService.buscarSessaoAtiva(empresaId, telefone);

    if (!sessao) {
      return {
        ativa: false,
        mensagem: 'Nenhuma sessão ativa encontrada',
      };
    }

    return {
      ativa: true,
      sessao: {
        id: sessao.id,
        etapaAtual: sessao.etapaAtual,
        status: sessao.status,
        iniciadoEm: sessao.iniciadoEm,
      },
    };
  }

  /**
   * DELETE /triagem/sessao/:sessaoId
   * Cancela uma sessão de triagem
   */
  @Delete('sessao/:sessaoId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelarSessao(@Param('sessaoId') sessaoId: string) {
    await this.triagemBotService.cancelarSessao(sessaoId);
  }

  /**
   * POST /triagem/webhook/whatsapp
   * Endpoint para receber mensagens do WhatsApp
   * (Público - sem autenticação JWT)
   *
   * Validação de Segurança:
   * - Verifica assinatura X-Hub-Signature-256 do Meta
   * - Previne ataques de replay/spoofing
   */
  @Public()
  @Post('webhook/whatsapp')
  @HttpCode(HttpStatus.OK)
  async webhookWhatsApp(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<
    ({ success: true } & ResultadoProcessamentoWebhook) | { success: false; message: string }
  > {
    const empresaId = process.env.DEFAULT_EMPRESA_ID || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    try {
      // 1. Validar assinatura do webhook (se configurada)
      const appSecret = process.env.WHATSAPP_APP_SECRET;

      if (appSecret && signature) {
        const isValid = this.validateWebhookSignature(body, signature, appSecret);

        if (!isValid) {
          this.logger.warn(`⚠️ Assinatura inválida do webhook - empresaId: ${empresaId}`);

          // Retornar 200 OK para não causar reenvio do Meta, mas não processar
          return {
            success: true,
            ignorado: true,
            motivo: 'Assinatura inválida - requisição rejeitada',
          } as any;
        }

        this.logger.log('✅ Assinatura do webhook validada com sucesso');
      } else if (!appSecret) {
        this.logger.warn(
          '⚠️ WHATSAPP_APP_SECRET não configurado - webhook sem validação de assinatura!',
        );
      }

      // 2. Processar mensagem normalmente
      const resultado = await this.triagemBotService.processarMensagemWhatsApp(empresaId, body);

      return {
        success: true,
        ...resultado,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar webhook WhatsApp: ${error.message}`, error.stack);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Valida assinatura HMAC SHA-256 do webhook do Meta
   * @param body Payload do webhook
   * @param signature Header X-Hub-Signature-256 (formato: sha256=<hash>)
   * @param appSecret App Secret configurado no Meta Business
   * @returns true se assinatura é válida
   */
  private validateWebhookSignature(body: any, signature: string, appSecret: string): boolean {
    try {
      // 1. Remover prefixo "sha256=" da assinatura
      const receivedHash = signature.replace('sha256=', '');

      // 2. Calcular HMAC SHA-256 do body
      const bodyString = JSON.stringify(body);
      const expectedHash = crypto.createHmac('sha256', appSecret).update(bodyString).digest('hex');

      // 3. Comparar hashes (timing-safe para prevenir ataques de timing)
      return crypto.timingSafeEqual(
        Buffer.from(receivedHash, 'hex'),
        Buffer.from(expectedHash, 'hex'),
      );
    } catch (error) {
      this.logger.error(`Erro ao validar assinatura do webhook: ${error.message}`);
      return false;
    }
  }
}
