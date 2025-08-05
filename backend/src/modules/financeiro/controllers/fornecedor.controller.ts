import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Request, HttpStatus, HttpException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FornecedorService } from '../services/fornecedor.service';
import { CreateFornecedorDto, UpdateFornecedorDto } from '../dto/fornecedor.dto';
import { FornecedorRemovalResponse } from '../dto/fornecedor-response.dto';

@Controller('fornecedores')
export class FornecedorController {
  constructor(private readonly fornecedorService: FornecedorService) { }

  // Endpoint de teste temporário sem autenticação (deve vir antes do POST genérico)
  @Post('test')
  async createTest(@Body() createFornecedorDto: CreateFornecedorDto) {
    console.log('🧪 [BACKEND] Teste de criação de fornecedor:', createFornecedorDto);

    try {
      // Usar um empresaId de teste
      const empresaId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await this.fornecedorService.create(createFornecedorDto, empresaId);
      console.log('✅ [BACKEND] Fornecedor criado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ [BACKEND] Erro ao criar fornecedor:', error);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createFornecedorDto: CreateFornecedorDto, @Request() req) {
    console.log('🏢 [BACKEND] Criação de fornecedor via endpoint normal:', createFornecedorDto);
    console.log('👤 [BACKEND] Dados do usuário logado:', req.user);
    const empresaId = req.user.empresa_id;
    console.log('🏢 [BACKEND] EmpresaId extraído:', empresaId);
    return await this.fornecedorService.create(createFornecedorDto, empresaId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('busca') busca: string, @Query('ativo') ativo: string, @Request() req) {
    const empresaId = req.user.empresa_id;
    const filtros: any = {};

    if (busca) {
      filtros.busca = busca;
    }

    if (ativo !== undefined && ativo !== '') {
      filtros.ativo = ativo === 'true';
    }

    return await this.fornecedorService.findAll(empresaId, filtros);
  }

  @Get('ativos')
  @UseGuards(JwtAuthGuard)
  async findAtivos(@Request() req) {
    const empresaId = req.user.empresa_id;
    return await this.fornecedorService.findAtivos(empresaId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req) {
    const empresaId = req.user.empresa_id;
    return await this.fornecedorService.findOne(id, empresaId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateFornecedorDto: UpdateFornecedorDto, @Request() req) {
    const empresaId = req.user.empresa_id;
    return await this.fornecedorService.update(id, updateFornecedorDto, empresaId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req): Promise<FornecedorRemovalResponse> {
    const empresaId = req.user.empresa_id;

    try {
      await this.fornecedorService.remove(id, empresaId);

      return {
        success: true,
        message: '✅ Fornecedor excluído com sucesso!'
      };
    } catch (error) {
      // Se é um erro de dependência, retornar resposta estruturada
      if (error.status === 400 && error.response?.details) {
        return {
          success: false,
          message: error.response.message,
          error: error.response,
          alternative: {
            action: 'desativar',
            endpoint: `/fornecedores/${id}/desativar`,
            description: 'Desativar fornecedor mantendo o histórico'
          }
        };
      }

      // Re-lançar outros erros
      throw error;
    }
  }

  @Patch(':id/desativar')
  @UseGuards(JwtAuthGuard)
  async desativar(@Param('id') id: string, @Request() req) {
    const empresaId = req.user.empresa_id;
    const fornecedor = await this.fornecedorService.desativar(id, empresaId);
    return {
      message: 'Fornecedor desativado com sucesso',
      fornecedor
    };
  }

  @Post(':id/limpar-contas-pagas')
  @UseGuards(JwtAuthGuard)
  async limparContasPagas(@Param('id') id: string, @Request() req) {
    const empresaId = req.user.empresa_id;

    try {
      const result = await this.fornecedorService.limparContasPagas(id, empresaId);

      return {
        success: true,
        message: 'Histórico de contas pagas removido com sucesso',
        data: result
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Erro ao limpar histórico de contas pagas',
        error: error.code || 'CLEANUP_ERROR'
      });
    }
  }
}
