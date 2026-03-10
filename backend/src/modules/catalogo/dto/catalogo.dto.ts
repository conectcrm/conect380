import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const catalogItemKinds = [
  'simple',
  'composite',
  'variant_parent',
  'variant_child',
  'service',
  'subscription',
] as const;

export const catalogBusinessTypes = [
  'produto',
  'servico',
  'plano',
  'modulo',
  'licenca',
  'aplicativo',
  'peca',
  'acessorio',
  'pacote',
  'garantia',
] as const;

export const catalogStatuses = ['ativo', 'inativo', 'descontinuado'] as const;
export const catalogBillingModels = ['unico', 'recorrente'] as const;
export const catalogRecurrences = ['mensal', 'anual', 'trimestral', 'sob_consulta'] as const;
export const catalogComponentRoles = [
  'included',
  'required',
  'optional',
  'recommended',
  'addon',
] as const;
export const catalogTemplateSections = [
  'identificacao',
  'comercial',
  'cobranca',
  'operacao',
  'estoque',
  'composicao',
  'compatibilidade',
  'observacoes',
] as const;
export const catalogTemplateFieldTypes = [
  'text',
  'textarea',
  'number',
  'money',
  'select',
  'multiselect',
  'boolean',
  'json',
  'date',
] as const;

export type CatalogItemKind = (typeof catalogItemKinds)[number];
export type CatalogBusinessType = (typeof catalogBusinessTypes)[number];
export type CatalogStatus = (typeof catalogStatuses)[number];
export type CatalogBillingModel = (typeof catalogBillingModels)[number];
export type CatalogRecurrence = (typeof catalogRecurrences)[number];
export type CatalogComponentRole = (typeof catalogComponentRoles)[number];

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class ListCatalogItemsDto {
  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(catalogStatuses)
  status?: CatalogStatus;

  @IsOptional()
  @IsEnum(catalogItemKinds)
  itemKind?: CatalogItemKind;

  @IsOptional()
  @IsEnum(catalogBusinessTypes)
  businessType?: CatalogBusinessType;

  @IsOptional()
  @IsString()
  templateCode?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  subcategoriaId?: string;

  @IsOptional()
  @IsUUID()
  configuracaoId?: string;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @IsEnum(['created_at', 'nome', 'sale_price'])
  sortBy?: 'created_at' | 'nome' | 'sale_price';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class ListCatalogTemplatesDto {
  @IsOptional()
  @IsEnum(catalogItemKinds)
  itemKind?: CatalogItemKind;

  @IsOptional()
  @IsEnum(catalogBusinessTypes)
  businessType?: CatalogBusinessType;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  includeInactive?: boolean;
}

export class CreateCatalogItemComponentDto {
  @IsUUID()
  childItemId: string;

  @IsEnum(catalogComponentRoles)
  componentRole: CatalogComponentRole;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  affectsPrice?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ReplaceCatalogItemComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCatalogItemComponentDto)
  components: CreateCatalogItemComponentDto[];
}

export class CreateCatalogItemDto {
  @IsOptional()
  @IsUUID()
  legacyProdutoId?: string | null;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsEnum(catalogItemKinds)
  itemKind: CatalogItemKind;

  @IsEnum(catalogBusinessTypes)
  businessType: CatalogBusinessType;

  @IsOptional()
  @IsString()
  templateCode?: string | null;

  @IsOptional()
  @IsUUID()
  categoriaId?: string | null;

  @IsOptional()
  @IsUUID()
  subcategoriaId?: string | null;

  @IsOptional()
  @IsUUID()
  configuracaoId?: string | null;

  @IsOptional()
  @IsEnum(catalogStatuses)
  status?: CatalogStatus;

  @IsOptional()
  @IsEnum(catalogBillingModels)
  billingModel?: CatalogBillingModel | null;

  @IsOptional()
  @IsEnum(catalogRecurrences)
  recurrence?: CatalogRecurrence | null;

  @IsOptional()
  @IsString()
  unitCode?: string | null;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  costAmount?: number | null;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  stockCurrent?: number | null;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  stockMin?: number | null;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  stockMax?: number | null;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsString()
  supplierName?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCatalogItemComponentDto)
  components?: CreateCatalogItemComponentDto[];
}

export class UpdateCatalogItemDto extends PartialType(CreateCatalogItemDto) {}

export class UpdateCatalogItemStatusDto {
  @IsEnum(catalogStatuses)
  status: CatalogStatus;
}
