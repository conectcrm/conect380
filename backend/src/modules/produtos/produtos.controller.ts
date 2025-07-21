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
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { Produto } from './produto.entity';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  async findAll(
    @Query('categoria') categoria?: string,
    @Query('status') status?: string,
  ): Promise<Produto[]> {
    if (categoria) {
      return this.produtosService.findByCategoria(categoria);
    }
    if (status) {
      return this.produtosService.findByStatus(status);
    }
    return this.produtosService.findAll();
  }

  @Get('estatisticas')
  async getEstatisticas() {
    return this.produtosService.getEstatisticas();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Produto> {
    return this.produtosService.findOne(id);
  }

  @Post()
  async create(
    @Body(ValidationPipe) createProdutoDto: CreateProdutoDto,
  ): Promise<Produto> {
    return this.produtosService.create(createProdutoDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    return this.produtosService.update(id, updateProdutoDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.produtosService.remove(id);
    return { message: 'Produto excluído com sucesso' };
  }
}
