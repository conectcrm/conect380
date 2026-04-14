import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MovimentacaoTesourariaStatus } from '../entities/movimentacao-tesouraria.entity';

export class QueryTesourariaPosicaoDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  incluirInativas?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  janelaDias?: number;
}

export class QueryTesourariaMovimentacoesDto {
  @IsOptional()
  @IsEnum(MovimentacaoTesourariaStatus)
  status?: MovimentacaoTesourariaStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}

export class CriarTransferenciaTesourariaDto {
  @IsUUID()
  contaOrigemId: string;

  @IsUUID()
  contaDestinoId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  origemId?: string;
}

export class AprovarTransferenciaTesourariaDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacao?: string;
}

export class CancelarTransferenciaTesourariaDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacao?: string;
}

export type PosicaoTesourariaContaItemResponse = {
  contaBancariaId: string;
  nomeConta: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  ativo: boolean;
  saldoAtual: number;
  saidasProgramadas: number;
  saldoProjetado: number;
};

export type PosicaoTesourariaResponse = {
  referenciaEm: string;
  janelaDias: number;
  totalContas: number;
  saldoAtualConsolidado: number;
  entradasPrevistasConsolidadas: number;
  saidasProgramadasConsolidadas: number;
  saldoProjetadoConsolidado: number;
  itens: PosicaoTesourariaContaItemResponse[];
};

export type MovimentacaoTesourariaItemResponse = {
  id: string;
  status: MovimentacaoTesourariaStatus;
  valor: number;
  descricao?: string;
  contaOrigemId: string;
  contaOrigemNome: string;
  contaDestinoId: string;
  contaDestinoNome: string;
  correlationId: string;
  origemId?: string;
  auditoria: Array<Record<string, unknown>>;
  criadoPor?: string;
  atualizadoPor?: string;
  createdAt: string;
  updatedAt: string;
};

export type ListaMovimentacoesTesourariaResponse = {
  data: MovimentacaoTesourariaItemResponse[];
  total: number;
  limite: number;
};

export type ResultadoCriacaoTransferenciaTesourariaResponse = {
  movimentacao: MovimentacaoTesourariaItemResponse;
};

export type ResultadoAprovacaoTransferenciaTesourariaResponse = {
  movimentacao: MovimentacaoTesourariaItemResponse;
  saldoContaOrigem: number;
  saldoContaDestino: number;
};

export type ResultadoCancelamentoTransferenciaTesourariaResponse = {
  movimentacao: MovimentacaoTesourariaItemResponse;
};
