import { api } from './api';
import {
  catalogoService,
  CatalogItem,
  CatalogItemComponent,
  CatalogStats,
  CreateCatalogItemData,
} from './catalogoService';
import { isCatalogApiEnabledForTenant } from '../config/catalogoFeaturesFlags';
import { normalizeOptionalMojibakeText } from '../utils/textEncoding';

export interface ProdutoComponente {
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity?: number;
  sortOrder?: number;
  affectsPrice?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
  nome?: string;
  preco?: number;
  tipoItem?: string;
  status?: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  categoriaId?: string | null;
  subcategoriaId?: string | null;
  configuracaoId?: string | null;
  subcategoriaNome?: string | null;
  configuracaoNome?: string | null;
  preco: number;
  custoUnitario?: number | null;
  templateCode?: string | null;
  atributosTemplate?: Record<string, unknown>;
  tipoItem: string;
  frequencia: string;
  unidadeMedida: string;
  status: string;
  descricao?: string;
  sku: string;
  fornecedor: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  vendasMes: number;
  vendasTotal: number;
  tags?: string[];
  variacoes?: string[];
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
  componentes?: ProdutoComponente[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateProdutoData {
  nome: string;
  categoria: string;
  categoriaId?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  preco: number;
  custoUnitario?: number;
  templateCode?: string;
  atributosTemplate?: Record<string, unknown>;
  tipoItem?: string;
  frequencia?: string;
  unidadeMedida?: string;
  status?: string;
  descricao?: string;
  sku?: string;
  fornecedor?: string;
  estoqueAtual?: number;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  tags?: string[];
  variacoes?: string[];
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
  componentes?: ProdutoComponente[];
}

export interface UpdateProdutoData extends Partial<CreateProdutoData> {}

export interface ProdutoEstatisticas {
  totalProdutos: number;
  produtosAtivos: number;
  vendasMes: number;
  valorTotal: number;
  estoquesBaixos: number;
}

export interface ProdutoListFilters {
  categoria?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  status?: string;
  search?: string;
  tipoItem?: string;
  page?: number;
  limit?: number;
  sortBy?: 'nome' | 'categoria' | 'preco' | 'status' | 'criadoEm' | 'atualizadoEm';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProdutoListResponse {
  data: Produto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type ProdutoCsvExportFilters = Omit<ProdutoListFilters, 'page' | 'limit'>;

class ProdutosService {
  private getEmpresaAtivaId(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const empresaId = window.localStorage.getItem('empresaAtiva');
    return empresaId?.trim() || undefined;
  }

  private useCatalogApi(): boolean {
    return isCatalogApiEnabledForTenant(this.getEmpresaAtivaId());
  }

  private inferCatalogItemKind(tipoItem?: string): CreateCatalogItemData['itemKind'] {
    if (tipoItem === 'plano') return 'subscription';
    if (tipoItem === 'pacote') return 'composite';
    if (tipoItem === 'servico') return 'service';
    return 'simple';
  }

  private inferCatalogTemplateCode(tipoItem?: string): string | undefined {
    if (tipoItem === 'plano') return 'software_plan';
    if (tipoItem === 'modulo' || tipoItem === 'licenca' || tipoItem === 'aplicativo') {
      return 'software_module';
    }
    if (tipoItem === 'pacote') return 'service_package';
    if (tipoItem === 'peca') return 'autoparts_item';
    if (tipoItem === 'acessorio' || tipoItem === 'garantia' || tipoItem === 'servico') {
      return 'retail_accessory_or_service';
    }

    return undefined;
  }

  private mapProdutoFiltersToCatalog(filters: ProdutoListFilters = {}) {
    const sortBy =
      filters.sortBy === 'nome'
        ? 'nome'
        : filters.sortBy === 'preco'
          ? 'sale_price'
          : 'created_at';

    return {
      search: filters.search,
      status: filters.status,
      businessType: filters.tipoItem,
      categoriaId: filters.categoriaId,
      subcategoriaId: filters.subcategoriaId,
      configuracaoId: filters.configuracaoId,
      page: filters.page,
      limit: filters.limit,
      sortBy,
      sortOrder: filters.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc',
    } as const;
  }

  private mapCatalogStatsToLegacy(stats: CatalogStats): ProdutoEstatisticas {
    return {
      totalProdutos: Number(stats.totalItems || 0),
      produtosAtivos: Number(stats.activeItems || 0),
      vendasMes: 0,
      valorTotal: Number(stats.totalSalePrice || 0),
      estoquesBaixos: Number(stats.lowStockItems || 0),
    };
  }

  private mapCatalogComponentToProduto(component: CatalogItemComponent): ProdutoComponente {
    return {
      childItemId: component.childItemId,
      componentRole: component.componentRole,
      quantity: component.quantity,
      sortOrder: component.sortOrder,
      affectsPrice: component.affectsPrice,
      isDefault: component.isDefault,
      metadata: component.metadata || undefined,
      nome: component.childItem?.nome,
      preco:
        component.childItem?.salePrice === undefined || component.childItem?.salePrice === null
          ? undefined
          : Number(component.childItem.salePrice),
      tipoItem: component.childItem?.businessType,
      status: component.childItem?.status,
    };
  }

  private mapCatalogItemToProduto(item: CatalogItem): Produto {
    const metadata = (item.metadata || {}) as Record<string, unknown>;
    const categoriaFallback =
      typeof metadata.legacyCategoriaLabel === 'string' ? metadata.legacyCategoriaLabel : 'Geral';

    return {
      id: item.id,
      nome: item.nome,
      categoria: item.categoriaNome || categoriaFallback,
      categoriaId: item.categoriaId || undefined,
      subcategoriaId: item.subcategoriaId || undefined,
      configuracaoId: item.configuracaoId || undefined,
      subcategoriaNome: item.subcategoriaNome || undefined,
      configuracaoNome: item.configuracaoNome || undefined,
      preco: Number(item.salePrice || 0),
      custoUnitario:
        item.costAmount === null || item.costAmount === undefined
          ? null
          : Number(item.costAmount),
      templateCode: item.templateCode || undefined,
      atributosTemplate:
        metadata.templateAttributes && typeof metadata.templateAttributes === 'object'
          ? (metadata.templateAttributes as Record<string, unknown>)
          : undefined,
      tipoItem: item.businessType || 'produto',
      frequencia:
        item.billingModel === 'unico'
          ? 'unico'
          : item.recurrence ||
            (typeof metadata.frequencia === 'string' ? metadata.frequencia : undefined) ||
            'unico',
      unidadeMedida: item.unitCode || 'unidade',
      status: item.status || 'ativo',
      descricao: item.descricao || '',
      sku: item.sku || '',
      fornecedor: item.supplierName || '',
      estoqueAtual: Number(item.stockCurrent || 0),
      estoqueMinimo: Number(item.stockMin || 0),
      estoqueMaximo: Number(item.stockMax || 0),
      vendasMes: Number(metadata.vendasMes || 0),
      vendasTotal: Number(metadata.vendasTotal || 0),
      tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [],
      variacoes: Array.isArray(metadata.variacoes) ? (metadata.variacoes as string[]) : [],
      tipoLicenciamento:
        typeof metadata.tipoLicenciamento === 'string'
          ? metadata.tipoLicenciamento
          : undefined,
      periodicidadeLicenca:
        typeof metadata.periodicidadeLicenca === 'string'
          ? metadata.periodicidadeLicenca
          : undefined,
      renovacaoAutomatica:
        typeof metadata.renovacaoAutomatica === 'boolean'
          ? metadata.renovacaoAutomatica
          : undefined,
      quantidadeLicencas:
        metadata.quantidadeLicencas === undefined || metadata.quantidadeLicencas === null
          ? undefined
          : Number(metadata.quantidadeLicencas),
      componentes: Array.isArray(item.components)
        ? item.components.map((component) => this.mapCatalogComponentToProduto(component))
        : undefined,
      criadoEm: item.createdAt,
      atualizadoEm: item.updatedAt,
    };
  }

  private async mapCatalogItemById(id: string): Promise<Produto> {
    const item = await catalogoService.getItem(id);
    return this.mapCatalogItemToProduto(item);
  }

  private async buildCatalogCsv(filters: ProdutoCsvExportFilters): Promise<Blob> {
    const items = await catalogoService.listAllItems(this.mapProdutoFiltersToCatalog(filters));
    const produtos = items
      .map((item) => this.mapCatalogItemToProduto(item))
      .filter((produto) =>
        filters.categoria ? produto.categoria === filters.categoria : true,
      );

    const escapeCsv = (value: unknown) => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const linhas = [
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
        produto.subcategoriaNome || '',
        produto.configuracaoNome || '',
        produto.status,
        produto.preco,
        produto.custoUnitario ?? '',
        produto.estoqueAtual,
        produto.estoqueMinimo,
        produto.estoqueMaximo,
        produto.fornecedor,
        produto.vendasMes,
        produto.vendasTotal,
        produto.criadoEm,
        produto.atualizadoEm,
      ]),
    ];

    const csv = `\uFEFF${linhas.map((linha) => linha.map(escapeCsv).join(',')).join('\n')}`;
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  private mapLegacyToCatalogPayload(
    data: CreateProdutoData | UpdateProdutoData,
    existingItem?: CatalogItem,
  ): CreateCatalogItemData {
    const metadataAtual = (existingItem?.metadata || {}) as Record<string, unknown>;
    const tipoItem = data.tipoItem || existingItem?.businessType || 'produto';
    const componentesAtuais = Array.isArray(existingItem?.components)
      ? existingItem.components.map((component) => this.mapCatalogComponentToProduto(component))
      : undefined;
    const componentes =
      tipoItem === 'plano'
        ? data.componentes !== undefined
          ? data.componentes
          : componentesAtuais
        : undefined;
    const inferredTemplateCode = this.inferCatalogTemplateCode(tipoItem);
    const billingModel =
      data.frequencia === undefined
        ? existingItem?.billingModel || null
        : data.frequencia === 'unico'
          ? 'unico'
          : 'recorrente';
    const recurrence =
      data.frequencia === undefined
        ? (existingItem?.recurrence as CreateCatalogItemData['recurrence']) || null
        : data.frequencia === 'unico'
          ? null
          : (data.frequencia as CreateCatalogItemData['recurrence']);
    const explicitTemplateCode =
      data.templateCode === undefined ? undefined : data.templateCode?.trim() || null;
    const tiposComEstoque = new Set(['produto', 'peca', 'acessorio']);
    const trackStock =
      data.tipoItem === undefined
        ? existingItem?.trackStock ?? false
        : tiposComEstoque.has((data.tipoItem || 'produto').toLowerCase());

    return {
      nome: data.nome?.trim() || existingItem?.nome || '',
      descricao:
        data.descricao !== undefined ? data.descricao?.trim() || null : existingItem?.descricao || null,
      itemKind: this.inferCatalogItemKind(tipoItem),
      businessType: tipoItem as CreateCatalogItemData['businessType'],
      templateCode:
        explicitTemplateCode !== undefined
          ? explicitTemplateCode
          : data.tipoItem !== undefined
            ? inferredTemplateCode
            : inferredTemplateCode || existingItem?.templateCode || undefined,
      categoriaId:
        data.categoriaId !== undefined ? data.categoriaId || null : existingItem?.categoriaId || null,
      subcategoriaId:
        data.subcategoriaId !== undefined
          ? data.subcategoriaId || null
          : existingItem?.subcategoriaId || null,
      configuracaoId:
        data.configuracaoId !== undefined
          ? data.configuracaoId || null
          : existingItem?.configuracaoId || null,
      status: (data.status || existingItem?.status || 'ativo') as CreateCatalogItemData['status'],
      billingModel: billingModel as CreateCatalogItemData['billingModel'],
      recurrence,
      unitCode:
        data.unidadeMedida !== undefined
          ? data.unidadeMedida || null
          : existingItem?.unitCode || null,
      salePrice:
        data.preco !== undefined ? Number(data.preco) : Number(existingItem?.salePrice || 0),
      costAmount:
        data.custoUnitario !== undefined
          ? data.custoUnitario === null
            ? null
            : Number(data.custoUnitario)
          : existingItem?.costAmount ?? null,
      trackStock,
      stockCurrent: trackStock
        ? data.estoqueAtual !== undefined
          ? Number(data.estoqueAtual)
          : existingItem?.stockCurrent ?? 0
        : null,
      stockMin: trackStock
        ? data.estoqueMinimo !== undefined
          ? Number(data.estoqueMinimo)
          : existingItem?.stockMin ?? null
        : null,
      stockMax: trackStock
        ? data.estoqueMaximo !== undefined
          ? Number(data.estoqueMaximo)
          : existingItem?.stockMax ?? null
        : null,
      sku: data.sku !== undefined ? data.sku?.trim() || null : existingItem?.sku || null,
      supplierName:
        data.fornecedor !== undefined
          ? data.fornecedor?.trim() || null
          : existingItem?.supplierName || null,
      metadata: {
        ...metadataAtual,
        legacyCategoriaLabel:
          data.categoria !== undefined ? data.categoria.trim() : metadataAtual.legacyCategoriaLabel,
        tags: data.tags !== undefined ? data.tags : metadataAtual.tags,
        variacoes: data.variacoes !== undefined ? data.variacoes : metadataAtual.variacoes,
        tipoLicenciamento:
          data.tipoLicenciamento !== undefined
            ? data.tipoLicenciamento?.trim() || null
            : metadataAtual.tipoLicenciamento,
        periodicidadeLicenca:
          data.periodicidadeLicenca !== undefined
            ? data.periodicidadeLicenca?.trim() || null
            : metadataAtual.periodicidadeLicenca,
        renovacaoAutomatica:
          data.renovacaoAutomatica !== undefined
            ? Boolean(data.renovacaoAutomatica)
            : metadataAtual.renovacaoAutomatica,
        quantidadeLicencas:
          data.quantidadeLicencas !== undefined
            ? data.quantidadeLicencas
            : metadataAtual.quantidadeLicencas,
        templateAttributes:
          data.atributosTemplate !== undefined
            ? data.atributosTemplate
            : metadataAtual.templateAttributes,
        frequencia:
          data.frequencia !== undefined ? data.frequencia : metadataAtual.frequencia,
      },
      components: componentes?.map((componente, index) => ({
        childItemId: componente.childItemId,
        componentRole: componente.componentRole,
        quantity:
          componente.quantity === undefined || componente.quantity === null
            ? 1
            : Number(componente.quantity),
        sortOrder:
          componente.sortOrder === undefined || componente.sortOrder === null
            ? index
            : Number(componente.sortOrder),
        affectsPrice: Boolean(componente.affectsPrice),
        isDefault:
          componente.isDefault === undefined
            ? componente.componentRole !== 'addon'
            : Boolean(componente.isDefault),
        metadata: componente.metadata,
      })),
    };
  }

  // Buscar todos os produtos
  async findAll(filters?: { categoria?: string; status?: string }): Promise<Produto[]> {
    try {
      if (this.useCatalogApi()) {
        const legacyFilters = filters as ProdutoListFilters | undefined;
        const produtos = await catalogoService
          .listAllItems({
            status: filters?.status,
            categoriaId: legacyFilters?.categoriaId,
            subcategoriaId: legacyFilters?.subcategoriaId,
            configuracaoId: legacyFilters?.configuracaoId,
          })
          .then((items) => items.map((item) => this.mapCatalogItemToProduto(item)));

        return produtos.filter((produto) =>
          filters?.categoria ? produto.categoria === filters.categoria : true,
        );
      }

      const params = new URLSearchParams();
      if (filters?.categoria) params.append('categoria', filters.categoria);
      if ((filters as ProdutoListFilters)?.subcategoriaId) {
        params.append('subcategoriaId', (filters as ProdutoListFilters).subcategoriaId as string);
      }
      if ((filters as ProdutoListFilters)?.configuracaoId) {
        params.append('configuracaoId', (filters as ProdutoListFilters).configuracaoId as string);
      }
      if (filters?.status) params.append('status', filters.status);

      const response = await api.get(`/produtos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  async listPaginated(filters: ProdutoListFilters = {}): Promise<ProdutoListResponse> {
    try {
      if (this.useCatalogApi()) {
        const response = await catalogoService.listItems(this.mapProdutoFiltersToCatalog(filters));
        const data = response.data
          .map((item) => this.mapCatalogItemToProduto(item))
          .filter((produto) => (filters.categoria ? produto.categoria === filters.categoria : true));

        return {
          data,
          meta: response.meta,
        };
      }

      const params = new URLSearchParams();
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.subcategoriaId) params.append('subcategoriaId', filters.subcategoriaId);
      if (filters.configuracaoId) params.append('configuracaoId', filters.configuracaoId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.tipoItem) params.append('tipoItem', filters.tipoItem);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/produtos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos paginados:', error);
      throw error;
    }
  }

  async exportCsv(filters: ProdutoCsvExportFilters = {}): Promise<Blob> {
    try {
      if (this.useCatalogApi()) {
        return this.buildCatalogCsv(filters);
      }

      const params = new URLSearchParams();
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.subcategoriaId) params.append('subcategoriaId', filters.subcategoriaId);
      if (filters.configuracaoId) params.append('configuracaoId', filters.configuracaoId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.tipoItem) params.append('tipoItem', filters.tipoItem);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await api.get(`/produtos/exportar?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar CSV de produtos:', error);
      throw error;
    }
  }

  // Buscar produto por ID
  async findById(id: string): Promise<Produto> {
    try {
      if (this.useCatalogApi()) {
        return this.mapCatalogItemById(id);
      }

      const response = await api.get(`/produtos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw error;
    }
  }

  // Criar novo produto
  async create(data: CreateProdutoData): Promise<Produto> {
    try {
      if (this.useCatalogApi()) {
        const response = await catalogoService.createItem(this.mapLegacyToCatalogPayload(data));
        return this.mapCatalogItemToProduto(response);
      }

      const { componentes: _componentes, ...legacyPayload } = data;
      const response = await api.post('/produtos', legacyPayload);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  // Atualizar produto
  async update(id: string, data: UpdateProdutoData): Promise<Produto> {
    try {
      if (this.useCatalogApi()) {
        const existingItem = await catalogoService.getItem(id);
        const response = await catalogoService.updateItem(
          id,
          this.mapLegacyToCatalogPayload(data, existingItem),
        );
        return this.mapCatalogItemToProduto(response);
      }

      const { componentes: _componentes, ...legacyPayload } = data;
      const response = await api.put(`/produtos/${id}`, legacyPayload);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  }

  // Excluir produto
  async delete(id: string): Promise<void> {
    try {
      if (this.useCatalogApi()) {
        await catalogoService.deleteItem(id);
        return;
      }

      await api.delete(`/produtos/${id}`);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      throw error;
    }
  }

  // Buscar estatísticas
  async getEstatisticas(): Promise<ProdutoEstatisticas> {
    try {
      if (this.useCatalogApi()) {
        const stats = await catalogoService.getStats();
        return this.mapCatalogStatsToLegacy(stats);
      }

      const response = await api.get('/produtos/estatisticas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Transformar dados do formulário para API
  transformFormToApi(formData: any): CreateProdutoData {
    // Validação básica dos campos obrigatórios
    if (!formData.nome || formData.nome.trim() === '') {
      throw new Error('Nome é obrigatório');
    }
    if (!formData.categoria || formData.categoria.trim() === '') {
      throw new Error('Categoria é obrigatória');
    }
    if (
      formData.precoUnitario === undefined &&
      formData.precoUnitario !== 0 &&
      formData.preco === undefined &&
      formData.preco !== 0
    ) {
      throw new Error('Preço é obrigatório');
    }

    const preco = formData.precoUnitario ?? formData.preco;
    if (isNaN(preco) || preco < 0) {
      throw new Error('Preço deve ser um número válido maior ou igual a zero');
    }

    const tipoItem = formData.tipoItem || 'produto';
    const tipoComEstoque = ['produto', 'peca', 'acessorio'].includes(tipoItem);

    const transformed = {
      nome: formData.nome.trim(),
      categoria: formData.categoria.trim(),
      categoriaId: formData.categoriaId || undefined,
      subcategoriaId: formData.subcategoriaId || undefined,
      configuracaoId: formData.configuracaoId || undefined,
      preco: Number(preco),
      custoUnitario:
        formData.custoUnitario === undefined ||
        formData.custoUnitario === null ||
        formData.custoUnitario === ''
          ? undefined
          : Number(formData.custoUnitario),
      templateCode:
        formData.templateCode === undefined ? undefined : String(formData.templateCode).trim(),
      atributosTemplate:
        formData.atributosTemplate && typeof formData.atributosTemplate === 'object'
          ? formData.atributosTemplate
          : undefined,
      tipoItem,
      frequencia: formData.frequencia || 'unico',
      unidadeMedida: formData.unidadeMedida || 'unidade',
      status:
        formData.status === true
          ? 'ativo'
          : formData.status === false
            ? 'inativo'
            : formData.status || 'ativo',
      descricao: formData.descricao?.trim() || undefined,
      sku: formData.sku?.trim() || undefined,
      fornecedor: formData.fornecedor?.trim() || undefined,
      estoqueAtual:
        !tipoComEstoque
          ? undefined
          : formData.estoque !== undefined && formData.estoque !== null && formData.estoque !== ''
            ? Number(formData.estoque)
            : formData.estoqueAtual !== undefined &&
                formData.estoqueAtual !== null &&
                formData.estoqueAtual !== ''
              ? Number(formData.estoqueAtual)
              : undefined,
      estoqueMinimo:
        !tipoComEstoque ||
        formData.estoqueMinimo === undefined ||
        formData.estoqueMinimo === null ||
        formData.estoqueMinimo === ''
          ? undefined
          : Number(formData.estoqueMinimo),
      estoqueMaximo:
        !tipoComEstoque ||
        formData.estoqueMaximo === undefined ||
        formData.estoqueMaximo === null ||
        formData.estoqueMaximo === ''
          ? undefined
          : Number(formData.estoqueMaximo),
      tags: Array.isArray(formData.tags) ? formData.tags : undefined,
      variacoes: Array.isArray(formData.variacoes) ? formData.variacoes : undefined,
      tipoLicenciamento: formData.tipoLicenciamento?.trim() || undefined,
      periodicidadeLicenca: formData.periodicidadeLicenca?.trim() || undefined,
      renovacaoAutomatica:
        formData.renovacaoAutomatica === undefined
          ? undefined
          : Boolean(formData.renovacaoAutomatica),
      quantidadeLicencas:
        formData.quantidadeLicencas === undefined || formData.quantidadeLicencas === null
          ? undefined
          : Number(formData.quantidadeLicencas),
      componentes:
        tipoItem === 'plano' && Array.isArray(formData.componentes)
          ? formData.componentes
              .filter((componente: ProdutoComponente | null | undefined) => Boolean(componente?.childItemId))
              .map((componente: ProdutoComponente, index: number) => ({
                childItemId: componente.childItemId,
                componentRole: componente.componentRole,
                quantity:
                  componente.quantity === undefined || componente.quantity === null
                    ? 1
                    : Number(componente.quantity),
                sortOrder:
                  componente.sortOrder === undefined || componente.sortOrder === null
                    ? index
                    : Number(componente.sortOrder),
                affectsPrice: Boolean(componente.affectsPrice),
                isDefault:
                  componente.isDefault === undefined
                    ? componente.componentRole !== 'addon'
                    : Boolean(componente.isDefault),
                metadata: componente.metadata,
                nome: componente.nome,
                preco: componente.preco,
                tipoItem: componente.tipoItem,
                status: componente.status,
              }))
          : undefined,
    };

    return transformed;
  }

  // Transformar dados da API para o formato legado do frontend
  transformApiToLegacy(produto: Produto): any {
    const nome = normalizeOptionalMojibakeText(produto.nome) || '';
    const categoria = normalizeOptionalMojibakeText(produto.categoria) || '';
    const fornecedor = normalizeOptionalMojibakeText(produto.fornecedor) || '';
    const sku = normalizeOptionalMojibakeText(produto.sku) || '';
    const descricao = normalizeOptionalMojibakeText(produto.descricao) || '';
    const tipoLicenciamento = normalizeOptionalMojibakeText(produto.tipoLicenciamento);
    const periodicidadeLicenca = normalizeOptionalMojibakeText(produto.periodicidadeLicenca);

    return {
      id: produto.id,
      nome,
      tipoItem: (produto.tipoItem || 'produto') as
        | 'produto'
        | 'servico'
        | 'licenca'
        | 'modulo'
        | 'plano'
        | 'aplicativo'
        | 'peca'
        | 'acessorio'
        | 'pacote'
        | 'garantia',
      templateCode: produto.templateCode || undefined,
      atributosTemplate:
        produto.atributosTemplate && typeof produto.atributosTemplate === 'object'
          ? produto.atributosTemplate
          : undefined,
      categoria,
      categoriaId: produto.categoriaId || undefined,
      subcategoriaId: produto.subcategoriaId || undefined,
      configuracaoId: produto.configuracaoId || undefined,
      subcategoriaNome: normalizeOptionalMojibakeText(produto.subcategoriaNome) || undefined,
      configuracaoNome: normalizeOptionalMojibakeText(produto.configuracaoNome) || undefined,
      preco: produto.preco,
      custoUnitario:
        produto.custoUnitario === null || produto.custoUnitario === undefined
          ? null
          : Number(produto.custoUnitario),
      frequencia: (produto.frequencia || 'unico') as
        | 'unico'
        | 'mensal'
        | 'anual'
        | 'trimestral'
        | 'sob_consulta',
      unidadeMedida: (produto.unidadeMedida || 'unidade') as
        | 'unidade'
        | 'saca'
        | 'hectare'
        | 'pacote'
        | 'licenca'
        | 'hora'
        | 'dia'
        | 'mensal'
        | 'assinatura',
      estoque: {
        atual: produto.estoqueAtual,
        minimo: produto.estoqueMinimo,
        maximo: produto.estoqueMaximo,
      },
      status: produto.status as 'ativo' | 'inativo' | 'descontinuado',
      vendas: {
        mes: produto.vendasMes,
        total: produto.vendasTotal,
      },
      fornecedor,
      sku,
      descricao,
      tags: produto.tags || [],
      variacoes: produto.variacoes || [],
      tipoLicenciamento,
      periodicidadeLicenca,
      renovacaoAutomatica: produto.renovacaoAutomatica,
      quantidadeLicencas: produto.quantidadeLicencas,
      componentes: produto.componentes || [],
      criadoEm: produto.criadoEm,
      atualizadoEm: produto.atualizadoEm,
    };
  }
}

export const produtosService = new ProdutosService();
