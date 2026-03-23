import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

type OrdenacaoCategoria = 'nome' | 'created_at' | 'ordem';
type DirecaoOrdenacao = 'asc' | 'desc';

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

export class FiltrosCategoriasDto {
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(['nome', 'created_at', 'ordem'])
  ordenacao?: OrdenacaoCategoria;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsEnum(['asc', 'desc'])
  direcao?: DirecaoOrdenacao;
}

export class FiltrosSubcategoriasDto extends FiltrosCategoriasDto {
  @IsOptional()
  @IsUUID()
  categoria_id?: string;
}

export class FiltrosConfiguracoesDto extends FiltrosCategoriasDto {
  @IsOptional()
  @IsUUID()
  subcategoria_id?: string;
}

export class CriarCategoriaProdutoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  icone?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarCategoriaProdutoDto extends PartialType(CriarCategoriaProdutoDto) {}

export class CriarSubcategoriaProdutoDto {
  @IsUUID()
  categoria_id: string;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  precoBase?: number;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsObject()
  camposPersonalizados?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarSubcategoriaProdutoDto extends PartialType(CriarSubcategoriaProdutoDto) {}

export class CriarConfiguracaoProdutoDto {
  @IsUUID()
  subcategoria_id: string;

  @IsString()
  nome: string;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  multiplicador?: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarConfiguracaoProdutoDto extends PartialType(CriarConfiguracaoProdutoDto) {}

export class ReordenarCategoriasDto {
  @IsArray()
  categorias: Array<{ id: string; ordem: number }>;
}

export class DuplicarCategoriaDto {
  @IsOptional()
  @IsString()
  novoNome?: string;
}

export class ImportarCategoriasPayloadDto {
  @IsArray()
  categorias: any[];
}

