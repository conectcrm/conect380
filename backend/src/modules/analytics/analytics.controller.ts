import { Controller, Get, Query, Res, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

export interface AnalyticsQueryDto {
  periodo?: '7d' | '30d' | '90d' | '1y';
  vendedor?: string;
  status?: string[];
  categoria?: string;
}

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('dashboard')
  async getDashboardData(@Query() query: AnalyticsQueryDto) {
    try {
      this.logger.log(`Buscando dados do dashboard - Período: ${query.periodo}, Vendedor: ${query.vendedor}`);

      const data = await this.analyticsService.getDashboardData(query);
      return data;
    } catch (error) {
      this.logger.error('Erro ao buscar dados do dashboard:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('funil-conversao')
  async getFunilConversao(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getFunilConversao(query);
    } catch (error) {
      this.logger.error('Erro ao buscar funil de conversão:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance-vendedores')
  async getPerformanceVendedores(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getPerformanceVendedores(query);
    } catch (error) {
      this.logger.error('Erro ao buscar performance de vendedores:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('evolucao-temporal')
  async getEvolucaoTemporal(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getEvolucaoTemporal(query);
    } catch (error) {
      this.logger.error('Erro ao buscar evolução temporal:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tempo-medio-etapas')
  async getTempoMedioEtapas(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getTempoMedioEtapas(query);
    } catch (error) {
      this.logger.error('Erro ao buscar tempo médio por etapas:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('distribuicao-valores')
  async getDistribuicaoValores(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getDistribuicaoValores(query);
    } catch (error) {
      this.logger.error('Erro ao buscar distribuição de valores:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('previsao-fechamento')
  async getPrevisaoFechamento(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getPrevisaoFechamento(query);
    } catch (error) {
      this.logger.error('Erro ao buscar previsão de fechamento:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('alertas-gestao')
  async getAlertasGestao(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getAlertasGestao(query);
    } catch (error) {
      this.logger.error('Erro ao buscar alertas de gestão:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('export')
  async exportarRelatorio(
    @Query() query: AnalyticsQueryDto,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Exportando relatório - Período: ${query.periodo}, Vendedor: ${query.vendedor}`);

      const buffer = await this.analyticsService.exportarRelatorio(query);

      const filename = `relatorio-vendas-${query.periodo || '30d'}-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      });

      res.send(buffer);
    } catch (error) {
      this.logger.error('Erro ao exportar relatório:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('kpis-tempo-real')
  async getKpisTempoReal() {
    try {
      return await this.analyticsService.getKpisTempoReal();
    } catch (error) {
      this.logger.error('Erro ao buscar KPIs em tempo real:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metas-progresso')
  async getMetasProgresso(@Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getMetasProgresso(query);
    } catch (error) {
      this.logger.error('Erro ao buscar progresso das metas:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
