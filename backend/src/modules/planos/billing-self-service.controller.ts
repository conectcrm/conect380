import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { BillingSelfServiceService } from './billing-self-service.service';

@Controller('billing/self-service')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.PLANOS_MANAGE)
export class BillingSelfServiceController {
  constructor(private readonly billingSelfServiceService: BillingSelfServiceService) {}

  @Get('overview')
  async getOverview(@EmpresaId() empresaId: string) {
    const data = await this.billingSelfServiceService.getOverview(empresaId);
    return {
      success: true,
      data,
    };
  }

  @Get('history')
  async getHistory(
    @EmpresaId() empresaId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const data = await this.billingSelfServiceService.getHistory(empresaId, {
      limit,
      page,
      tipo,
      status,
      dataInicio,
      dataFim,
    });
    return {
      success: true,
      data,
    };
  }
}
