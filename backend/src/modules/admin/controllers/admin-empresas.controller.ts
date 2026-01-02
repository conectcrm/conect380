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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminEmpresasService } from '../services/admin-empresas.service';
import { CreateEmpresaAdminDto } from '../dto/create-empresa-admin.dto';
import { UpdateEmpresaAdminDto } from '../dto/update-empresa-admin.dto';
import { FilterEmpresasAdminDto } from '../dto/filter-empresas-admin.dto';
import { CreateModuloEmpresaDto } from '../dto/create-modulo-empresa.dto';
import { UpdateModuloEmpresaDto } from '../dto/update-modulo-empresa.dto';
import { MudarPlanoDto } from '../dto/mudar-plano.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

@Controller('admin/empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class AdminEmpresasController {
  constructor(private readonly adminEmpresasService: AdminEmpresasService) { }

  /**
   * GET /api/admin/empresas
   * Listar todas as empresas com filtros e paginação
   */
  @Get()
  async listarTodas(@Query() filters: FilterEmpresasAdminDto) {
    return await this.adminEmpresasService.listarTodas(filters);
  }

  /**
   * GET /api/admin/empresas/:id
   * Buscar detalhes completos de uma empresa
   */
  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.adminEmpresasService.buscarPorId(id);
  }

  /**
   * POST /api/admin/empresas
   * Criar nova empresa (onboarding completo)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CreateEmpresaAdminDto) {
    return await this.adminEmpresasService.criar(dto);
  }

  /**
   * PUT /api/admin/empresas/:id
   * Atualizar dados da empresa
   */
  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dto: UpdateEmpresaAdminDto) {
    return await this.adminEmpresasService.atualizar(id, dto);
  }

  /**
   * PATCH /api/admin/empresas/:id/suspender
   * Suspender empresa (bloquear acesso)
   */
  @Patch(':id/suspender')
  async suspender(@Param('id') id: string, @Body('motivo') motivo: string) {
    return await this.adminEmpresasService.suspender(id, motivo);
  }

  /**
   * PATCH /api/admin/empresas/:id/reativar
   * Reativar empresa (restaurar acesso)
   */
  @Patch(':id/reativar')
  async reativar(@Param('id') id: string) {
    return await this.adminEmpresasService.reativar(id);
  }

  /**
   * GET /api/admin/empresas/:id/usuarios
   * Listar usuários da empresa
   */
  @Get(':id/usuarios')
  async listarUsuarios(@Param('id') empresaId: string) {
    return await this.adminEmpresasService.listarUsuarios(empresaId);
  }

  /**
   * POST /api/admin/empresas/:id/health-score
   * Recalcular health score da empresa
   */
  @Post(':id/health-score')
  async calcularHealthScore(@Param('id') id: string) {
    const score = await this.adminEmpresasService.calcularHealthScore(id);
    return { id, health_score: score };
  }

  /**
   * ========================================
   * GESTÃO DE MÓDULOS
   * ========================================
   */

  /**
   * GET /api/admin/empresas/:id/modulos
   * Listar módulos da empresa
   */
  @Get(':id/modulos')
  async listarModulos(@Param('id') id: string) {
    return await this.adminEmpresasService.listarModulos(id);
  }

  /**
   * POST /api/admin/empresas/:id/modulos
   * Ativar módulo para a empresa
   */
  @Post(':id/modulos')
  @HttpCode(HttpStatus.CREATED)
  async ativarModulo(@Param('id') id: string, @Body() dto: CreateModuloEmpresaDto) {
    return await this.adminEmpresasService.ativarModulo(id, dto);
  }

  /**
   * PATCH /api/admin/empresas/:id/modulos/:modulo
   * Atualizar configurações/limites do módulo
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
   * DELETE /api/admin/empresas/:id/modulos/:modulo
   * Desativar módulo da empresa
   */
  @Delete(':id/modulos/:modulo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async desativarModulo(@Param('id') id: string, @Param('modulo') modulo: string) {
    await this.adminEmpresasService.desativarModulo(id, modulo);
  }

  /**
   * ========================================
   * GESTÃO DE PLANOS
   * ========================================
   */

  /**
   * GET /api/admin/empresas/:id/historico-planos
   * Listar histórico de mudanças de plano
   */
  @Get(':id/historico-planos')
  async historicoPlanos(@Param('id') id: string) {
    return await this.adminEmpresasService.historicoPlanos(id);
  }

  /**
   * PATCH /api/admin/empresas/:id/plano
   * Mudar plano da empresa
   */
  @Patch(':id/plano')
  async mudarPlano(@Param('id') id: string, @Body() dto: MudarPlanoDto) {
    return await this.adminEmpresasService.mudarPlano(id, dto);
  }
}
