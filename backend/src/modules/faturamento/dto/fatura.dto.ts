import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean, Min, Max, IsUUID } from 'class-validator';
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
  @IsOptional()
  @IsNumber()
  contratoId?: number;

  // ✅ CORREÇÃO: Usar UUID para cliente
  @IsUUID(4, { message: 'ID do cliente deve ser um UUID válido' })
  clienteId: string;

  @IsUUID()
  usuarioResponsavelId: string;

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
