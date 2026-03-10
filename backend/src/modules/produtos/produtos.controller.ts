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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { Produto } from './produto.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CacheInterceptor, CacheTTL } from '../../common/interceptors/cache.interceptor';
import { ProdutoListFilters, ProdutoListResult } from './produtos.service';

@Controller('produtos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_PRODUTOS_READ)
@UseInterceptors(CacheInterceptor) // Cache ativado para produtos
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get('exportar')
  async exportarCsv(
    @EmpresaId() empresaId: string,
    @Query('categoria') categoria: string | undefined,
    @Query('subcategoriaId') subcategoriaId: string | undefined,
    @Query('configuracaoId') configuracaoId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('search') search: string | undefined,
    @Query('tipoItem') tipoItem: string | undefined,
    @Query('sortBy') sortBy: string | undefined,
    @Query('sortOrder') sortOrder: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const produtos = await this.produtosService.listForExport(empresaId, {
      categoria,
      subcategoriaId,
      configuracaoId,
      status,
      search,
      tipoItem,
      sortBy: sortBy as ProdutoListFilters['sortBy'],
      sortOrder: sortOrder as ProdutoListFilters['sortOrder'],
    });

    const sanitize = (value: unknown) => {
      if (value === null || value === undefined) {
        return '';
      }

      const text = String(value);
      return text.includes('"') ? text.replace(/"/g, '""') : text;
    };

    const formatNumber = (value: number | null | undefined) =>
      typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '';

    const csv = [
      [
        'Nome',
        'SKU',
        'Categoria',
        'Subcategoria',
        'Configuração',
        'Status',
        'Preço',
        'Custo',
        'Estoque Atual',
        'Estoque Mínimo',
        'Estoque Máximo',
        'Fornecedor',
        'Vendas (Mês)',
        'Vendas (Total)',
        'Criado em',
        'Atualizado em',
      ],
      ...produtos.map((produto) => [
        produto.nome,
        produto.sku,
        produto.categoria,
        (produto as any).subcategoriaNome,
        (produto as any).configuracaoNome,
        produto.status,
        formatNumber(produto.preco),
        formatNumber(produto.custoUnitario),
        produto.estoqueAtual,
        produto.estoqueMinimo,
        produto.estoqueMaximo,
        produto.fornecedor,
        produto.vendasMes,
        produto.vendasTotal,
        produto.criadoEm,
        produto.atualizadoEm,
      ]),
    ]
      .map((row) => row.map((cell) => `"${sanitize(cell)}"`).join(';'))
      .join('\n');

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="produtos_${new Date().toISOString().slice(0, 10)}.csv"`,
    );

    return `\uFEFF${csv}`;
  }

  @Get()
  @CacheTTL(60 * 1000) // Cache: 1 minuto (listagem muda frequentemente)
  async findAll(
    @EmpresaId() empresaId: string,
    @Query('categoria') categoria?: string,
    @Query('subcategoriaId') subcategoriaId?: string,
    @Query('configuracaoId') configuracaoId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('tipoItem') tipoItem?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<Produto[] | ProdutoListResult> {
    const hasAdvancedFilters =
      !!search ||
      !!tipoItem ||
      !!page ||
      !!limit ||
      !!sortBy ||
      !!sortOrder ||
      !!subcategoriaId ||
      !!configuracaoId;

    if (hasAdvancedFilters) {
      const filters: ProdutoListFilters = {
        categoria,
        subcategoriaId,
        configuracaoId,
        status,
        search,
        tipoItem,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as ProdutoListFilters['sortBy'],
        sortOrder: sortOrder as ProdutoListFilters['sortOrder'],
      };

      return this.produtosService.listPaginated(empresaId, filters);
    }

    if (categoria) {
      return this.produtosService.findByCategoria(categoria, empresaId);
    }
    if (status) {
      return this.produtosService.findByStatus(status, empresaId);
    }
    return this.produtosService.findAll(empresaId);
  }

  @Get('estatisticas')
  @CacheTTL(2 * 60 * 1000) // Cache: 2 minutos (estatísticas mudam menos)
  async getEstatisticas(@EmpresaId() empresaId: string) {
    return this.produtosService.getEstatisticas(empresaId);
  }

  @Get(':id')
  @CacheTTL(5 * 60 * 1000) // Cache: 5 minutos (produto individual muda pouco)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
  ): Promise<Produto> {
    return this.produtosService.findOne(id, empresaId);
  }

  @Post()
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async create(
    @Body(ValidationPipe) createProdutoDto: CreateProdutoDto,
    @EmpresaId() empresaId: string,
  ): Promise<Produto> {
    return this.produtosService.create(createProdutoDto, empresaId);
  }

  @Put(':id')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProdutoDto: UpdateProdutoDto,
    @EmpresaId() empresaId: string,
  ): Promise<Produto> {
    return this.produtosService.update(id, updateProdutoDto, empresaId);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_PRODUTOS_DELETE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
  ): Promise<{ message: string }> {
    await this.produtosService.remove(id, empresaId);
    return { message: 'Produto descontinuado com sucesso' };
  }
}
