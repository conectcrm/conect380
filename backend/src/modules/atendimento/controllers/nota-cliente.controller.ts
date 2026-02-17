import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { NotaClienteService } from '../services/nota-cliente.service';
import { CreateNotaClienteDto } from '../dto/create-nota-cliente.dto';
import { UpdateNotaClienteDto } from '../dto/update-nota-cliente.dto';

@ApiTags('Notas Cliente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard)
@Controller('notas')
export class NotaClienteController {
  private readonly logger = new Logger(NotaClienteController.name);

  constructor(private readonly notaService: NotaClienteService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova nota para cliente/ticket' })
  async criar(@Body() dto: CreateNotaClienteDto, @Request() req, @EmpresaId() empresaId: string) {
    this.logger.log(`Criando nota - User: ${req.user.email}`);
    const autorId = req.user.id;
    return await this.notaService.criar(dto, autorId, empresaId);
  }

  @Get('cliente/:clienteId')
  @ApiOperation({ summary: 'Buscar todas as notas de um cliente' })
  async buscarPorCliente(@Param('clienteId') clienteId: string, @EmpresaId() empresaId: string) {
    return await this.notaService.buscarPorCliente(clienteId, empresaId);
  }

  @Get('telefone/:telefone')
  @ApiOperation({ summary: 'Buscar notas por telefone (fallback)' })
  async buscarPorTelefone(@Param('telefone') telefone: string, @EmpresaId() empresaId: string) {
    return await this.notaService.buscarPorTelefone(telefone, empresaId);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Buscar notas de um ticket especifico' })
  async buscarPorTicket(@Param('ticketId') ticketId: string, @EmpresaId() empresaId: string) {
    return await this.notaService.buscarPorTicket(ticketId, empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar nota por ID' })
  async buscarPorId(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return await this.notaService.buscarPorId(id, empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conteudo ou flag importante' })
  async atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateNotaClienteDto,
    @EmpresaId() empresaId: string,
  ) {
    return await this.notaService.atualizar(id, dto, empresaId);
  }

  @Patch(':id/importante')
  @ApiOperation({ summary: 'Marcar ou desmarcar nota como importante' })
  async toggleImportante(
    @Param('id') id: string,
    @Body('importante') importante: boolean,
    @EmpresaId() empresaId: string,
  ) {
    if (importante) {
      return await this.notaService.marcarImportante(id, empresaId);
    }

    return await this.notaService.desmarcarImportante(id, empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar nota' })
  async deletar(@Param('id') id: string, @EmpresaId() empresaId: string) {
    await this.notaService.deletar(id, empresaId);
    return { message: 'Nota deletada com sucesso' };
  }

  @Get('cliente/:clienteId/count')
  @ApiOperation({ summary: 'Contar total de notas de um cliente' })
  async contarPorCliente(@Param('clienteId') clienteId: string, @EmpresaId() empresaId: string) {
    const total = await this.notaService.contarPorCliente(clienteId, empresaId);
    const importantes = await this.notaService.contarImportantesPorCliente(clienteId, empresaId);

    return { total, importantes };
  }
}
