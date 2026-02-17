import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Public } from '../../../modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { IniciarTriagemDto, ResponderTriagemDto } from '../dto';
import { ResultadoProcessamentoWebhook, TriagemBotService } from '../services/triagem-bot.service';

@Controller('triagem')
export class TriagemController {
  private readonly logger = new Logger(TriagemController.name);

  constructor(private readonly triagemBotService: TriagemBotService) {}

  @Post('iniciar')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  @HttpCode(HttpStatus.OK)
  async iniciar(@EmpresaId() empresaId: string, @Body() iniciarDto: IniciarTriagemDto) {
    return this.triagemBotService.iniciarTriagem(empresaId, iniciarDto);
  }

  @Post('responder')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  @HttpCode(HttpStatus.OK)
  async responder(@EmpresaId() empresaId: string, @Body() responderDto: ResponderTriagemDto) {
    return this.triagemBotService.processarResposta(empresaId, responderDto);
  }

  @Get('sessao/:telefone')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  async buscarSessao(@EmpresaId() empresaId: string, @Param('telefone') telefone: string) {
    const sessao = await this.triagemBotService.buscarSessaoAtiva(empresaId, telefone);

    if (!sessao) {
      return {
        ativa: false,
        mensagem: 'Nenhuma sessao ativa encontrada',
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

  @Delete('sessao/:sessaoId')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelarSessao(@EmpresaId() empresaId: string, @Param('sessaoId') sessaoId: string) {
    await this.triagemBotService.cancelarSessao(empresaId, sessaoId);
  }

  @Public()
  @Post('webhook/whatsapp')
  @HttpCode(HttpStatus.OK)
  async webhookWhatsApp(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<
    ({ success: true } & ResultadoProcessamentoWebhook) | { success: false; message: string }
  > {
    const empresaId = process.env.DEFAULT_EMPRESA_ID;
    if (!empresaId) {
      this.logger.error('DEFAULT_EMPRESA_ID nao configurado para webhook de triagem');
      return {
        success: false,
        message: 'Empresa padrao nao configurada',
      };
    }

    try {
      const appSecret = process.env.WHATSAPP_APP_SECRET;

      if (appSecret && signature) {
        const isValid = this.validateWebhookSignature(body, signature, appSecret);

        if (!isValid) {
          this.logger.warn(`Assinatura invalida do webhook - empresaId: ${empresaId}`);
          return {
            success: true,
            ignorado: true,
            motivo: 'Assinatura invalida - requisicao rejeitada',
          } as any;
        }

        this.logger.log('Assinatura do webhook validada com sucesso');
      } else if (!appSecret) {
        this.logger.warn('WHATSAPP_APP_SECRET nao configurado - webhook sem validacao de assinatura');
      }

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

  private validateWebhookSignature(body: any, signature: string, appSecret: string): boolean {
    try {
      const receivedHash = signature.replace('sha256=', '');
      const bodyString = JSON.stringify(body);
      const expectedHash = crypto.createHmac('sha256', appSecret).update(bodyString).digest('hex');

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
