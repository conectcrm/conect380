import {
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
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianCriticalAuditInterceptor } from './interceptors/guardian-critical-audit.interceptor';

@Controller('guardian/empresas')
@UseGuards(JwtAuthGuard, GuardianMfaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(GuardianCriticalAuditInterceptor)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
export class GuardianEmpresasController {
  constructor(private readonly adminEmpresasService: AdminEmpresasService) {}

  /**
   * GET /api/guardian/empresas
   * Listar todas as empresas com filtros e paginaÃ§Ã£o
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
   * Listar usuÃ¡rios da empresa
   */
  @Get(':id/usuarios')
  async listarUsuarios(@Param('id') empresaId: string) {
    return await this.adminEmpresasService.listarUsuarios(empresaId);
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
   * GESTÃƒO DE MÃ“DULOS
   * ========================================
   */

  /**
   * GET /api/guardian/empresas/:id/modulos
   * Listar mÃ³dulos da empresa
   */
  @Get(':id/modulos')
  async listarModulos(@Param('id') id: string) {
    return await this.adminEmpresasService.listarModulos(id);
  }

  /**
   * POST /api/guardian/empresas/:id/modulos
   * Ativar mÃ³dulo para a empresa
   */
  @Post(':id/modulos')
  @HttpCode(HttpStatus.CREATED)
  async ativarModulo(@Param('id') id: string, @Body() dto: CreateModuloEmpresaDto) {
    return await this.adminEmpresasService.ativarModulo(id, dto);
  }

  /**
   * PATCH /api/guardian/empresas/:id/modulos/:modulo
   * Atualizar configuraÃ§Ãµes/limites do mÃ³dulo
   */
  @Patch(':id/modulos/:modulo')
  async atualizarModulo(
    @Param('id') id: string,
    @Param('modulo') modulo: string,
    @Body() dto: UpdateModuloEmpresaDto,
  ) {
    return await this.adminEmpresasService.atualizarModulo(id, modulo, dto);
  }

  /**
   * DELETE /api/guardian/empresas/:id/modulos/:modulo
   * Desativar mÃ³dulo da empresa
   */
  @Delete(':id/modulos/:modulo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desativarModulo(@Param('id') id: string, @Param('modulo') modulo: string) {
    await this.adminEmpresasService.desativarModulo(id, modulo);
  }

  /**
   * ========================================
   * GESTÃƒO DE PLANOS
   * ========================================
   */

  /**
   * GET /api/guardian/empresas/:id/historico-planos
   * Listar histÃ³rico de mudanÃ§as de plano
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



