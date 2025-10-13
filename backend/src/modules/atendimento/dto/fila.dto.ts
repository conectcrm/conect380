import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsObject } from 'class-validator';

export class CriarFilaDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsObject()
  horarioAtendimento?: any;
}

export class AtualizarFilaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsObject()
  horarioAtendimento?: any;
}

export class AtribuirAtendenteFilaDto {
  @IsString()
  atendenteId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadeMaxima?: number;
}
