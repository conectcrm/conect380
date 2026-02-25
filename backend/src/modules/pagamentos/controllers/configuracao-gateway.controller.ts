import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ConfiguracaoGatewayService } from '../services/configuracao-gateway.service';
import {
  CreateConfiguracaoGatewayDto,
  ListConfiguracoesGatewayDto,
  UpdateConfiguracaoGatewayDto,
} from '../dto/configuracao-gateway.dto';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';

@Controller('pagamentos/gateways/configuracoes')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class ConfiguracaoGatewayController {
  constructor(private readonly configuracaoGatewayService: ConfiguracaoGatewayService) {}

  @Get()
  async listar(
    @EmpresaId() empresaId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filtros: ListConfiguracoesGatewayDto,
  ) {
    return this.configuracaoGatewayService.findAll(empresaId, filtros);
  }

  @Get(':id')
  async obter(@EmpresaId() empresaId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.configuracaoGatewayService.findOne(id, empresaId);
  }

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async criar(
    @EmpresaId() empresaId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateConfiguracaoGatewayDto,
  ) {
    return this.configuracaoGatewayService.create(dto, empresaId);
  }

  @Patch(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateConfiguracaoGatewayDto,
  ) {
    return this.configuracaoGatewayService.update(id, dto, empresaId);
  }

  @Delete(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async remover(@EmpresaId() empresaId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.configuracaoGatewayService.remove(id, empresaId);
    return { message: 'Configuração removida com sucesso' };
  }
}
