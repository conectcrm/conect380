import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { EmailIntegradoService } from './email-integrado.service';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';

@Controller('email')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailIntegradoService,
    private readonly portalService: PortalService,
  ) {}

  /**
   * Envia notificação de proposta aceita
   */
  @Post('notificar-aceite')
  async notificarAceite(@Body() dadosProposta: any) {
    try {
      this.logger.log('[EMAIL] Recebida solicitacao de notificacao de aceite:', dadosProposta.numero);

      const sucesso = await this.emailService.notificarPropostaAceita(dadosProposta);

      if (sucesso) {
        return {
          success: true,
          message: 'Notificação de aceite enviada com sucesso',
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: 'Erro ao enviar notificação de aceite',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      this.logger.error('[EMAIL] Erro no endpoint de notificacao:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro interno no envio de email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envia proposta por email para cliente
   */
  @Post('enviar-proposta')
  async enviarProposta(
    @Body()
    dados: {
      proposta: any;
      emailCliente: string;
      linkPortal: string;
      registrarToken?: boolean;
    },
  ) {
    try {
      this.logger.log('[EMAIL] Enviando proposta para:', dados.emailCliente);

      // Se solicitado, registrar o token no portal service
      if (dados.registrarToken && dados.proposta.token) {
        this.logger.log('[EMAIL] Registrando token no sistema de portal:', dados.proposta.token);
        await this.portalService.registrarTokenProposta(
          dados.proposta.token,
          dados.proposta.numero || dados.proposta.id,
        );
      }

      const sucesso = await this.emailService.enviarPropostaPorEmail(
        dados.proposta,
        dados.emailCliente,
        dados.linkPortal,
        dados.proposta.numero || dados.proposta.id, // Passar ID da proposta para sincronização automática
      );

      if (sucesso) {
        return {
          success: true,
          message: 'Proposta enviada por email com sucesso',
          emailCliente: dados.emailCliente,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: 'Erro ao enviar proposta por email',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      this.logger.error('[EMAIL] Erro no envio de proposta:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro interno no envio de proposta',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envia email genérico (agora com envio real)
   */
  @Post('enviar')
  async enviarEmailGenerico(@Body() dados: any) {
    try {
      this.logger.log('[EMAIL] Dados completos recebidos:', JSON.stringify(dados, null, 2));

      // CORRECAO: Suportar tanto formato antigo (para/assunto/corpo) quanto novo (to/subject/message)
      const para = dados.para || dados.to;
      const assunto = dados.assunto || dados.subject;
      const corpo = dados.corpo || dados.message || dados.html || dados.text;

      // VALIDACAO: Verificar se dados necessarios estao presentes
      if (!para || !Array.isArray(para) || para.length === 0) {
        throw new Error(`Dados inválidos: para=${para}, tipo=${typeof para}`);
      }

      this.logger.log('[EMAIL] Enviando email generico para:', para);

      // CORRECAO: Usar o EmailIntegradoService real para envio
      const emailData = {
        to: para[0], // Usar o primeiro destinatário
        cc: para.slice(1).join(','), // Outros como cópia se houver
        subject: assunto || 'Email ConectCRM',
        html: corpo || '',
        text: (corpo || '').replace(/<[^>]*>/g, ''), // Remover HTML para versão texto
      };

      this.logger.log('[EMAIL] Dados preparados para envio:', JSON.stringify(emailData, null, 2));

      // Usar o serviço real de email
      const sucesso = await this.emailService.enviarEmailGenerico(emailData);

      if (sucesso) {
        return {
          success: true,
          message: 'Email enviado com sucesso',
          id: `email_${Date.now()}`,
          status: 'enviado',
          timestamp: new Date().toISOString(),
          destinatarios: para,
        };
      } else {
        throw new Error('Falha no envio do email');
      }
    } catch (error) {
      this.logger.error('[EMAIL] Erro no envio de email generico:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro no envio de email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Status do serviço de email
   */
  @Get('status')
  async statusEmail() {
    return {
      service: 'Email Integrado',
      status: 'ativo',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /email/notificar-aceite',
        'POST /email/enviar-proposta',
        'GET /email/status',
      ],
    };
  }
}
