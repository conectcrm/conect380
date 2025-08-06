import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoFatura, FormaPagamento } from '../entities/fatura.entity';

export class ItemFaturaDto {
  @IsString()
  descricao: string;

  @IsNumber()
  @Min(0.01)
  quantidade: number;

  @IsNumber()
  @Min(0.01)
  valorUnitario: number;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsString()
  codigoProduto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentualDesconto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDesconto?: number;
}

export class CreateFaturaDto {
  @IsNumber()
  contratoId: number;

  @IsNumber()
  clienteId: number;

  @IsNumber()
  usuarioResponsavelId: number;

  @IsEnum(TipoFatura)
  tipo: TipoFatura;

  @IsString()
  descricao: string;

  @IsOptional()
  @IsEnum(FormaPagamento)
  formaPagamentoPreferida?: FormaPagamento;

  @IsDateString()
  dataVencimento: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemFaturaDto)
  itens: ItemFaturaDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDesconto?: number;
}

export class UpdateFaturaDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum(FormaPagamento)
  formaPagamentoPreferida?: FormaPagamento;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorDesconto?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemFaturaDto)
  itens?: ItemFaturaDto[];
}

export class GerarFaturaAutomaticaDto {
  @IsNumber()
  contratoId: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  enviarEmail?: boolean;
}
