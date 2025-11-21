import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoContrato } from '../entities/contrato.entity';

export class CondicoesPagamentoDto {
  @IsNumber()
  @Min(1)
  @Max(12)
  parcelas: number;

  @IsString()
  formaPagamento: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  diaVencimento: number;

  @IsNumber()
  @Min(0.01)
  valorParcela: number;
}

export class CreateContratoDto {
  @IsOptional()
  @IsUUID()
  propostaId?: string;

  @IsUUID(4)
  clienteId: string;

  @IsUUID(4)
  usuarioResponsavelId: string;

  @IsEnum(TipoContrato)
  tipo: TipoContrato;

  @IsString()
  objeto: string;

  @IsNumber()
  @Min(0.01)
  valorTotal: number;

  @IsDateString()
  dataInicio: string;

  @IsDateString()
  dataFim: string;

  @IsDateString()
  dataVencimento: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  clausulasEspeciais?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CondicoesPagamentoDto)
  condicoesPagamento?: CondicoesPagamentoDto;
}

export class UpdateContratoDto {
  @IsOptional()
  @IsString()
  objeto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valorTotal?: number;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  clausulasEspeciais?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CondicoesPagamentoDto)
  condicoesPagamento?: CondicoesPagamentoDto;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
