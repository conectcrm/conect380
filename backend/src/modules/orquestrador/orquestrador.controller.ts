import { Controller, Get, Post, Body, Param, Query, Put, Delete, UseGuards } from '@nestjs/common';
import { OrquestradorService } from './services/orquestrador.service';
import {
  CreateFluxoAutomatizadoDto,
  UpdateFluxoAutomatizadoDto,
  FiltroFluxosDto,
  EstatisticasFluxoDto,
  ProcessarFluxoDto,
} from './dto/fluxo-automatizado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orquestrador')
@UseGuards(JwtAuthGuard)
export class OrquestradorController {
  constructor(private readonly orquestradorService: OrquestradorService) {}

  /**
   * Iniciar fluxo automatizado para uma proposta aceita
   */
  @Post('fluxos')
  async criarFluxoAutomatizado(@Body() createDto: CreateFluxoAutomatizadoDto) {
    return await this.orquestradorService.criarFluxoAutomatizado(createDto);
  }

  /**
   * Listar fluxos automatizados com filtros
   */
  @Get('fluxos')
  async listarFluxos(@Query() filtros: FiltroFluxosDto) {
    return await this.orquestradorService.listarFluxos(filtros);
  }

  /**
   * Buscar fluxo por ID
   */
  @Get('fluxos/:id')
  async buscarFluxoPorId(@Param('id') id: string) {
    return await this.orquestradorService.buscarPorId(id);
  }

  /**
   * Atualizar fluxo automatizado
   */
  @Put('fluxos/:id')
  async atualizarFluxo(@Param('id') id: string, @Body() updateDto: UpdateFluxoAutomatizadoDto) {
    return await this.orquestradorService.atualizar(id, updateDto);
  }

  /**
   * Processar fluxo manualmente
   */
  @Post('fluxos/:id/processar')
  async processarFluxo(
    @Param('id') id: string,
    @Body() body: { forcarProcessamento?: boolean; parametrosCustomizados?: any },
  ) {
    const processarDto: ProcessarFluxoDto = {
      fluxoId: id,
      forcarProcessamento: body.forcarProcessamento,
      parametrosCustomizados: body.parametrosCustomizados,
    };

    return await this.orquestradorService.processarFluxo(processarDto);
  }

  /**
   * Pausar fluxo automatizado
   */
  @Post('fluxos/:id/pausar')
  async pausarFluxo(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return await this.orquestradorService.pausarFluxo(id, body.motivo);
  }

  /**
   * Retomar fluxo pausado
   */
  @Post('fluxos/:id/retomar')
  async retomarFluxo(@Param('id') id: string) {
    return await this.orquestradorService.retomarFluxo(id);
  }

  /**
   * Cancelar fluxo automatizado
   */
  @Post('fluxos/:id/cancelar')
  async cancelarFluxo(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return await this.orquestradorService.cancelarFluxo(id, body.motivo);
  }

  /**
   * Processar todos os fluxos pendentes manualmente
   */
  @Post('processar-pendentes')
  async processarFluxosPendentes() {
    await this.orquestradorService.processarFluxosPendentes();
    return {
      message: 'Processamento de fluxos pendentes iniciado',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obter estatísticas dos fluxos
   */
  @Get('estatisticas')
  async obterEstatisticas(@Query() filtros: EstatisticasFluxoDto) {
    return await this.orquestradorService.obterEstatisticas(filtros);
  }

  /**
   * Dashboard com resumo geral
   */
  @Get('dashboard')
  async dashboard(@Query('tenantId') tenantId?: string) {
    const filtrosBasicos = tenantId ? { tenantId } : {};

    const [estatisticas, fluxosRecentes, fluxosComErro] = await Promise.all([
      this.orquestradorService.obterEstatisticas(filtrosBasicos),
      this.orquestradorService.listarFluxos({
        ...filtrosBasicos,
        limite: 5,
        ordenarPor: 'createdAt',
        direcao: 'DESC',
      }),
      this.orquestradorService.listarFluxos({ ...filtrosBasicos, comErros: true, limite: 5 }),
    ]);

    return {
      estatisticas,
      fluxosRecentes: fluxosRecentes.fluxos,
      fluxosComErro: fluxosComErro.fluxos,
      resumo: {
        totalFluxos: estatisticas.totalFluxos,
        fluxosAtivos: estatisticas.resumo
          .filter(
            (r) => !['workflow_concluido', 'cancelado', 'erro_processamento'].includes(r.status),
          )
          .reduce((acc, r) => acc + parseInt(r.total), 0),
        taxaSucesso: this.calcularTaxaSucesso(estatisticas.resumo),
        tempoMedioProcessamento: '2.5 horas', // Placeholder - implementar cálculo real
      },
    };
  }

  /**
   * Healthcheck do orquestrador
   */
  @Get('health')
  async healthcheck() {
    return {
      status: 'ok',
      service: 'Orquestrador de Fluxo Automatizado',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  private calcularTaxaSucesso(resumoEstatisticas: any[]): number {
    const total = resumoEstatisticas.reduce((acc, stat) => acc + parseInt(stat.total), 0);
    const concluidos = resumoEstatisticas
      .filter((stat) => stat.status === 'workflow_concluido')
      .reduce((acc, stat) => acc + parseInt(stat.total), 0);

    return total > 0 ? Math.round((concluidos / total) * 100) : 0;
  }
}
