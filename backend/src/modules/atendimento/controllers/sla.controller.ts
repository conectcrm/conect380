import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { SlaService } from '../services/sla.service';
import { CreateSlaConfigDto } from '../dto/sla/create-sla-config.dto';
import { UpdateSlaConfigDto } from '../dto/sla/update-sla-config.dto';
import { SlaMetricasFilterDto } from '../dto/sla/sla-metricas-filter.dto';

@Controller('atendimento/sla')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  // ==================== CRUD DE CONFIGURAÇÕES ====================

  @Post('configs')
  @HttpCode(HttpStatus.CREATED)
  async criarConfig(@Body() dto: CreateSlaConfigDto, @EmpresaId() empresaId: string) {
    return await this.slaService.criar(dto, empresaId);
  }

  @Get('configs')
  async listarConfigs(@EmpresaId() empresaId: string, @Query('apenasAtivas') apenasAtivas?: string) {
    const filtrarAtivas = apenasAtivas === 'true';
    return await this.slaService.listar(empresaId, filtrarAtivas);
  }

  @Get('configs/:id')
  async buscarConfig(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return await this.slaService.buscarPorId(id, empresaId);
  }

  @Put('configs/:id')
  async atualizarConfig(
    @Param('id') id: string,
    @Body() dto: UpdateSlaConfigDto,
    @EmpresaId() empresaId: string,
  ) {
    return await this.slaService.atualizar(id, dto, empresaId);
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletarConfig(@Param('id') id: string, @EmpresaId() empresaId: string) {
    await this.slaService.deletar(id, empresaId);
  }

  // ==================== CÁLCULOS E MONITORAMENTO ====================

  @Post('tickets/:ticketId/calcular')
  async calcularSlaTicket(
    @Param('ticketId') ticketId: string,
    @Body()
    body: {
      prioridade: string;
      canal: string;
      ticketCriadoEm: string;
    },
    @EmpresaId() empresaId: string,
  ) {
    const ticketCriadoEm = new Date(body.ticketCriadoEm);

    return await this.slaService.calcularSlaTicket(
      ticketId,
      body.prioridade,
      body.canal,
      ticketCriadoEm,
      empresaId,
    );
  }

  @Get('violacoes')
  async buscarViolacoes(@EmpresaId() empresaId: string) {
    return await this.slaService.verificarViolacoes(empresaId);
  }

  @Get('alertas')
  async buscarAlertas(@EmpresaId() empresaId: string) {
    return await this.slaService.buscarAlertas(empresaId);
  }

  // ==================== MÉTRICAS E RELATÓRIOS ====================

  @Get('metricas')
  async buscarMetricas(@EmpresaId() empresaId: string, @Query() filtros?: SlaMetricasFilterDto) {
    return await this.slaService.buscarMetricas(empresaId, filtros);
  }

  @Get('tickets/:ticketId/historico')
  async buscarHistorico(@Param('ticketId') ticketId: string, @EmpresaId() empresaId: string) {
    return await this.slaService.buscarHistorico(ticketId, empresaId);
  }

  // ==================== AÇÕES ====================

  @Post('tickets/:ticketId/alerta')
  @HttpCode(HttpStatus.CREATED)
  async gerarAlerta(
    @Param('ticketId') ticketId: string,
    @Body()
    body: {
      slaConfigId: string;
      percentualUsado: number;
      tempoRespostaMinutos: number;
      tempoLimiteMinutos: number;
    },
    @EmpresaId() empresaId: string,
  ) {
    return await this.slaService.gerarAlerta(
      ticketId,
      body.slaConfigId,
      body.percentualUsado,
      body.tempoRespostaMinutos,
      body.tempoLimiteMinutos,
      empresaId,
    );
  }

  @Post('tickets/:ticketId/violacao')
  @HttpCode(HttpStatus.CREATED)
  async registrarViolacao(
    @Param('ticketId') ticketId: string,
    @Body()
    body: {
      slaConfigId: string;
      tempoRespostaMinutos: number;
      tempoLimiteMinutos: number;
    },
    @EmpresaId() empresaId: string,
  ) {
    return await this.slaService.registrarViolacao(
      ticketId,
      body.slaConfigId,
      body.tempoRespostaMinutos,
      body.tempoLimiteMinutos,
      empresaId,
    );
  }
}
