import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TipoContaBancaria } from '../entities/conta-bancaria.entity';

export class QueryContasBancariasDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  busca?: string;
}

export class CreateContaBancariaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  banco: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  agencia: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  conta: string;

  @IsOptional()
  @IsEnum(TipoContaBancaria)
  tipoConta?: TipoContaBancaria;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saldo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  chavePix?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateContaBancariaDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  banco?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  agencia?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  conta?: string;

  @IsOptional()
  @IsEnum(TipoContaBancaria)
  tipoConta?: TipoContaBancaria;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saldo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  chavePix?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class ContaBancariaIdDto {
  @IsUUID()
  id: string;
}
