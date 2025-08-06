import { IsUUID, IsEnum, IsOptional, IsObject, IsInt, IsString, IsDateString, Min, Max } from 'class-validator';
import { TipoEvento, StatusEvento } from '../entities/evento-fluxo.entity';

export class CreateEventoFluxoDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  fluxoId: string;

  @IsEnum(TipoEvento)
  tipoEvento: TipoEvento;

  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsObject()
  dadosEvento?: {
    entityId?: string;
    entityType?: string;
    dadosAntes?: any;
    dadosDepois?: any;
    parametrosExecucao?: any;
    configuracoes?: any;
  };

  @IsOptional()
  @IsDateString()
  dataAgendamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxTentativas?: number;
}

export class UpdateEventoFluxoDto {
  @IsOptional()
  @IsEnum(StatusEvento)
  status?: StatusEvento;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsObject()
  dadosEvento?: {
    entityId?: string;
    entityType?: string;
    dadosAntes?: any;
    dadosDepois?: any;
    parametrosExecucao?: any;
    configuracoes?: any;
  };

  @IsOptional()
  @IsDateString()
  dataAgendamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxTentativas?: number;

  @IsOptional()
  @IsString()
  ultimoErro?: string;

  @IsOptional()
  @IsObject()
  resultadoProcessamento?: {
    sucesso?: boolean;
    dadosRetorno?: any;
    mensagem?: string;
    codigoErro?: string;
    detalhesErro?: any;
  };
}

export class ProcessarEventoDto {
  @IsUUID()
  eventoId: string;

  @IsOptional()
  @IsString()
  processadoPor?: string;

  @IsOptional()
  @IsObject()
  parametrosCustomizados?: any;

  @IsOptional()
  @IsInt()
  @Min(0)
  tentativaEspecifica?: number;
}

export class FiltroEventosDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  fluxoId?: string;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipoEvento?: TipoEvento;

  @IsOptional()
  @IsEnum(StatusEvento)
  status?: StatusEvento;

  @IsOptional()
  @IsDateString()
  criadoApos?: string;

  @IsOptional()
  @IsDateString()
  criadoAntes?: string;

  @IsOptional()
  @IsDateString()
  processadoApos?: string;

  @IsOptional()
  @IsDateString()
  processadoAntes?: string;

  @IsOptional()
  @IsDateString()
  agendadoApos?: string;

  @IsOptional()
  @IsDateString()
  agendadoAntes?: string;

  @IsOptional()
  @IsString()
  processadoPor?: string;

  @IsOptional()
  @IsString()
  temErros?: boolean;

  @IsOptional()
  @IsString()
  vencidos?: boolean;

  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @IsOptional()
  @IsString()
  direcao?: 'ASC' | 'DESC';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class ReprocessarEventosDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  eventosIds?: string[];

  @IsOptional()
  @IsUUID()
  fluxoId?: string;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipoEvento?: TipoEvento;

  @IsOptional()
  @IsEnum(StatusEvento)
  status?: StatusEvento;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxTentativas?: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}
