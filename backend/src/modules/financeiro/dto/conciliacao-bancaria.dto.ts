import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const parseBooleanQueryValue = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class ImportarExtratoBancarioDto {
  @IsUUID()
  contaBancariaId: string;
}

export class QueryImportacoesExtratoDto {
  @IsOptional()
  @IsUUID()
  contaBancariaId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}

export class QueryItensImportacaoExtratoDto {
  @IsOptional()
  @Transform(parseBooleanQueryValue)
  @IsBoolean()
  conciliado?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limite?: number;
}

export class ExecutarMatchingAutomaticoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  toleranciaDias?: number;
}

export class ConciliarItemExtratoDto {
  @IsUUID()
  contaPagarId: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class DesconciliarItemExtratoDto {
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class QueryCandidatosConciliacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}
