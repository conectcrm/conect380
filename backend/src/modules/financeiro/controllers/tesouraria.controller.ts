import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import {
  AprovarTransferenciaTesourariaDto,
  CancelarTransferenciaTesourariaDto,
  CriarTransferenciaTesourariaDto,
  QueryTesourariaMovimentacoesDto,
  QueryTesourariaPosicaoDto,
} from '../dto/tesouraria.dto';
import { TesourariaService } from '../services/tesouraria.service';

@Controller('tesouraria')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
export class TesourariaController {
  constructor(private readonly tesourariaService: TesourariaService) {}

  @Get('posicao')
  async obterPosicao(@EmpresaId() empresaId: string, @Query() query: QueryTesourariaPosicaoDto) {
    return this.tesourariaService.obterPosicao(empresaId, query);
  }

  @Get('transferencias')
  async listarMovimentacoes(
    @EmpresaId() empresaId: string,
    @Query() query: QueryTesourariaMovimentacoesDto,
  ) {
    return this.tesourariaService.listarMovimentacoes(empresaId, query);
  }

  @Post('transferencias')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async criarTransferencia(
    @EmpresaId() empresaId: string,
    @Body() dto: CriarTransferenciaTesourariaDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.tesourariaService.criarTransferencia(empresaId, dto, userId);
  }

  @Post('transferencias/:id/aprovar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async aprovarTransferencia(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprovarTransferenciaTesourariaDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.tesourariaService.aprovarTransferencia(id, empresaId, dto, userId);
  }

  @Post('transferencias/:id/cancelar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async cancelarTransferencia(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarTransferenciaTesourariaDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.tesourariaService.cancelarTransferencia(id, empresaId, dto, userId);
  }
}
