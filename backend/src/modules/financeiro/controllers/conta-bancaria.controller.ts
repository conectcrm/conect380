import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  CreateContaBancariaDto,
  QueryContasBancariasDto,
  UpdateContaBancariaDto,
} from '../dto/conta-bancaria.dto';
import { ContaBancariaService } from '../services/conta-bancaria.service';

@Controller('contas-bancarias')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class ContaBancariaController {
  constructor(private readonly contaBancariaService: ContaBancariaService) {}

  @Get()
  async findAll(@EmpresaId() empresaId: string, @Query() query: QueryContasBancariasDto) {
    return this.contaBancariaService.findAll(empresaId, query);
  }

  @Get('ativas')
  async findAtivas(@EmpresaId() empresaId: string) {
    return this.contaBancariaService.findAtivas(empresaId);
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.contaBancariaService.findOne(id, empresaId);
  }

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async create(@EmpresaId() empresaId: string, @Body() dto: CreateContaBancariaDto) {
    return this.contaBancariaService.create(dto, empresaId);
  }

  @Put(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContaBancariaDto,
  ) {
    return this.contaBancariaService.update(id, dto, empresaId);
  }

  @Patch(':id/desativar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async desativar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const contaBancaria = await this.contaBancariaService.desativar(id, empresaId);
    return {
      message: 'Conta bancaria desativada com sucesso',
      contaBancaria,
    };
  }

  @Delete(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.contaBancariaService.remove(id, empresaId);
    return {
      success: true,
      message: 'Conta bancaria excluida com sucesso',
    };
  }
}
