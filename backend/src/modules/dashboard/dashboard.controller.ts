import {
  Logger,
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  DashboardService,
  DashboardKPIs,
  VendedorRanking,
  AlertaInteligente,
} from './dashboard.service';
import { CacheInterceptor, CacheTTL } from '../../common/interceptors/cache.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, EmpresaGuard)
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @CacheTTL(30 * 1000)
  async getKPIs(
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = 'mensal',
    @Query('vendedor') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ): Promise<DashboardKPIs> {
    return await this.dashboardService.getKPIs(periodo, vendedorId, regiao, empresaId);
  }

  @Get('vendedores-ranking')
  @CacheTTL(60 * 1000)
  async getVendedoresRanking(
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = 'mensal',
  ): Promise<VendedorRanking[]> {
    return await this.dashboardService.getVendedoresRanking(periodo, empresaId);
  }

  @Get('alertas')
  @CacheTTL(45 * 1000)
  async getAlertasInteligentes(@EmpresaId() empresaId: string): Promise<AlertaInteligente[]> {
    return await this.dashboardService.getAlertasInteligentes('mensal', empresaId);
  }

  @Get('resumo')
  async getResumoCompleto(
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = 'mensal',
    @Query('vendedor') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    const agora = new Date();

    try {
      const [kpis, vendedoresRanking, chartsData] = await Promise.all([
        this.dashboardService.getKPIs(periodo, vendedorId, regiao, empresaId),
        this.dashboardService.getVendedoresRanking(periodo, empresaId),
        this.dashboardService.getChartsData(periodo, vendedorId, regiao, empresaId),
      ]);

      const alertas = await this.dashboardService.getAlertasInteligentes(periodo, empresaId, {
        ranking: vendedoresRanking,
        kpis,
      });

      return {
        kpis,
        vendedoresRanking,
        alertas,
        chartsData,
        metadata: {
          periodo,
          vendedorId,
          regiao,
          atualizadoEm: agora.toISOString(),
          proximaAtualizacao: new Date(agora.getTime() + 15 * 60 * 1000).toISOString(),
          periodosDisponiveis: this.dashboardService.getPeriodosDisponiveis(),
          vendedoresDisponiveis: vendedoresRanking.map((vendedor) => ({
            id: vendedor.id,
            nome: vendedor.nome,
          })),
          regioesDisponiveis: this.dashboardService.getRegioesDisponiveis(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao carregar resumo do dashboard (empresa=${empresaId}, periodo=${periodo}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Erro ao carregar dados do dashboard.');
    }
  }
}
