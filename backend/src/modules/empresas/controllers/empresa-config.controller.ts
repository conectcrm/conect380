import { Controller, Get, Put, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmpresaConfigService } from '../services/empresa-config.service';
import { UpdateEmpresaConfigDto } from '../dto/update-empresa-config.dto';

/**
 * Controller REST para configurações de empresa
 * 🔐 SEGURANÇA: empresa_id extraído do JWT (não aceita do path)
 */
@Controller('empresas/config')  // 🔐 Removido :empresaId do path
@UseGuards(AuthGuard('jwt'))  // 🔐 ATIVADO - Proteção global
export class EmpresaConfigController {
  constructor(private readonly configService: EmpresaConfigService) { }

  /**
   * GET /empresas/config
   * Busca configurações da empresa autenticada
   * 🔐 SEGURANÇA: empresaId extraído do JWT
   */
  @Get()
  async getConfig(@Request() req) {
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }
    return await this.configService.getByEmpresaId(empresaId);
  }

  /**
   * PUT /empresas/config
   * Atualiza configurações da empresa autenticada
   * 🔐 SEGURANÇA: empresaId extraído do JWT
   */
  @Put()
  async updateConfig(
    @Request() req,
    @Body() updateDto: UpdateEmpresaConfigDto,
  ) {
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }
    return await this.configService.update(empresaId, updateDto);
  }

  /**
   * POST /empresas/config/reset
   * Restaura configurações para valores padrão
   * 🔐 SEGURANÇA: empresaId extraído do JWT
   */
  @Post('reset')
  async resetConfig(@Request() req) {
    const empresaId = req.user.empresa_id;
    if (!empresaId) {
      throw new ForbiddenException('Usuário não possui empresa associada');
    }
    return await this.configService.resetToDefaults(empresaId);
  }
}
