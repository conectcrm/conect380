import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DemandaService } from '../services/demanda.service';
import { CreateDemandaDto } from '../dto/create-demanda.dto';
import { UpdateDemandaDto } from '../dto/update-demanda.dto';

/**
 * Controller para gerenciar demandas dos clientes
 *
 * Endpoints:
 * - POST /demandas - Criar demanda
 * - GET /demandas/:id - Buscar demanda por ID
 * - GET /demandas/cliente/:clienteId - Buscar demandas de um cliente
 * - GET /demandas/telefone/:telefone - Buscar demandas por telefone
 * - GET /demandas/ticket/:ticketId - Buscar demandas de um ticket
 * - GET /demandas/status/:status - Buscar demandas por status
 * - PATCH /demandas/:id - Atualizar demanda
 * - PATCH /demandas/:id/responsavel - Atribuir responsável
 * - PATCH /demandas/:id/status - Alterar status
 * - PATCH /demandas/:id/iniciar - Iniciar demanda
 * - PATCH /demandas/:id/concluir - Concluir demanda
 * - PATCH /demandas/:id/cancelar - Cancelar demanda
 * - DELETE /demandas/:id - Deletar demanda
 */
@ApiTags('Demandas Cliente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('demandas')
export class DemandaController {
  private readonly logger = new Logger(DemandaController.name);

  constructor(private readonly demandaService: DemandaService) {}

  /**
   * Criar nova demanda
   */
  @Post()
  @ApiOperation({ summary: 'Criar nova demanda para cliente/ticket' })
  async criar(@Body() dto: CreateDemandaDto, @Request() req) {
    this.logger.log(`📋 Criando demanda - User: ${req.user.email}`);

    const autorId = req.user.id;
    const empresaId = req.user.empresa_id;

    return await this.demandaService.criar(dto, autorId, empresaId);
  }

  /**
   * Buscar todas as demandas de um cliente
   */
  @Get('cliente/:clienteId')
  @ApiOperation({ summary: 'Buscar todas as demandas de um cliente' })
  async buscarPorCliente(
    @Param('clienteId') clienteId: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.demandaService.buscarPorCliente(clienteId, empresaId);
  }

  /**
   * Buscar demandas por telefone do contato
   */
  @Get('telefone/:telefone')
  @ApiOperation({ summary: 'Buscar demandas por telefone (fallback)' })
  async buscarPorTelefone(
    @Param('telefone') telefone: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.demandaService.buscarPorTelefone(telefone, empresaId);
  }

  /**
   * Buscar demandas de um ticket
   */
  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Buscar demandas de um ticket específico' })
  async buscarPorTicket(
    @Param('ticketId') ticketId: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.demandaService.buscarPorTicket(ticketId, empresaId);
  }

  /**
   * Buscar demandas por status
   */
  @Get('status/:status')
  @ApiOperation({ summary: 'Buscar demandas por status' })
  async buscarPorStatus(
    @Param('status') status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.demandaService.buscarPorStatus(status, empresaId);
  }

  /**
   * Buscar demanda por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar demanda por ID' })
  async buscarPorId(@Param('id') id: string) {
    return await this.demandaService.buscarPorId(id);
  }

  /**
   * Atualizar demanda
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar demanda' })
  async atualizar(@Param('id') id: string, @Body() dto: UpdateDemandaDto) {
    return await this.demandaService.atualizar(id, dto);
  }

  /**
   * Atribuir responsável
   */
  @Patch(':id/responsavel')
  @ApiOperation({ summary: 'Atribuir responsável à demanda' })
  async atribuirResponsavel(@Param('id') id: string, @Body('responsavelId') responsavelId: string) {
    return await this.demandaService.atribuirResponsavel(id, responsavelId);
  }

  /**
   * Alterar status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status da demanda' })
  async alterarStatus(
    @Param('id') id: string,
    @Body('status') status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada',
  ) {
    return await this.demandaService.alterarStatus(id, status);
  }

  /**
   * Iniciar demanda
   */
  @Patch(':id/iniciar')
  @ApiOperation({ summary: 'Iniciar demanda (status → em_andamento)' })
  async iniciar(@Param('id') id: string) {
    return await this.demandaService.iniciar(id);
  }

  /**
   * Concluir demanda
   */
  @Patch(':id/concluir')
  @ApiOperation({ summary: 'Concluir demanda (status → concluida)' })
  async concluir(@Param('id') id: string) {
    return await this.demandaService.concluir(id);
  }

  /**
   * Cancelar demanda
   */
  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar demanda' })
  async cancelar(@Param('id') id: string) {
    return await this.demandaService.cancelar(id);
  }

  /**
   * Deletar demanda
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar demanda' })
  async deletar(@Param('id') id: string) {
    await this.demandaService.deletar(id);
    return { message: 'Demanda deletada com sucesso' };
  }

  /**
   * Contar demandas de um cliente
   */
  @Get('cliente/:clienteId/count')
  @ApiOperation({ summary: 'Contar demandas de um cliente' })
  async contarPorCliente(
    @Param('clienteId') clienteId: string,
    @Query('empresaId') empresaId?: string,
  ) {
    const total = await this.demandaService.contarPorCliente(clienteId, empresaId);
    const abertas = await this.demandaService.contarAbertasPorCliente(clienteId, empresaId);
    const urgentes = await this.demandaService.contarUrgentesPorCliente(clienteId, empresaId);

    return { total, abertas, urgentes };
  }
}
