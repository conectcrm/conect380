import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { Cliente, StatusCliente } from './cliente.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { PaginationParams } from '../../common/interfaces/common.interface';

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) { }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tipo', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso' })
  async findAll(@EmpresaId() empresaId: string, @Query() params: PaginationParams) {
    return this.clientesService.findAll(empresaId, params);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Listar clientes por status' })
  @ApiResponse({ status: 200, description: 'Clientes por status retornados com sucesso' })
  async getByStatus(@EmpresaId() empresaId: string, @Param('status') status: StatusCliente) {
    const clientes = await this.clientesService.getByStatus(empresaId, status);
    return {
      success: true,
      data: clientes,
    };
  }

  @Get('proximo-contato')
  @ApiOperation({ summary: 'Clientes com próximo contato agendado' })
  @ApiResponse({ status: 200, description: 'Lista de clientes com contatos agendados' })
  async getProximoContato(@EmpresaId() empresaId: string) {
    const clientes = await this.clientesService.getClientesProximoContato(empresaId);
    return {
      success: true,
      data: clientes,
    };
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas dos clientes' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async getEstatisticas(@EmpresaId() empresaId: string) {
    const estatisticas = await this.clientesService.getEstatisticas(empresaId);
    return {
      success: true,
      data: estatisticas,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async findById(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const cliente = await this.clientesService.findById(id, empresaId);

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return {
      success: true,
      data: cliente,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@EmpresaId() empresaId: string, @Body() clienteData: Partial<Cliente>) {
    const cliente = await this.clientesService.create({
      ...clienteData,
      empresa_id: empresaId,
    });

    return {
      success: true,
      data: cliente,
      message: 'Cliente criado com sucesso',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<Cliente>,
  ) {
    const cliente = await this.clientesService.update(id, empresaId, updateData);

    if (!cliente) {
      return {
        success: false,
        message: 'Cliente não encontrado',
      };
    }

    return {
      success: true,
      data: cliente,
      message: 'Cliente atualizado com sucesso',
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status do cliente' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  async updateStatus(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body('status') status: StatusCliente,
  ) {
    const cliente = await this.clientesService.updateStatus(id, empresaId, status);

    return {
      success: true,
      data: cliente,
      message: 'Status atualizado com sucesso',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir cliente' })
  @ApiResponse({ status: 200, description: 'Cliente excluído com sucesso' })
  async delete(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.clientesService.delete(id, empresaId);

    return {
      success: true,
      message: 'Cliente excluído com sucesso',
    };
  }
}
