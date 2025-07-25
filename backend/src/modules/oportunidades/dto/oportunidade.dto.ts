import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsArray, Min, Max } from 'class-validator';
import { EstagioOportunidade, PrioridadeOportunidade, OrigemOportunidade } from '../oportunidade.entity';

export class CreateOportunidadeDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  probabilidade: number;

  @IsEnum(EstagioOportunidade)
  estagio: EstagioOportunidade;

  @IsEnum(PrioridadeOportunidade)
  prioridade: PrioridadeOportunidade;

  @IsEnum(OrigemOportunidade)
  origem: OrigemOportunidade;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  dataFechamentoEsperado?: string;

  @IsString()
  responsavel_id: string;

  @IsOptional()
  @IsNumber()
  cliente_id?: number;

  // Campos de contato (quando não há cliente)
  @IsOptional()
  @IsString()
  nomeContato?: string;

  @IsOptional()
  @IsString()
  emailContato?: string;

  @IsOptional()
  @IsString()
  telefoneContato?: string;

  @IsOptional()
  @IsString()
  empresaContato?: string;
}

export class UpdateOportunidadeDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probabilidade?: number;

  @IsOptional()
  @IsEnum(EstagioOportunidade)
  estagio?: EstagioOportunidade;

  @IsOptional()
  @IsEnum(PrioridadeOportunidade)
  prioridade?: PrioridadeOportunidade;

  @IsOptional()
  @IsEnum(OrigemOportunidade)
  origem?: OrigemOportunidade;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  dataFechamentoEsperado?: string;

  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @IsOptional()
  @IsNumber()
  cliente_id?: number;

  @IsOptional()
  @IsString()
  nomeContato?: string;

  @IsOptional()
  @IsString()
  emailContato?: string;

  @IsOptional()
  @IsString()
  telefoneContato?: string;

  @IsOptional()
  @IsString()
  empresaContato?: string;
}

export class UpdateEstagioDto {
  @IsEnum(EstagioOportunidade)
  estagio: EstagioOportunidade;

  @IsOptional()
  @IsDateString()
  dataFechamentoReal?: string;
}

export class MetricasQueryDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
