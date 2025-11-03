import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmpresaModuloService } from '../services/empresa-modulo.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateEmpresaModuloDto } from '../dto/create-empresa-modulo.dto';
import { UpdateEmpresaModuloDto } from '../dto/update-empresa-modulo.dto';
import { ModuloEnum, PlanoEnum } from '../entities/empresa-modulo.entity';

@Controller('empresas/modulos')
@UseGuards(JwtAuthGuard)
export class EmpresaModuloController {
  constructor(private readonly empresaModuloService: EmpresaModuloService) {}

  /**
   * GET /empresas/modulos/ativos
   * Lista módulos ativos da empresa do usuário logado
   */
  @Get('ativos')
  async listarModulosAtivos(@Request() req) {
    const empresa_id = req.user.empresa_id;
    const modulos = await this.empresaModuloService.listarModulosAtivos(empresa_id);

    return {
      success: true,
      data: modulos,
    };
  }

  /**
   * GET /empresas/modulos
   * Lista todos os módulos da empresa (ativos e inativos)
   */
  @Get()
  async listar(@Request() req) {
    const empresa_id = req.user.empresa_id;
    const modulos = await this.empresaModuloService.listar(empresa_id);

    return {
      success: true,
      data: modulos,
    };
  }

  /**
   * GET /empresas/modulos/verificar/:modulo
   * Verifica se empresa tem módulo ativo
   */
  @Get('verificar/:modulo')
  async verificarModulo(@Request() req, @Param('modulo') modulo: ModuloEnum) {
    const empresa_id = req.user.empresa_id;
    const ativo = await this.empresaModuloService.isModuloAtivo(empresa_id, modulo);

    return {
      success: true,
      data: { modulo, ativo },
    };
  }

  /**
   * GET /empresas/modulos/plano
   * Retorna plano atual da empresa
   */
  @Get('plano')
  async getPlano(@Request() req) {
    const empresa_id = req.user.empresa_id;
    const plano = await this.empresaModuloService.getPlanoAtual(empresa_id);

    return {
      success: true,
      data: { plano },
    };
  }

  /**
   * POST /empresas/modulos/ativar
   * Ativa módulo para empresa
   */
  @Post('ativar')
  async ativarModulo(@Request() req, @Body() dto: CreateEmpresaModuloDto) {
    const empresa_id = req.user.empresa_id;
    const modulo = await this.empresaModuloService.ativar(empresa_id, dto);

    return {
      success: true,
      message: `Módulo ${dto.modulo} ativado com sucesso`,
      data: modulo,
    };
  }

  /**
   * DELETE /empresas/modulos/:modulo
   * Desativa módulo da empresa
   */
  @Delete(':modulo')
  async desativarModulo(@Request() req, @Param('modulo') modulo: ModuloEnum) {
    const empresa_id = req.user.empresa_id;
    await this.empresaModuloService.desativar(empresa_id, modulo);

    return {
      success: true,
      message: `Módulo ${modulo} desativado com sucesso`,
    };
  }

  /**
   * PATCH /empresas/modulos/:modulo
   * Atualiza dados do módulo
   */
  @Patch(':modulo')
  async atualizarModulo(
    @Request() req,
    @Param('modulo') modulo: ModuloEnum,
    @Body() dto: UpdateEmpresaModuloDto,
  ) {
    const empresa_id = req.user.empresa_id;
    const moduloAtualizado = await this.empresaModuloService.atualizar(empresa_id, modulo, dto);

    return {
      success: true,
      message: `Módulo ${modulo} atualizado com sucesso`,
      data: moduloAtualizado,
    };
  }

  /**
   * POST /empresas/modulos/plano/:plano
   * Ativa plano completo (Starter, Business, Enterprise)
   */
  @Post('plano/:plano')
  async ativarPlano(@Request() req, @Param('plano') plano: PlanoEnum) {
    const empresa_id = req.user.empresa_id;
    await this.empresaModuloService.ativarPlano(empresa_id, plano);

    return {
      success: true,
      message: `Plano ${plano} ativado com sucesso`,
    };
  }
}
