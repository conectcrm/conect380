import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTipoServicoDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  descricao?: string;

  @IsString({ message: 'Cor deve ser uma string' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor?: string;

  @IsString({ message: 'Ícone deve ser uma string' })
  @IsOptional()
  @MaxLength(50, { message: 'Ícone deve ter no máximo 50 caracteres' })
  icone?: string;

  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @IsOptional()
  ordem?: number;

  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  ativo?: boolean;
}
