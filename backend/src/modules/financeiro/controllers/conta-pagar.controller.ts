import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import {
  CreateContaPagarDto,
  QueryContasPagarDto,
  RegistrarPagamentoContaPagarDto,
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

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.contaPagarService.findOne(id, empresaId);
  }

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async create(@EmpresaId() empresaId: string, @Body() dto: CreateContaPagarDto) {
    return this.contaPagarService.create(dto, empresaId);
  }

  @Put(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContaPagarDto,
  ) {
    return this.contaPagarService.update(id, dto, empresaId);
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
  ) {
    return this.contaPagarService.registrarPagamento(id, dto, empresaId);
  }
}
