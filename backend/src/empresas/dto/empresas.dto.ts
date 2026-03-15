import {
  IsString,
  IsEmail,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
  MinLength,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const PLANO_CADASTRO_VALUES = [
  'starter',
  'business',
  'enterprise',
  'professional',
  'pro',
  'basic',
  'basico',
  'premium',
  'empresarial',
] as const;

class EmpresaDataDto {
  @ApiProperty({ description: 'Nome da empresa' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CNPJ da empresa' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve ter formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj: string;

  @ApiProperty({ description: 'Email corporativo' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Telefone da empresa' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone deve ter formato valido brasileiro',
  })
  telefone: string;

  @ApiProperty({ description: 'Endereco completo' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ description: 'Cidade' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ description: 'Estado (UF)' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'Estado deve conter UF com 2 letras' })
  estado: string;

  @ApiProperty({ description: 'CEP' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-\d{3}$/, { message: 'CEP deve ter formato XXXXX-XXX' })
  cep: string;
}

class UsuarioDataDto {
  @ApiProperty({ description: 'Nome completo do usuario' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Email do usuario' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha do usuario' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Senha deve conter pelo menos 1 letra e 1 numero',
  })
  senha: string;

  @ApiProperty({ description: 'Telefone do usuario' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone deve ter formato valido brasileiro',
  })
  telefone: string;
}

export class CreateEmpresaDto {
  @ApiProperty({ description: 'Dados da empresa' })
  @ValidateNested()
  @Type(() => EmpresaDataDto)
  empresa: EmpresaDataDto;

  @ApiProperty({ description: 'Dados do usuario administrador' })
  @ValidateNested()
  @Type(() => UsuarioDataDto)
  usuario: UsuarioDataDto;

  @ApiProperty({ description: 'ID do plano selecionado' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @IsNotEmpty()
  @IsIn(PLANO_CADASTRO_VALUES, { message: 'Plano invalido para cadastro' })
  plano: string;

  @ApiProperty({ description: 'Aceitacao dos termos de uso' })
  @IsBoolean()
  aceitarTermos: boolean;
}

export class VerificarEmailDto {
  @ApiProperty({ description: 'Token de verificacao de email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
