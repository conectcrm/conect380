import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  CreateCentroCustoDto,
  QueryCentrosCustoDto,
  UpdateCentroCustoDto,
} from '../dto/centro-custo.dto';
import { CentroCustoService } from '../services/centro-custo.service';

@Controller('centros-custo')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class CentroCustoController {
  constructor(private readonly centroCustoService: CentroCustoService) {}

  @Get()
  async findAll(@EmpresaId() empresaId: string, @Query() query: QueryCentrosCustoDto) {
    return this.centroCustoService.findAll(empresaId, query);
  }

  @Get('ativos')
  async findAtivos(@EmpresaId() empresaId: string) {
    return this.centroCustoService.findAtivos(empresaId);
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.centroCustoService.findOne(id, empresaId);
  }

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async create(
    @EmpresaId() empresaId: string,
    @Body() dto: CreateCentroCustoDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.centroCustoService.create(dto, empresaId, userId);
  }

  @Put(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCentroCustoDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.centroCustoService.update(id, dto, empresaId, userId);
  }

  @Patch(':id/desativar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async desativar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    const centroCusto = await this.centroCustoService.desativar(id, empresaId, userId);
    return {
      message: 'Centro de custo desativado com sucesso',
      centroCusto,
    };
  }

  @Delete(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.centroCustoService.remove(id, empresaId);
    return {
      success: true,
      message: 'Centro de custo excluido com sucesso',
    };
  }
}
