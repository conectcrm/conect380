import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from './produto.entity';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';
import { CategoriaProduto } from '../categorias-produtos/entities/categoria-produto.entity';
import { SubcategoriaProduto } from '../categorias-produtos/entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from '../categorias-produtos/entities/configuracao-produto.entity';
import { CacheService } from '../../common/services/cache.service';

type ProdutoSortField = 'nome' | 'categoria' | 'preco' | 'status' | 'criadoEm' | 'atualizadoEm';

export type ProdutoListFilters = {
  categoria?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  status?: string;
  search?: string;
  tipoItem?: string;
  page?: number;
  limit?: number;
  sortBy?: ProdutoSortField;
  sortOrder?: 'ASC' | 'DESC';
};

export type ProdutoListResult = {
  data: Produto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ProdutoQueryContext = {
  query: ReturnType<Repository<Produto>['createQueryBuilder']>;
  page: number;
  limit: number;
  sortBy: ProdutoSortField;
  sortOrder: 'ASC' | 'DESC';
};

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto)
    private categoriaProdutoRepository: Repository<CategoriaProduto>,
    @InjectRepository(SubcategoriaProduto)
    private subcategoriaProdutoRepository: Repository<SubcategoriaProduto>,
    @InjectRepository(ConfiguracaoProduto)
    private configuracaoProdutoRepository: Repository<ConfiguracaoProduto>,
    private readonly cacheService: CacheService,
  ) {}

  private invalidateProdutosCache(empresaId: string) {
    const prefixes = [
      `${empresaId}:shared:/produtos`,
      `${empresaId}:shared:/api/produtos`,
      `${empresaId}:/produtos`,
      `${empresaId}:/api/produtos`,
      'default:shared:/produtos',
      'default:shared:/api/produtos',
      'default:/produtos',
      'default:/api/produtos',
    ];

    prefixes.forEach((prefix) => this.cacheService.invalidate(prefix));
  }

  private normalizeProduto(produto: Produto, tipoItemFallback = 'produto'): Produto {
    if (!produto) {
      return produto;
    }

    const ativoResolved =
      produto.status !== undefined && produto.status !== null
        ? produto.status === 'ativo'
        : (produto as any).ativo ?? true;

    (produto as any).empresa_id = produto.empresaId;
    (produto as any).tipoItem = produto.tipoItem ?? tipoItemFallback;
    (produto as any).status = produto.status ?? (ativoResolved ? 'ativo' : 'inativo');
    (produto as any).ativo = ativoResolved;
    (produto as any).categoriaId = produto.categoriaId ?? produto.categoriaRelacionada?.id ?? null;
    (produto as any).subcategoriaId = produto.subcategoriaId ?? produto.subcategoria?.id ?? null;
    (produto as any).configuracaoId = produto.configuracaoId ?? produto.configuracao?.id ?? null;
    (produto as any).subcategoriaNome = produto.subcategoria?.nome ?? null;
    (produto as any).configuracaoNome = produto.configuracao?.nome ?? null;
    return produto;
  }

  async findAll(empresaId: string): Promise<Produto[]> {
    const produtos = await this.produtoRepository.find({
      where: { empresaId },
      relations: ['categoriaRelacionada', 'subcategoria', 'configuracao'],
      order: {
        criadoEm: 'DESC',
      },
    });

    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async listPaginated(empresaId: string, filters: ProdutoListFilters = {}): Promise<ProdutoListResult> {
    const { query, page, limit } = this.buildListQuery(empresaId, filters);
    query.skip((page - 1) * limit).take(limit);

    const [produtos, total] = await query.getManyAndCount();

    return {
      data: produtos.map((produto) => this.normalizeProduto(produto)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listForExport(empresaId: string, filters: ProdutoListFilters = {}): Promise<Produto[]> {
    const { query } = this.buildListQuery(empresaId, {
      ...filters,
      page: 1,
      limit: 50000,
    });

    const produtos = await query.getMany();
    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async findOne(id: string, empresaId: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id, empresaId },
      relations: ['categoriaRelacionada', 'subcategoria', 'configuracao'],
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} nao encontrado`);
    }

    return this.normalizeProduto(produto);
  }

  async create(createProdutoDto: CreateProdutoDto, empresaId: string): Promise<Produto> {
    try {
      const payload = { ...createProdutoDto } as any;
      const tipoItem = payload.tipoItem || 'produto';
      const hierarchy = await this.resolveHierarchy(payload, empresaId);

      if (!payload.sku) {
        payload.sku = await this.generateUniqueSku(payload.nome, tipoItem, empresaId);
      } else {
        const existingSku = await this.produtoRepository.findOne({
          where: { sku: payload.sku, empresaId },
        });
        if (existingSku) {
          throw new ConflictException(`SKU ${payload.sku} ja existe para esta empresa`);
        }
      }

      const produto = this.produtoRepository.create({
        nome: payload.nome,
        categoria: hierarchy.categoria?.nome ?? payload.categoria ?? 'geral',
        categoriaId: hierarchy.categoria?.id ?? null,
        subcategoriaId: hierarchy.subcategoria?.id ?? null,
        configuracaoId: hierarchy.configuracao?.id ?? null,
        preco: payload.preco,
        custoUnitario: payload.custoUnitario ?? payload.preco ?? 0,
        tipoItem,
        frequencia: payload.frequencia || 'unico',
        unidadeMedida: payload.unidadeMedida || 'unidade',
        status: payload.status || 'ativo',
        descricao: payload.descricao,
        sku: payload.sku,
        fornecedor: payload.fornecedor || 'Nao informado',
        estoqueAtual: payload.estoqueAtual ?? payload.estoque ?? 0,
        estoqueMinimo: payload.estoqueMinimo ?? 0,
        estoqueMaximo: payload.estoqueMaximo ?? 0,
        vendasMes: payload.vendasMes ?? 0,
        vendasTotal: payload.vendasTotal ?? 0,
        tags: payload.tags ?? null,
        variacoes: payload.variacoes ?? null,
        tipoLicenciamento: payload.tipoLicenciamento ?? null,
        periodicidadeLicenca: payload.periodicidadeLicenca ?? null,
        renovacaoAutomatica:
          payload.renovacaoAutomatica === undefined ? false : Boolean(payload.renovacaoAutomatica),
        quantidadeLicencas: payload.quantidadeLicencas ?? null,
        ativo: payload.status ? payload.status !== 'inativo' : true,
        empresaId,
      });

      const saved = await this.produtoRepository.save(produto);
      this.invalidateProdutosCache(empresaId);
      const hydrated = await this.produtoRepository.findOne({
        where: { id: saved.id, empresaId },
        relations: ['categoriaRelacionada', 'subcategoria', 'configuracao'],
      });
      return this.normalizeProduto(hydrated || saved, tipoItem);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Erro ao criar produto');
    }
  }

  async update(
    id: string,
    updateProdutoDto: UpdateProdutoDto,
    empresaId: string,
  ): Promise<Produto> {
    const produto = await this.findOne(id, empresaId);

    const payload = { ...updateProdutoDto } as any;
    const shouldUpdateHierarchy =
      payload.categoria !== undefined ||
      payload.categoriaId !== undefined ||
      payload.subcategoriaId !== undefined ||
      payload.configuracaoId !== undefined;

    if (payload.sku && payload.sku !== produto.sku) {
      const existingSku = await this.produtoRepository.findOne({
        where: { sku: payload.sku, empresaId },
      });
      if (existingSku) {
        throw new ConflictException(`SKU ${payload.sku} ja existe para esta empresa`);
      }
    }

    if (payload.nome !== undefined) {
      produto.nome = payload.nome;
    }
    if (payload.categoria !== undefined) {
      produto.categoria = payload.categoria;
    }
    if (shouldUpdateHierarchy) {
      const hierarchy = await this.resolveHierarchy(payload, empresaId);

      if (hierarchy.categoria) {
        produto.categoria = hierarchy.categoria.nome;
        produto.categoriaId = hierarchy.categoria.id;
      } else if (payload.categoria !== undefined) {
        produto.categoriaId = null;
      }

      produto.subcategoriaId = hierarchy.subcategoria?.id ?? null;
      produto.configuracaoId = hierarchy.configuracao?.id ?? null;
    }
    if (payload.preco !== undefined) {
      produto.preco = payload.preco;
    }
    if (payload.descricao !== undefined) {
      produto.descricao = payload.descricao;
    }
    if (payload.sku !== undefined) {
      produto.sku = payload.sku;
    }
    if (payload.tipoItem !== undefined) {
      produto.tipoItem = payload.tipoItem;
    }
    if (payload.frequencia !== undefined) {
      produto.frequencia = payload.frequencia;
    }
    if (payload.unidadeMedida !== undefined) {
      produto.unidadeMedida = payload.unidadeMedida;
    }
    if (payload.custoUnitario !== undefined) {
      produto.custoUnitario = payload.custoUnitario;
    }
    if (payload.fornecedor !== undefined) {
      produto.fornecedor = payload.fornecedor;
    }
    if (payload.status !== undefined) {
      produto.status = payload.status;
      produto.ativo = payload.status !== 'inativo';
    }
    if (payload.estoqueAtual !== undefined) {
      produto.estoqueAtual = payload.estoqueAtual;
    }
    if (payload.estoqueMinimo !== undefined) {
      produto.estoqueMinimo = payload.estoqueMinimo;
    }
    if (payload.estoqueMaximo !== undefined) {
      produto.estoqueMaximo = payload.estoqueMaximo;
    }
    if (payload.tags !== undefined) {
      produto.tags = payload.tags;
    }
    if (payload.variacoes !== undefined) {
      produto.variacoes = payload.variacoes;
    }
    if (payload.tipoLicenciamento !== undefined) {
      produto.tipoLicenciamento = payload.tipoLicenciamento;
    }
    if (payload.periodicidadeLicenca !== undefined) {
      produto.periodicidadeLicenca = payload.periodicidadeLicenca;
    }
    if (payload.renovacaoAutomatica !== undefined) {
      produto.renovacaoAutomatica = payload.renovacaoAutomatica;
    }
    if (payload.quantidadeLicencas !== undefined) {
      produto.quantidadeLicencas = payload.quantidadeLicencas;
    }

    const updated = await this.produtoRepository.save(produto);
    this.invalidateProdutosCache(empresaId);
    const hydrated = await this.produtoRepository.findOne({
      where: { id: updated.id, empresaId },
      relations: ['categoriaRelacionada', 'subcategoria', 'configuracao'],
    });
    return this.normalizeProduto(
      hydrated || updated,
      payload.tipoItem ?? (produto as any).tipoItem ?? 'produto',
    );
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const produto = await this.findOne(id, empresaId);
    await this.produtoRepository.remove(produto);
    this.invalidateProdutosCache(empresaId);
  }

  async findByCategoria(categoria: string, empresaId: string): Promise<Produto[]> {
    const produtos = await this.produtoRepository.find({
      where: { categoria, empresaId },
      relations: ['categoriaRelacionada', 'subcategoria', 'configuracao'],
      order: { nome: 'ASC' },
    });
    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async findByStatus(status: string, empresaId: string): Promise<Produto[]> {
    const normalizedStatus = (status || '').trim().toLowerCase();

    const query = this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId });

    if (normalizedStatus === 'ativo') {
      query.andWhere('(produto.status = :status OR (produto.status IS NULL AND produto.ativo = true))', {
        status: 'ativo',
      });
    } else if (normalizedStatus === 'inativo') {
      query.andWhere('(produto.status = :status OR (produto.status IS NULL AND produto.ativo = false))', {
        status: 'inativo',
      });
    } else if (normalizedStatus === 'descontinuado') {
      query.andWhere('produto.status = :status', { status: 'descontinuado' });
    }

    const produtos = await query.orderBy('produto.nome', 'ASC').getMany();
    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async getEstatisticas(empresaId: string) {
    const totalProdutos = await this.produtoRepository.count({
      where: { empresaId },
    });

    const produtosAtivos = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .andWhere('(produto.status = :status OR (produto.status IS NULL AND produto.ativo = true))', {
        status: 'ativo',
      })
      .getCount();

    const valorTotal = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .select('SUM(produto.preco)', 'total')
      .getRawOne();

    const estoquesBaixos = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .andWhere("COALESCE(produto.tipoItem, 'produto') = 'produto'")
      .andWhere('COALESCE(produto.estoque, 0) <= COALESCE(produto."estoqueMinimo", 5)')
      .getCount();

    return {
      totalProdutos,
      produtosAtivos,
      vendasMes: 0,
      valorTotal: Number(valorTotal.total) || 0,
      estoquesBaixos,
    };
  }

  private normalizeFilter(value?: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeStatusFilter(status?: string): 'ativo' | 'inativo' | 'descontinuado' | undefined {
    const normalized = this.normalizeFilter(status)?.toLowerCase();
    if (normalized === 'ativo' || normalized === 'inativo' || normalized === 'descontinuado') {
      return normalized;
    }
    return undefined;
  }

  private resolveSortBy(sortBy?: string): ProdutoSortField {
    const allowed: ProdutoSortField[] = ['nome', 'categoria', 'preco', 'status', 'criadoEm', 'atualizadoEm'];
    return allowed.includes(sortBy as ProdutoSortField) ? (sortBy as ProdutoSortField) : 'nome';
  }

  private resolveSortOrder(sortOrder?: string): 'ASC' | 'DESC' {
    return String(sortOrder || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  }

  private buildListQuery(empresaId: string, filters: ProdutoListFilters = {}): ProdutoQueryContext {
    const page = this.clampNumber(filters.page, 1, 1, 100000);
    const limit = this.clampNumber(filters.limit, 10, 1, 50000);
    const search = this.normalizeFilter(filters.search);
    const categoria = this.normalizeFilter(filters.categoria);
    const subcategoriaId = this.normalizeFilter(filters.subcategoriaId);
    const configuracaoId = this.normalizeFilter(filters.configuracaoId);
    const tipoItem = this.normalizeFilter(filters.tipoItem);
    const normalizedStatus = this.normalizeStatusFilter(filters.status);
    const sortBy = this.resolveSortBy(filters.sortBy);
    const sortOrder = this.resolveSortOrder(filters.sortOrder);

    const query = this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoriaRelacionada', 'categoriaRelacionada')
      .leftJoinAndSelect('produto.subcategoria', 'subcategoria')
      .leftJoinAndSelect('produto.configuracao', 'configuracao')
      .where('produto.empresa_id = :empresaId', { empresaId });

    if (categoria) {
      query.andWhere('LOWER(produto.categoria) = :categoria', { categoria: categoria.toLowerCase() });
    }

    if (tipoItem) {
      query.andWhere("LOWER(COALESCE(produto.tipoItem, 'produto')) = :tipoItem", {
        tipoItem: tipoItem.toLowerCase(),
      });
    }

    if (subcategoriaId) {
      query.andWhere('produto.subcategoria_id = :subcategoriaId', { subcategoriaId });
    }

    if (configuracaoId) {
      query.andWhere('produto.configuracao_id = :configuracaoId', { configuracaoId });
    }

    if (normalizedStatus === 'ativo') {
      query.andWhere('(produto.status = :status OR (produto.status IS NULL AND produto.ativo = true))', {
        status: 'ativo',
      });
    } else if (normalizedStatus === 'inativo') {
      query.andWhere('(produto.status = :status OR (produto.status IS NULL AND produto.ativo = false))', {
        status: 'inativo',
      });
    } else if (normalizedStatus === 'descontinuado') {
      query.andWhere('produto.status = :status', { status: 'descontinuado' });
    }

    if (search) {
      query.andWhere(
        `(
          LOWER(produto.nome) LIKE :search
          OR LOWER(COALESCE(produto.sku, '')) LIKE :search
          OR LOWER(COALESCE(produto.fornecedor, '')) LIKE :search
        )`,
        { search: `%${search.toLowerCase()}%` },
      );
    }

    query.orderBy(`produto.${sortBy}`, sortOrder);

    return {
      query,
      page,
      limit,
      sortBy,
      sortOrder,
    };
  }

  private clampNumber(value: number | undefined, fallback: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(Math.max(Math.trunc(value as number), min), max);
  }

  private async resolveHierarchy(
    payload: Partial<CreateProdutoDto> & Partial<UpdateProdutoDto>,
    empresaId: string,
  ): Promise<{
    categoria: CategoriaProduto | null;
    subcategoria: SubcategoriaProduto | null;
    configuracao: ConfiguracaoProduto | null;
  }> {
    let categoria: CategoriaProduto | null = null;
    let subcategoria: SubcategoriaProduto | null = null;
    let configuracao: ConfiguracaoProduto | null = null;

    if (payload.categoriaId) {
      categoria = await this.categoriaProdutoRepository.findOne({
        where: { id: payload.categoriaId, empresaId },
      });

      if (!categoria) {
        throw new ConflictException('Categoria selecionada não foi encontrada para esta empresa');
      }
    }

    if (payload.subcategoriaId) {
      subcategoria = await this.subcategoriaProdutoRepository.findOne({
        where: { id: payload.subcategoriaId, empresaId },
      });

      if (!subcategoria) {
        throw new ConflictException('Subcategoria selecionada não foi encontrada para esta empresa');
      }

      if (categoria && subcategoria.categoriaId !== categoria.id) {
        throw new ConflictException('A subcategoria selecionada não pertence à categoria informada');
      }

      if (!categoria) {
        categoria = await this.categoriaProdutoRepository.findOne({
          where: { id: subcategoria.categoriaId, empresaId },
        });
      }
    }

    if (payload.configuracaoId) {
      configuracao = await this.configuracaoProdutoRepository.findOne({
        where: { id: payload.configuracaoId, empresaId },
      });

      if (!configuracao) {
        throw new ConflictException('Configuração selecionada não foi encontrada para esta empresa');
      }

      if (subcategoria && configuracao.subcategoriaId !== subcategoria.id) {
        throw new ConflictException('A configuração selecionada não pertence à subcategoria informada');
      }

      if (!subcategoria) {
        subcategoria = await this.subcategoriaProdutoRepository.findOne({
          where: { id: configuracao.subcategoriaId, empresaId },
        });
      }

      if (!subcategoria) {
        throw new ConflictException('A subcategoria da configuração selecionada não foi encontrada');
      }

      if (categoria && subcategoria.categoriaId !== categoria.id) {
        throw new ConflictException('A configuração selecionada não pertence à categoria informada');
      }

      if (!categoria) {
        categoria = await this.categoriaProdutoRepository.findOne({
          where: { id: subcategoria.categoriaId, empresaId },
        });
      }
    }

    return {
      categoria,
      subcategoria,
      configuracao,
    };
  }

  private async generateUniqueSku(
    nome: string,
    tipoItem: string = 'produto',
    empresaId: string,
  ): Promise<string> {
    const prefix = tipoItem.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const nomeParte = nome
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    let tentativa = 1;
    let sku = `${prefix}-${nomeParte}-${timestamp}`;

    while (await this.produtoRepository.findOne({ where: { sku, empresaId } })) {
      sku = `${prefix}-${nomeParte}-${timestamp}-${tentativa}`;
      tentativa++;
    }

    return sku;
  }
}
