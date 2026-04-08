import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import {
  QueryContasReceberDto,
  ReenviarCobrancaContaReceberDto,
  RegistrarRecebimentoContaReceberDto,
} from '../dto/conta-receber.dto';
import { ContaReceberService } from '../services/conta-receber.service';

@Controller('contas-receber')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
export class ContaReceberController {
  constructor(private readonly contaReceberService: ContaReceberService) {}

  @Get()
  async findAll(@EmpresaId() empresaId: string, @Query() query: QueryContasReceberDto) {
    return this.contaReceberService.findAll(empresaId, query);
  }

  @Get('resumo')
  async obterResumo(@EmpresaId() empresaId: string, @Query() query: QueryContasReceberDto) {
    return this.contaReceberService.obterResumo(empresaId, query);
  }

  @Post(':id/registrar-recebimento')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async registrarRecebimento(
    @EmpresaId() empresaId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarRecebimentoContaReceberDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaReceberService.registrarRecebimento(id, dto, empresaId, userId);
  }

  @Post(':id/reenviar-cobranca')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async reenviarCobranca(
    @EmpresaId() empresaId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReenviarCobrancaContaReceberDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub || 'sistema';
    return this.contaReceberService.reenviarCobranca(id, dto, empresaId, userId);
  }
}
