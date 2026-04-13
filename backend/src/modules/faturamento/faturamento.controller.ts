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
  Req,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { FaturamentoService } from './services/faturamento.service';
import { PagamentoService } from './services/pagamento.service';
import { CobrancaService } from './services/cobranca.service';
import {
  CreateFaturaDto,
  UpdateFaturaDto,
  GerarFaturaAutomaticaDto,
  GerarCobrancaLoteDto,
  GerarNumeroDocumentoFinanceiroDto,
} from './dto/fatura.dto';
import {
  CreatePagamentoDto,
  UpdatePagamentoDto,
  ProcessarPagamentoDto,
  RegistrarPagamentoManualDto,
} from './dto/pagamento.dto';
import { CreatePlanoCobrancaDto, UpdatePlanoCobrancaDto } from './dto/plano-cobranca.dto';
import { EnvioFaturaEmailOpcoes, ResultadoCobrancaLote } from './services/faturamento.service';
import type { Request, Response } from 'express';

type StatusFatura =
  | 'pendente'
  | 'enviada'
  | 'paga'
  | 'vencida'
  | 'cancelada'
  | 'parcialmente_paga';
type TipoFatura = 'unica' | 'recorrente' | 'parcela' | 'adicional';
type OrigemFatura = 'faturamento' | 'avulso';
type StatusPagamento =
  | 'pendente'
  | 'processando'
  | 'aprovado'
  | 'rejeitado'
  | 'cancelado'
  | 'estornado';
type StatusPlanoCobranca = 'ativo' | 'pausado' | 'cancelado' | 'expirado';

@Controller('faturamento')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
export class FaturamentoController {
  private readonly logger = new Logger(FaturamentoController.name);
  private readonly camposOrdenacaoPermitidos = new Set([
    'createdAt',
    'dataEmissao',
    'dataVencimento',
    'status',
    'valorTotal',
    'numero',
  ]);

  constructor(
    private readonly faturamentoService: FaturamentoService,
    private readonly pagamentoService: PagamentoService,
    private readonly cobrancaService: CobrancaService,
  ) {}

  private sanitizarSortBy(
    sortBy?: string,
  ): 'createdAt' | 'dataEmissao' | 'dataVencimento' | 'status' | 'valorTotal' | 'numero' {
    const valor = String(sortBy || '').trim();
    if (this.camposOrdenacaoPermitidos.has(valor)) {
      return valor as
        | 'createdAt'
        | 'dataEmissao'
        | 'dataVencimento'
        | 'status'
        | 'valorTotal'
        | 'numero';
    }

    return 'createdAt';
  }

  private sanitizarSortOrder(sortOrder?: string): 'ASC' | 'DESC' {
    return String(sortOrder || '').trim().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  }

  private sanitizarDataFiltro(data?: string): string | undefined {
    const valor = String(data || '').trim();
    if (!valor) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor;
    }

    const parsed = new Date(valor);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed.toISOString().slice(0, 10);
  }

  // ==================== FATURAS ====================

  @Post('faturas')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async criarFatura(
    @Body() createFaturaDto: CreateFaturaDto,
    @EmpresaId() empresaId: string,
    @CurrentUser()
    user?: {
      id?: string;
      sub?: string;
      role?: string;
      permissions?: string[];
      permissoes?: string[];
    },
  ) {
    try {
      const actorId = user?.id || user?.sub;
      const fatura = await this.faturamentoService.criarFatura(createFaturaDto, empresaId, {
        id: actorId,
        role: user?.role,
        permissions: Array.isArray(user?.permissions) ? user?.permissions : [],
        permissoes: Array.isArray(user?.permissoes) ? user?.permissoes : [],
      });
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
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async gerarFaturaAutomatica(
    @Body() gerarFaturaDto: GerarFaturaAutomaticaDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const fatura = await this.faturamentoService.gerarFaturaAutomatica(gerarFaturaDto, empresaId);
      return {
        status: HttpStatus.CREATED,
        message: 'Fatura automatica gerada com sucesso',
        data: fatura,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('faturas')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarFaturas(
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusFatura,
    @Query('tipo') tipo?: TipoFatura,
    @Query('origem') origem?: OrigemFatura,
    @Query('clienteId') clienteId?: string,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('periodoCampo') periodoCampo?: 'emissao' | 'vencimento',
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('sortBy')
    sortBy:
      | 'createdAt'
      | 'dataEmissao'
      | 'dataVencimento'
      | 'status'
      | 'valorTotal'
      | 'numero' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const sortBySeguro = this.sanitizarSortBy(sortBy);
    const sortOrderSeguro = this.sanitizarSortOrder(sortOrder);
    const periodoCampoFiltro: 'emissao' | 'vencimento' =
      periodoCampo === 'emissao' ? 'emissao' : 'vencimento';

    const filtros = {
      status: status as any,
      tipo: tipo as any,
      origem: origem as any,
      clienteId: clienteId?.trim() || undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      dataInicio: this.sanitizarDataFiltro(dataInicio),
      dataFim: this.sanitizarDataFiltro(dataFim),
      periodoCampo: periodoCampoFiltro,
      q,
    };

    // Mantem compatibilidade com implementacoes que esperam paginacao flat
    const paginated = await this.faturamentoService.buscarFaturasPaginadas(
      empresaId,
      Number(page) || 1,
      Number(pageSize) || 10,
      sortBySeguro,
      sortOrderSeguro,
      filtros,
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
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarFaturasPaginadas(
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusFatura,
    @Query('tipo') tipo?: TipoFatura,
    @Query('origem') origem?: OrigemFatura,
    @Query('clienteId') clienteId?: string,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('periodoCampo') periodoCampo?: 'emissao' | 'vencimento',
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('sortBy')
    sortBy:
      | 'createdAt'
      | 'dataEmissao'
      | 'dataVencimento'
      | 'status'
      | 'valorTotal'
      | 'numero' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const sortBySeguro = this.sanitizarSortBy(sortBy);
    const sortOrderSeguro = this.sanitizarSortOrder(sortOrder);
    const periodoCampoFiltro: 'emissao' | 'vencimento' =
      periodoCampo === 'emissao' ? 'emissao' : 'vencimento';

    const filtros = {
      status: status as any,
      tipo: tipo as any,
      origem: origem as any,
      clienteId: clienteId?.trim() || undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      dataInicio: this.sanitizarDataFiltro(dataInicio),
      dataFim: this.sanitizarDataFiltro(dataFim),
      periodoCampo: periodoCampoFiltro,
      q,
    };

    const paginated = await this.faturamentoService.buscarFaturasPaginadas(
      empresaId,
      Number(page) || 1,
      Number(pageSize) || 10,
      sortBySeguro,
      sortOrderSeguro,
      filtros,
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
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarFaturaPorId(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const fatura = await this.faturamentoService.buscarFaturaPorId(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Fatura encontrada',
      data: fatura,
    };
  }

  @Get('faturas/numero/:numero')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarFaturaPorNumero(@Param('numero') numero: string, @EmpresaId() empresaId: string) {
    const fatura = await this.faturamentoService.buscarFaturaPorNumero(numero, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Fatura encontrada',
      data: fatura,
    };
  }

  @Post('faturas/documento/gerar-numero')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async gerarNumeroDocumentoFinanceiro(
    @Body() payload: GerarNumeroDocumentoFinanceiroDto,
    @EmpresaId() empresaId: string,
  ) {
    const resultado = await this.faturamentoService.gerarNumeroDocumentoFinanceiro(
      empresaId,
      payload.tipoDocumento,
      payload.anoReferencia,
    );

    return {
      status: HttpStatus.OK,
      message: 'Numero do documento gerado com sucesso',
      data: resultado,
    };
  }

  @Post('faturas/:id/link-pagamento')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async gerarLinkPagamentoFatura(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Req() req: Request,
  ) {
    const originHeader = req.headers?.origin;
    const frontendBaseUrl =
      typeof originHeader === 'string' && originHeader.trim() ? originHeader.trim() : undefined;
    const backendBaseUrl = `${req.protocol}://${req.get('host')}`;

    const resultado = await this.faturamentoService.gerarLinkPagamentoFatura(id, empresaId, {
      frontendBaseUrl,
      backendBaseUrl,
    });

    return {
      status: HttpStatus.OK,
      message: 'Link de pagamento gerado com sucesso',
      data: resultado,
    };
  }

  @Put('faturas/:id')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async atualizarFatura(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFaturaDto: UpdateFaturaDto,
    @EmpresaId() empresaId: string,
    @CurrentUser()
    user: {
      id?: string;
      sub?: string;
      role?: string;
      permissions?: string[];
      permissoes?: string[];
    },
  ) {
    const userId = user?.id || user?.sub;
    const fatura = await this.faturamentoService.atualizarFatura(
      id,
      updateFaturaDto,
      empresaId,
      userId,
      {
        id: userId,
        role: user?.role,
        permissions: Array.isArray(user?.permissions) ? user?.permissions : [],
        permissoes: Array.isArray(user?.permissoes) ? user?.permissoes : [],
      },
    );

    return {
      status: HttpStatus.OK,
      message: 'Fatura atualizada com sucesso',
      data: fatura,
    };
  }

  @Put('faturas/:id/pagar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
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
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async cancelarFatura(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @CurrentUser() user: { id?: string; sub?: string },
    @Body('motivo') motivo?: string,
  ) {
    const userId = user?.id || user?.sub;
    const fatura = await this.faturamentoService.cancelarFatura(id, empresaId, motivo, userId);

    return {
      status: HttpStatus.OK,
      message: 'Fatura cancelada com sucesso',
      data: fatura,
    };
  }

  @Post('faturas/:id/enviar-email')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async enviarFaturaPorEmail(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body() envio?: EnvioFaturaEmailOpcoes,
  ) {
    const resultado = await this.faturamentoService.enviarFaturaPorEmail(id, empresaId, envio);

    const message = resultado.enviado
      ? resultado.simulado
        ? `Envio de email simulado (${resultado.motivo || 'motivo_desconhecido'})`
        : 'Fatura enviada por email'
      : 'Erro ao enviar fatura';

    return {
      status: HttpStatus.OK,
      message,
      data: resultado,
    };
  }

  @Post('faturas/gerar-cobranca-lote')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async gerarCobrancaLote(
    @Body() payload: GerarCobrancaLoteDto,
    @EmpresaId() empresaId: string,
  ) {
    const resultado: ResultadoCobrancaLote = await this.faturamentoService.gerarCobrancaEmLote(
      payload.faturaIds,
      empresaId,
    );

    return {
      status: HttpStatus.OK,
      message:
        `Cobranca em lote concluida: ` +
        `${resultado.sucesso} envio(s) real(is), ` +
        `${resultado.simuladas} simulado(s), ` +
        `${resultado.falhas} falha(s), ` +
        `${resultado.ignoradas} ignorada(s).`,
      data: resultado,
    };
  }

  @Get('faturas/:id/pdf')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async baixarPdfFatura(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Res() res: Response,
  ) {
    const resultado = await this.faturamentoService.gerarPdfFatura(id, empresaId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resultado.filename}"`,
      'Content-Length': resultado.buffer.length,
    });

    res.send(resultado.buffer);
  }

  @Post('faturas/cobranca-vencidas')
  @HttpCode(HttpStatus.OK)
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async gerarCobrancaFaturasVencidas(@EmpresaId() empresaId: string) {
    const resultado = await this.faturamentoService.gerarCobrancaFaturasVencidas(empresaId);

    return {
      status: HttpStatus.OK,
      message:
        `Cobranca de vencidas concluida: ` +
        `${resultado.sucesso} envio(s) real(is), ` +
        `${resultado.simuladas} simulado(s), ` +
        `${resultado.falhas} falha(s), ` +
        `${resultado.ignoradas} ignorada(s).`,
      data: resultado,
    };
  }

  @Get('operacao/prontidao-cobranca')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async obterProntidaoCobranca(@EmpresaId() empresaId: string) {
    const prontidao = await this.faturamentoService.obterProntidaoCobranca(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Prontidao de cobranca recuperada com sucesso',
      data: prontidao,
    };
  }

  @Delete('faturas/:id')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async excluirFatura(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    this.logger.log(`[CONTROLLER] DELETE /faturamento/faturas/${id} - Iniciando exclusao`);

    try {
      this.logger.log(`[CONTROLLER] Chamando excluirFatura para ID: ${id}`);
      const userId = user?.id || user?.sub;
      await this.faturamentoService.excluirFatura(id, empresaId, userId);

      this.logger.log(`[CONTROLLER] Fatura ${id} excluida com sucesso`);
      return {
        status: HttpStatus.OK,
        message: 'Fatura excluida com sucesso',
        data: { id },
      };
    } catch (error) {
      this.logger.log(`[CONTROLLER] Erro ao excluir fatura ID ${id}: ${error.message}`);
      this.logger.log(`[CONTROLLER] Stack trace: ${error.stack}`);
      throw new BadRequestException(error.message);
    }
  }

  // ==================== PAGAMENTOS ====================

  @Post('pagamentos')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
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

  @Post('pagamentos/manual')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async registrarPagamentoManual(
    @Body() registrarPagamentoDto: RegistrarPagamentoManualDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const pagamento = await this.pagamentoService.registrarPagamentoManual(
        registrarPagamentoDto,
        empresaId,
      );
      return {
        status: HttpStatus.CREATED,
        message: 'Pagamento manual registrado com sucesso',
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
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
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

  @Get('auditoria/correlacao/:correlationId')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
  async obterTrilhaCorrelacao(
    @Param('correlationId') correlationId: string,
    @EmpresaId() empresaId: string,
  ) {
    const trilha = await this.pagamentoService.obterTrilhaPorCorrelacao(correlationId, empresaId);
    return {
      status: HttpStatus.OK,
      message: 'Trilha de correlacao recuperada com sucesso',
      data: trilha,
    };
  }

  @Get('pagamentos')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
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
      status: status as any,
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
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
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
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
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
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
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
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async estornarPagamento(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @EmpresaId() empresaId: string,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub;
    const estorno = await this.pagamentoService.estornarPagamento(id, motivo, empresaId, userId);

    return {
      status: HttpStatus.OK,
      message: 'Estorno processado com sucesso',
      data: estorno,
    };
  }

  @Get('pagamentos/estatisticas')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
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
      message: 'Estatisticas recuperadas com sucesso',
      data: estatisticas,
    };
  }

  // ==================== PLANOS DE COBRANCA ====================

  @Post('planos-cobranca')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async criarPlanoCobranca(
    @Body() createPlanoDto: CreatePlanoCobrancaDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const plano = await this.cobrancaService.criarPlanoCobranca(createPlanoDto, empresaId);
      return {
        status: HttpStatus.CREATED,
        message: 'Plano de cobranca criado com sucesso',
        data: plano,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('planos-cobranca')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarPlanosCobranca(
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusPlanoCobranca,
    @Query('clienteId') clienteId?: string,
    @Query('contratoId') contratoId?: string,
  ) {
    const contratoIdNumber = contratoId ? Number(contratoId) : undefined;
    const filtros = {
      status: status as any,
      clienteId: clienteId?.trim() || undefined,
      contratoId: Number.isFinite(contratoIdNumber) ? contratoIdNumber : undefined,
    };
    const planos = await this.cobrancaService.buscarPlanosCobranca(empresaId, filtros);

    return {
      status: HttpStatus.OK,
      message: 'Planos de cobranca recuperados com sucesso',
      data: planos,
      total: planos.length,
    };
  }

  @Get('planos-cobranca/:id')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarPlanoPorId(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.buscarPlanoPorId(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobranca encontrado',
      data: plano,
    };
  }

  @Get('planos-cobranca/codigo/:codigo')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarPlanoPorCodigo(@Param('codigo') codigo: string, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.buscarPlanoPorCodigo(codigo, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobranca encontrado',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async atualizarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanoDto: UpdatePlanoCobrancaDto,
    @EmpresaId() empresaId: string,
  ) {
    const plano = await this.cobrancaService.atualizarPlanoCobranca(id, updatePlanoDto, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobranca atualizado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/pausar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async pausarPlanoCobranca(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.pausarPlanoCobranca(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobranca pausado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/reativar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async reativarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
  ) {
    const plano = await this.cobrancaService.reativarPlanoCobranca(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobranca reativado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/cancelar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async cancelarPlanoCobranca(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body('motivo') motivo?: string,
  ) {
    const plano = await this.cobrancaService.cancelarPlanoCobranca(id, empresaId, motivo);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobranca cancelado com sucesso',
      data: plano,
    };
  }

  @Post('planos-cobranca/:id/gerar-fatura')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
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

  // ==================== UTILITARIOS ====================

  @Post('processar-cobrancas-recorrentes')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async processarCobrancasRecorrentes(@EmpresaId() empresaId: string) {
    const resultado = await this.cobrancaService.processarCobrancasRecorrentes(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Processamento de cobrancas recorrentes concluido',
      data: resultado,
    };
  }

  @Post('verificar-faturas-vencidas')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async verificarFaturasVencidas(@EmpresaId() empresaId: string) {
    const resultado = await this.faturamentoService.verificarFaturasVencidas(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Verificacao de faturas vencidas concluida',
      data: resultado,
    };
  }

  @Post('enviar-lembretes-vencimento')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async enviarLembreteVencimento(@EmpresaId() empresaId: string) {
    const resultado = await this.cobrancaService.enviarLembreteVencimento(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Lembretes de vencimento enviados',
      data: resultado,
    };
  }
}
