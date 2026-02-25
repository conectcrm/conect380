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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.DASHBOARD_READ)
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  private normalizeRole(user?: User): string {
    return user?.role?.toString().toLowerCase().trim() ?? '';
  }

  private isPrivilegedRole(role: string): boolean {
    return (
      role === UserRole.SUPERADMIN ||
      role === UserRole.ADMIN ||
      role === UserRole.GERENTE ||
      role === UserRole.MANAGER ||
      role === 'gestor' ||
      role === 'superadmin'
    );
  }

  private resolveVendedorScope(user: User | undefined, requestedVendedorId?: string): string | undefined {
    if (!user?.id) {
      return undefined;
    }

    const role = this.normalizeRole(user);

    // Menor privilégio: perfis operacionais/usuário enxergam apenas seus próprios dados.
    if (role === UserRole.VENDEDOR) {
      return user.id;
    }

    if (this.isPrivilegedRole(role)) {
      return requestedVendedorId;
    }

    // Fallback seguro para roles desconhecidas.
    return user.id;
  }

  @Get('kpis')
  @CacheTTL(30 * 1000)
  async getKPIs(
    @CurrentUser() user: User,
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = 'mensal',
    @Query('vendedor') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ): Promise<DashboardKPIs> {
    const vendedorScope = this.resolveVendedorScope(user, vendedorId);
    return await this.dashboardService.getKPIs(periodo, vendedorScope, regiao, empresaId);
  }

  @Get('vendedores-ranking')
  @CacheTTL(60 * 1000)
  async getVendedoresRanking(
    @CurrentUser() user: User,
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = 'mensal',
  ): Promise<VendedorRanking[]> {
    const vendedorScope = this.resolveVendedorScope(user);
    return await this.dashboardService.getVendedoresRanking(periodo, empresaId, vendedorScope);
  }

  @Get('alertas')
  @CacheTTL(45 * 1000)
  async getAlertasInteligentes(
    @CurrentUser() user: User,
    @EmpresaId() empresaId: string,
  ): Promise<AlertaInteligente[]> {
    const vendedorScope = this.resolveVendedorScope(user);
    return await this.dashboardService.getAlertasInteligentes(
      'mensal',
      empresaId,
      undefined,
      vendedorScope,
    );
  }

  @Get('resumo')
  async getResumoCompleto(
    @CurrentUser() user: User,
    @EmpresaId() empresaId: string,
    @Query('periodo') periodo: string = 'mensal',
    @Query('vendedor') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    const agora = new Date();
    const vendedorScope = this.resolveVendedorScope(user, vendedorId);

    try {
      const [kpis, vendedoresRanking, chartsData] = await Promise.all([
        this.dashboardService.getKPIs(periodo, vendedorScope, regiao, empresaId),
        this.dashboardService.getVendedoresRanking(periodo, empresaId, vendedorScope),
        this.dashboardService.getChartsData(periodo, vendedorScope, regiao, empresaId),
      ]);

      const alertas = await this.dashboardService.getAlertasInteligentes(periodo, empresaId, {
        ranking: vendedoresRanking,
        kpis,
      }, vendedorScope);

      return {
        kpis,
        vendedoresRanking,
        alertas,
        chartsData,
        metadata: {
          periodo,
          vendedorId: vendedorScope,
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
