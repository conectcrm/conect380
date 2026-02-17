import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { AgendaPrioridade, AgendaStatus } from '../agenda-evento.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateAgendaEventoDto {
  @IsString()
  @MaxLength(255)
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsDateString()
  inicio: string;

  @IsDateString()
  @IsOptional()
  fim?: string;

  @IsBoolean()
  @IsOptional()
  all_day?: boolean;

  @IsEnum(AgendaStatus)
  @IsOptional()
  status?: AgendaStatus;

  @IsEnum(AgendaPrioridade)
  @IsOptional()
  prioridade?: AgendaPrioridade;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  local?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsArray()
  @IsOptional()
  attendees?: string[];

  @IsUUID()
  @IsOptional()
  interacao_id?: string;
}

export class UpdateAgendaEventoDto extends PartialType(CreateAgendaEventoDto) {}

export class AgendaEventoFiltroDto extends PaginationDto {
  @IsEnum(AgendaStatus)
  @IsOptional()
  status?: AgendaStatus;

  @IsEnum(AgendaPrioridade)
  @IsOptional()
  prioridade?: AgendaPrioridade;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsString()
  @IsOptional()
  busca?: string;

  @IsUUID()
  @IsOptional()
  interacao_id?: string;
}
