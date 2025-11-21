import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, IsArray } from 'class-validator';

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
  @IsArray()
  @IsString({ each: true })
  variaveis?: string[]; // Array de variáveis: ['{{nome}}', '{{ticket}}', '{{empresa}}']
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
  @IsArray()
  @IsString({ each: true })
  variaveis?: string[]; // Array de variáveis: ['{{nome}}', '{{ticket}}', '{{empresa}}']
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
