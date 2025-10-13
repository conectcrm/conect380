import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ContextoClienteService } from '../services/contexto-cliente.service';
import { ContextoClienteQueryDto, ContextoClienteResponseDto } from '../dto/contexto-cliente.dto';

@Controller('api/atendimento/clientes')
@UseGuards(JwtAuthGuard)
export class ContextoClienteController {
  private readonly logger = new Logger(ContextoClienteController.name);

  constructor(
    private readonly contextoClienteService: ContextoClienteService,
  ) { }

  /**
   * GET /api/atendimento/clientes/:clienteId/contexto
   * Obter contexto completo do cliente (dados + estatísticas + histórico)
   */
  @Get(':clienteId/contexto')
  async obterContextoCompleto(
    @Param('clienteId') clienteId: string,
    @Query() query: ContextoClienteQueryDto,
  ): Promise<ContextoClienteResponseDto> {
    this.logger.log(`📊 GET /api/atendimento/clientes/${clienteId}/contexto`);

    return this.contextoClienteService.obterContextoCompleto(
      clienteId,
      query.empresaId,
    );
  }

  /**
   * GET /api/atendimento/clientes/por-telefone/:telefone/contexto
   * Obter contexto completo do cliente por telefone (fallback quando não temos UUID)
   */
  @Get('por-telefone/:telefone/contexto')
  async obterContextoPorTelefone(
    @Param('telefone') telefone: string,
    @Query() query: ContextoClienteQueryDto,
  ): Promise<ContextoClienteResponseDto> {
    this.logger.log(`📞 GET /api/atendimento/clientes/por-telefone/${telefone}/contexto`);

    return this.contextoClienteService.obterContextoPorTelefone(
      telefone,
      query.empresaId,
    );
  }

  /**
   * GET /api/atendimento/clientes/:clienteId/estatisticas
   * Obter apenas estatísticas do cliente
   */
  @Get(':clienteId/estatisticas')
  async obterEstatisticas(
    @Param('clienteId') clienteId: string,
    @Query('empresaId') empresaId?: string,
  ): Promise<ContextoClienteResponseDto['estatisticas']> {
    this.logger.log(`📈 GET /api/atendimento/clientes/${clienteId}/estatisticas`);

    return this.contextoClienteService.obterEstatisticas(clienteId, empresaId);
  }

  /**
   * GET /api/atendimento/clientes/:clienteId/historico
   * Obter apenas histórico do cliente
   */
  @Get(':clienteId/historico')
  async obterHistorico(
    @Param('clienteId') clienteId: string,
    @Query('empresaId') empresaId?: string,
  ): Promise<ContextoClienteResponseDto['historico']> {
    this.logger.log(`📜 GET /api/atendimento/clientes/${clienteId}/historico`);

    return this.contextoClienteService.obterHistorico2(clienteId, empresaId);
  }
}
