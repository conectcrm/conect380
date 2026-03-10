import { api } from './api';

export interface CatalogItemComponent {
  id: string;
  empresaId: string;
  parentItemId: string;
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity: number;
  sortOrder: number;
  affectsPrice: boolean;
  isDefault: boolean;
  metadata?: Record<string, unknown> | null;
  childItem?: {
    id: string;
    nome: string;
    itemKind: string;
    businessType: string;
    status: string;
    templateCode?: string | null;
    salePrice: number;
    currencyCode: string;
    sku?: string | null;
  } | null;
}

export interface CatalogTemplateField {
  id: string;
  templateCode: string;
  fieldKey: string;
  label: string;
  section: string;
  fieldType: string;
  required: boolean;
  options?: Array<{ value: string; label: string }> | null;
  sortOrder: number;
  helpText?: string | null;
}

export interface CatalogTemplate {
  code: string;
  empresaId?: string | null;
  nome: string;
  descricao?: string | null;
  itemKind: string;
  businessType: string;
  ativo: boolean;
  fields?: CatalogTemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  empresaId: string;
  legacyProdutoId?: string | null;
  code?: string | null;
  nome: string;
  descricao?: string | null;
  itemKind: string;
  businessType: string;
  templateCode?: string | null;
  template?: CatalogTemplate | null;
  categoriaId?: string | null;
  categoriaNome?: string | null;
  subcategoriaId?: string | null;
  subcategoriaNome?: string | null;
  configuracaoId?: string | null;
  configuracaoNome?: string | null;
  status: string;
  billingModel?: string | null;
  recurrence?: string | null;
  unitCode?: string | null;
  salePrice: number;
  costAmount?: number | null;
  currencyCode: string;
  trackStock: boolean;
  stockCurrent?: number | null;
  stockMin?: number | null;
  stockMax?: number | null;
  sku?: string | null;
  supplierName?: string | null;
  metadata?: Record<string, unknown> | null;
  components?: CatalogItemComponent[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogStats {
  totalItems: number;
  activeItems: number;
  compositeItems: number;
  lowStockItems: number;
  deletedItems: number;
  totalSalePrice: number;
  totalCostAmount: number;
}

export interface CatalogItemListFilters {
  search?: string;
  status?: string;
  itemKind?: string;
  businessType?: string;
  templateCode?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  configuracaoId?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
  sortBy?: 'created_at' | 'nome' | 'sale_price';
  sortOrder?: 'asc' | 'desc';
}

export interface CatalogItemListResponse {
  data: CatalogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCatalogItemData {
  legacyProdutoId?: string | null;
  code?: string | null;
  nome: string;
  descricao?: string | null;
  itemKind: 'simple' | 'composite' | 'variant_parent' | 'variant_child' | 'service' | 'subscription';
  businessType:
    | 'produto'
    | 'servico'
    | 'plano'
    | 'modulo'
    | 'licenca'
    | 'aplicativo'
    | 'peca'
    | 'acessorio'
    | 'pacote'
    | 'garantia';
  templateCode?: string | null;
  categoriaId?: string | null;
  subcategoriaId?: string | null;
  configuracaoId?: string | null;
  status?: 'ativo' | 'inativo' | 'descontinuado';
  billingModel?: 'unico' | 'recorrente' | null;
  recurrence?: 'mensal' | 'anual' | 'trimestral' | 'sob_consulta' | null;
  unitCode?: string | null;
  salePrice: number;
  costAmount?: number | null;
  trackStock?: boolean;
  stockCurrent?: number | null;
  stockMin?: number | null;
  stockMax?: number | null;
  sku?: string | null;
  supplierName?: string | null;
  metadata?: Record<string, unknown>;
  components?: Array<{
    childItemId: string;
    componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
    quantity?: number;
    sortOrder?: number;
    affectsPrice?: boolean;
    isDefault?: boolean;
    metadata?: Record<string, unknown>;
  }>;
}

export interface UpdateCatalogItemData extends Partial<CreateCatalogItemData> {}

class CatalogoService {
  private buildParams(filters: CatalogItemListFilters = {}) {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.itemKind) params.append('itemKind', filters.itemKind);
    if (filters.businessType) params.append('businessType', filters.businessType);
    if (filters.templateCode) params.append('templateCode', filters.templateCode);
    if (filters.categoriaId) params.append('categoriaId', filters.categoriaId);
    if (filters.subcategoriaId) params.append('subcategoriaId', filters.subcategoriaId);
    if (filters.configuracaoId) params.append('configuracaoId', filters.configuracaoId);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.includeDeleted !== undefined) {
      params.append('includeDeleted', String(filters.includeDeleted));
    }
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return params.toString();
  }

  async listItems(filters: CatalogItemListFilters = {}): Promise<CatalogItemListResponse> {
    const response = await api.get(`/catalog/items?${this.buildParams(filters)}`);
    return response.data;
  }

  async listAllItems(filters: Omit<CatalogItemListFilters, 'page' | 'limit'> = {}): Promise<CatalogItem[]> {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const items: CatalogItem[] = [];

    do {
      const response = await this.listItems({
        ...filters,
        page,
        limit,
      });

      items.push(...(response.data || []));
      totalPages = response.meta?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);

    return items;
  }

  async getItem(id: string): Promise<CatalogItem> {
    const response = await api.get(`/catalog/items/${id}`);
    return response.data;
  }

  async createItem(data: CreateCatalogItemData): Promise<CatalogItem> {
    const response = await api.post('/catalog/items', data);
    return response.data;
  }

  async updateItem(id: string, data: UpdateCatalogItemData): Promise<CatalogItem> {
    const response = await api.put(`/catalog/items/${id}`, data);
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/catalog/items/${id}`);
  }

  async getStats(): Promise<CatalogStats> {
    const response = await api.get('/catalog/stats');
    return response.data;
  }

  async listTemplates(filters: { itemKind?: string; businessType?: string; includeInactive?: boolean } = {}) {
    const params = new URLSearchParams();
    if (filters.itemKind) params.append('itemKind', filters.itemKind);
    if (filters.businessType) params.append('businessType', filters.businessType);
    if (filters.includeInactive !== undefined) {
      params.append('includeInactive', String(filters.includeInactive));
    }

    const response = await api.get(`/catalog/templates?${params.toString()}`);
    return response.data as CatalogTemplate[];
  }
}

export const catalogoService = new CatalogoService();
