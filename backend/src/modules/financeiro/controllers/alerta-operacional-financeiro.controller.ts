import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import {
  AtualizarStatusAlertaOperacionalFinanceiroDto,
  QueryAlertasOperacionaisFinanceiroDto,
  ReprocessarAlertaOperacionalFinanceiroDto,
} from '../dto/alerta-operacional-financeiro.dto';
import { AlertaOperacionalFinanceiroService } from '../services/alerta-operacional-financeiro.service';

@Controller('financeiro/alertas-operacionais')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class AlertaOperacionalFinanceiroController {
  constructor(private readonly alertaService: AlertaOperacionalFinanceiroService) {}

  @Get()
  async listar(
    @EmpresaId() empresaId: string,
    @Query() query: QueryAlertasOperacionaisFinanceiroDto,
  ) {
    return this.alertaService.listar(empresaId, query);
  }

  @Post(':id/ack')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async ack(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarStatusAlertaOperacionalFinanceiroDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.alertaService.ack(id, empresaId, userId, dto);
  }

  @Post(':id/resolver')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async resolver(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarStatusAlertaOperacionalFinanceiroDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.alertaService.resolver(id, empresaId, userId, dto);
  }

  @Post('recalcular')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async recalcular(@EmpresaId() empresaId: string, @CurrentUser() user: { id?: string; sub?: string }) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.alertaService.recalcularAlertas(empresaId, userId);
  }

  @Post(':id/reprocessar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async reprocessar(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReprocessarAlertaOperacionalFinanceiroDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.alertaService.reprocessar(id, empresaId, userId, dto);
  }
}
