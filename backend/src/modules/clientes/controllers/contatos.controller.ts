import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { ContatosService } from '../services/contatos.service';
import {
  CreateContatoDto,
  UpdateContatoDto,
  ResponseContatoDto,
} from '../dto/contato.dto';

/**
 * Controller para gerenciar contatos vinculados a clientes
 * 
 * Rotas:
 * GET    /api/crm/clientes/:clienteId/contatos     - Lista todos os contatos do cliente
 * GET    /api/crm/contatos/:id                     - Busca um contato específico
 * POST   /api/crm/clientes/:clienteId/contatos     - Cria novo contato
 * PATCH  /api/crm/contatos/:id                     - Atualiza contato
 * PATCH  /api/crm/contatos/:id/principal           - Define contato como principal
 * DELETE /api/crm/contatos/:id                     - Remove contato (soft delete)
 */
@Controller('api/crm')
@UseGuards(JwtAuthGuard)
export class ContatosController {
  constructor(private readonly contatosService: ContatosService) { }

  /**
   * Lista todos os contatos de um cliente
   * GET /api/crm/clientes/:clienteId/contatos
   */
  @Get('clientes/:clienteId/contatos')
  async listar(
    @Param('clienteId') clienteId: string,
    @Request() req,
  ): Promise<ResponseContatoDto[]> {
    const empresaId = req.user?.empresaId;
    return this.contatosService.listarPorCliente(clienteId, empresaId);
  }

  /**
   * Busca um contato específico por ID
   * GET /api/crm/contatos/:id
   */
  @Get('contatos/:id')
  async buscar(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ResponseContatoDto> {
    return this.contatosService.buscarPorId(id);
  }

  /**
   * Cria um novo contato para um cliente
   * POST /api/crm/clientes/:clienteId/contatos
   * 
   * Body exemplo:
   * {
   *   "nome": "João Silva",
   *   "email": "joao@empresa.com",
   *   "telefone": "11999999999",
   *   "cargo": "Gerente Comercial",
   *   "principal": true,
   *   "observacoes": "Prefere contato pela manhã"
   * }
   */
  @Post('clientes/:clienteId/contatos')
  @HttpCode(HttpStatus.CREATED)
  async criar(
    @Param('clienteId') clienteId: string,
    @Body() createContatoDto: CreateContatoDto,
    @Request() req,
  ): Promise<ResponseContatoDto> {
    const empresaId = req.user?.empresaId;
    return this.contatosService.criar(clienteId, createContatoDto, empresaId);
  }

  /**
   * Atualiza um contato existente
   * PATCH /api/crm/contatos/:id
   * 
   * Body exemplo (todos os campos opcionais):
   * {
   *   "nome": "João Silva Jr.",
   *   "cargo": "Diretor Comercial",
   *   "telefone": "11988888888"
   * }
   */
  @Patch('contatos/:id')
  async atualizar(
    @Param('id') id: string,
    @Body() updateContatoDto: UpdateContatoDto,
    @Request() req,
  ): Promise<ResponseContatoDto> {
    return this.contatosService.atualizar(id, updateContatoDto);
  }

  /**
   * Define um contato como principal
   * PATCH /api/crm/contatos/:id/principal
   */
  @Patch('contatos/:id/principal')
  async definirComoPrincipal(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ResponseContatoDto> {
    return this.contatosService.definirComoPrincipal(id);
  }

  /**
   * Remove (soft delete) um contato
   * DELETE /api/crm/contatos/:id
   */
  @Delete('contatos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id') id: string, @Request() req): Promise<void> {
    return this.contatosService.remover(id);
  }
}
