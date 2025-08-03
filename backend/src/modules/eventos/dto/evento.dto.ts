import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { TipoEvento } from '../evento.entity';

export class CreateEventoDto {
  @IsString()
  @MaxLength(255)
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsDateString()
  dataInicio: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsBoolean()
  diaInteiro?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  local?: string;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  cor?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsUUID()
  usuarioId: string;

  @IsUUID()
  empresaId: string;
}

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsBoolean()
  diaInteiro?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  local?: string;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  cor?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
