import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { DistribuicaoService } from '../services/distribuicao.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

/**
 * Controller para distribuição automática de tickets
 * 
 * Endpoints:
 * - POST /atendimento/distribuicao/:ticketId - Distribuir 1 ticket
 * - POST /atendimento/distribuicao/fila/:filaId/redistribuir - Redistribuir fila inteira
 * - GET /atendimento/distribuicao/estatisticas - Buscar estatísticas
 * - GET /atendimento/distribuicao/configuracao/:filaId - Buscar configuração de fila
 * - PATCH /atendimento/distribuicao/configuracao/:filaId - Atualizar configuração de fila
 */
@Controller('atendimento/distribuicao')
@UseGuards(JwtAuthGuard)
export class DistribuicaoController {
  private readonly logger = new Logger(DistribuicaoController.name);

  constructor(private readonly distribuicaoService: DistribuicaoService) { }

  /**
   * Distribui um ticket específico para um atendente disponível
   * 
   * @param ticketId - ID do ticket a ser distribuído
   * @returns Ticket atualizado com atendenteId
   */
  @Post(':ticketId')
  async distribuirTicket(@Param('ticketId') ticketId: string) {
    this.logger.log(`📨 POST /atendimento/distribuicao/${ticketId}`);

    const ticket = await this.distribuicaoService.distribuirTicket(ticketId);

    return {
      success: true,
      message: ticket.atendenteId
        ? 'Ticket distribuído com sucesso'
        : 'Nenhum atendente disponível no momento',
      data: ticket,
    };
  }

  /**
   * Redistribui todos os tickets pendentes de uma fila
   * 
   * @param filaId - ID da fila a ser redistribuída
   * @returns Número de tickets redistribuídos
   */
  @Post('fila/:filaId/redistribuir')
  async redistribuirFila(@Param('filaId') filaId: string) {
    this.logger.log(`📨 POST /atendimento/distribuicao/fila/${filaId}/redistribuir`);

    const resultado = await this.distribuicaoService.redistribuirFila(filaId);

    return {
      success: true,
      message: `${resultado.distribuidos} ticket(s) redistribuído(s)`,
      data: resultado,
    };
  }

  /**
   * Busca estatísticas de distribuição para o dashboard
   * 
   * @param empresaId - ID da empresa (query param)
   * @returns Estatísticas de tickets e atendentes
   */
  @Get('estatisticas')
  async buscarEstatisticas(@Query('empresaId') empresaId: string) {
    this.logger.log(`📊 GET /atendimento/distribuicao/estatisticas?empresaId=${empresaId}`);

    const estatisticas = await this.distribuicaoService.buscarEstatisticas(empresaId);

    return {
      success: true,
      data: estatisticas,
    };
  }

  /**
   * Lista todas as filas disponíveis para seleção
   * 
   * @param empresaId - ID da empresa (query param)
   * @returns Lista de filas
   */
  @Get('filas')
  async listarFilas(@Query('empresaId') empresaId: string) {
    this.logger.log(`📋 GET /atendimento/distribuicao/filas?empresaId=${empresaId}`);

    const filas = await this.distribuicaoService.listarFilas(empresaId);

    return {
      success: true,
      data: filas,
    };
  }

  /**
   * Busca configuração de auto-distribuição de uma fila
   * 
   * @param filaId - ID da fila
   * @param empresaId - ID da empresa (query param)
   * @returns Configuração da fila
   */
  @Get('configuracao/:filaId')
  async buscarConfiguracao(
    @Param('filaId') filaId: string,
    @Query('empresaId') empresaId: string,
  ) {
    this.logger.log(`⚙️ GET /atendimento/distribuicao/configuracao/${filaId}?empresaId=${empresaId}`);

    const configuracao = await this.distribuicaoService.buscarConfiguracao(filaId, empresaId);

    return {
      success: true,
      data: configuracao,
    };
  }

  /**
   * Atualiza configuração de auto-distribuição de uma fila
   * 
   * @param filaId - ID da fila
   * @param body - { empresaId, autoDistribuicao, algoritmo }
   * @returns Configuração atualizada
   */
  @Patch('configuracao/:filaId')
  async atualizarConfiguracao(
    @Param('filaId') filaId: string,
    @Body() body: { empresaId: string; autoDistribuicao: boolean; algoritmo: string },
  ) {
    this.logger.log(`💾 PATCH /atendimento/distribuicao/configuracao/${filaId}`);

    const configuracao = await this.distribuicaoService.atualizarConfiguracao(
      filaId,
      body.empresaId,
      body.autoDistribuicao,
      body.algoritmo,
    );

    return {
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: configuracao,
    };
  }
}
