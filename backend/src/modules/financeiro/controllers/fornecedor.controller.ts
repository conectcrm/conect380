import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FornecedorService } from '../services/fornecedor.service';
import { CreateFornecedorDto, UpdateFornecedorDto } from '../dto/fornecedor.dto';

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
  async remove(@Param('id') id: string, @Request() req) {
    const empresaId = req.user.empresa_id;
    await this.fornecedorService.remove(id, empresaId);
    return { message: 'Fornecedor excluído com sucesso' };
  }
}
