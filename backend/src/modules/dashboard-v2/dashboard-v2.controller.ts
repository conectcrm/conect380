import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { DashboardV2QueryDto } from './dto/dashboard-v2-query.dto';
import { DashboardV2SetFlagDto } from './dto/dashboard-v2-set-flag.dto';
import { DashboardV2Service } from './dashboard-v2.service';
import { DashboardV2FeatureFlagService } from './services/dashboard-v2-feature-flag.service';

@Controller('dashboard/v2')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.DASHBOARD_READ)
export class DashboardV2Controller {
  constructor(
    private readonly dashboardV2Service: DashboardV2Service,
    private readonly dashboardV2FeatureFlagService: DashboardV2FeatureFlagService,
  ) {}

  @Get('feature-flag')
  async getFeatureFlag(@EmpresaId() empresaId: string) {
    return this.dashboardV2Service.getFeatureFlag(empresaId);
  }

  @Patch('feature-flag')
  @Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
  async setFeatureFlag(
    @EmpresaId() empresaId: string,
    @CurrentUser() user: User,
    @Body() body: DashboardV2SetFlagDto,
  ) {
    await this.dashboardV2FeatureFlagService.setFlag({
      empresaId,
      enabled: body.enabled,
      rolloutPercentage: body.rolloutPercentage,
      updatedBy: user?.id || null,
    });

    return this.dashboardV2Service.getFeatureFlag(empresaId);
  }

  @Get('overview')
  async getOverview(@EmpresaId() empresaId: string, @Query() query: DashboardV2QueryDto) {
    return this.dashboardV2Service.getOverview(empresaId, query);
  }

  @Get('trends')
  async getTrends(@EmpresaId() empresaId: string, @Query() query: DashboardV2QueryDto) {
    return this.dashboardV2Service.getTrends(empresaId, query);
  }

  @Get('funnel')
  async getFunnel(@EmpresaId() empresaId: string, @Query() query: DashboardV2QueryDto) {
    return this.dashboardV2Service.getFunnel(empresaId, query);
  }

  @Get('pipeline-summary')
  async getPipelineSummary(@EmpresaId() empresaId: string, @Query() query: DashboardV2QueryDto) {
    return this.dashboardV2Service.getPipelineSummary(empresaId, query);
  }

  @Get('insights')
  async getInsights(@EmpresaId() empresaId: string, @Query() query: DashboardV2QueryDto) {
    return this.dashboardV2Service.getInsights(empresaId, query);
  }
}
