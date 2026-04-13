import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ComissoesService } from './comissoes.service';
import { PropostaComissaoConfigDto } from './dto/proposta-comissao-config.dto';

@Controller('comissoes')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
export class ComissoesController {
  constructor(private readonly comissoesService: ComissoesService) {}

  @Get('lancamentos')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
  async listarLancamentos(
    @EmpresaId() empresaId: string,
    @Query('competenciaAno') competenciaAno?: string,
    @Query('competenciaMes') competenciaMes?: string,
    @Query('status') status?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('propostaId') propostaId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.comissoesService.listarLancamentos({
      empresaId,
      competenciaAno: competenciaAno ? Number(competenciaAno) : undefined,
      competenciaMes: competenciaMes ? Number(competenciaMes) : undefined,
      status: status ? String(status).trim() : undefined,
      usuarioId: usuarioId ? String(usuarioId).trim() : undefined,
      propostaId: propostaId ? String(propostaId).trim() : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('minhas')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
  async listarMinhasComissoes(
    @EmpresaId() empresaId: string,
    @CurrentUser() user?: { id?: string; sub?: string },
    @Query('competenciaAno') competenciaAno?: string,
    @Query('competenciaMes') competenciaMes?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const usuarioId = String(user?.id || user?.sub || '').trim();
    if (!usuarioId) {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    return this.comissoesService.listarLancamentos({
      empresaId,
      usuarioId,
      competenciaAno: competenciaAno ? Number(competenciaAno) : undefined,
      competenciaMes: competenciaMes ? Number(competenciaMes) : undefined,
      status: status ? String(status).trim() : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('propostas/:propostaId/config')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
  async obterConfigProposta(
    @Param('propostaId') propostaId: string,
    @EmpresaId() empresaId: string,
  ) {
    const config = await this.comissoesService.obterConfigProposta(String(propostaId).trim(), empresaId);
    return { propostaId, config };
  }

  @Post('propostas/:propostaId/config')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async salvarConfigProposta(
    @Param('propostaId') propostaId: string,
    @Body() body: PropostaComissaoConfigDto,
    @EmpresaId() empresaId: string,
    @CurrentUser() user?: { id?: string; sub?: string },
  ) {
    const actorId = user?.id || user?.sub || null;
    const config = await this.comissoesService.salvarConfigProposta(String(propostaId).trim(), empresaId, body as any);
    return { propostaId, config, atualizadoPor: actorId };
  }
}
