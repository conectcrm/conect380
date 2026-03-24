import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EnderecoMinhaEmpresaDto {
  @ApiPropertyOptional({ description: 'Rua' })
  @IsOptional()
  @IsString()
  rua?: string;

  @ApiPropertyOptional({ description: 'Numero' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ description: 'Complemento' })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  cep?: string;
}

class UsuarioAdminMinhaEmpresaDto {
  @ApiProperty({ description: 'Nome do usuario administrador' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nome: string;

  @ApiProperty({ description: 'Email do usuario administrador' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Telefone do usuario administrador' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Senha inicial opcional para o usuario administrador' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;
}

export class CreateMinhaEmpresaDto {
  @ApiProperty({ description: 'Nome da empresa' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'CNPJ no formato 00.000.000/0000-00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve ter formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj: string;

  @ApiProperty({ description: 'Email da empresa' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Telefone da empresa' })
  @IsString()
  @IsNotEmpty()
  telefone: string;

  @ApiPropertyOptional({ type: EnderecoMinhaEmpresaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EnderecoMinhaEmpresaDto)
  endereco?: EnderecoMinhaEmpresaDto;

  @ApiProperty({ description: 'Plano da empresa (starter, business, enterprise)' })
  @IsString()
  @IsNotEmpty()
  planoId: string;

  @ApiProperty({ type: UsuarioAdminMinhaEmpresaDto })
  @ValidateNested()
  @Type(() => UsuarioAdminMinhaEmpresaDto)
  usuarioAdmin: UsuarioAdminMinhaEmpresaDto;
}

