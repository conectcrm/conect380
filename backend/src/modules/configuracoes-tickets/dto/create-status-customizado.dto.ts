import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsUUID,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateStatusCustomizadoDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  descricao?: string;

  @IsUUID('4', { message: 'Nível ID deve ser um UUID válido' })
  @IsNotEmpty({ message: 'Nível ID é obrigatório' })
  nivelId: string;

  @IsString({ message: 'Cor deve ser uma string' })
  @IsNotEmpty({ message: 'Cor é obrigatória' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Cor deve estar no formato hexadecimal (#RRGGBB)' })
  cor: string;

  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @IsNotEmpty({ message: 'Ordem é obrigatória' })
  ordem: number;

  @IsBoolean({ message: 'Finalizador deve ser um booleano' })
  @IsOptional()
  finalizador?: boolean;

  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  ativo?: boolean;
}
