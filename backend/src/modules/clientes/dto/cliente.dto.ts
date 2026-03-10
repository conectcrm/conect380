import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { StatusCliente, TipoCliente } from '../cliente.entity';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'telefone deve estar no formato E.164 (ex: +5511999999999)',
  })
  telefone?: string;

  @IsOptional()
  @IsEnum(TipoCliente)
  tipo?: TipoCliente;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documento?: string;

  // Compatibilidade legada para payloads antigos.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpf_cnpj?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cep?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum(StatusCliente)
  status?: StatusCliente;

  // Compatibilidade legada para payloads que ainda enviam ativo direto.
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  // Aliases legados para avatar.
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  ultimo_contato?: string;

  @IsOptional()
  @IsDateString()
  proximo_contato?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  origem?: string;

  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @IsOptional()
  @IsString()
  responsavelId?: string;
}

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}
