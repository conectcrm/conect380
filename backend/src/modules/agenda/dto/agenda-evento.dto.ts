import {
  IsEmail,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  AgendaAttendeeRsvpStatus,
  AgendaLocationType,
  AgendaPrioridade,
  AgendaReminderType,
  AgendaStatus,
  AgendaTipo,
} from '../agenda-evento.entity';
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

  @IsEnum(AgendaTipo)
  @IsOptional()
  tipo?: AgendaTipo;

  @IsEnum(AgendaLocationType)
  @IsOptional()
  location_type?: AgendaLocationType;

  @IsInt()
  @Min(1)
  @IsOptional()
  reminder_time?: number;

  @IsEnum(AgendaReminderType)
  @IsOptional()
  reminder_type?: AgendaReminderType;

  @IsBoolean()
  @IsOptional()
  email_offline?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsBoolean()
  @IsOptional()
  is_recurring?: boolean;

  @IsObject()
  @IsOptional()
  recurring_pattern?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  responsavel_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  responsavel_nome?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  attendees?: string[];

  @IsUUID()
  @IsOptional()
  interacao_id?: string;
}

export class UpdateAgendaEventoDto extends PartialType(CreateAgendaEventoDto) {}

export class UpdateAgendaEventoRsvpDto {
  @IsEnum(AgendaAttendeeRsvpStatus)
  resposta: AgendaAttendeeRsvpStatus;
}

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
