import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { DistribuicaoService } from '../services/distribuicao.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';

/**
 * Controller para distribuicao automatica de tickets
 */
@Controller('atendimento/distribuicao')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class DistribuicaoController {
  private readonly logger = new Logger(DistribuicaoController.name);

  constructor(private readonly distribuicaoService: DistribuicaoService) {}

  @Post(':ticketId')
  async distribuirTicket(@Param('ticketId') ticketId: string, @EmpresaId() empresaId: string) {
    this.logger.log(`POST /atendimento/distribuicao/${ticketId}`);

    const ticket = await this.distribuicaoService.distribuirTicket(ticketId, empresaId);

    return {
      success: true,
      message: ticket.atendenteId
        ? 'Ticket distribuido com sucesso'
        : 'Nenhum atendente disponivel no momento',
      data: ticket,
    };
  }

  @Post('fila/:filaId/redistribuir')
  async redistribuirFila(@Param('filaId') filaId: string, @EmpresaId() empresaId: string) {
    this.logger.log(`POST /atendimento/distribuicao/fila/${filaId}/redistribuir`);

    const resultado = await this.distribuicaoService.redistribuirFila(filaId, empresaId);

    return {
      success: true,
      message: `${resultado.distribuidos} ticket(s) redistribuido(s)`,
      data: resultado,
    };
  }

  @Get('estatisticas')
  async buscarEstatisticas(@EmpresaId() empresaId: string) {
    this.logger.log('GET /atendimento/distribuicao/estatisticas');

    const estatisticas = await this.distribuicaoService.buscarEstatisticas(empresaId);

    return {
      success: true,
      data: estatisticas,
    };
  }

  @Get('filas')
  async listarFilas(@EmpresaId() empresaId: string) {
    this.logger.log('GET /atendimento/distribuicao/filas');

    const filas = await this.distribuicaoService.listarFilas(empresaId);

    return {
      success: true,
      data: filas,
    };
  }

  @Get('configuracao/:filaId')
  async buscarConfiguracao(@Param('filaId') filaId: string, @EmpresaId() empresaId: string) {
    this.logger.log(`GET /atendimento/distribuicao/configuracao/${filaId}`);

    const configuracao = await this.distribuicaoService.buscarConfiguracao(filaId, empresaId);

    return {
      success: true,
      data: configuracao,
    };
  }

  @Patch('configuracao/:filaId')
  async atualizarConfiguracao(
    @Param('filaId') filaId: string,
    @Body() body: { autoDistribuicao: boolean; algoritmo: string },
    @EmpresaId() empresaId: string,
  ) {
    this.logger.log(`PATCH /atendimento/distribuicao/configuracao/${filaId}`);

    const configuracao = await this.distribuicaoService.atualizarConfiguracao(
      filaId,
      empresaId,
      body.autoDistribuicao,
      body.algoritmo,
    );

    return {
      success: true,
      message: 'Configuracao atualizada com sucesso',
      data: configuracao,
    };
  }
}
