import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { Produto } from './produto.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CacheInterceptor, CacheTTL } from '../../common/interceptors/cache.interceptor';

@Controller('produtos')
@UseGuards(JwtAuthGuard, EmpresaGuard)
@UseInterceptors(CacheInterceptor) // 🚀 Cache ativado para produtos
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) { }

  @Get()
  @CacheTTL(60 * 1000) // 🚀 Cache: 1 minuto (listagem muda frequentemente)
  async findAll(
    @EmpresaId() empresaId: string,
    @Query('categoria') categoria?: string,
    @Query('status') status?: string,
  ): Promise<Produto[]> {
    if (categoria) {
      return this.produtosService.findByCategoria(categoria, empresaId);
    }
    if (status) {
      return this.produtosService.findByStatus(status, empresaId);
    }
    return this.produtosService.findAll(empresaId);
  }

  @Get('estatisticas')
  @CacheTTL(2 * 60 * 1000) // 🚀 Cache: 2 minutos (estatísticas mudam menos)
  async getEstatisticas(@EmpresaId() empresaId: string) {
    return this.produtosService.getEstatisticas(empresaId);
  }

  @Get(':id')
  @CacheTTL(5 * 60 * 1000) // 🚀 Cache: 5 minutos (produto individual muda pouco)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
  ): Promise<Produto> {
    return this.produtosService.findOne(id, empresaId);
  }

  @Post()
  async create(
    @Body(ValidationPipe) createProdutoDto: CreateProdutoDto,
    @EmpresaId() empresaId: string,
  ): Promise<Produto> {
    return this.produtosService.create(createProdutoDto, empresaId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProdutoDto: UpdateProdutoDto,
    @EmpresaId() empresaId: string,
  ): Promise<Produto> {
    return this.produtosService.update(id, updateProdutoDto, empresaId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
  ): Promise<{ message: string }> {
    await this.produtosService.remove(id, empresaId);
    return { message: 'Produto excluído com sucesso' };
  }
}
