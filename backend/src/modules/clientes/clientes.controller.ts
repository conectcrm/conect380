import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { Cliente, StatusCliente } from './cliente.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentEmpresa } from '../../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { PaginationParams } from '../../common/interfaces/common.interface';

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso' })
  async findAll(
    @CurrentUser() user: User,
    @Query() params: PaginationParams,
  ) {
    return this.clientesService.findAll(user.empresa_id, params);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Listar clientes por status' })
  @ApiResponse({ status: 200, description: 'Clientes por status retornados com sucesso' })
  async getByStatus(
    @CurrentUser() user: User,
    @Param('status') status: StatusCliente,
  ) {
    const clientes = await this.clientesService.getByStatus(user.empresa_id, status);
    return {
      success: true,
      data: clientes,
    };
  }

  @Get('proximo-contato')
  @ApiOperation({ summary: 'Clientes com próximo contato agendado' })
  @ApiResponse({ status: 200, description: 'Lista de clientes com contatos agendados' })
  async getProximoContato(@CurrentUser() user: User) {
    const clientes = await this.clientesService.getClientesProximoContato(user.empresa_id);
    return {
      success: true,
      data: clientes,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async findById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const cliente = await this.clientesService.findById(id, user.empresa_id);
    
    if (!cliente) {
      return {
        success: false,
        message: 'Cliente não encontrado',
      };
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
  async create(
    @CurrentUser() user: User,
    @Body() clienteData: Partial<Cliente>,
  ) {
    const cliente = await this.clientesService.create({
      ...clienteData,
      empresa_id: user.empresa_id,
      responsavel_id: user.id,
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
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateData: Partial<Cliente>,
  ) {
    const cliente = await this.clientesService.update(id, user.empresa_id, updateData);
    
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
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: StatusCliente,
  ) {
    const cliente = await this.clientesService.updateStatus(id, user.empresa_id, status);
    
    return {
      success: true,
      data: cliente,
      message: 'Status atualizado com sucesso',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir cliente' })
  @ApiResponse({ status: 200, description: 'Cliente excluído com sucesso' })
  async delete(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.clientesService.delete(id, user.empresa_id);
    
    return {
      success: true,
      message: 'Cliente excluído com sucesso',
    };
  }
}
