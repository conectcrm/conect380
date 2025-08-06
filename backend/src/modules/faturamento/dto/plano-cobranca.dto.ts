import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { TipoRecorrencia } from '../entities/plano-cobranca.entity';

export class CreatePlanoCobrancaDto {
  @IsNumber()
  contratoId: number;

  @IsNumber()
  clienteId: number;

  @IsNumber()
  usuarioResponsavelId: number;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsEnum(TipoRecorrencia)
  tipoRecorrencia: TipoRecorrencia;

  @IsOptional()
  @IsNumber()
  @Min(1)
  intervaloRecorrencia?: number;

  @IsNumber()
  @Min(0.01)
  valorRecorrente: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  diaVencimento: number;

  @IsDateString()
  dataInicio: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limiteCiclos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  jurosAtraso?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  multaAtraso?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  diasTolerancia?: number;

  @IsOptional()
  @IsBoolean()
  enviarLembrete?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  diasAntesLembrete?: number;

  @IsOptional()
  @IsObject()
  configuracoes?: {
    metodoPagamentoPreferido?: string;
    notificacoesEmail?: boolean;
    notificacoesSMS?: boolean;
    tentativasCobranca?: number;
    webhookUrl?: string;
  };
}

export class UpdatePlanoCobrancaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valorRecorrente?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  diaVencimento?: number;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  jurosAtraso?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  multaAtraso?: number;

  @IsOptional()
  @IsBoolean()
  enviarLembrete?: boolean;

  @IsOptional()
  @IsObject()
  configuracoes?: object;
}
