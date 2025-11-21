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
import { NotaClienteService } from '../services/nota-cliente.service';
import { CreateNotaClienteDto } from '../dto/create-nota-cliente.dto';
import { UpdateNotaClienteDto } from '../dto/update-nota-cliente.dto';

/**
 * Controller para gerenciar notas dos clientes
 *
 * Endpoints:
 * - POST /notas - Criar nota
 * - GET /notas/:id - Buscar nota por ID
 * - GET /notas/cliente/:clienteId - Buscar notas de um cliente
 * - GET /notas/telefone/:telefone - Buscar notas por telefone
 * - GET /notas/ticket/:ticketId - Buscar notas de um ticket
 * - PATCH /notas/:id - Atualizar nota
 * - PATCH /notas/:id/importante - Marcar/desmarcar como importante
 * - DELETE /notas/:id - Deletar nota
 */
@ApiTags('Notas Cliente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notas')
export class NotaClienteController {
  private readonly logger = new Logger(NotaClienteController.name);

  constructor(private readonly notaService: NotaClienteService) {}

  /**
   * Criar nova nota
   */
  @Post()
  @ApiOperation({ summary: 'Criar nova nota para cliente/ticket' })
  async criar(@Body() dto: CreateNotaClienteDto, @Request() req) {
    this.logger.log(`📝 Criando nota - User: ${req.user.email}`);

    const autorId = req.user.id;
    const empresaId = req.user.empresa_id;

    return await this.notaService.criar(dto, autorId, empresaId);
  }

  /**
   * Buscar todas as notas de um cliente
   */
  @Get('cliente/:clienteId')
  @ApiOperation({ summary: 'Buscar todas as notas de um cliente' })
  async buscarPorCliente(
    @Param('clienteId') clienteId: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.notaService.buscarPorCliente(clienteId, empresaId);
  }

  /**
   * Buscar notas por telefone do contato
   */
  @Get('telefone/:telefone')
  @ApiOperation({ summary: 'Buscar notas por telefone (fallback)' })
  async buscarPorTelefone(
    @Param('telefone') telefone: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.notaService.buscarPorTelefone(telefone, empresaId);
  }

  /**
   * Buscar notas de um ticket
   */
  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Buscar notas de um ticket específico' })
  async buscarPorTicket(
    @Param('ticketId') ticketId: string,
    @Query('empresaId') empresaId?: string,
  ) {
    return await this.notaService.buscarPorTicket(ticketId, empresaId);
  }

  /**
   * Buscar nota por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar nota por ID' })
  async buscarPorId(@Param('id') id: string) {
    return await this.notaService.buscarPorId(id);
  }

  /**
   * Atualizar nota
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conteúdo ou flag importante' })
  async atualizar(@Param('id') id: string, @Body() dto: UpdateNotaClienteDto) {
    return await this.notaService.atualizar(id, dto);
  }

  /**
   * Marcar/desmarcar nota como importante
   */
  @Patch(':id/importante')
  @ApiOperation({ summary: 'Marcar ou desmarcar nota como importante' })
  async toggleImportante(@Param('id') id: string, @Body('importante') importante: boolean) {
    if (importante) {
      return await this.notaService.marcarImportante(id);
    } else {
      return await this.notaService.desmarcarImportante(id);
    }
  }

  /**
   * Deletar nota
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar nota' })
  async deletar(@Param('id') id: string) {
    await this.notaService.deletar(id);
    return { message: 'Nota deletada com sucesso' };
  }

  /**
   * Contar notas de um cliente
   */
  @Get('cliente/:clienteId/count')
  @ApiOperation({ summary: 'Contar total de notas de um cliente' })
  async contarPorCliente(
    @Param('clienteId') clienteId: string,
    @Query('empresaId') empresaId?: string,
  ) {
    const total = await this.notaService.contarPorCliente(clienteId, empresaId);
    const importantes = await this.notaService.contarImportantesPorCliente(clienteId, empresaId);

    return { total, importantes };
  }
}
