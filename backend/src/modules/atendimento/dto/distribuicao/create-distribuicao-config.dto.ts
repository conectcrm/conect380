import { IsString, IsBoolean, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class CreateDistribuicaoConfigDto {
  @IsString()
  filaId: string;

  @IsEnum(['round-robin', 'menor-carga', 'skills', 'hibrido'])
  algoritmo: 'round-robin' | 'menor-carga' | 'skills' | 'hibrido';

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  capacidadeMaxima?: number;

  @IsBoolean()
  @IsOptional()
  priorizarOnline?: boolean;

  @IsBoolean()
  @IsOptional()
  considerarSkills?: boolean;

  @IsInt()
  @Min(1)
  @Max(1440) // máximo 24 horas
  @IsOptional()
  tempoTimeoutMin?: number;

  @IsBoolean()
  @IsOptional()
  permitirOverflow?: boolean;

  @IsString()
  @IsOptional()
  filaBackupId?: string;
}
