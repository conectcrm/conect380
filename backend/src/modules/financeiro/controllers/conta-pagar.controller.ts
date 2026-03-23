import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import {
  AprovarLoteContasPagarDto,
  AprovarContaPagarDto,
  CreateContaPagarDto,
  QueryExportacaoContasPagarDto,
  QueryHistoricoExportacaoContasPagarDto,
  QueryContasPagarDto,
  RegistrarPagamentoContaPagarDto,
  ReprovarContaPagarDto,
  UpdateContaPagarDto,
} from '../dto/conta-pagar.dto';
import { ContaPagarService } from '../services/conta-pagar.service';

@Controller('contas-pagar')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class ContaPagarController {
  constructor(private readonly contaPagarService: ContaPagarService) {}

  @Get()
  async findAll(@EmpresaId() empresaId: string, @Query() query: QueryContasPagarDto) {
    return this.contaPagarService.findAll(empresaId, query);
  }

  @Get('resumo')
  async obterResumo(@EmpresaId() empresaId: string, @Query() query: QueryContasPagarDto) {
    return this.contaPagarService.obterResumo(empresaId, query);
  }

  @Get('aprovacoes/pendentes')
  async listarPendenciasAprovacao(
    @EmpresaId() empresaId: string,
    @Query() query: QueryContasPagarDto,
  ) {
    return this.contaPagarService.listarPendenciasAprovacao(empresaId, query);
  }

  @Get('exportacao')
  async exportarContasPagar(
    @EmpresaId() empresaId: string,
    @Query() query: QueryExportacaoContasPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
    @Res() res: Response,
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    const exportacao = await this.contaPagarService.exportarContasPagar(empresaId, query, userId);
    res.set({
      'Content-Type': exportacao.contentType,
      'Content-Disposition': `attachment; filename="${exportacao.filename}"`,
      'Content-Length': exportacao.buffer.length.toString(),
      'X-Total-Registros': exportacao.totalRegistros.toString(),
    });
    res.send(exportacao.buffer);
  }

  @Get('exportacao/historico')
  async listarHistoricoExportacoes(
    @EmpresaId() empresaId: string,
    @Query() query: QueryHistoricoExportacaoContasPagarDto,
  ) {
    return this.contaPagarService.listarHistoricoExportacoes(empresaId, query);
  }

  @Post('aprovacoes/lote')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async aprovarLote(
    @EmpresaId() empresaId: string,
    @Body() dto: AprovarLoteContasPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaPagarService.aprovarLote(dto, empresaId, userId);
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.contaPagarService.findOne(id, empresaId);
  }

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async create(
    @EmpresaId() empresaId: string,
    @Body() dto: CreateContaPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaPagarService.create(dto, empresaId, userId);
  }

  @Put(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContaPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaPagarService.update(id, dto, empresaId, userId);
  }

  @Delete(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.contaPagarService.remove(id, empresaId);
    return {
      success: true,
      message: 'Conta a pagar excluida com sucesso',
    };
  }

  @Post(':id/registrar-pagamento')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async registrarPagamento(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: RegistrarPagamentoContaPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaPagarService.registrarPagamento(id, dto, empresaId, userId);
  }

  @Post(':id/aprovar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async aprovar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: AprovarContaPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaPagarService.aprovar(id, dto, empresaId, userId);
  }

  @Post(':id/reprovar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async reprovar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: ReprovarContaPagarDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaPagarService.reprovar(id, dto, empresaId, userId);
  }
}
