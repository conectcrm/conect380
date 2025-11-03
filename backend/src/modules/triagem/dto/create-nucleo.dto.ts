import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoDistribuicao {
  ROUND_ROBIN = 'round_robin',
  LOAD_BALANCING = 'load_balancing',
  SKILL_BASED = 'skill_based',
  MANUAL = 'manual',
}

export class HorarioFuncionamentoDto {
  @IsBoolean()
  ativo: boolean;

  @IsString()
  @IsOptional()
  inicio?: string; // formato: "08:00"

  @IsString()
  @IsOptional()
  fim?: string; // formato: "18:00"

  @IsArray()
  @IsOptional()
  diasSemana?: number[]; // 0=domingo, 6=sábado
}

export class CreateNucleoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do núcleo é obrigatório' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  descricao: string;

  @IsString()
  @IsOptional()
  cor?: string; // hex color para UI

  @IsString()
  @IsOptional()
  icone?: string; // nome do ícone

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsBoolean()
  @IsOptional()
  visivelNoBot?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  prioridade?: number;

  @IsEnum(TipoDistribuicao)
  @IsOptional()
  tipoDistribuicao?: TipoDistribuicao;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  atendentesIds?: string[];

  @IsString()
  @IsOptional()
  supervisorId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  capacidadeMaxima?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  capacidadeAtual?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  slaRespostaMinutos?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  slaResolucaoHoras?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => HorarioFuncionamentoDto)
  @IsOptional()
  horarioFuncionamento?: HorarioFuncionamentoDto;

  @IsString()
  @IsOptional()
  mensagemBoasVindas?: string;

  @IsString()
  @IsOptional()
  mensagemForaHorario?: string;

  @IsString()
  @IsOptional()
  mensagemCapacidadeLotada?: string;
}
