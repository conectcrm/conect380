import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, MaxLength } from 'class-validator';

export class CreateTemplateMensagemDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  conteudo: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Atalho deve ter no máximo 50 caracteres' })
  atalho?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Categoria deve ter no máximo 100 caracteres' })
  categoria?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsInt()
  @IsOptional()
  ordem?: number;

  @IsString()
  @IsNotEmpty({ message: 'Empresa ID é obrigatório' })
  empresaId: string;
}
