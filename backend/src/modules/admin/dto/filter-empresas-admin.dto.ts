import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum StatusEmpresa {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

export class FilterEmpresasAdminDto {
  @IsOptional()
  @IsString()
  search?: string; // Busca por nome, CNPJ ou email

  @IsOptional()
  @IsEnum(StatusEmpresa)
  status?: StatusEmpresa;

  @IsOptional()
  @IsString()
  plano?: string; // starter, business, enterprise

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  healthScoreMin?: number; // Score mínimo (0-100)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  healthScoreMax?: number; // Score máximo (0-100)

  @IsOptional()
  @IsString()
  dataInicio?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  dataFim?: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number; // Página atual (default: 1)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number; // Itens por página (default: 20)

  @IsOptional()
  @IsString()
  sortBy?: string; // Campo para ordenar

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC'; // Ordem
}
