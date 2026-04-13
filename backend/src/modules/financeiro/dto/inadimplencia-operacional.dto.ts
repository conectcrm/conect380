import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Max, Min } from 'class-validator';

const parseBooleanQueryValue = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

export class QueryInadimplenciaOperacionalDto {
  @IsOptional()
  @IsIn(['ativo', 'em_risco', 'bloqueado_automatico', 'bloqueado_manual'])
  status?: 'ativo' | 'em_risco' | 'bloqueado_automatico' | 'bloqueado_manual';

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @Transform(parseBooleanQueryValue)
  @IsBoolean()
  somenteComSaldoVencido?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(500)
  limit?: number;
}

export class AcaoManualInadimplenciaOperacionalDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class ReavaliarInadimplenciaOperacionalDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class InadimplenciaOperacionalResponseDto {
  id: string;
  empresaId: string;
  clienteId: string;
  statusOperacional: 'ativo' | 'em_risco' | 'bloqueado_automatico' | 'bloqueado_manual';
  origemStatus: 'sistema' | 'automacao' | 'manual';
  motivo: string | null;
  bloqueioManual: boolean;
  saldoVencido: number;
  diasMaiorAtraso: number;
  quantidadeTitulosVencidos: number;
  ultimaAvaliacaoEm: string | null;
  bloqueadoEm: string | null;
  desbloqueadoEm: string | null;
  metadata: Record<string, unknown> | null;
  cliente: {
    id: string;
    nome: string;
    email: string;
    documento?: string | null;
  } | null;
}

export class InadimplenciaOperacionalEventoResponseDto {
  id: string;
  tipoEvento: string;
  estadoAnterior: string | null;
  estadoNovo: string | null;
  motivo: string | null;
  saldoVencido: number;
  diasMaiorAtraso: number;
  atorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
