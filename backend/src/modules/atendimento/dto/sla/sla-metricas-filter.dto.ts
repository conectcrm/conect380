import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class SlaMetricasFilterDto {
  @IsOptional()
  @IsDateString({}, { message: 'dataInicio deve ser uma data válida' })
  dataInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dataFim deve ser uma data válida' })
  dataFim?: string;

  @IsOptional()
  @IsString()
  @IsIn(['baixa', 'normal', 'alta', 'urgente'])
  prioridade?: string;

  @IsOptional()
  @IsString()
  canal?: string;
}
