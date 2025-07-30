import { Controller, Put, Param, Body, HttpStatus, HttpException, Get, Post } from '@nestjs/common';
import { PortalService } from './portal.service';

@Controller('api/portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) { }

  /**
   * Atualiza o status de uma proposta via token do portal
   */
  @Put('proposta/:token/status')
  async atualizarStatusPorToken(
    @Param('token') token: string,
    @Body() updateData: {
      status: string;
      timestamp?: string;
      ip?: string;
      userAgent?: string;
    }
  ) {
    try {
      console.log(`📝 Portal: Atualizando status via token ${token} para: ${updateData.status}`);

      const resultado = await this.portalService.atualizarStatusPorToken(
        token,
        updateData.status,
        {
          timestamp: updateData.timestamp,
          ip: updateData.ip,
          userAgent: updateData.userAgent
        }
      );

      console.log('✅ Portal: Status atualizado com sucesso');

      return {
        success: true,
        message: 'Status atualizado via portal',
        proposta: resultado,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Portal: Erro ao atualizar status:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status via portal',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém uma proposta por token do portal
   */
  @Get('proposta/:token')
  async obterPropostaPorToken(@Param('token') token: string) {
    try {
      const proposta = await this.portalService.obterPropostaPorToken(token);

      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Token inválido ou proposta não encontrada'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        proposta
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar proposta via portal',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Registra visualização da proposta
   */
  @Put('proposta/:token/view')
  async registrarVisualizacao(
    @Param('token') token: string,
    @Body() viewData: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    }
  ) {
    try {
      await this.portalService.registrarVisualizacao(token, viewData);

      return {
        success: true,
        message: 'Visualização registrada'
      };

    } catch (error) {
      console.error('❌ Portal: Erro ao registrar visualização:', error);

      return {
        success: false,
        message: 'Erro ao registrar visualização',
        error: error.message
      };
    }
  }

  /**
   * Registra uma ação específica do cliente
   */
  @Post('proposta/:token/acao')
  async registrarAcao(
    @Param('token') token: string,
    @Body() acaoData: {
      acao: string;
      timestamp?: string;
      ip?: string;
      userAgent?: string;
      dados?: any;
    }
  ) {
    try {
      console.log(`📊 Portal: Registrando ação "${acaoData.acao}" para token ${token}`);

      const resultado = await this.portalService.registrarAcaoCliente(
        token,
        acaoData.acao,
        {
          timestamp: acaoData.timestamp,
          ip: acaoData.ip,
          userAgent: acaoData.userAgent,
          dados: acaoData.dados
        }
      );

      return {
        success: resultado.sucesso,
        message: resultado.mensagem,
        status: resultado.status,
        acao: acaoData.acao,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Portal: Erro ao registrar ação:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao registrar ação',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
