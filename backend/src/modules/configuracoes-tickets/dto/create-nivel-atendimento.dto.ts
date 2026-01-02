import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateNivelAtendimentoDto {
  @IsString({ message: 'Código deve ser uma string' })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MinLength(2, { message: 'Código deve ter no mínimo 2 caracteres' })
  @MaxLength(10, { message: 'Código deve ter no máximo 10 caracteres' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Código deve conter apenas letras maiúsculas e números (ex: N1, N2, N3)' })
  codigo: string;

  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  descricao?: string;

  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @IsNotEmpty({ message: 'Ordem é obrigatória' })
  ordem: number;

  @IsString({ message: 'Cor deve ser uma string' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor?: string;

  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  ativo?: boolean;
}
