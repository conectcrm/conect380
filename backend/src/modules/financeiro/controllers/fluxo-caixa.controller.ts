import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { QueryFluxoCaixaDto } from '../dto/fluxo-caixa.dto';
import { FluxoCaixaService } from '../services/fluxo-caixa.service';

@Controller('financeiro/fluxo-caixa')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
export class FluxoCaixaController {
  constructor(private readonly fluxoCaixaService: FluxoCaixaService) {}

  @Get('resumo')
  async obterResumo(@EmpresaId() empresaId: string, @Query() query: QueryFluxoCaixaDto) {
    return this.fluxoCaixaService.obterResumo(empresaId, query);
  }

  @Get('projecao')
  async obterProjecao(@EmpresaId() empresaId: string, @Query() query: QueryFluxoCaixaDto) {
    return this.fluxoCaixaService.obterProjecao(empresaId, query);
  }
}
