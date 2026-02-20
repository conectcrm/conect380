import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

export interface AnalyticsQueryDto {
  periodo?: '7d' | '30d' | '90d' | '1y';
  vendedor?: string;
  status?: string[];
  categoria?: string;
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.RELATORIOS_READ)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  private withEmpresa(empresaId: string, query: AnalyticsQueryDto) {
    return { ...query, empresaId };
  }

  @Get('dashboard')
  async getDashboardData(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      this.logger.log(
        `Buscando dashboard analytics (periodo=${query.periodo}, vendedor=${query.vendedor})`,
      );
      return await this.analyticsService.getDashboardData(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar dados do dashboard:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('funil-conversao')
  async getFunilConversao(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getFunilConversao(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar funil de conversao:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('performance-vendedores')
  async getPerformanceVendedores(
    @EmpresaId() empresaId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    try {
      return await this.analyticsService.getPerformanceVendedores(
        this.withEmpresa(empresaId, query),
      );
    } catch (error) {
      this.logger.error('Erro ao buscar performance de vendedores:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('evolucao-temporal')
  async getEvolucaoTemporal(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getEvolucaoTemporal(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar evolucao temporal:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tempo-medio-etapas')
  async getTempoMedioEtapas(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getTempoMedioEtapas(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar tempo medio por etapas:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('distribuicao-valores')
  async getDistribuicaoValores(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getDistribuicaoValores(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar distribuicao de valores:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('previsao-fechamento')
  async getPrevisaoFechamento(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getPrevisaoFechamento(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar previsao de fechamento:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alertas-gestao')
  async getAlertasGestao(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getAlertasGestao(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar alertas de gestao:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  async exportarRelatorio(
    @EmpresaId() empresaId: string,
    @Query() query: AnalyticsQueryDto,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.analyticsService.exportarRelatorio(
        this.withEmpresa(empresaId, query),
      );
      const filename = `relatorio-vendas-${query.periodo || '30d'}-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      });

      res.send(buffer);
    } catch (error) {
      this.logger.error('Erro ao exportar relatorio:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('kpis-tempo-real')
  async getKpisTempoReal(@EmpresaId() empresaId: string) {
    try {
      return await this.analyticsService.getKpisTempoReal(empresaId);
    } catch (error) {
      this.logger.error('Erro ao buscar KPIs em tempo real:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metas-progresso')
  async getMetasProgresso(@EmpresaId() empresaId: string, @Query() query: AnalyticsQueryDto) {
    try {
      return await this.analyticsService.getMetasProgresso(this.withEmpresa(empresaId, query));
    } catch (error) {
      this.logger.error('Erro ao buscar progresso das metas:', error);
      throw new HttpException(
        error.message || 'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
