import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ContaPagarAnexoDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tamanho: number;

  @IsOptional()
  @IsString()
  url?: string;
}

export class QueryContasPagarDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsString()
  termo?: string;

  @IsOptional()
  status?: string | string[];

  @IsOptional()
  categoria?: string | string[];

  @IsOptional()
  prioridade?: string | string[];

  @IsOptional()
  @IsUUID()
  fornecedorId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

export class CreateContaPagarDto {
  @IsUUID()
  fornecedorId: string;

  @IsString()
  descricao: string;

  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @IsOptional()
  @IsDateString()
  dataEmissao?: string;

  @IsDateString()
  dataVencimento: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  valorOriginal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDesconto?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  prioridade?: string;

  @IsOptional()
  @IsString()
  tipoPagamento?: string;

  @IsOptional()
  @IsString()
  contaBancariaId?: string;

  @IsOptional()
  @IsString()
  centroCustoId?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  recorrente?: boolean;

  @IsOptional()
  @IsString()
  frequenciaRecorrencia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  numeroParcelas?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContaPagarAnexoDto)
  anexos?: ContaPagarAnexoDto[];
}

export class UpdateContaPagarDto {
  @IsOptional()
  @IsUUID()
  fornecedorId?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @IsOptional()
  @IsDateString()
  dataEmissao?: string;

  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  valorOriginal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDesconto?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  prioridade?: string;

  @IsOptional()
  @IsString()
  tipoPagamento?: string;

  @IsOptional()
  @IsString()
  contaBancariaId?: string;

  @IsOptional()
  @IsString()
  centroCustoId?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  recorrente?: boolean;

  @IsOptional()
  @IsString()
  frequenciaRecorrencia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  numeroParcelas?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContaPagarAnexoDto)
  anexos?: ContaPagarAnexoDto[];
}

export class RegistrarPagamentoContaPagarDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  valorPago?: number;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @IsString()
  tipoPagamento?: string;

  @IsOptional()
  @IsString()
  contaBancariaId?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  comprovantePagamento?: string;
}
