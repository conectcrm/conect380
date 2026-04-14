import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MetaTipo } from '../entities/meta.entity';

export class CreateMetaDto {
  @IsEnum(MetaTipo)
  tipo: MetaTipo;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  periodo: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  valor: number;

  @IsUUID()
  @IsOptional()
  vendedorId?: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  regiao?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsUUID()
  @IsOptional()
  empresaId?: string;
}
