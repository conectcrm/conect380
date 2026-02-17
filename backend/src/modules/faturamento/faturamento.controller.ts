import { Logger,
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
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
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
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class FaturamentoController {
  private readonly logger = new Logger(FaturamentoController.name);
  constructor(
    private readonly faturamentoService: FaturamentoService,
    private readonly pagamentoService: PagamentoService,
    private readonly cobrancaService: CobrancaService,
  ) {}

  // ==================== FATURAS ====================

  @Post('faturas')
  async criarFatura(@Body() createFaturaDto: CreateFaturaDto, @EmpresaId() empresaId: string) {
    try {
      const fatura = await this.faturamentoService.criarFatura(createFaturaDto, empresaId);
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
  async gerarFaturaAutomatica(
    @Body() gerarFaturaDto: GerarFaturaAutomaticaDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const fatura = await this.faturamentoService.gerarFaturaAutomatica(gerarFaturaDto, empresaId);
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
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusFatura,
    @Query('clienteId') clienteId?: number,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('sortBy') sortBy: 'createdAt' | 'dataVencimento' | 'valorTotal' | 'numero' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filtros = {
      status,
      clienteId: clienteId ? Number(clienteId) : undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      q,
    };

    // Mantém compatibilidade com implementações que esperam paginação flat
    const paginated = await this.faturamentoService.buscarFaturasPaginadas(
      empresaId,
      Number(page) || 1,
      Number(pageSize) || 10,
      sortBy,
      sortOrder,
    );

    return {
      status: HttpStatus.OK,
      message: 'Faturas recuperadas com sucesso',
      data: paginated.faturas,
      total: paginated.total,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      aggregates: paginated.resumo,
      filtros,
    };
  }

  @Get('faturas/paginadas')
  async buscarFaturasPaginadas(
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusFatura,
    @Query('clienteId') clienteId?: number,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('sortBy') sortBy: 'createdAt' | 'dataVencimento' | 'valorTotal' | 'numero' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filtros = {
      status,
      clienteId: clienteId ? Number(clienteId) : undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      q,
    };

    const paginated = await this.faturamentoService.buscarFaturasPaginadas(
      empresaId,
      Number(page) || 1,
      Number(pageSize) || 10,
      sortBy,
      sortOrder,
    );

    return {
      status: HttpStatus.OK,
      message: 'Faturas recuperadas com sucesso',
      data: {
        items: paginated.faturas,
        total: paginated.total,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
        aggregates: paginated.resumo,
        filtros,
      },
    };
  }

  @Get('faturas/:id')
  async buscarFaturaPorId(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const fatura = await this.faturamentoService.buscarFaturaPorId(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Fatura encontrada',
      data: fatura,
    };
  }

  @Get('faturas/numero/:numero')
  async buscarFaturaPorNumero(@Param('numero') numero: string, @EmpresaId() empresaId: string) {
    const fatura = await this.faturamentoService.buscarFaturaPorNumero(numero, empresaId);

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
    @EmpresaId() empresaId: string,
  ) {
    const fatura = await this.faturamentoService.atualizarFatura(id, updateFaturaDto, empresaId);

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
    @EmpresaId() empresaId: string,
  ) {
    const fatura = await this.faturamentoService.marcarComoPaga(id, valorPago, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Fatura marcada como paga',
      data: fatura,
    };
  }

  @Put('faturas/:id/cancelar')
  async cancelarFatura(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body('motivo') motivo?: string,
  ) {
    const fatura = await this.faturamentoService.cancelarFatura(id, empresaId, motivo);

    return {
      status: HttpStatus.OK,
      message: 'Fatura cancelada com sucesso',
      data: fatura,
    };
  }

  @Post('faturas/:id/enviar-email')
  async enviarFaturaPorEmail(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
  ) {
    const sucesso = await this.faturamentoService.enviarFaturaPorEmail(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: sucesso ? 'Fatura enviada por email' : 'Erro ao enviar fatura',
      data: { enviado: sucesso },
    };
  }

  @Delete('faturas/:id')
  async excluirFatura(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    this.logger.log(`🔍 [CONTROLLER] DELETE /faturamento/faturas/${id} - Iniciando exclusão`);

    try {
      this.logger.log(`🔍 [CONTROLLER] Chamando excluirFatura para ID: ${id}`);
      await this.faturamentoService.excluirFatura(id, empresaId);

      this.logger.log(`🔍 [CONTROLLER] Fatura ${id} excluída com sucesso`);
      return {
        status: HttpStatus.OK,
        message: 'Fatura excluída com sucesso',
        data: { id },
      };
    } catch (error) {
      this.logger.log(`🔍 [CONTROLLER] Erro ao excluir fatura ID ${id}: ${error.message}`);
      this.logger.log(`🔍 [CONTROLLER] Stack trace: ${error.stack}`);
      throw new BadRequestException(error.message);
    }
  }

  // ==================== PAGAMENTOS ====================

  @Post('pagamentos')
  async criarPagamento(
    @Body() createPagamentoDto: CreatePagamentoDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const pagamento = await this.pagamentoService.criarPagamento(createPagamentoDto, empresaId);
      return {
        status: HttpStatus.CREATED,
        message: 'Pagamento criado com sucesso',
        data: pagamento,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('pagamentos/processar')
  @HttpCode(HttpStatus.OK)
  async processarPagamento(
    @Body() processarPagamentoDto: ProcessarPagamentoDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const pagamento = await this.pagamentoService.processarPagamento(
        processarPagamentoDto,
        empresaId,
      );
      return {
        status: HttpStatus.OK,
        message: 'Pagamento processado com sucesso',
        data: pagamento,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('pagamentos')
  async buscarPagamentos(
    @EmpresaId() empresaId: string,
    @Query('faturaId') faturaId?: number,
    @Query('status') status?: StatusPagamento,
    @Query('metodoPagamento') metodoPagamento?: string,
    @Query('gateway') gateway?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const filtros = {
      faturaId: faturaId ? Number(faturaId) : undefined,
      status,
      metodoPagamento,
      gateway,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    };

    const pagamentos = await this.pagamentoService.buscarPagamentos(filtros, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Pagamentos recuperados com sucesso',
      data: pagamentos,
      total: pagamentos.length,
    };
  }

  @Get('pagamentos/:id')
  async buscarPagamentoPorId(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
  ) {
    const pagamento = await this.pagamentoService.buscarPagamentoPorId(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Pagamento encontrado',
      data: pagamento,
    };
  }

  @Get('pagamentos/transacao/:transacaoId')
  async buscarPagamentoPorTransacao(
    @Param('transacaoId') transacaoId: string,
    @EmpresaId() empresaId: string,
  ) {
    const pagamento = await this.pagamentoService.buscarPagamentoPorTransacao(
      transacaoId,
      empresaId,
    );

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
    @EmpresaId() empresaId: string,
  ) {
    try {
      const pagamento = await this.pagamentoService.atualizarPagamento(
        id,
        updatePagamentoDto,
        empresaId,
      );

      return {
        status: HttpStatus.OK,
        message: 'Pagamento atualizado com sucesso',
        data: pagamento,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('pagamentos/:id/estornar')
  async estornarPagamento(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @EmpresaId() empresaId: string,
  ) {
    const estorno = await this.pagamentoService.estornarPagamento(id, motivo, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Estorno processado com sucesso',
      data: estorno,
    };
  }

  @Get('pagamentos/estatisticas')
  async obterEstatisticasPagamentos(
    @EmpresaId() empresaId: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('gateway') gateway?: string,
  ) {
    const filtros = {
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      gateway,
    };

    const estatisticas = await this.pagamentoService.obterEstatisticasPagamentos(
      filtros,
      empresaId,
    );

    return {
      status: HttpStatus.OK,
      message: 'Estatísticas recuperadas com sucesso',
      data: estatisticas,
    };
  }

  // ==================== PLANOS DE COBRANÇA ====================

  @Post('planos-cobranca')
  async criarPlanoCobranca(
    @Body() createPlanoDto: CreatePlanoCobrancaDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const plano = await this.cobrancaService.criarPlanoCobranca(createPlanoDto, empresaId);
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
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusPlanoCobranca,
    @Query('clienteId') clienteId?: number,
    @Query('contratoId') contratoId?: number,
  ) {
    const filtros = { status, clienteId, contratoId };
    const planos = await this.cobrancaService.buscarPlanosCobranca(empresaId, filtros);

    return {
      status: HttpStatus.OK,
      message: 'Planos de cobrança recuperados com sucesso',
      data: planos,
      total: planos.length,
    };
  }

  @Get('planos-cobranca/:id')
  async buscarPlanoPorId(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.buscarPlanoPorId(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança encontrado',
      data: plano,
    };
  }

  @Get('planos-cobranca/codigo/:codigo')
  async buscarPlanoPorCodigo(@Param('codigo') codigo: string, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.buscarPlanoPorCodigo(codigo, empresaId);

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
    @EmpresaId() empresaId: string,
  ) {
    const plano = await this.cobrancaService.atualizarPlanoCobranca(id, updatePlanoDto, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança atualizado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/pausar')
  async pausarPlanoCobranca(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.pausarPlanoCobranca(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança pausado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/reativar')
  async reativarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
  ) {
    const plano = await this.cobrancaService.reativarPlanoCobranca(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança reativado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/cancelar')
  async cancelarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body('motivo') motivo?: string,
  ) {
    const plano = await this.cobrancaService.cancelarPlanoCobranca(id, empresaId, motivo);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança cancelado com sucesso',
      data: plano,
    };
  }

  @Post('planos-cobranca/:id/gerar-fatura')
  async gerarFaturaRecorrente(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    try {
      const plano = await this.cobrancaService.buscarPlanoPorId(id, empresaId);
      const fatura = await this.cobrancaService.gerarFaturaRecorrente(plano, empresaId);

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
  async processarCobrancasRecorrentes(@EmpresaId() empresaId: string) {
    await this.cobrancaService.processarCobrancasRecorrentes(empresaId);

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
  async enviarLembreteVencimento(@EmpresaId() empresaId: string) {
    await this.cobrancaService.enviarLembreteVencimento(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Lembretes de vencimento enviados',
    };
  }
}
