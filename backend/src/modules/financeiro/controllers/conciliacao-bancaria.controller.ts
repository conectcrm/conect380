import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  ConciliarItemExtratoDto,
  DesconciliarItemExtratoDto,
  ExecutarMatchingAutomaticoDto,
  ImportarExtratoBancarioDto,
  QueryCandidatosConciliacaoDto,
  QueryImportacoesExtratoDto,
  QueryItensImportacaoExtratoDto,
} from '../dto/conciliacao-bancaria.dto';
import { ConciliacaoBancariaService } from '../services/conciliacao-bancaria.service';

@Controller('conciliacao-bancaria')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class ConciliacaoBancariaController {
  constructor(private readonly conciliacaoBancariaService: ConciliacaoBancariaService) {}

  @Get('importacoes')
  async listarImportacoes(
    @EmpresaId() empresaId: string,
    @Query() query: QueryImportacoesExtratoDto,
  ) {
    return this.conciliacaoBancariaService.listarImportacoes(empresaId, query);
  }

  @Get('importacoes/:id/itens')
  async listarItensImportacao(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Query() query: QueryItensImportacaoExtratoDto,
  ) {
    return this.conciliacaoBancariaService.listarItensImportacao(id, empresaId, query);
  }

  @Get('itens/:id/candidatos')
  async listarCandidatosConciliacao(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Query() query: QueryCandidatosConciliacaoDto,
  ) {
    return this.conciliacaoBancariaService.listarCandidatosConciliacao(id, empresaId, query);
  }

  @Post('importacoes')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarExtrato(
    @EmpresaId() empresaId: string,
    @Body() dto: ImportarExtratoBancarioDto,
    @UploadedFile() arquivo: Express.Multer.File,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.conciliacaoBancariaService.importarExtrato(dto, arquivo, empresaId, userId);
  }

  @Post('importacoes/:id/matching-automatico')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async executarMatchingAutomatico(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: ExecutarMatchingAutomaticoDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.conciliacaoBancariaService.executarMatchingAutomatico(id, empresaId, userId, dto);
  }

  @Post('itens/:id/conciliar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async conciliarItem(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: ConciliarItemExtratoDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.conciliacaoBancariaService.conciliarItemManual(id, dto, empresaId, userId);
  }

  @Post('itens/:id/desconciliar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async desconciliarItem(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: DesconciliarItemExtratoDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.conciliacaoBancariaService.desconciliarItemManual(id, dto, empresaId, userId);
  }
}
