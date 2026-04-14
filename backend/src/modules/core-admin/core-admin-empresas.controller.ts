import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmpresaAdminDto } from './dto/create-empresa-admin.dto';
import { CreateModuloEmpresaDto } from './dto/create-modulo-empresa.dto';
import { FilterEmpresasAdminDto } from './dto/filter-empresas-admin.dto';
import { MudarPlanoDto } from './dto/mudar-plano.dto';
import { UpdateEmpresaAdminDto } from './dto/update-empresa-admin.dto';
import { UpdateModuloEmpresaDto } from './dto/update-modulo-empresa.dto';
import { User, UserRole } from '../users/user.entity';
import { CoreAdminMfaGuard } from './guards/core-admin-mfa.guard';
import { CoreAdminCriticalAuditInterceptor } from './interceptors/core-admin-critical-audit.interceptor';
import { CoreAdminCapabilitiesService } from './services/core-admin-capabilities.service';
import { CoreAdminEmpresasService } from './services/core-admin-empresas.service';

@Controller('core-admin/empresas')
@UseGuards(JwtAuthGuard, CoreAdminMfaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(CoreAdminCriticalAuditInterceptor)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
export class CoreAdminEmpresasController {
  constructor(
    private readonly coreAdminEmpresasService: CoreAdminEmpresasService,
    private readonly coreAdminCapabilitiesService: CoreAdminCapabilitiesService,
  ) {}

  @Get()
  async listarTodas(@Query() filters: FilterEmpresasAdminDto) {
    return await this.coreAdminEmpresasService.listarTodas(filters);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.coreAdminEmpresasService.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CreateEmpresaAdminDto) {
    return await this.coreAdminEmpresasService.criar(dto);
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dto: UpdateEmpresaAdminDto) {
    return await this.coreAdminEmpresasService.atualizar(id, dto);
  }

  @Patch(':id/suspender')
  async suspender(@Param('id') id: string, @Body('motivo') motivo: string) {
    return await this.coreAdminEmpresasService.suspender(id, motivo);
  }

  @Patch(':id/reativar')
  async reativar(@Param('id') id: string) {
    return await this.coreAdminEmpresasService.reativar(id);
  }

  @Get(':id/usuarios')
  async listarUsuarios(@Param('id') empresaId: string) {
    return await this.coreAdminEmpresasService.listarUsuarios(empresaId);
  }

  @Put(':empresaId/usuarios/:usuarioId/reset-senha')
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE, Permission.USERS_RESET_PASSWORD)
  async resetarSenhaUsuario(
    @Param('empresaId') empresaId: string,
    @Param('usuarioId') usuarioId: string,
    @CurrentUser() currentUser: User,
    @Body('motivo') motivo?: string,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario autenticado invalido');
    }

    const result = await this.coreAdminEmpresasService.resetarSenhaUsuario(
      empresaId,
      usuarioId,
      {
        id: currentUser.id,
        nome: currentUser.nome,
        email: currentUser.email,
      },
      motivo,
    );

    return {
      message: 'Senha resetada com sucesso',
      ...result,
    };
  }

  @Get(':id/modulos')
  async listarModulos(@Param('id') id: string) {
    return await this.coreAdminEmpresasService.listarModulos(id);
  }

  @Post(':id/modulos')
  @HttpCode(HttpStatus.CREATED)
  async ativarModulo(@Param('id') id: string, @Body() dto: CreateModuloEmpresaDto) {
    this.coreAdminCapabilitiesService.assertCompanyModuleManagementAllowed();
    return await this.coreAdminEmpresasService.ativarModulo(id, dto);
  }

  @Patch(':id/modulos/:modulo')
  async atualizarModulo(
    @Param('id') id: string,
    @Param('modulo') modulo: string,
    @Body() dto: UpdateModuloEmpresaDto,
  ) {
    this.coreAdminCapabilitiesService.assertCompanyModuleManagementAllowed();
    return await this.coreAdminEmpresasService.atualizarModulo(id, modulo, dto);
  }

  @Delete(':id/modulos/:modulo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desativarModulo(@Param('id') id: string, @Param('modulo') modulo: string) {
    this.coreAdminCapabilitiesService.assertCompanyModuleManagementAllowed();
    await this.coreAdminEmpresasService.desativarModulo(id, modulo);
  }

  @Get(':id/historico-planos')
  @Permissions(Permission.PLANOS_MANAGE)
  async historicoPlanos(@Param('id') id: string) {
    return await this.coreAdminEmpresasService.historicoPlanos(id);
  }

  @Patch(':id/plano')
  @Permissions(Permission.PLANOS_MANAGE)
  async mudarPlano(@Param('id') id: string, @Body() dto: MudarPlanoDto) {
    return await this.coreAdminEmpresasService.mudarPlano(id, dto);
  }
}
