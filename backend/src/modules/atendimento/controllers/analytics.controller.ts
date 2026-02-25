import {
  Controller,
  Get,
  Query,
  Logger,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Controller REST para Analytics e Dashboard de Atendimento
 * Fornece métricas agregadas, estatísticas e dados para visualização
 * 🔐 SEGURANÇA: Todos os endpoints protegidos com JWT - empresa_id extraído do token
 *
 * @author ConectCRM
 * @date 2025-11-18
 */
@Controller('api/atendimento/analytics')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.RELATORIOS_READ)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/atendimento/analytics/dashboard
   * Retorna métricas principais para o dashboard
   * 🔐 SEGURANÇA: empresa_id extraído do JWT
   *
   * Query params:
   * - periodo: '7d' | '30d' | '90d' | 'custom' (opcional, padrão: '7d')
   * - dataInicio: ISO date string (obrigatório se periodo=custom)
   * - dataFim: ISO date string (obrigatório se periodo=custom)
   */
  @Get('dashboard')
  async getDashboardMetrics(
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = '7d',
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT

    this.logger.log(
      `📊 [GET /analytics/dashboard] empresaId=${empresaId} periodo=${periodo}`,
    );

    if (!empresaId) {
      throw new HttpException('Usuário não possui empresa associada', HttpStatus.FORBIDDEN);
    }

    if (periodo === 'custom' && (!dataInicio || !dataFim)) {
      throw new HttpException(
        'dataInicio e dataFim são obrigatórios quando periodo=custom',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const metrics = await this.analyticsService.getDashboardMetrics({
        empresaId,
        periodo,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined,
      });

      this.logger.log(`✅ Dashboard metrics retornadas: ${metrics.ticketsAbertos} tickets abertos`);
      return metrics;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar dashboard metrics: ${error.message}`, error.stack);
      throw new HttpException(
        'Erro ao buscar métricas do dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/atendimento/analytics/desempenho-atendentes
   * Retorna métricas de desempenho por atendente
   * 🔐 SEGURANÇA: empresa_id extraído do JWT
   *
   * Query params:
   * - periodo: '7d' | '30d' | '90d' (opcional, padrão: '30d')
   * - limite: number (opcional, padrão: 10)
   */
  @Get('desempenho-atendentes')
  async getDesempenhoAtendentes(
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = '30d',
    @Query('limite') limite?: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT

    this.logger.log(
      `👥 [GET /analytics/desempenho-atendentes] empresaId=${empresaId} periodo=${periodo}`,
    );

    if (!empresaId) {
      throw new HttpException('Usuário não possui empresa associada', HttpStatus.FORBIDDEN);
    }

    try {
      const desempenho = await this.analyticsService.getDesempenhoAtendentes({
        empresaId,
        periodo,
        limite: limite ? parseInt(limite, 10) : 10,
      });

      this.logger.log(`✅ Desempenho de ${desempenho.length} atendentes retornado`);
      return desempenho;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar desempenho de atendentes: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Erro ao buscar desempenho de atendentes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/atendimento/analytics/canais
   * Retorna estatísticas agrupadas por canal
   * 🔐 SEGURANÇA: empresa_id extraído do JWT
   *
   * Query params:
   * - periodo: '7d' | '30d' | '90d' (opcional, padrão: '30d')
   */
  @Get('canais')
  async getEstatisticasCanais(@EmpresaId() empresaId: string, @Query('periodo') periodo: string = '30d') {
    // 🔐 SEGURANÇA: empresa_id vem do JWT

    this.logger.log(
      `📱 [GET /analytics/canais] empresaId=${empresaId} periodo=${periodo}`,
    );

    if (!empresaId) {
      throw new HttpException('Usuário não possui empresa associada', HttpStatus.FORBIDDEN);
    }

    try {
      const estatisticas = await this.analyticsService.getEstatisticasCanais({
        empresaId,
        periodo,
      });

      this.logger.log(`✅ Estatísticas de ${estatisticas.length} canais retornadas`);
      return estatisticas;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas de canais: ${error.message}`, error.stack);
      throw new HttpException(
        'Erro ao buscar estatísticas de canais',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/atendimento/analytics/tendencias
   * Retorna dados de tendências ao longo do tempo para gráficos
   * 🔐 SEGURANÇA: empresa_id extraído do JWT
   *
   * Query params:
   * - metrica: 'tickets' | 'tempo_resposta' | 'satisfacao' | 'sla' (obrigatório)
   * - periodo: '7d' | '30d' | '90d' (opcional, padrão: '30d')
   * - granularidade: 'hora' | 'dia' | 'semana' (opcional, padrão: 'dia')
   */
  @Get('tendencias')
  async getTendencias(
    @EmpresaId() empresaId: string,
    @Query('metrica') metrica: string,
    @Query('periodo') periodo: string = '30d',
    @Query('granularidade') granularidade: string = 'dia',
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT

    this.logger.log(
      `📈 [GET /analytics/tendencias] empresaId=${empresaId} metrica=${metrica} periodo=${periodo}`,
    );

    if (!empresaId) {
      throw new HttpException('Usuário não possui empresa associada', HttpStatus.FORBIDDEN);
    }

    if (!metrica) {
      throw new HttpException('metrica é obrigatório', HttpStatus.BAD_REQUEST);
    }

    const metricasValidas = ['tickets', 'tempo_resposta', 'satisfacao', 'sla'];
    if (!metricasValidas.includes(metrica)) {
      throw new HttpException(
        `metrica deve ser uma de: ${metricasValidas.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tendencias = await this.analyticsService.getTendencias({
        empresaId,
        metrica,
        periodo,
        granularidade,
      });

      this.logger.log(`✅ ${tendencias.length} pontos de tendência retornados`);
      return tendencias;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar tendências: ${error.message}`, error.stack);
      throw new HttpException('Erro ao buscar tendências', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

