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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@Controller('email')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailIntegradoService,
    private readonly portalService: PortalService,
  ) {}

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string' && response.trim()) {
        return response;
      }

      if (response && typeof response === 'object') {
        const responseRecord = response as Record<string, unknown>;
        const responseMessage = responseRecord.message;

        if (Array.isArray(responseMessage)) {
          const joined = responseMessage
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .join('. ');

          if (joined) {
            return joined;
          }
        }

        if (typeof responseMessage === 'string' && responseMessage.trim()) {
          return responseMessage;
        }
      }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) {
        return message;
      }
    }

    return fallbackMessage;
  }

  /**
   * Envia notificacao de proposta aceita
   */
  @Post('notificar-aceite')
  async notificarAceite(@Body() dadosProposta: any) {
    try {
      this.logger.log(
        `[EMAIL] Recebida solicitacao de notificacao de aceite: ${dadosProposta?.numero || '[sem-numero]'}`,
      );

      const sucesso = await this.emailService.notificarPropostaAceita(dadosProposta);

      if (sucesso) {
        return {
          success: true,
          message: 'Notificacao de aceite enviada com sucesso',
          timestamp: new Date().toISOString(),
        };
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao enviar notificacao de aceite',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } catch (error) {
      this.logger.error('[EMAIL] Erro no endpoint de notificacao de aceite', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro interno no envio de email',
          error: this.resolveErrorMessage(error, 'Falha ao enviar notificacao de aceite'),
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
    @EmpresaId() empresaId: string,
    @Body()
    dados: {
      proposta: any;
      emailCliente: string;
      linkPortal: string;
      registrarToken?: boolean;
    },
  ) {
    try {
      this.logger.log(`[EMAIL] Enviando proposta para: ${dados?.emailCliente || '[sem-email]'}`);

      // Se solicitado, registrar o token no portal service.
      if (dados?.registrarToken && dados?.proposta?.token) {
        const token = String(dados.proposta.token);
        const tokenMask = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '[token]';
        this.logger.log(`[EMAIL] Registrando token no portal: ${tokenMask}`);

        await this.portalService.registrarTokenProposta(
          dados.proposta.token,
          dados.proposta.id || dados.proposta.numero,
          empresaId,
        );
      }

      const sucesso = await this.emailService.enviarPropostaPorEmail(
        dados.proposta,
        dados.emailCliente,
        dados.linkPortal,
        dados.proposta.numero || dados.proposta.id, // Passar ID da proposta para sincronizacao automatica
        empresaId,
      );

      if (sucesso) {
        return {
          success: true,
          message: 'Proposta enviada por email com sucesso',
          emailCliente: dados.emailCliente,
          timestamp: new Date().toISOString(),
        };
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao enviar proposta por email',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } catch (error) {
      this.logger.error('[EMAIL] Erro no envio de proposta', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro interno no envio de proposta',
          error: this.resolveErrorMessage(error, 'Falha ao enviar proposta por email'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envia email generico
   */
  @Post('enviar')
  async enviarEmailGenerico(@EmpresaId() empresaId: string, @Body() dados: any) {
    try {
      this.logger.log(
        `[EMAIL] Dados recebidos (resumo): ${JSON.stringify({
          keys: dados ? Object.keys(dados) : [],
          toCount: Array.isArray(dados?.para || dados?.to) ? (dados.para || dados.to).length : 0,
          hasHtml: Boolean(dados?.html || dados?.corpo || dados?.message),
          subject: (dados?.assunto || dados?.subject)
            ? String(dados.assunto || dados.subject).slice(0, 120)
            : null,
        })}`,
      );

      // Suportar tanto formato antigo (para/assunto/corpo) quanto novo (to/subject/message).
      const para = dados.para || dados.to;
      const assunto = dados.assunto || dados.subject;
      const corpo = dados.corpo || dados.message || dados.html || dados.text;

      if (!para || !Array.isArray(para) || para.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Dados invalidos para envio de email',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `[EMAIL] Enviando email generico (resumo): ${JSON.stringify({
          destinatarios: Array.isArray(para) ? para.length : 0,
          primeiroDominio:
            Array.isArray(para) && typeof para[0] === 'string' && para[0].includes('@')
              ? para[0].split('@')[1]
              : null,
        })}`,
      );

      const emailData = {
        to: para[0], // Usar o primeiro destinatario.
        cc: para.slice(1).join(','), // Outros como copia, se houver.
        subject: assunto || 'Email ConectCRM',
        html: corpo || '',
        text: (corpo || '').replace(/<[^>]*>/g, ''), // Remover HTML para versao texto.
      };

      this.logger.log(
        `[EMAIL] Dados preparados (resumo): ${JSON.stringify({
          toDomain:
            typeof emailData?.to === 'string' && emailData.to.includes('@')
              ? emailData.to.split('@')[1]
              : null,
          hasCc: Boolean(emailData?.cc),
          subject: emailData?.subject ? String(emailData.subject).slice(0, 120) : null,
          htmlLength: typeof emailData?.html === 'string' ? emailData.html.length : 0,
          textLength: typeof emailData?.text === 'string' ? emailData.text.length : 0,
        })}`,
      );

      const sucesso = await this.emailService.enviarEmailGenerico(emailData, empresaId);

      if (sucesso) {
        return {
          success: true,
          message: 'Email enviado com sucesso',
          id: `email_${Date.now()}`,
          status: 'enviado',
          timestamp: new Date().toISOString(),
          destinatarios: para,
        };
      }

      throw new HttpException(
        {
          success: false,
          message: 'Falha no envio do email',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } catch (error) {
      this.logger.error('[EMAIL] Erro no envio de email generico', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro no envio de email',
          error: this.resolveErrorMessage(error, 'Falha ao enviar email generico'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Status do servico de email
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
