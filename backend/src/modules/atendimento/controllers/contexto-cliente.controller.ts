import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { ContextoClienteService } from '../services/contexto-cliente.service';
import { ContextoClienteQueryDto, ContextoClienteResponseDto } from '../dto/contexto-cliente.dto';

@Controller('api/atendimento/clientes')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_CHATS_READ)
export class ContextoClienteController {
  private readonly logger = new Logger(ContextoClienteController.name);

  constructor(private readonly contextoClienteService: ContextoClienteService) {}

  @Get(':clienteId/contexto')
  async obterContextoCompleto(
    @Param('clienteId') clienteId: string,
    @Query() _query: ContextoClienteQueryDto,
    @EmpresaId() empresaId: string,
  ): Promise<ContextoClienteResponseDto> {
    this.logger.log(`GET /api/atendimento/clientes/${clienteId}/contexto`);
    return this.contextoClienteService.obterContextoCompleto(clienteId, empresaId);
  }

  @Get('por-telefone/:telefone/contexto')
  async obterContextoPorTelefone(
    @Param('telefone') telefone: string,
    @Query() _query: ContextoClienteQueryDto,
    @EmpresaId() empresaId: string,
  ): Promise<ContextoClienteResponseDto> {
    this.logger.log(`GET /api/atendimento/clientes/por-telefone/${telefone}/contexto`);
    return this.contextoClienteService.obterContextoPorTelefone(telefone, empresaId);
  }

  @Get(':clienteId/estatisticas')
  async obterEstatisticas(
    @Param('clienteId') clienteId: string,
    @EmpresaId() empresaId: string,
  ): Promise<ContextoClienteResponseDto['estatisticas']> {
    this.logger.log(`GET /api/atendimento/clientes/${clienteId}/estatisticas`);
    return this.contextoClienteService.obterEstatisticas(clienteId, empresaId);
  }

  @Get(':clienteId/historico')
  async obterHistorico(
    @Param('clienteId') clienteId: string,
    @EmpresaId() empresaId: string,
  ): Promise<ContextoClienteResponseDto['historico']> {
    this.logger.log(`GET /api/atendimento/clientes/${clienteId}/historico`);
    return this.contextoClienteService.obterHistorico2(clienteId, empresaId);
  }
}
