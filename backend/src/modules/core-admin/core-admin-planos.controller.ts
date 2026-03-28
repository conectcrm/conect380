import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanosService } from '../planos/planos.service';
import { AtualizarPlanoDto } from '../planos/dto/atualizar-plano.dto';
import { CriarPlanoDto } from '../planos/dto/criar-plano.dto';
import { UserRole } from '../users/user.entity';
import { CoreAdminMfaGuard } from './guards/core-admin-mfa.guard';
import { CoreAdminCriticalAuditInterceptor } from './interceptors/core-admin-critical-audit.interceptor';
import { CoreAdminCapabilitiesService } from './services/core-admin-capabilities.service';

@Controller('core-admin/planos')
@UseGuards(JwtAuthGuard, CoreAdminMfaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(CoreAdminCriticalAuditInterceptor)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.PLANOS_MANAGE)
export class CoreAdminPlanosController {
  constructor(
    private readonly planosService: PlanosService,
    private readonly coreAdminCapabilitiesService: CoreAdminCapabilitiesService,
  ) {}

  @Get()
  async listarTodos(@Query('include_inactive') includeInactive?: string) {
    return this.planosService.listarTodos(this.parseIncludeInactive(includeInactive));
  }

  @Get('modulos')
  async listarModulosDisponiveis(@Query('include_inactive') includeInactive?: string) {
    return this.planosService.listarModulosDisponiveis(
      this.parseIncludeInactive(includeInactive),
    );
  }

  @Get('codigo/:codigo')
  async buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.planosService.buscarPorCodigo(codigo);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.planosService.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dados: CriarPlanoDto) {
    return this.planosService.criar(dados);
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dados: AtualizarPlanoDto) {
    return this.planosService.atualizar(id, dados);
  }

  @Delete(':id')
  async remover(@Param('id') id: string) {
    this.coreAdminCapabilitiesService.assertPlanDeletionAllowed();
    await this.planosService.remover(id);
    return { message: 'Plano removido com sucesso' };
  }

  @Put(':id/desativar')
  async desativar(@Param('id') id: string) {
    return this.planosService.desativar(id);
  }

  @Put(':id/ativar')
  async ativar(@Param('id') id: string) {
    return this.planosService.ativar(id);
  }

  @Put(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const planoAtual = await this.planosService.buscarPorId(id);
    if (!planoAtual) {
      throw new NotFoundException('Plano nao encontrado');
    }

    return planoAtual.ativo
      ? this.planosService.desativar(id)
      : this.planosService.ativar(id);
  }

  @Post('bootstrap-defaults')
  @HttpCode(HttpStatus.OK)
  async bootstrapDefaults(@Body() body?: { overwrite?: boolean }) {
    return this.planosService.bootstrapDefaults({ overwrite: Boolean(body?.overwrite) });
  }

  private parseIncludeInactive(raw: string | undefined): boolean {
    if (raw === undefined) {
      return true;
    }

    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    throw new BadRequestException('Parametro include_inactive invalido');
  }
}
