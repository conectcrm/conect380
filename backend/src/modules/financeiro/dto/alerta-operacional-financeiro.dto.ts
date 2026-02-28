import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  AlertaOperacionalFinanceiroSeveridade,
  AlertaOperacionalFinanceiroStatus,
  AlertaOperacionalFinanceiroTipo,
} from '../entities/alerta-operacional-financeiro.entity';

export class QueryAlertasOperacionaisFinanceiroDto {
  @IsOptional()
  @IsIn(Object.values(AlertaOperacionalFinanceiroStatus))
  status?: AlertaOperacionalFinanceiroStatus;

  @IsOptional()
  @IsIn(Object.values(AlertaOperacionalFinanceiroSeveridade))
  severidade?: AlertaOperacionalFinanceiroSeveridade;

  @IsOptional()
  @IsIn(Object.values(AlertaOperacionalFinanceiroTipo))
  tipo?: AlertaOperacionalFinanceiroTipo;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limite?: number;
}

export class AtualizarStatusAlertaOperacionalFinanceiroDto {
  @IsOptional()
  @IsString()
  observacao?: string;
}
