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
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { FilaService, MetricasFila } from '../services/fila.service';
import { CreateFilaDto, UpdateFilaDto, AddAtendenteFilaDto, AtribuirTicketDto } from '../dto/fila';
import {
  AtribuirNucleoDto,
  AtribuirDepartamentoDto,
  AtribuirNucleoEDepartamentoDto,
} from '../dto/atribuir-fila.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

/**
 * Controller para gerenciamento de Filas
 * Base: /api/filas
 */
@ApiTags('Filas')
@ApiBearerAuth()
@Controller('api/filas')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class FilaController {
  constructor(private readonly filaService: FilaService) {}

  /**
   * GET /api/filas
   * Lista todas as filas da empresa
   */
  @Get()
  async listar(@EmpresaId() empresaId: string) {
    return await this.filaService.listar(empresaId);
  }

  /**
   * GET /api/filas/:id
   * Busca uma fila por ID
   */
  @Get(':id')
  async buscarPorId(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return await this.filaService.buscarPorId(id, empresaId);
  }

  /**
   * POST /api/filas
   * Cria uma nova fila
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@EmpresaId() empresaId: string, @Body() dto: CreateFilaDto) {
    return await this.filaService.criar(empresaId, dto);
  }

  /**
   * PUT /api/filas/:id
   * Atualiza uma fila existente
   */
  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() dto: UpdateFilaDto,
  ) {
    return await this.filaService.atualizar(id, empresaId, dto);
  }

  /**
   * DELETE /api/filas/:id
   * Remove uma fila (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id') id: string, @EmpresaId() empresaId: string) {
    await this.filaService.remover(id, empresaId);
  }

  /**
   * POST /api/filas/:id/atendentes
   * Adiciona um atendente a uma fila
   */
  @Post(':id/atendentes')
  @HttpCode(HttpStatus.CREATED)
  async adicionarAtendente(
    @Param('id') filaId: string,
    @EmpresaId() empresaId: string,
    @Body() dto: AddAtendenteFilaDto,
  ) {
    return await this.filaService.adicionarAtendente(filaId, empresaId, dto);
  }

  /**
   * DELETE /api/filas/:id/atendentes/:atendenteId
   * Remove um atendente de uma fila
   */
  @Delete(':id/atendentes/:atendenteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtendente(
    @Param('id') filaId: string,
    @Param('atendenteId') atendenteId: string,
    @EmpresaId() empresaId: string,
  ) {
    await this.filaService.removerAtendente(filaId, atendenteId, empresaId);
  }

  /**
   * POST /api/filas/distribuir
   * Distribui um ticket para um atendente
   */
  @Post('distribuir')
  @HttpCode(HttpStatus.OK)
  async distribuirTicket(@EmpresaId() empresaId: string, @Body() dto: AtribuirTicketDto) {
    return await this.filaService.distribuirTicket(empresaId, dto);
  }

  /**
   * GET /api/filas/:id/metricas
   * Obter métricas de uma fila
   */
  @Get(':id/metricas')
  async obterMetricas(@Param('id') filaId: string, @EmpresaId() empresaId: string) {
    return await this.filaService.obterMetricas(filaId, empresaId);
  }

  /**
   * GET /api/filas/:id/atendentes
   * Lista atendentes de uma fila
   */
  @Get(':id/atendentes')
  async listarAtendentes(@Param('id') filaId: string, @EmpresaId() empresaId: string) {
    const fila = await this.filaService.buscarPorId(filaId, empresaId);
    return fila.atendentes;
  }

  /**
   * GET /api/filas/:id/tickets
   * Lista tickets de uma fila
   */
  @Get(':id/tickets')
  @ApiOperation({ summary: 'Listar tickets de uma fila' })
  async listarTickets(
    @Param('id') filaId: string,
    @EmpresaId() empresaId: string,
    @Query('status') status?: string,
  ) {
    // TODO: Implementar listagem de tickets por fila no TicketService
    return {
      message: 'Endpoint implementado - integração com TicketService pendente',
      filaId,
      status,
    };
  }

  // ========================================
  // ENDPOINTS ENTERPRISE - Consolidação Equipe → Fila
  // ========================================

  /**
   * PATCH /api/filas/:id/nucleo
   * Atribui um núcleo de atendimento a uma fila
   */
  @Patch(':id/nucleo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atribuir núcleo de atendimento a uma fila',
    description: 'Associa a fila a um núcleo específico (ex: Suporte, Comercial, Financeiro)',
  })
  @ApiParam({ name: 'id', description: 'ID da fila' })
  @ApiResponse({
    status: 200,
    description: 'Núcleo atribuído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Fila não encontrada',
  })
  async atribuirNucleo(
    @Param('id') filaId: string,
    @EmpresaId() empresaId: string,
    @Body() dto: AtribuirNucleoDto,
  ) {
    return await this.filaService.atribuirNucleoOuDepartamento(
      filaId,
      empresaId,
      dto.nucleoId,
      undefined,
    );
  }

  /**
   * PATCH /api/filas/:id/departamento
   * Atribui um departamento a uma fila
   */
  @Patch(':id/departamento')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atribuir departamento a uma fila',
    description: 'Associa a fila a um departamento específico (ex: TI, Vendas, RH)',
  })
  @ApiParam({ name: 'id', description: 'ID da fila' })
  @ApiResponse({
    status: 200,
    description: 'Departamento atribuído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Fila não encontrada',
  })
  async atribuirDepartamento(
    @Param('id') filaId: string,
    @EmpresaId() empresaId: string,
    @Body() dto: AtribuirDepartamentoDto,
  ) {
    return await this.filaService.atribuirNucleoOuDepartamento(
      filaId,
      empresaId,
      undefined,
      dto.departamentoId,
    );
  }

  /**
   * PATCH /api/filas/:id/atribuir
   * Atribui núcleo E/OU departamento simultaneamente
   */
  @Patch(':id/atribuir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atribuir núcleo e/ou departamento a uma fila',
    description: 'Permite atribuir núcleo, departamento ou ambos simultaneamente',
  })
  @ApiParam({ name: 'id', description: 'ID da fila' })
  @ApiResponse({
    status: 200,
    description: 'Atribuições realizadas com sucesso',
  })
  async atribuirNucleoEDepartamento(
    @Param('id') filaId: string,
    @EmpresaId() empresaId: string,
    @Body() dto: AtribuirNucleoEDepartamentoDto,
  ) {
    return await this.filaService.atribuirNucleoOuDepartamento(
      filaId,
      empresaId,
      dto.nucleoId,
      dto.departamentoId,
    );
  }

  /**
   * GET /api/filas/nucleo/:nucleoId
   * Lista todas as filas de um núcleo específico
   */
  @Get('nucleo/:nucleoId')
  @ApiOperation({
    summary: 'Listar filas de um núcleo',
    description: 'Retorna todas as filas ativas associadas a um núcleo',
  })
  @ApiParam({ name: 'nucleoId', description: 'ID do núcleo de atendimento' })
  @ApiResponse({
    status: 200,
    description: 'Lista de filas retornada com sucesso',
  })
  async listarPorNucleo(
    @Param('nucleoId') nucleoId: string,
    @EmpresaId() empresaId: string,
  ) {
    return await this.filaService.listarPorNucleo(nucleoId, empresaId);
  }

  /**
   * GET /api/filas/departamento/:departamentoId
   * Lista todas as filas de um departamento específico
   */
  @Get('departamento/:departamentoId')
  @ApiOperation({
    summary: 'Listar filas de um departamento',
    description: 'Retorna todas as filas ativas associadas a um departamento',
  })
  @ApiParam({ name: 'departamentoId', description: 'ID do departamento' })
  @ApiResponse({
    status: 200,
    description: 'Lista de filas retornada com sucesso',
  })
  async listarPorDepartamento(
    @Param('departamentoId') departamentoId: string,
    @EmpresaId() empresaId: string,
  ) {
    return await this.filaService.listarPorDepartamento(departamentoId, empresaId);
  }

  /**
   * GET /api/filas/nucleo/:nucleoId/ideal
   * Busca fila ideal para distribuição automática (menor carga)
   * Usado pelo bot de triagem
   */
  @Get('nucleo/:nucleoId/ideal')
  @ApiOperation({
    summary: 'Buscar fila ideal para um núcleo (menor carga)',
    description: 'Retorna a fila com menor carga de trabalho para distribuição automática',
  })
  @ApiParam({ name: 'nucleoId', description: 'ID do núcleo de atendimento' })
  @ApiResponse({
    status: 200,
    description: 'Fila ideal encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhuma fila ativa encontrada para este núcleo',
  })
  async buscarFilaIdeal(
    @Param('nucleoId') nucleoId: string,
    @EmpresaId() empresaId: string,
  ) {
    const fila = await this.filaService.buscarFilaIdealPorNucleo(nucleoId, empresaId);

    if (!fila) {
      return {
        message: 'Nenhuma fila ativa encontrada para este núcleo',
        nucleoId,
      };
    }

    return fila;
  }
}

