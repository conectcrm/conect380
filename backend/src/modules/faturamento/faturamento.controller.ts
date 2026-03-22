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
import { DocumentoFiscalService } from './services/documento-fiscal.service';
import {
  CreateFaturaDto,
  UpdateFaturaDto,
  GerarFaturaAutomaticaDto,
  GerarCobrancaLoteDto,
  GerarNumeroDocumentoFinanceiroDto,
} from './dto/fatura.dto';
import {
  CancelarDocumentoFiscalDto,
  CriarRascunhoDocumentoFiscalDto,
  EmitirDocumentoFiscalDto,
} from './dto/documento-fiscal.dto';
import { CreatePagamentoDto, UpdatePagamentoDto, ProcessarPagamentoDto } from './dto/pagamento.dto';
import { CreatePlanoCobrancaDto, UpdatePlanoCobrancaDto } from './dto/plano-cobranca.dto';
import { StatusFatura } from './entities/fatura.entity';
import { StatusPagamento } from './entities/pagamento.entity';
import { StatusPlanoCobranca } from './entities/plano-cobranca.entity';
import { EnvioFaturaEmailOpcoes, ResultadoCobrancaLote } from './services/faturamento.service';
import type { Request } from 'express';

@Controller('faturamento')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
export class FaturamentoController {
  private readonly logger = new Logger(FaturamentoController.name);
  constructor(
    private readonly faturamentoService: FaturamentoService,
    private readonly pagamentoService: PagamentoService,
    private readonly cobrancaService: CobrancaService,
    private readonly documentoFiscalService: DocumentoFiscalService,
  ) {}

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
        message: 'Fatura automática gerada com sucesso',
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
    @Query('clienteId') clienteId?: string,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('periodoCampo') periodoCampo?: 'emissao' | 'vencimento',
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('sortBy') sortBy: 'createdAt' | 'dataVencimento' | 'valorTotal' | 'numero' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const periodoCampoFiltro: 'emissao' | 'vencimento' =
      periodoCampo === 'vencimento' ? 'vencimento' : 'emissao';

    const filtros = {
      status,
      clienteId: clienteId?.trim() || undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      periodoCampo: periodoCampoFiltro,
      q,
    };

    // Mantém compatibilidade com implementações que esperam paginação flat
    const paginated = await this.faturamentoService.buscarFaturasPaginadas(
      empresaId,
      Number(page) || 1,
      Number(pageSize) || 10,
      sortBy,
      sortOrder,
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
    @Query('clienteId') clienteId?: string,
    @Query('contratoId') contratoId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('periodoCampo') periodoCampo?: 'emissao' | 'vencimento',
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('sortBy') sortBy: 'createdAt' | 'dataVencimento' | 'valorTotal' | 'numero' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const periodoCampoFiltro: 'emissao' | 'vencimento' =
      periodoCampo === 'vencimento' ? 'vencimento' : 'emissao';

    const filtros = {
      status,
      clienteId: clienteId?.trim() || undefined,
      contratoId: contratoId ? Number(contratoId) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      periodoCampo: periodoCampoFiltro,
      q,
    };

    const paginated = await this.faturamentoService.buscarFaturasPaginadas(
      empresaId,
      Number(page) || 1,
      Number(pageSize) || 10,
      sortBy,
      sortOrder,
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

  @Post('faturas/:id/documento-fiscal/rascunho')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async criarRascunhoDocumentoFiscal(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body() payload: CriarRascunhoDocumentoFiscalDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub;
    const statusFiscal = await this.documentoFiscalService.criarRascunho(
      id,
      empresaId,
      payload,
      userId,
    );

    return {
      status: HttpStatus.OK,
      message: 'Rascunho fiscal atualizado com sucesso',
      data: statusFiscal,
    };
  }

  @Post('faturas/:id/documento-fiscal/emitir')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async emitirDocumentoFiscal(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body() payload: EmitirDocumentoFiscalDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub;
    const statusFiscal = await this.documentoFiscalService.emitir(id, empresaId, payload, userId);

    return {
      status: HttpStatus.OK,
      message: 'Documento fiscal emitido com sucesso',
      data: statusFiscal,
    };
  }

  @Get('faturas/:id/documento-fiscal/status')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async consultarStatusDocumentoFiscal(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Query('sincronizar') sincronizar?: string,
    @CurrentUser() user?: { id?: string; sub?: string },
  ) {
    const sincronizarStatus = ['1', 'true', 'sim', 'yes'].includes(
      String(sincronizar || '')
        .trim()
        .toLowerCase(),
    );
    const statusFiscal = await this.documentoFiscalService.consultarStatus(id, empresaId, {
      sincronizar: sincronizarStatus,
      userId: user?.id || user?.sub,
    });

    return {
      status: HttpStatus.OK,
      message: 'Status fiscal recuperado com sucesso',
      data: statusFiscal,
    };
  }

  @Get('documento-fiscal/configuracao')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async obterDiagnosticoConfiguracaoDocumentoFiscal(@EmpresaId() empresaId: string) {
    const diagnostico =
      await this.documentoFiscalService.obterDiagnosticoConfiguracaoFiscalPorEmpresa(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Diagnostico de configuracao fiscal recuperado com sucesso',
      data: diagnostico,
    };
  }

  @Get('documento-fiscal/conectividade')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async testarConectividadeDocumentoFiscal(@EmpresaId() empresaId: string) {
    const diagnostico = await this.documentoFiscalService.testarConectividadeProviderFiscal(
      empresaId,
    );

    return {
      status: HttpStatus.OK,
      message: 'Teste de conectividade fiscal executado com sucesso',
      data: diagnostico,
    };
  }

  @Get('documento-fiscal/preflight')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async executarPreflightDocumentoFiscal(@EmpresaId() empresaId: string) {
    const diagnostico = await this.documentoFiscalService.executarPreflightFiscal(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Preflight fiscal executado com sucesso',
      data: diagnostico,
    };
  }

  @Post('faturas/:id/documento-fiscal/cancelar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async cancelarOuInutilizarDocumentoFiscal(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Body() payload: CancelarDocumentoFiscalDto,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    const userId = user?.id || user?.sub;
    const statusFiscal = await this.documentoFiscalService.cancelarOuInutilizar(
      id,
      empresaId,
      payload,
      userId,
    );

    return {
      status: HttpStatus.OK,
      message: 'Status do documento fiscal atualizado com sucesso',
      data: statusFiscal,
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

  @Delete('faturas/:id')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async excluirFatura(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    this.logger.log(`🔍 [CONTROLLER] DELETE /faturamento/faturas/${id} - Iniciando exclusão`);

    try {
      this.logger.log(`🔍 [CONTROLLER] Chamando excluirFatura para ID: ${id}`);
      const userId = user?.id || user?.sub;
      await this.faturamentoService.excluirFatura(id, empresaId, userId);

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
      message: 'Estatísticas recuperadas com sucesso',
      data: estatisticas,
    };
  }

  // ==================== PLANOS DE COBRANÇA ====================

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
        message: 'Plano de cobrança criado com sucesso',
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
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarPlanoPorId(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.buscarPlanoPorId(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança encontrado',
      data: plano,
    };
  }

  @Get('planos-cobranca/codigo/:codigo')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_READ)
  async buscarPlanoPorCodigo(@Param('codigo') codigo: string, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.buscarPlanoPorCodigo(codigo, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança encontrado',
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
      message: 'Plano de cobrança atualizado com sucesso',
      data: plano,
    };
  }

  @Put('planos-cobranca/:id/pausar')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async pausarPlanoCobranca(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    const plano = await this.cobrancaService.pausarPlanoCobranca(id, empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Plano de cobrança pausado com sucesso',
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
      message: 'Plano de cobrança reativado com sucesso',
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
      message: 'Plano de cobrança cancelado com sucesso',
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

  // ==================== UTILITÁRIOS ====================

  @Post('processar-cobrancas-recorrentes')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async processarCobrancasRecorrentes(@EmpresaId() empresaId: string) {
    await this.cobrancaService.processarCobrancasRecorrentes(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Processamento de cobranças recorrentes iniciado',
    };
  }

  @Post('verificar-faturas-vencidas')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async verificarFaturasVencidas() {
    await this.faturamentoService.verificarFaturasVencidas();

    return {
      status: HttpStatus.OK,
      message: 'Verificação de faturas vencidas concluída',
    };
  }

  @Post('enviar-lembretes-vencimento')
  @Permissions(Permission.FINANCEIRO_FATURAMENTO_MANAGE)
  async enviarLembreteVencimento(@EmpresaId() empresaId: string) {
    await this.cobrancaService.enviarLembreteVencimento(empresaId);

    return {
      status: HttpStatus.OK,
      message: 'Lembretes de vencimento enviados',
    };
  }
}
