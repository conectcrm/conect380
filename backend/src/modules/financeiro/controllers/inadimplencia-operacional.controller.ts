import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import {
  AcaoManualInadimplenciaOperacionalDto,
  QueryInadimplenciaOperacionalDto,
  ReavaliarInadimplenciaOperacionalDto,
} from '../dto/inadimplencia-operacional.dto';
import { InadimplenciaOperacionalService } from '../services/inadimplencia-operacional.service';
import { InadimplenciaOperacionalMonitorService } from '../services/inadimplencia-operacional-monitor.service';

@Controller('inadimplencia-operacional')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
export class InadimplenciaOperacionalController {
  constructor(
    private readonly inadimplenciaOperacionalService: InadimplenciaOperacionalService,
    private readonly inadimplenciaOperacionalMonitorService: InadimplenciaOperacionalMonitorService,
  ) {}

  @Get('clientes')
  async listarClientes(
    @EmpresaId() empresaId: string,
    @Query() query: QueryInadimplenciaOperacionalDto,
  ) {
    return this.inadimplenciaOperacionalService.listarStatus(empresaId, query);
  }

  @Get('clientes/:clienteId')
  async obterCliente(
    @EmpresaId() empresaId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
  ) {
    return this.inadimplenciaOperacionalService.obterStatusCliente(empresaId, clienteId);
  }

  @Post('clientes/:clienteId/reavaliar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async reavaliarCliente(
    @EmpresaId() empresaId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Body() dto: ReavaliarInadimplenciaOperacionalDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const actorId = user?.id || user?.sub || 'sistema';
    return this.inadimplenciaOperacionalService.avaliarCliente(empresaId, clienteId, {
      actorId,
      motivo: dto.motivo,
      trigger: 'reavaliacao_manual',
    });
  }

  @Post('clientes/:clienteId/bloquear-manual')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async bloquearManual(
    @EmpresaId() empresaId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Body() dto: AcaoManualInadimplenciaOperacionalDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const actorId = user?.id || user?.sub || 'sistema';
    return this.inadimplenciaOperacionalService.bloquearManual(
      empresaId,
      clienteId,
      actorId,
      dto.motivo,
    );
  }

  @Post('clientes/:clienteId/desbloquear-manual')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async desbloquearManual(
    @EmpresaId() empresaId: string,
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Body() dto: AcaoManualInadimplenciaOperacionalDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const actorId = user?.id || user?.sub || 'sistema';
    return this.inadimplenciaOperacionalService.desbloquearManual(
      empresaId,
      clienteId,
      actorId,
      dto.motivo,
    );
  }

  @Post('reprocessar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async reprocessarFila(
    @EmpresaId() empresaId: string,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const actorId = user?.id || user?.sub || 'sistema';
    return this.inadimplenciaOperacionalMonitorService.executarEmpresa(empresaId, actorId);
  }
}
