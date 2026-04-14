import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export type AgrupamentoFluxoCaixa = 'dia' | 'semana' | 'mes';

export class QueryFluxoCaixaDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsIn(['dia', 'semana', 'mes'])
  agrupamento?: AgrupamentoFluxoCaixa;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  janelaDias?: number;
}

export type SerieFluxoCaixaItemResponse = {
  periodoInicio: string;
  periodoFim: string;
  entradasRealizadas: number;
  saidasRealizadas: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoLiquido: number;
};

export type ResumoFluxoCaixaResponse = {
  periodoInicio: string;
  periodoFim: string;
  agrupamento: AgrupamentoFluxoCaixa;
  totais: {
    entradasRealizadas: number;
    saidasRealizadas: number;
    entradasPrevistas: number;
    saidasPrevistas: number;
    saldoLiquidoRealizado: number;
    saldoLiquidoPrevisto: number;
  };
  serie: SerieFluxoCaixaItemResponse[];
};

export type ProjecaoFluxoCaixaItemResponse = {
  data: string;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoProjetadoAcumulado: number;
};

export type ProjecaoFluxoCaixaResponse = {
  baseEm: string;
  ate: string;
  dias: number;
  totalEntradasPrevistas: number;
  totalSaidasPrevistas: number;
  saldoProjetado: number;
  itens: ProjecaoFluxoCaixaItemResponse[];
};
