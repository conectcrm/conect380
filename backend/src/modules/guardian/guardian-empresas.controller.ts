import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminEmpresasService } from '../admin/services/admin-empresas.service';
import { CreateEmpresaAdminDto } from '../admin/dto/create-empresa-admin.dto';
import { UpdateEmpresaAdminDto } from '../admin/dto/update-empresa-admin.dto';
import { FilterEmpresasAdminDto } from '../admin/dto/filter-empresas-admin.dto';
import { CreateModuloEmpresaDto } from '../admin/dto/create-modulo-empresa.dto';
import { UpdateModuloEmpresaDto } from '../admin/dto/update-modulo-empresa.dto';
import { MudarPlanoDto } from '../admin/dto/mudar-plano.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { User, UserRole } from '../users/user.entity';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianCriticalAuditInterceptor } from './interceptors/guardian-critical-audit.interceptor';
import { GuardianCapabilitiesService } from './services/guardian-capabilities.service';

@Controller('guardian/empresas')
@UseGuards(JwtAuthGuard, GuardianMfaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(GuardianCriticalAuditInterceptor)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
export class GuardianEmpresasController {
  constructor(
    private readonly adminEmpresasService: AdminEmpresasService,
    private readonly guardianCapabilitiesService: GuardianCapabilitiesService,
  ) {}

  /**
   * GET /api/guardian/empresas
   * Listar todas as empresas com filtros e paginacao
   */
  @Get()
  async listarTodas(@Query() filters: FilterEmpresasAdminDto) {
    return await this.adminEmpresasService.listarTodas(filters);
  }

  /**
   * GET /api/guardian/empresas/:id
   * Buscar detalhes completos de uma empresa
   */
  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.adminEmpresasService.buscarPorId(id);
  }

  /**
   * POST /api/guardian/empresas
   * Criar nova empresa (onboarding completo)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CreateEmpresaAdminDto) {
    return await this.adminEmpresasService.criar(dto);
  }

  /**
   * PUT /api/guardian/empresas/:id
   * Atualizar dados da empresa
   */
  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dto: UpdateEmpresaAdminDto) {
    return await this.adminEmpresasService.atualizar(id, dto);
  }

  /**
   * PATCH /api/guardian/empresas/:id/suspender
   * Suspender empresa (bloquear acesso)
   */
  @Patch(':id/suspender')
  async suspender(@Param('id') id: string, @Body('motivo') motivo: string) {
    return await this.adminEmpresasService.suspender(id, motivo);
  }

  /**
   * PATCH /api/guardian/empresas/:id/reativar
   * Reativar empresa (restaurar acesso)
   */
  @Patch(':id/reativar')
  async reativar(@Param('id') id: string) {
    return await this.adminEmpresasService.reativar(id);
  }

  /**
   * GET /api/guardian/empresas/:id/usuarios
   * Listar usuarios da empresa
   */
  @Get(':id/usuarios')
  async listarUsuarios(@Param('id') empresaId: string) {
    return await this.adminEmpresasService.listarUsuarios(empresaId);
  }

  /**
   * PUT /api/guardian/empresas/:empresaId/usuarios/:usuarioId/reset-senha
   * Resetar senha de um usuario da empresa (operacao superadmin cross-tenant)
   */
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

    const result = await this.adminEmpresasService.resetarSenhaUsuario(
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

  /**
   * POST /api/guardian/empresas/:id/health-score
   * Recalcular health score da empresa
   */
  @Post(':id/health-score')
  async calcularHealthScore(@Param('id') id: string) {
    const score = await this.adminEmpresasService.calcularHealthScore(id);
    return { id, health_score: score };
  }

  /**
   * ========================================
   * GESTAO DE MODULOS
   * ========================================
   */

  /**
   * GET /api/guardian/empresas/:id/modulos
   * Listar modulos da empresa
   */
  @Get(':id/modulos')
  async listarModulos(@Param('id') id: string) {
    return await this.adminEmpresasService.listarModulos(id);
  }

  /**
   * POST /api/guardian/empresas/:id/modulos
   * Ativar modulo para a empresa
   */
  @Post(':id/modulos')
  @HttpCode(HttpStatus.CREATED)
  async ativarModulo(@Param('id') id: string, @Body() dto: CreateModuloEmpresaDto) {
    this.guardianCapabilitiesService.assertCompanyModuleManagementAllowed();
    return await this.adminEmpresasService.ativarModulo(id, dto);
  }

  /**
   * PATCH /api/guardian/empresas/:id/modulos/:modulo
   * Atualizar configuracoes/limites do modulo
   */
  @Patch(':id/modulos/:modulo')
  async atualizarModulo(
    @Param('id') id: string,
    @Param('modulo') modulo: string,
    @Body() dto: UpdateModuloEmpresaDto,
  ) {
    this.guardianCapabilitiesService.assertCompanyModuleManagementAllowed();
    return await this.adminEmpresasService.atualizarModulo(id, modulo, dto);
  }

  /**
   * DELETE /api/guardian/empresas/:id/modulos/:modulo
   * Desativar modulo da empresa
   */
  @Delete(':id/modulos/:modulo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desativarModulo(@Param('id') id: string, @Param('modulo') modulo: string) {
    this.guardianCapabilitiesService.assertCompanyModuleManagementAllowed();
    await this.adminEmpresasService.desativarModulo(id, modulo);
  }

  /**
   * ========================================
   * GESTAO DE PLANOS
   * ========================================
   */

  /**
   * GET /api/guardian/empresas/:id/historico-planos
   * Listar historico de mudancas de plano
   */
  @Get(':id/historico-planos')
  @Permissions(Permission.PLANOS_MANAGE)
  async historicoPlanos(@Param('id') id: string) {
    return await this.adminEmpresasService.historicoPlanos(id);
  }

  /**
   * PATCH /api/guardian/empresas/:id/plano
   * Mudar plano da empresa
   */
  @Patch(':id/plano')
  @Permissions(Permission.PLANOS_MANAGE)
  async mudarPlano(@Param('id') id: string, @Body() dto: MudarPlanoDto) {
    return await this.adminEmpresasService.mudarPlano(id, dto);
  }
}

