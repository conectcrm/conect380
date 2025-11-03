import { IsString, IsOptional, IsEnum, IsEmail, IsNumber, Min } from 'class-validator';
import { StatusAtendente } from '../entities/atendente.entity';

export class CriarAtendenteDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(StatusAtendente)
  status?: StatusAtendente;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacidadeMaxima?: number;
}

export class AtualizarAtendenteDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(StatusAtendente)
  status?: StatusAtendente;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacidadeMaxima?: number;
}

export class AtualizarStatusAtendenteDto {
  @IsEnum(StatusAtendente)
  status: StatusAtendente;
}
