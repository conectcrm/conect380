import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProdutoDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  categoria: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  subcategoriaId?: string;

  @IsOptional()
  @IsUUID()
  configuracaoId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  preco: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : parseFloat(value),
  )
  custoUnitario?: number;

  @IsOptional()
  @IsString()
  @IsEnum([
    'produto',
    'servico',
    'licenca',
    'modulo',
    'plano',
    'aplicativo',
    'peca',
    'acessorio',
    'pacote',
    'garantia',
  ])
  tipoItem?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['unico', 'mensal', 'anual', 'trimestral', 'sob_consulta'])
  frequencia?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['unidade', 'saca', 'hectare', 'pacote', 'licenca', 'hora', 'dia', 'mensal', 'assinatura'])
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

  @IsOptional()
  @IsString()
  tipoLicenciamento?: string;

  @IsOptional()
  @IsString()
  periodicidadeLicenca?: string;

  @IsOptional()
  @IsBoolean()
  renovacaoAutomatica?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : Number(value),
  )
  quantidadeLicencas?: number;
}

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {}
