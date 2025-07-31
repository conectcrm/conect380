import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService, DashboardKPIs, VendedorRanking, AlertaInteligente } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  /**
   * GET /dashboard/kpis
   * Obter KPIs principais do dashboard
   */
  @Get('kpis')
  async getKPIs(
    @Query('periodo') periodo: string = 'mensal',
    @Query('vendedor') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ): Promise<DashboardKPIs> {
    return await this.dashboardService.getKPIs(periodo, vendedorId, regiao);
  }

  /**
   * GET /dashboard/vendedores-ranking
   * Obter ranking de vendedores
   */
  @Get('vendedores-ranking')
  async getVendedoresRanking(
    @Query('periodo') periodo: string = 'mensal'
  ): Promise<VendedorRanking[]> {
    return await this.dashboardService.getVendedoresRanking(periodo);
  }

  /**
   * GET /dashboard/alertas
   * Obter alertas inteligentes
   */
  @Get('alertas')
  async getAlertasInteligentes(): Promise<AlertaInteligente[]> {
    return await this.dashboardService.getAlertasInteligentes();
  }

  /**
   * GET /dashboard/resumo
   * Obter dados completos do dashboard
   */
  @Get('resumo')
  async getResumoCompleto(
    @Query('periodo') periodo: string = 'mensal',
    @Query('vendedor') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    const [kpis, vendedoresRanking, alertas] = await Promise.all([
      this.dashboardService.getKPIs(periodo, vendedorId, regiao),
      this.dashboardService.getVendedoresRanking(periodo),
      this.dashboardService.getAlertasInteligentes(),
    ]);

    return {
      kpis,
      vendedoresRanking,
      alertas,
      metadata: {
        periodo,
        vendedorId,
        regiao,
        atualizadoEm: new Date().toISOString(),
        proximaAtualizacao: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
      }
    };
  }
}
