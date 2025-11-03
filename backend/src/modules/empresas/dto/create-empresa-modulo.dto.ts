import { IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ModuloEnum, PlanoEnum } from '../entities/empresa-modulo.entity';

export class CreateEmpresaModuloDto {
  @IsEnum(ModuloEnum)
  modulo: ModuloEnum;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsDateString()
  data_expiracao?: string;

  @IsOptional()
  @IsEnum(PlanoEnum)
  plano?: PlanoEnum;
}
