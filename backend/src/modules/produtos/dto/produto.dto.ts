import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, IsEnum, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProdutoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  categoria: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  preco: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  custoUnitario?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['produto', 'servico', 'licenca', 'modulo', 'plano', 'aplicativo'])
  tipoItem?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['unico', 'mensal', 'anual'])
  frequencia?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['unidade', 'saca', 'hectare', 'pacote', 'licenca'])
  unidadeMedida?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['ativo', 'inativo', 'descontinuado'])
  status?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  fornecedor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estoqueAtual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estoqueMinimo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estoqueMaximo?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variacoes?: string[];
}

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {}
