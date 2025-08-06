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
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FaturamentoService } from './services/faturamento.service';
import { PagamentoService } from './services/pagamento.service';
import { CobrancaService } from './services/cobranca.service';
import { CreateFaturaDto, UpdateFaturaDto, GerarFaturaAutomaticaDto } from './dto/fatura.dto';
import { CreatePagamentoDto, UpdatePagamentoDto, ProcessarPagamentoDto } from './dto/pagamento.dto';
import { CreatePlanoCobrancaDto, UpdatePlanoCobrancaDto } from './dto/plano-cobranca.dto';
import { StatusFatura } from './entities/fatura.entity';
import { StatusPagamento } from './entities/pagamento.entity';
import { StatusPlanoCobranca } from './entities/plano-cobranca.entity';

@Controller('faturamento')
@UseGuards(JwtAuthGuard)
export class FaturamentoController {
  constructor(
    private readonly faturamentoService: FaturamentoService,
    private readonly pagamentoService: PagamentoService,
    private readonly cobrancaService: CobrancaService,
  ) { }

  // ==================== FATURAS ====================

  @Post('faturas')
  async criarFatura(@Body() createFaturaDto: CreateFaturaDto) {
    try {
      const fatura = await this.faturamentoService.criarFatura(createFaturaDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Fatura criada com sucesso',
        data: fatura,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('faturas/automatica')
  async gerarFaturaAutomatica(@Body() gerarFaturaDto: GerarFaturaAutomaticaDto) {
    try {
      const fatura = await this.faturamentoService.gerarFaturaAutomatica(gerarFaturaDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Fatura automática gerada com sucesso',
        data: fatura,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('faturas')
  async buscarFaturas(
    @Query('status') status?: StatusFatura,
    @Query('clienteId') clienteId?: number,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const filtros = {
      status,
      clienteId,
      contratoId,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    };

    const faturas = await this.faturamentoService.buscarFaturas(filtros);

    return {
      status: HttpStatus.OK,
      message: 'Faturas recuperadas com sucesso',
      data: faturas,
      total: faturas.length,
    };
  }

  @Get('faturas/:id')
  async buscarFaturaPorId(@Param('id', ParseIntPipe) id: number) {
    const fatura = await this.faturamentoService.buscarFaturaPorId(id);

    return {
      status: HttpStatus.OK,
      message: 'Fatura encontrada',
      data: fatura,
    };
  }

  @Get('faturas/numero/:numero')
  async buscarFaturaPorNumero(@Param('numero') numero: string) {
    const fatura = await this.faturamentoService.buscarFaturaPorNumero(numero);

    return {
      status: HttpStatus.OK,
      message: 'Fatura encontrada',
      data: fatura,
    };
  }

  @Put('faturas/:id')
  async atualizarFatura(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFaturaDto: UpdateFaturaDto,
  ) {
    const fatura = await this.faturamentoService.atualizarFatura(id, updateFaturaDto);

    return {
      status: HttpStatus.OK,
      message: 'Fatura atualizada com sucesso',
      data: fatura,
    };
  }

  @Put('faturas/:id/pagar')
  async marcarComoPaga(
    @Param('id', ParseIntPipe) id: number,
    @Body('valorPago') valorPago: number,
  ) {
    const fatura = await this.faturamentoService.marcarComoPaga(id, valorPago);

    return {
      status: HttpStatus.OK,
      message: 'Fatura marcada como paga',
      data: fatura,
    };
  }

  @Put('faturas/:id/cancelar')
  async cancelarFatura(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo?: string,
  ) {
    const fatura = await this.faturamentoService.cancelarFatura(id, motivo);

    return {
      status: HttpStatus.OK,
      message: 'Fatura cancelada com sucesso',
      data: fatura,
    };
  }

  @Post('faturas/:id/enviar-email')
  async enviarFaturaPorEmail(@Param('id', ParseIntPipe) id: number) {
    const sucesso = await this.faturamentoService.enviarFaturaPorEmail(id);

    return {
      status: HttpStatus.OK,
      message: sucesso ? 'Fatura enviada por email' : 'Erro ao enviar fatura',
      data: { enviado: sucesso },
    };
  }

  // ==================== PAGAMENTOS ====================

  @Post('pagamentos')
  async criarPagamento(@Body() createPagamentoDto: CreatePagamentoDto) {
    try {
      const pagamento = await this.pagamentoService.criarPagamento(createPagamentoDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Pagamento criado com sucesso',
        data: pagamento,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('pagamentos/processar')
  async processarPagamento(@Body() processarPagamentoDto: ProcessarPagamentoDto) {
    try {
      const pagamento = await this.pagamentoService.processarPagamento(processarPagamentoDto);
      return {
        status: HttpStatus.OK,
        message: 'Pagamento processado com sucesso',
        data: pagamento,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('pagamentos')
  async buscarPagamentos(
    @Query('faturaId') faturaId?: number,
    @Query('status') status?: StatusPagamento,
    @Query('metodoPagamento') metodoPagamento?: string,
    @Query('gateway') gateway?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const filtros = {
      faturaId,
      status,
      metodoPagamento,
      gateway,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    };

    const pagamentos = await this.pagamentoService.buscarPagamentos(filtros);

    return {
      status: HttpStatus.OK,
      message: 'Pagamentos recuperados com sucesso',
      data: pagamentos,
      total: pagamentos.length,
    };
  }

  @Get('pagamentos/:id')
  async buscarPagamentoPorId(@Param('id', ParseIntPipe) id: number) {
    const pagamento = await this.pagamentoService.buscarPagamentoPorId(id);

    return {
      status: HttpStatus.OK,
      message: 'Pagamento encontrado',
      data: pagamento,
    };
  }

  @Get('pagamentos/transacao/:transacaoId')
  async buscarPagamentoPorTransacao(@Param('transacaoId') transacaoId: string) {
    const pagamento = await this.pagamentoService.buscarPagamentoPorTransacao(transacaoId);

    return {
      status: HttpStatus.OK,
      message: 'Pagamento encontrado',
      data: pagamento,
    };
  }

  @Put('pagamentos/:id')
  async atualizarPagamento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePagamentoDto: UpdatePagamentoDto,
  ) {
    const pagamento = await this.pagamentoService.atualizarPagamento(id, updatePagamentoDto);

    return {
      status: HttpStatus.OK,
      message: 'Pagamento atualizado com sucesso',
      data: pagamento,
    };
  }

  @Post('pagamentos/:id/estornar')
  async estornarPagamento(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
  ) {
    const estorno = await this.pagamentoService.estornarPagamento(id, motivo);

    return {
      status: HttpStatus.OK,
      message: 'Estorno processado com sucesso',
      data: estorno,
    };
  }

  @Get('pagamentos/estatisticas')
  async obterEstatisticasPagamentos(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('gateway') gateway?: string,
  ) {
    const filtros = {
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      gateway,
    };

    const estatisticas = await this.pagamentoService.obterEstatisticasPagamentos(filtros);

    return {
      status: HttpStatus.OK,
      message: 'Estatísticas recuperadas com sucesso',
      data: estatisticas,
    };
  }

  // ==================== PLANOS DE COBRANÇA ====================

  @Post('planos-cobranca')
  async criarPlanoCobranca(@Body() createPlanoDto: CreatePlanoCobrancaDto) {
    try {
      const plano = await this.cobrancaService.criarPlanoCobranca(createPlanoDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Plano de cobrança criado com sucesso',
        data: plano,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('planos-cobranca')
  async buscarPlanosCobranca(
    @Query('status') status?: StatusPlanoCobranca,
    @Query('clienteId') clienteId?: number,
    @Query('contratoId') contratoId?: number,
  ) {
    const filtros = { status, clienteId, contratoId };
    const planos = await this.cobrancaService.buscarPlanosCobranca(filtros);

    return {
      status: HttpStatus.OK,
      message: 'Planos de cobrança recuperados com sucesso',
      data: planos,
      total: planos.length,
    };
  }

  @Get('planos-cobranca/:id')
  async buscarPlanoPorId(@Param('id', ParseIntPipe) id: number) {
    const plano = await this.cobrancaService.buscarPlanoPorId(id);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança encontrado',
      data: plano,
    };
  }

  @Get('planos-cobranca/codigo/:codigo')
  async buscarPlanoPorCodigo(@Param('codigo') codigo: string) {
    const plano = await this.cobrancaService.buscarPlanoPorCodigo(codigo);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança encontrado',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id')
  async atualizarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanoDto: UpdatePlanoCobrancaDto,
  ) {
    const plano = await this.cobrancaService.atualizarPlanoCobranca(id, updatePlanoDto);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança atualizado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/pausar')
  async pausarPlanoCobranca(@Param('id', ParseIntPipe) id: number) {
    const plano = await this.cobrancaService.pausarPlanoCobranca(id);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança pausado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/reativar')
  async reativarPlanoCobranca(@Param('id', ParseIntPipe) id: number) {
    const plano = await this.cobrancaService.reativarPlanoCobranca(id);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança reativado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/cancelar')
  async cancelarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo?: string,
  ) {
    const plano = await this.cobrancaService.cancelarPlanoCobranca(id, motivo);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança cancelado com sucesso',
      data: plano,
    };
  }

  @Post('planos-cobranca/:id/gerar-fatura')
  async gerarFaturaRecorrente(@Param('id', ParseIntPipe) id: number) {
    try {
      const plano = await this.cobrancaService.buscarPlanoPorId(id);
      const fatura = await this.cobrancaService.gerarFaturaRecorrente(plano);

      return {
        status: HttpStatus.CREATED,
        message: 'Fatura recorrente gerada com sucesso',
        data: fatura,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ==================== UTILITÁRIOS ====================

  @Post('processar-cobrancas-recorrentes')
  async processarCobrancasRecorrentes() {
    await this.cobrancaService.processarCobrancasRecorrentes();

    return {
      status: HttpStatus.OK,
      message: 'Processamento de cobranças recorrentes iniciado',
    };
  }

  @Post('verificar-faturas-vencidas')
  async verificarFaturasVencidas() {
    await this.faturamentoService.verificarFaturasVencidas();

    return {
      status: HttpStatus.OK,
      message: 'Verificação de faturas vencidas concluída',
    };
  }

  @Post('enviar-lembretes-vencimento')
  async enviarLembreteVencimento() {
    await this.cobrancaService.enviarLembreteVencimento();

    return {
      status: HttpStatus.OK,
      message: 'Lembretes de vencimento enviados',
    };
  }
}
