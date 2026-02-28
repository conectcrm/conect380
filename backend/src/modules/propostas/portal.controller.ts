import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PortalService } from './portal.service';

@Controller('api/portal')
export class PortalController {
  private readonly logger = new Logger(PortalController.name);

  constructor(private readonly portalService: PortalService) {}

  private maskToken(token?: string): string {
    if (!token) return '[token]';
    return token.length <= 8 ? `${token.slice(0, 2)}***` : `${token.slice(0, 4)}...${token.slice(-4)}`;
  }

  private resolvePortalErrorStatus(error: unknown): HttpStatus {
    const message = String((error as any)?.message || '').toLowerCase();
    if (
      message.includes('transicao de status invalida') ||
      message.includes('exige aprovacao interna')
    ) {
      return HttpStatus.BAD_REQUEST;
    }
    if (
      message.includes('token invalido') ||
      message.includes('token inválido') ||
      message.includes('token expirado') ||
      message.includes('expirado') ||
      message.includes('proposta nao encontrada') ||
      message.includes('proposta não encontrada')
    ) {
      return HttpStatus.NOT_FOUND;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  @Put('proposta/:token/status')
  async atualizarStatusPorToken(
    @Param('token') token: string,
    @Body()
    updateData: {
      status: string;
      timestamp?: string;
      ip?: string;
      userAgent?: string;
    },
  ) {
    try {
      this.logger.log(
        `Portal: Atualizando status via token ${this.maskToken(token)} para: ${updateData.status}`,
      );

      const resultado = await this.portalService.atualizarStatusPorToken(token, updateData.status, {
        timestamp: updateData.timestamp,
        ip: updateData.ip,
        userAgent: updateData.userAgent,
      });

      return {
        success: true,
        message: 'Status atualizado via portal',
        proposta: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Portal: Erro ao atualizar status', error);
      const statusCode = this.resolvePortalErrorStatus(error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status via portal',
          error: error.message,
        },
        statusCode,
      );
    }
  }

  @Get('proposta/:token')
  async obterPropostaPorToken(@Param('token') token: string) {
    try {
      const proposta = await this.portalService.obterPropostaPorToken(token);

      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Token invalido ou proposta nao encontrada',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        proposta,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const statusCode = this.resolvePortalErrorStatus(error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar proposta via portal',
          error: error.message,
        },
        statusCode,
      );
    }
  }

  @Put('proposta/:token/view')
  async registrarVisualizacao(
    @Param('token') token: string,
    @Body()
    viewData: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    },
  ) {
    try {
      await this.portalService.registrarVisualizacao(token, viewData);

      return {
        success: true,
        message: 'Visualizacao registrada',
      };
    } catch (error) {
      this.logger.error('Portal: Erro ao registrar visualizacao', error);
      return {
        success: false,
        message: 'Erro ao registrar visualizacao',
        error: error.message,
      };
    }
  }

  @Post('proposta/:token/acao')
  async registrarAcao(
    @Param('token') token: string,
    @Body()
    acaoData: {
      acao: string;
      timestamp?: string;
      ip?: string;
      userAgent?: string;
      dados?: any;
    },
  ) {
    try {
      this.logger.log(
        `Portal: Registrando acao "${acaoData.acao}" para token ${this.maskToken(token)}`,
      );

      const resultado = await this.portalService.registrarAcaoCliente(token, acaoData.acao, {
        timestamp: acaoData.timestamp,
        ip: acaoData.ip,
        userAgent: acaoData.userAgent,
        dados: acaoData.dados,
      });

      return {
        success: resultado.sucesso,
        message: resultado.mensagem,
        status: resultado.status,
        acao: acaoData.acao,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Portal: Erro ao registrar acao', error);
      const statusCode = this.resolvePortalErrorStatus(error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao registrar acao',
          error: error.message,
        },
        statusCode,
      );
    }
  }
}
