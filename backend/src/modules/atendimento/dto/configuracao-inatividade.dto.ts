import { IsNumber, IsBoolean, IsString, IsOptional, IsArray, Min, Max } from 'class-validator';

export class ConfiguracaoInactivityDto {
  @IsOptional()
  @IsString()
  departamentoId?: string | null;

  @IsNumber()
  @Min(5, { message: 'Timeout mínimo é 5 minutos' })
  @Max(43200, { message: 'Timeout máximo é 43200 minutos (30 dias)' })
  timeoutMinutos: number;

  @IsOptional()
  @IsBoolean()
  enviarAviso?: boolean;

  @IsOptional()
  @IsNumber()
  avisoMinutosAntes?: number;

  @IsOptional()
  @IsString()
  mensagemAviso?: string | null;

  @IsOptional()
  @IsString()
  mensagemFechamento?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  statusAplicaveis?: string[] | null;
}
