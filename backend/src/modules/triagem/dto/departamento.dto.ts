import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação de departamento
 */
export class CreateDepartamentoDto {
  @IsString()
  @MaxLength(36)
  nucleoId: string;

  @IsString()
  @MaxLength(100)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  cor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icone?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  visivelNoBot?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  atendentesIds?: string[];

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  horarioFuncionamento?: any;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440) // 24 horas
  slaRespostaMinutos?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720) // 30 dias
  slaResolucaoHoras?: number;

  @IsOptional()
  @IsString()
  mensagemBoasVindas?: string;

  @IsOptional()
  @IsString()
  mensagemTransferencia?: string;

  @IsOptional()
  @IsEnum(['round_robin', 'load_balancing', 'skill_based', 'manual'])
  tipoDistribuicao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacidadeMaximaTickets?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

/**
 * DTO para atualização de departamento
 */
export class UpdateDepartamentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  cor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icone?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  visivelNoBot?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  atendentesIds?: string[];

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  horarioFuncionamento?: any;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  slaRespostaMinutos?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  slaResolucaoHoras?: number;

  @IsOptional()
  @IsString()
  mensagemBoasVindas?: string;

  @IsOptional()
  @IsString()
  mensagemTransferencia?: string;

  @IsOptional()
  @IsEnum(['round_robin', 'load_balancing', 'skill_based', 'manual'])
  tipoDistribuicao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacidadeMaximaTickets?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}

/**
 * DTO para filtros de busca
 */
export class FilterDepartamentoDto {
  @IsOptional()
  @IsUUID()
  nucleoId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(['round_robin', 'load_balancing', 'skill_based', 'manual'])
  tipoDistribuicao?: string;

  @IsOptional()
  @IsUUID()
  supervisorId?: string;
}
