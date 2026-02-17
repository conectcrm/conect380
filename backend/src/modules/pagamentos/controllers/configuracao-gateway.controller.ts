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

@Controller('pagamentos/gateways/configuracoes')
@UseGuards(JwtAuthGuard, EmpresaGuard)
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
  async criar(
    @EmpresaId() empresaId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateConfiguracaoGatewayDto,
  ) {
    return this.configuracaoGatewayService.create(dto, empresaId);
  }

  @Patch(':id')
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateConfiguracaoGatewayDto,
  ) {
    return this.configuracaoGatewayService.update(id, dto, empresaId);
  }

  @Delete(':id')
  async remover(@EmpresaId() empresaId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.configuracaoGatewayService.remove(id, empresaId);
    return { message: 'Configuração removida com sucesso' };
  }
}
