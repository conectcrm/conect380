import { Logger, Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  DashboardService,
  DashboardKPIs,
  VendedorRanking,
  AlertaInteligente,
} from './dashboard.service';
import { CacheInterceptor, CacheTTL } from '../../common/interceptors/cache.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, EmpresaGuard)
@UseInterceptors(CacheInterceptor) // 🚀 Cache ativado para dashboard
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/kpis
   * Obter KPIs principais do dashboard
   */
  @Get('kpis')
  @CacheTTL(30 * 1000) // 🚀 Cache: 30 segundos (KPIs precisam ser atualizados frequentemente)
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
  @CacheTTL(60 * 1000) // 🚀 Cache: 1 minuto (ranking muda menos frequentemente)
  async getVendedoresRanking(
    @Query('periodo') periodo: string = 'mensal',
  ): Promise<VendedorRanking[]> {
    return await this.dashboardService.getVendedoresRanking(periodo);
  }

  /**
   * GET /dashboard/alertas
   * Obter alertas inteligentes
   */
  @Get('alertas')
  @CacheTTL(45 * 1000) // 🚀 Cache: 45 segundos (alertas devem ser relativamente frescos)
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
    // TEMPORÁRIO: Retornar mock data até que as migrations sejam completadas
    const agora = new Date();
    try {
      const [kpis, vendedoresRanking] = await Promise.all([
        this.dashboardService.getKPIs(periodo, vendedorId, regiao),
        this.dashboardService.getVendedoresRanking(periodo),
      ]);

      const alertas = await this.dashboardService.getAlertasInteligentes(periodo, {
        ranking: vendedoresRanking,
        kpis,
      });

      return {
        kpis,
        vendedoresRanking,
        alertas,
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
      this.logger.log('⚠️  Erro no dashboard, retornando mock data:', error.message);
      return {
        kpis: {
          faturamentoTotal: { valor: 0, meta: 100000, variacao: 0, periodo: 'vs mês anterior' },
          ticketMedio: { valor: 0, variacao: 0, periodo: 'vs mês anterior' },
          vendasFechadas: { quantidade: 0, variacao: 0, periodo: 'vs mês anterior' },
          emNegociacao: { valor: 0, quantidade: 0, propostas: [] },
          novosClientesMes: { quantidade: 0, variacao: 0 },
          leadsQualificados: { quantidade: 0, variacao: 0 },
          propostasEnviadas: { valor: 0, variacao: 0 },
          taxaSucessoGeral: { percentual: 0, variacao: 0 },
          agenda: {
            totalEventos: 0,
            eventosConcluidos: 0,
            proximosEventos: 0,
            eventosHoje: 0,
            estatisticasPorTipo: {
              reuniao: 0,
              ligacao: 0,
              apresentacao: 0,
              visita: 0,
              'follow-up': 0,
              outro: 0,
            },
            produtividade: 0,
          },
        },
        vendedoresRanking: [],
        alertas: [],
        metadata: {
          periodo,
          vendedorId,
          regiao,
          atualizadoEm: agora.toISOString(),
          proximaAtualizacao: new Date(agora.getTime() + 15 * 60 * 1000).toISOString(),
          periodosDisponiveis: this.dashboardService.getPeriodosDisponiveis(),
          vendedoresDisponiveis: [],
          regioesDisponiveis: this.dashboardService.getRegioesDisponiveis(),
        },
      };
    }
  }
}
