import { IsString, IsEmail, IsNotEmpty, ValidateNested, IsBoolean, MinLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class EmpresaDataDto {
  @ApiProperty({ description: 'Nome da empresa' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CNPJ da empresa' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ deve ter formato XX.XXX.XXX/XXXX-XX' })
  cnpj: string;

  @ApiProperty({ description: 'Email corporativo' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Telefone da empresa' })
  @IsString()
  @IsNotEmpty()
  telefone: string;

  @ApiProperty({ description: 'Endereço completo' })
  @IsString()
  @IsNotEmpty()
  endereco: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ description: 'Estado (UF)' })
  @IsString()
  @IsNotEmpty()
  estado: string;

  @ApiProperty({ description: 'CEP' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-\d{3}$/, { message: 'CEP deve ter formato XXXXX-XXX' })
  cep: string;
}

class UsuarioDataDto {
  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @ApiProperty({ description: 'Telefone do usuário' })
  @IsString()
  @IsNotEmpty()
  telefone: string;
}

export class CreateEmpresaDto {
  @ApiProperty({ description: 'Dados da empresa' })
  @ValidateNested()
  @Type(() => EmpresaDataDto)
  empresa: EmpresaDataDto;

  @ApiProperty({ description: 'Dados do usuário administrador' })
  @ValidateNested()
  @Type(() => UsuarioDataDto)
  usuario: UsuarioDataDto;

  @ApiProperty({ description: 'ID do plano selecionado' })
  @IsString()
  @IsNotEmpty()
  plano: string;

  @ApiProperty({ description: 'Aceitação dos termos de uso' })
  @IsBoolean()
  aceitarTermos: boolean;
}

export class VerificarEmailDto {
  @ApiProperty({ description: 'Token de verificação de email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
