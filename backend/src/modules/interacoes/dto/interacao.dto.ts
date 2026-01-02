import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { TipoInteracao } from '../interacao.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { AgendaPrioridade, AgendaStatus } from '../../agenda/agenda-evento.entity';

class CreateInlineAgendaEventoDto {
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
}

export class CreateInteracaoDto {
  @IsEnum(TipoInteracao)
  tipo: TipoInteracao;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  titulo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsDateString()
  @IsOptional()
  data_referencia?: string;

  @IsDateString()
  @IsOptional()
  proxima_acao_em?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  proxima_acao_descricao?: string;

  @IsUUID()
  @IsOptional()
  agenda_event_id?: string;

  @IsUUID()
  @IsOptional()
  lead_id?: string;

  @IsUUID()
  @IsOptional()
  contato_id?: string;

  @IsUUID()
  @IsOptional()
  responsavel_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInlineAgendaEventoDto)
  agenda_evento?: CreateInlineAgendaEventoDto;
}

export class UpdateInteracaoDto extends PartialType(CreateInteracaoDto) { }

export class InteracaoFiltroDto extends PaginationDto {
  @IsEnum(TipoInteracao)
  @IsOptional()
  tipo?: TipoInteracao;

  @IsUUID()
  @IsOptional()
  lead_id?: string;

  @IsUUID()
  @IsOptional()
  contato_id?: string;

  @IsUUID()
  @IsOptional()
  responsavel_id?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsString()
  @IsOptional()
  busca?: string;
}

