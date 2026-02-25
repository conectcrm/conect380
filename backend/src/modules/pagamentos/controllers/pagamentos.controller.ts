import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PagamentosGatewayService } from '../services/pagamentos.service';
import {
  CreateTransacaoGatewayDto,
  ListTransacoesGatewayDto,
  UpdateTransacaoGatewayDto,
} from '../dto/transacao-gateway.dto';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';

@Controller('pagamentos/gateways/transacoes')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
export class GatewayTransacoesController {
  constructor(private readonly pagamentosGatewayService: PagamentosGatewayService) {}

  @Get()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
  async listar(
    @EmpresaId() empresaId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filtros: ListTransacoesGatewayDto,
  ) {
    return this.pagamentosGatewayService.listarTransacoes(empresaId, filtros);
  }

  @Get(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
  async obter(@EmpresaId() empresaId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.pagamentosGatewayService.obterTransacao(id, empresaId);
  }

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async criar(
    @EmpresaId() empresaId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateTransacaoGatewayDto,
  ) {
    return this.pagamentosGatewayService.registrarTransacao(dto, empresaId);
  }

  @Patch(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateTransacaoGatewayDto,
  ) {
    return this.pagamentosGatewayService.atualizarTransacao(id, dto, empresaId);
  }
}
