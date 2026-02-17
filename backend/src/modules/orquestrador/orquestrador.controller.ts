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
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@Controller('orquestrador')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class OrquestradorController {
  constructor(private readonly orquestradorService: OrquestradorService) {}

  /**
   * Iniciar fluxo automatizado para uma proposta aceita
   */
  @Post('fluxos')
  async criarFluxoAutomatizado(
    @EmpresaId() empresaId: string,
    @Body() createDto: CreateFluxoAutomatizadoDto,
  ) {
    return await this.orquestradorService.criarFluxoAutomatizado({
      ...createDto,
      tenantId: empresaId,
    });
  }

  /**
   * Listar fluxos automatizados com filtros
   */
  @Get('fluxos')
  async listarFluxos(@EmpresaId() empresaId: string, @Query() filtros: FiltroFluxosDto) {
    return await this.orquestradorService.listarFluxos({
      ...filtros,
      tenantId: empresaId,
    });
  }

  /**
   * Buscar fluxo por ID
   */
  @Get('fluxos/:id')
  async buscarFluxoPorId(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return await this.orquestradorService.buscarPorId(id, empresaId);
  }

  /**
   * Atualizar fluxo automatizado
   */
  @Put('fluxos/:id')
  async atualizarFluxo(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateFluxoAutomatizadoDto,
  ) {
    return await this.orquestradorService.atualizar(id, updateDto, empresaId);
  }

  /**
   * Processar fluxo manualmente
   */
  @Post('fluxos/:id/processar')
  async processarFluxo(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() body: { forcarProcessamento?: boolean; parametrosCustomizados?: any },
  ) {
    const processarDto: ProcessarFluxoDto = {
      fluxoId: id,
      forcarProcessamento: body.forcarProcessamento,
      parametrosCustomizados: body.parametrosCustomizados,
    };

    return await this.orquestradorService.processarFluxo(processarDto, empresaId);
  }

  /**
   * Pausar fluxo automatizado
   */
  @Post('fluxos/:id/pausar')
  async pausarFluxo(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() body: { motivo?: string },
  ) {
    return await this.orquestradorService.pausarFluxo(id, body.motivo, empresaId);
  }

  /**
   * Retomar fluxo pausado
   */
  @Post('fluxos/:id/retomar')
  async retomarFluxo(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return await this.orquestradorService.retomarFluxo(id, empresaId);
  }

  /**
   * Cancelar fluxo automatizado
   */
  @Post('fluxos/:id/cancelar')
  async cancelarFluxo(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() body: { motivo?: string },
  ) {
    return await this.orquestradorService.cancelarFluxo(id, body.motivo, empresaId);
  }

  /**
   * Processar todos os fluxos pendentes manualmente
   */
  @Post('processar-pendentes')
  async processarFluxosPendentes(@EmpresaId() empresaId: string) {
    await this.orquestradorService.processarFluxosPendentes(empresaId);
    return {
      message: 'Processamento de fluxos pendentes iniciado',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obter estatisticas dos fluxos
   */
  @Get('estatisticas')
  async obterEstatisticas(@EmpresaId() empresaId: string, @Query() filtros: EstatisticasFluxoDto) {
    return await this.orquestradorService.obterEstatisticas({
      ...filtros,
      tenantId: empresaId,
    });
  }

  /**
   * Dashboard com resumo geral
   */
  @Get('dashboard')
  async dashboard(@EmpresaId() empresaId: string) {
    const filtrosBasicos = { tenantId: empresaId };

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
        tempoMedioProcessamento: '2.5 horas', // Placeholder - implementar calculo real
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
