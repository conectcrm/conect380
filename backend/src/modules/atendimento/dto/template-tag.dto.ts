import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export class CriarTemplateDto {
  @IsString()
  nome: string;

  @IsString()
  conteudo: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  atalho?: string;

  @IsOptional()
  @IsObject()
  variaveis?: Record<string, any>;
}

export class AtualizarTemplateDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  conteudo?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  atalho?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsObject()
  variaveis?: Record<string, any>;
}

export class CriarTagDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

export class AtualizarTagDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
