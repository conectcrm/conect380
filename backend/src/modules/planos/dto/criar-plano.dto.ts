import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CriarPlanoDto {
  @IsString()
  nome: string;

  @IsString()
  codigo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber()
  @Min(0)
  preco: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  limiteUsuarios: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  limiteClientes: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  limiteStorage: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  limiteApiCalls: number;

  @IsOptional()
  @IsBoolean()
  whiteLabel?: boolean;

  @IsOptional()
  @IsBoolean()
  suportePrioritario?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsNumber()
  ordem?: number;

  @IsOptional()
  modulosInclusos?: string[]; // IDs dos módulos
}
