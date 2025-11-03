import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoDistribuicao } from './create-nucleo.dto';

export class FilterNucleoDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = String(value).toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @Transform(({ value }) => {
    if (!value) return undefined;
    if (value === 'menor_carga') return 'load_balancing';
    return value;
  })
  @IsEnum(TipoDistribuicao)
  @IsOptional()
  tipoDistribuicao?: TipoDistribuicao;

  @IsString()
  @IsOptional()
  supervisorId?: string;

  @IsString()
  @IsOptional()
  empresaId?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = String(value).toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  visivelNoBot?: boolean;
}
