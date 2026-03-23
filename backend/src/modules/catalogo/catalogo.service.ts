import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Repository } from 'typeorm';
import { Produto } from '../produtos/produto.entity';
import { CategoriaProduto } from '../categorias-produtos/entities/categoria-produto.entity';
import { SubcategoriaProduto } from '../categorias-produtos/entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from '../categorias-produtos/entities/configuracao-produto.entity';
import {
  CreateCatalogItemDto,
  CreateCatalogItemComponentDto,
  ListCatalogItemsDto,
  ListCatalogTemplatesDto,
  ReplaceCatalogItemComponentsDto,
  UpdateCatalogItemDto,
  UpdateCatalogItemStatusDto,
} from './dto/catalogo.dto';
import { CatalogItem } from './entities/catalog-item.entity';
import { CatalogItemComponent } from './entities/catalog-item-component.entity';
import { CatalogTemplate } from './entities/catalog-template.entity';
import { CatalogTemplateField } from './entities/catalog-template-field.entity';

const COMPOSITE_ITEM_KINDS = new Set(['composite', 'subscription', 'variant_parent']);
const TEMPLATE_ITEM_KIND_COMPATIBILITY: Record<string, string[]> = {
  retail_accessory_or_service: ['service'],
};
const TEMPLATE_BUSINESS_TYPE_COMPATIBILITY: Record<string, string[]> = {
  software_module: ['licenca', 'aplicativo'],
  retail_accessory_or_service: ['servico', 'garantia'],
};

type ItemHierarchy = {
  categoria: CategoriaProduto | null;
  subcategoria: SubcategoriaProduto | null;
  configuracao: ConfiguracaoProduto | null;
};

@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(CatalogItem)
    private readonly catalogItemRepository: Repository<CatalogItem>,
    @InjectRepository(CatalogItemComponent)
    private readonly catalogItemComponentRepository: Repository<CatalogItemComponent>,
    @InjectRepository(CatalogTemplate)
    private readonly catalogTemplateRepository: Repository<CatalogTemplate>,
    @InjectRepository(CatalogTemplateField)
    private readonly catalogTemplateFieldRepository: Repository<CatalogTemplateField>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto)
    private readonly categoriaRepository: Repository<CategoriaProduto>,
    @InjectRepository(SubcategoriaProduto)
    private readonly subcategoriaRepository: Repository<SubcategoriaProduto>,
    @InjectRepository(ConfiguracaoProduto)
    private readonly configuracaoRepository: Repository<ConfiguracaoProduto>,
  ) {}

  private toNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeTemplateField(field: CatalogTemplateField) {
    return {
      id: field.id,
      templateCode: field.templateCode,
      fieldKey: field.fieldKey,
      label: field.label,
      section: field.section,
      fieldType: field.fieldType,
      required: Boolean(field.required),
      options: field.options ?? null,
      sortOrder: this.toNumber(field.sortOrder),
      helpText: field.helpText ?? null,
    };
  }

  private normalizeTemplate(template?: CatalogTemplate | null) {
    if (!template) {
      return null;
    }

    return {
      code: template.code,
      empresaId: template.empresaId ?? null,
      nome: template.nome,
      descricao: template.descricao ?? null,
      itemKind: template.itemKind,
      businessType: template.businessType,
      ativo: Boolean(template.ativo),
      fields: (template.fields || [])
        .slice()
        .sort((a, b) => this.toNumber(a.sortOrder) - this.toNumber(b.sortOrder))
        .map((field) => this.normalizeTemplateField(field)),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private normalizeComponent(component: CatalogItemComponent) {
    return {
      id: component.id,
      empresaId: component.empresaId,
      parentItemId: component.parentItemId,
      childItemId: component.childItemId,
      componentRole: component.componentRole,
      quantity: this.toNumber(component.quantity, 1),
      sortOrder: this.toNumber(component.sortOrder, 0),
      affectsPrice: Boolean(component.affectsPrice),
      isDefault: Boolean(component.isDefault),
      metadata: component.metadata ?? null,
      childItem: component.childItem
        ? {
            id: component.childItem.id,
            nome: component.childItem.nome,
            itemKind: component.childItem.itemKind,
            businessType: component.childItem.businessType,
            status: component.childItem.status,
            templateCode: component.childItem.templateCode ?? null,
            salePrice: this.toNumber(component.childItem.salePrice, 0),
            currencyCode: component.childItem.currencyCode,
            sku: component.childItem.sku ?? null,
          }
        : null,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    };
  }

  private normalizeItem(item: CatalogItem, includeComponents = false) {
    return {
      id: item.id,
      empresaId: item.empresaId,
      legacyProdutoId: item.legacyProdutoId ?? null,
      code: item.code ?? null,
      nome: item.nome,
      descricao: item.descricao ?? null,
      itemKind: item.itemKind,
      businessType: item.businessType,
      templateCode: item.templateCode ?? null,
      template: this.normalizeTemplate(item.template),
      categoriaId: item.categoriaId ?? null,
      categoriaNome: item.categoria?.nome ?? null,
      subcategoriaId: item.subcategoriaId ?? null,
      subcategoriaNome: item.subcategoria?.nome ?? null,
      configuracaoId: item.configuracaoId ?? null,
      configuracaoNome: item.configuracao?.nome ?? null,
      status: item.status,
      billingModel: item.billingModel ?? null,
      recurrence: item.recurrence ?? null,
      unitCode: item.unitCode ?? null,
      salePrice: this.toNumber(item.salePrice, 0),
      costAmount:
        item.costAmount === null || item.costAmount === undefined
          ? null
          : this.toNumber(item.costAmount, 0),
      currencyCode: item.currencyCode,
      trackStock: Boolean(item.trackStock),
      stockCurrent:
        item.stockCurrent === null || item.stockCurrent === undefined
          ? null
          : this.toNumber(item.stockCurrent, 0),
      stockMin:
        item.stockMin === null || item.stockMin === undefined
          ? null
          : this.toNumber(item.stockMin, 0),
      stockMax:
        item.stockMax === null || item.stockMax === undefined
          ? null
          : this.toNumber(item.stockMax, 0),
      sku: item.sku ?? null,
      supplierName: item.supplierName ?? null,
      metadata: item.metadata ?? null,
      deletedAt: item.deletedAt ?? null,
      components: includeComponents
        ? (item.componentsAsParent || [])
            .slice()
            .sort((a, b) => this.toNumber(a.sortOrder) - this.toNumber(b.sortOrder))
            .map((component) => this.normalizeComponent(component))
        : undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private buildItemsQuery(empresaId: string, includeDeleted = false) {
    const qb = this.catalogItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.template', 'template')
      .leftJoinAndSelect('template.fields', 'templateField')
      .leftJoinAndSelect('item.categoria', 'categoria')
      .leftJoinAndSelect('item.subcategoria', 'subcategoria')
      .leftJoinAndSelect('item.configuracao', 'configuracao')
      .where('item.empresa_id = :empresaId', { empresaId });

    if (!includeDeleted) {
      qb.andWhere('item.deleted_at IS NULL');
    }

    return qb;
  }

  private normalizeCatalogClassifier(value?: string | null): string {
    return (value || '').trim().toLowerCase();
  }

  private isTemplateItemKindCompatible(template: CatalogTemplate, itemKind: string): boolean {
    const normalizedItemKind = this.normalizeCatalogClassifier(itemKind);
    if (!normalizedItemKind) {
      return true;
    }

    if (this.normalizeCatalogClassifier(template.itemKind) === normalizedItemKind) {
      return true;
    }

    const allowedKinds = TEMPLATE_ITEM_KIND_COMPATIBILITY[template.code] || [];
    return allowedKinds.some(
      (candidateKind) => this.normalizeCatalogClassifier(candidateKind) === normalizedItemKind,
    );
  }

  private isTemplateBusinessTypeCompatible(template: CatalogTemplate, businessType: string): boolean {
    const normalizedBusinessType = this.normalizeCatalogClassifier(businessType);
    if (!normalizedBusinessType) {
      return true;
    }

    if (this.normalizeCatalogClassifier(template.businessType) === normalizedBusinessType) {
      return true;
    }

    const allowedBusinessTypes = TEMPLATE_BUSINESS_TYPE_COMPATIBILITY[template.code] || [];
    return allowedBusinessTypes.some(
      (candidateBusinessType) =>
        this.normalizeCatalogClassifier(candidateBusinessType) === normalizedBusinessType,
    );
  }

  private resolveCompatibleTemplateCodes(
    value: string,
    compatibilityMap: Record<string, string[]>,
  ): string[] {
    const normalizedValue = this.normalizeCatalogClassifier(value);
    if (!normalizedValue) {
      return [];
    }

    return Object.entries(compatibilityMap)
      .filter(([, candidates]) =>
        candidates.some(
          (candidateValue) => this.normalizeCatalogClassifier(candidateValue) === normalizedValue,
        ),
      )
      .map(([templateCode]) => templateCode);
  }

  private async ensureTemplateAccessible(
    empresaId: string,
    templateCode?: string | null,
    itemKind?: string,
    businessType?: string,
  ): Promise<CatalogTemplate | null> {
    if (!templateCode) {
      return null;
    }

    const template = await this.catalogTemplateRepository.findOne({
      where: [
        { code: templateCode, empresaId },
        { code: templateCode, empresaId: IsNull() },
      ],
      relations: {
        fields: true,
      },
      order: {
        fields: {
          sortOrder: 'ASC',
          fieldKey: 'ASC',
        },
      },
    });

    if (!template) {
      throw new BadRequestException('Template informado não foi encontrado para esta empresa');
    }

    if (itemKind && template.itemKind !== itemKind) {
      if (!this.isTemplateItemKindCompatible(template, itemKind)) {
        throw new BadRequestException('O template informado não é compatível com o itemKind');
      }
    }

    if (businessType && !this.isTemplateBusinessTypeCompatible(template, businessType)) {
      throw new BadRequestException('O template informado não é compatível com o businessType');
    }

    return template;
  }

  private async resolveHierarchy(
    empresaId: string,
    payload: Partial<CreateCatalogItemDto> & Partial<UpdateCatalogItemDto>,
  ): Promise<ItemHierarchy> {
    let categoria: CategoriaProduto | null = null;
    let subcategoria: SubcategoriaProduto | null = null;
    let configuracao: ConfiguracaoProduto | null = null;

    if (payload.categoriaId) {
      categoria = await this.categoriaRepository.findOne({
        where: { id: payload.categoriaId, empresaId },
      });

      if (!categoria) {
        throw new BadRequestException('Categoria informada não foi encontrada para esta empresa');
      }
    }

    if (payload.subcategoriaId) {
      subcategoria = await this.subcategoriaRepository.findOne({
        where: { id: payload.subcategoriaId, empresaId },
      });

      if (!subcategoria) {
        throw new BadRequestException('Subcategoria informada não foi encontrada para esta empresa');
      }

      if (categoria && subcategoria.categoriaId !== categoria.id) {
        throw new BadRequestException('A subcategoria informada não pertence à categoria selecionada');
      }

      if (!categoria) {
        categoria = await this.categoriaRepository.findOne({
          where: { id: subcategoria.categoriaId, empresaId },
        });
      }
    }

    if (payload.configuracaoId) {
      configuracao = await this.configuracaoRepository.findOne({
        where: { id: payload.configuracaoId, empresaId },
      });

      if (!configuracao) {
        throw new BadRequestException('Configuração informada não foi encontrada para esta empresa');
      }

      if (subcategoria && configuracao.subcategoriaId !== subcategoria.id) {
        throw new BadRequestException(
          'A configuração informada não pertence à subcategoria selecionada',
        );
      }

      if (!subcategoria) {
        subcategoria = await this.subcategoriaRepository.findOne({
          where: { id: configuracao.subcategoriaId, empresaId },
        });
      }

      if (!subcategoria) {
        throw new BadRequestException('A subcategoria vinculada à configuração não foi encontrada');
      }

      if (categoria && subcategoria.categoriaId !== categoria.id) {
        throw new BadRequestException(
          'A configuração informada não pertence à categoria selecionada',
        );
      }

      if (!categoria) {
        categoria = await this.categoriaRepository.findOne({
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

  private async findLegacyProduto(
    empresaId: string,
    legacyProdutoId?: string | null,
  ): Promise<Produto | null> {
    if (!legacyProdutoId) {
      return null;
    }

    const produto = await this.produtoRepository.findOne({
      where: { id: legacyProdutoId, empresaId },
    });

    if (!produto) {
      throw new BadRequestException('Produto legado informado não foi encontrado para esta empresa');
    }

    return produto;
  }

  private ensureCompositeComponentsAllowed(
    itemKind: string,
    components?: CreateCatalogItemComponentDto[],
  ): void {
    if (!components?.length) {
      return;
    }

    if (!COMPOSITE_ITEM_KINDS.has(itemKind)) {
      throw new BadRequestException(
        'Somente itens compostos, subscriptions ou variant_parent podem possuir componentes',
      );
    }
  }

  private async findItemOrFail(
    id: string,
    empresaId: string,
    options?: { includeDeleted?: boolean; includeComponents?: boolean },
  ): Promise<CatalogItem> {
    const qb = this.buildItemsQuery(empresaId, options?.includeDeleted ?? false).andWhere(
      'item.id = :id',
      { id },
    );

    if (options?.includeComponents) {
      qb.leftJoinAndSelect('item.componentsAsParent', 'component')
        .leftJoinAndSelect('component.childItem', 'childItem')
        .addOrderBy('component.sort_order', 'ASC')
        .addOrderBy('childItem.nome', 'ASC');
    }

    const item = await qb.getOne();

    if (!item) {
      throw new NotFoundException('Item de catálogo não encontrado');
    }

    return item;
  }

  private async replaceComponentsInternal(
    parentItem: CatalogItem,
    empresaId: string,
    payload: ReplaceCatalogItemComponentsDto,
  ): Promise<void> {
    this.ensureCompositeComponentsAllowed(parentItem.itemKind, payload.components);

    await this.catalogItemComponentRepository.delete({
      empresaId,
      parentItemId: parentItem.id,
    });

    if (!payload.components.length) {
      return;
    }

    const childIds = [...new Set(payload.components.map((component) => component.childItemId))];
    const childItems = await this.catalogItemRepository.find({
      where: {
        empresaId,
        id: In(childIds),
        deletedAt: IsNull(),
      },
      select: ['id'],
    });

    if (childItems.length !== childIds.length) {
      throw new BadRequestException('Um ou mais componentes informados não existem para esta empresa');
    }

    const invalidSelfReference = payload.components.some(
      (component) => component.childItemId === parentItem.id,
    );
    if (invalidSelfReference) {
      throw new BadRequestException('Um item não pode referenciar a si mesmo como componente');
    }

    const entities = payload.components.map((component, index) =>
      this.catalogItemComponentRepository.create({
        empresaId,
        parentItemId: parentItem.id,
        childItemId: component.childItemId,
        componentRole: component.componentRole,
        quantity: component.quantity ?? 1,
        sortOrder: component.sortOrder ?? index,
        affectsPrice: component.affectsPrice ?? false,
        isDefault: component.isDefault ?? true,
        metadata: component.metadata ?? null,
      }),
    );

    await this.catalogItemComponentRepository.save(entities);
  }

  async listItems(empresaId: string, filtros: ListCatalogItemsDto) {
    const page = Math.max(1, filtros.page ?? 1);
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20));

    const qb = this.buildItemsQuery(empresaId, filtros.includeDeleted ?? false);

    if (filtros.search) {
      qb.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('item.nome ILIKE :search', { search: `%${filtros.search}%` })
            .orWhere('COALESCE(item.descricao, \'\') ILIKE :search', {
              search: `%${filtros.search}%`,
            })
            .orWhere('COALESCE(item.sku, \'\') ILIKE :search', {
              search: `%${filtros.search}%`,
            });
        }),
      );
    }

    if (filtros.status) {
      qb.andWhere('item.status = :status', { status: filtros.status });
    }

    if (filtros.itemKind) {
      qb.andWhere('item.item_kind = :itemKind', { itemKind: filtros.itemKind });
    }

    if (filtros.businessType) {
      qb.andWhere('item.business_type = :businessType', {
        businessType: filtros.businessType,
      });
    }

    if (filtros.templateCode) {
      qb.andWhere('item.template_code = :templateCode', { templateCode: filtros.templateCode });
    }

    if (filtros.categoriaId) {
      qb.andWhere('item.categoria_id = :categoriaId', { categoriaId: filtros.categoriaId });
    }

    if (filtros.subcategoriaId) {
      qb.andWhere('item.subcategoria_id = :subcategoriaId', {
        subcategoriaId: filtros.subcategoriaId,
      });
    }

    if (filtros.configuracaoId) {
      qb.andWhere('item.configuracao_id = :configuracaoId', {
        configuracaoId: filtros.configuracaoId,
      });
    }

    const sortField =
      filtros.sortBy === 'nome'
        ? 'item.nome'
        : filtros.sortBy === 'sale_price'
          ? 'item.sale_price'
          : 'item.created_at';
    const sortDirection = filtros.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, sortDirection).addOrderBy('item.nome', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.normalizeItem(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getItem(id: string, empresaId: string) {
    const item = await this.findItemOrFail(id, empresaId, { includeComponents: true });
    return this.normalizeItem(item, true);
  }

  async createItem(empresaId: string, payload: CreateCatalogItemDto) {
    this.ensureCompositeComponentsAllowed(payload.itemKind, payload.components);

    const [template, hierarchy] = await Promise.all([
      this.ensureTemplateAccessible(
        empresaId,
        payload.templateCode,
        payload.itemKind,
        payload.businessType,
      ),
      this.resolveHierarchy(empresaId, payload),
    ]);

    await this.findLegacyProduto(empresaId, payload.legacyProdutoId);

    const item = this.catalogItemRepository.create({
      empresaId,
      legacyProdutoId: payload.legacyProdutoId ?? null,
      code: payload.code?.trim() || null,
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || null,
      itemKind: payload.itemKind,
      businessType: payload.businessType,
      templateCode: template?.code ?? null,
      categoriaId: hierarchy.categoria?.id ?? null,
      subcategoriaId: hierarchy.subcategoria?.id ?? null,
      configuracaoId: hierarchy.configuracao?.id ?? null,
      status: payload.status ?? 'ativo',
      billingModel: payload.billingModel ?? null,
      recurrence: payload.recurrence ?? null,
      unitCode: payload.unitCode?.trim() || null,
      salePrice: payload.salePrice,
      costAmount: payload.costAmount ?? null,
      currencyCode: 'BRL',
      trackStock: payload.trackStock ?? false,
      stockCurrent: payload.trackStock ? payload.stockCurrent ?? 0 : null,
      stockMin: payload.trackStock ? payload.stockMin ?? null : null,
      stockMax: payload.trackStock ? payload.stockMax ?? null : null,
      sku: payload.sku?.trim() || null,
      supplierName: payload.supplierName?.trim() || null,
      metadata: payload.metadata ?? null,
    });

    const saved = await this.catalogItemRepository.save(item);

    if (payload.components?.length) {
      await this.replaceComponentsInternal(saved, empresaId, {
        components: payload.components,
      });
    }

    return this.getItem(saved.id, empresaId);
  }

  async updateItem(id: string, empresaId: string, payload: UpdateCatalogItemDto) {
    const item = await this.findItemOrFail(id, empresaId, {
      includeDeleted: true,
      includeComponents: true,
    });

    const nextItemKind = payload.itemKind ?? item.itemKind;
    const nextBusinessType = payload.businessType ?? item.businessType;
    const nextTemplateCode =
      payload.templateCode !== undefined ? payload.templateCode : item.templateCode ?? null;
    const shouldResolveHierarchy =
      payload.categoriaId !== undefined ||
      payload.subcategoriaId !== undefined ||
      payload.configuracaoId !== undefined;

    const [template, hierarchy] = await Promise.all([
      this.ensureTemplateAccessible(empresaId, nextTemplateCode, nextItemKind, nextBusinessType),
      shouldResolveHierarchy
        ? this.resolveHierarchy(empresaId, {
            categoriaId:
              payload.categoriaId !== undefined ? payload.categoriaId : item.categoriaId ?? null,
            subcategoriaId:
              payload.subcategoriaId !== undefined
                ? payload.subcategoriaId
                : item.subcategoriaId ?? null,
            configuracaoId:
              payload.configuracaoId !== undefined
                ? payload.configuracaoId
                : item.configuracaoId ?? null,
          })
        : Promise.resolve<ItemHierarchy>({
            categoria: item.categoria ?? null,
            subcategoria: item.subcategoria ?? null,
            configuracao: item.configuracao ?? null,
          }),
    ]);

    await this.findLegacyProduto(
      empresaId,
      payload.legacyProdutoId !== undefined ? payload.legacyProdutoId : item.legacyProdutoId ?? null,
    );

    if (payload.code !== undefined) item.code = payload.code?.trim() || null;
    if (payload.legacyProdutoId !== undefined) item.legacyProdutoId = payload.legacyProdutoId ?? null;
    if (payload.nome !== undefined) item.nome = payload.nome.trim();
    if (payload.descricao !== undefined) item.descricao = payload.descricao?.trim() || null;
    if (payload.itemKind !== undefined) item.itemKind = payload.itemKind;
    if (payload.businessType !== undefined) item.businessType = payload.businessType;
    if (payload.templateCode !== undefined) item.templateCode = template?.code ?? null;
    if (payload.status !== undefined) item.status = payload.status;
    if (payload.billingModel !== undefined) item.billingModel = payload.billingModel ?? null;
    if (payload.recurrence !== undefined) item.recurrence = payload.recurrence ?? null;
    if (payload.unitCode !== undefined) item.unitCode = payload.unitCode?.trim() || null;
    if (payload.salePrice !== undefined) item.salePrice = payload.salePrice;
    if (payload.costAmount !== undefined) item.costAmount = payload.costAmount ?? null;
    if (payload.trackStock !== undefined) item.trackStock = payload.trackStock;
    if (payload.sku !== undefined) item.sku = payload.sku?.trim() || null;
    if (payload.supplierName !== undefined) item.supplierName = payload.supplierName?.trim() || null;
    if (payload.metadata !== undefined) item.metadata = payload.metadata ?? null;

    if (shouldResolveHierarchy) {
      item.categoriaId = hierarchy.categoria?.id ?? null;
      item.subcategoriaId = hierarchy.subcategoria?.id ?? null;
      item.configuracaoId = hierarchy.configuracao?.id ?? null;
    }

    if (payload.trackStock !== undefined || payload.stockCurrent !== undefined) {
      item.stockCurrent = item.trackStock ? payload.stockCurrent ?? item.stockCurrent ?? 0 : null;
    }
    if (payload.trackStock !== undefined || payload.stockMin !== undefined) {
      item.stockMin = item.trackStock ? payload.stockMin ?? item.stockMin ?? null : null;
    }
    if (payload.trackStock !== undefined || payload.stockMax !== undefined) {
      item.stockMax = item.trackStock ? payload.stockMax ?? item.stockMax ?? null : null;
    }

    this.ensureCompositeComponentsAllowed(item.itemKind, payload.components);

    await this.catalogItemRepository.save(item);

    if (payload.components) {
      await this.replaceComponentsInternal(item, empresaId, {
        components: payload.components,
      });
    }

    return this.getItem(id, empresaId);
  }

  async updateStatus(id: string, empresaId: string, payload: UpdateCatalogItemStatusDto) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });
    item.status = payload.status;

    if (payload.status === 'descontinuado' && !item.deletedAt) {
      item.deletedAt = new Date();
    }

    if (payload.status !== 'descontinuado') {
      item.deletedAt = null;
    }

    await this.catalogItemRepository.save(item);
    return this.getItem(id, empresaId);
  }

  async removeItem(id: string, empresaId: string) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });
    item.status = 'descontinuado';
    item.deletedAt = new Date();
    await this.catalogItemRepository.save(item);
    return { message: 'Item de catálogo descontinuado com sucesso' };
  }

  async getItemComponents(id: string, empresaId: string) {
    await this.findItemOrFail(id, empresaId);

    const components = await this.catalogItemComponentRepository.find({
      where: { empresaId, parentItemId: id },
      relations: {
        childItem: true,
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });

    return components.map((component) => this.normalizeComponent(component));
  }

  async replaceItemComponents(
    id: string,
    empresaId: string,
    payload: ReplaceCatalogItemComponentsDto,
  ) {
    const item = await this.findItemOrFail(id, empresaId, {
      includeDeleted: true,
      includeComponents: true,
    });
    await this.replaceComponentsInternal(item, empresaId, payload);
    return this.getItemComponents(id, empresaId);
  }

  async listTemplates(empresaId: string, filtros: ListCatalogTemplatesDto) {
    const qb = this.catalogTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.fields', 'field')
      .where('(template.empresa_id IS NULL OR template.empresa_id = :empresaId)', { empresaId });

    if (!filtros.includeInactive) {
      qb.andWhere('template.ativo = true');
    }

    if (filtros.itemKind) {
      const compatibleTemplateCodes = this.resolveCompatibleTemplateCodes(
        filtros.itemKind,
        TEMPLATE_ITEM_KIND_COMPATIBILITY,
      );

      qb.andWhere(
        new Brackets((subQuery) => {
          subQuery.where('template.item_kind = :itemKind', { itemKind: filtros.itemKind });
          if (compatibleTemplateCodes.length > 0) {
            subQuery.orWhere('template.code IN (:...itemKindCompatibleTemplateCodes)', {
              itemKindCompatibleTemplateCodes: compatibleTemplateCodes,
            });
          }
        }),
      );
    }

    if (filtros.businessType) {
      const compatibleTemplateCodes = this.resolveCompatibleTemplateCodes(
        filtros.businessType,
        TEMPLATE_BUSINESS_TYPE_COMPATIBILITY,
      );

      qb.andWhere(
        new Brackets((subQuery) => {
          subQuery.where('template.business_type = :businessType', {
            businessType: filtros.businessType,
          });
          if (compatibleTemplateCodes.length > 0) {
            subQuery.orWhere('template.code IN (:...businessTypeCompatibleTemplateCodes)', {
              businessTypeCompatibleTemplateCodes: compatibleTemplateCodes,
            });
          }
        }),
      );
    }

    qb.orderBy('template.empresa_id', 'DESC')
      .addOrderBy('template.nome', 'ASC')
      .addOrderBy('field.sort_order', 'ASC')
      .addOrderBy('field.field_key', 'ASC');

    const templates = await qb.getMany();
    return templates.map((template) => this.normalizeTemplate(template));
  }

  async getTemplate(code: string, empresaId: string) {
    const template = await this.catalogTemplateRepository.findOne({
      where: [
        { code, empresaId },
        { code, empresaId: IsNull() },
      ],
      relations: {
        fields: true,
      },
      order: {
        fields: {
          sortOrder: 'ASC',
          fieldKey: 'ASC',
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template de catálogo não encontrado');
    }

    return this.normalizeTemplate(template);
  }

  async getStats(empresaId: string) {
    const raw = await this.catalogItemRepository
      .createQueryBuilder('item')
      .select('COUNT(*)', 'totalItems')
      .addSelect(`COUNT(*) FILTER (WHERE item.status = 'ativo' AND item.deleted_at IS NULL)`, 'activeItems')
      .addSelect(
        `COUNT(*) FILTER (WHERE item.item_kind IN ('composite', 'subscription', 'variant_parent') AND item.deleted_at IS NULL)`,
        'compositeItems',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE item.deleted_at IS NULL
            AND item.track_stock = true
            AND item.stock_min IS NOT NULL
            AND COALESCE(item.stock_current, 0) <= item.stock_min
        )`,
        'lowStockItems',
      )
      .addSelect(`COUNT(*) FILTER (WHERE item.deleted_at IS NOT NULL)`, 'deletedItems')
      .addSelect(`COALESCE(SUM(item.sale_price) FILTER (WHERE item.deleted_at IS NULL), 0)`, 'totalSalePrice')
      .addSelect(`COALESCE(SUM(item.cost_amount) FILTER (WHERE item.deleted_at IS NULL), 0)`, 'totalCostAmount')
      .where('item.empresa_id = :empresaId', { empresaId })
      .getRawOne();

    return {
      totalItems: this.toNumber(raw?.totalitems ?? raw?.totalItems, 0),
      activeItems: this.toNumber(raw?.activeitems ?? raw?.activeItems, 0),
      compositeItems: this.toNumber(raw?.compositeitems ?? raw?.compositeItems, 0),
      lowStockItems: this.toNumber(raw?.lowstockitems ?? raw?.lowStockItems, 0),
      deletedItems: this.toNumber(raw?.deleteditems ?? raw?.deletedItems, 0),
      totalSalePrice: this.toNumber(raw?.totalsaleprice ?? raw?.totalSalePrice, 0),
      totalCostAmount: this.toNumber(raw?.totalcostamount ?? raw?.totalCostAmount, 0),
    };
  }
}
