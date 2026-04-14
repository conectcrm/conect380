import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type StatusContaReceber = 'pendente' | 'parcial' | 'recebida' | 'vencida' | 'cancelada';
export type OrigemContaReceber = 'faturamento' | 'avulso';
export type TipoLancamentoAvulsoContaReceber =
  | 'instalacao'
  | 'servico_avulso'
  | 'reembolso'
  | 'solicitacao_servico'
  | 'outro';

export class QueryContasReceberDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  status?: string | string[];

  @IsOptional()
  origem?: string | string[];

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsDateString()
  dataVencimentoInicio?: string;

  @IsOptional()
  @IsDateString()
  dataVencimentoFim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;

  @IsOptional()
  @IsIn(['dataVencimento', 'valorTotal', 'valorEmAberto', 'createdAt', 'numero', 'cliente'])
  sortBy?: 'dataVencimento' | 'valorTotal' | 'valorEmAberto' | 'createdAt' | 'numero' | 'cliente';

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export type ContaReceberItemResponse = {
  id: number;
  numero: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail?: string | null;
  status: StatusContaReceber;
  origemTitulo: OrigemContaReceber;
  tipoLancamentoAvulso?: TipoLancamentoAvulsoContaReceber | null;
  statusFatura: string;
  createdAt: string;
  dataEmissao: string;
  dataVencimento: string;
  valorTotal: number;
  valorPago: number;
  valorEmAberto: number;
  diasAtraso: number;
};

export type ListContasReceberResponse = {
  data: ContaReceberItemResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type ResumoContasReceberResponse = {
  totalTitulos: number;
  valorTotal: number;
  valorRecebido: number;
  valorEmAberto: number;
  valorVencido: number;
  quantidadePendentes: number;
  quantidadeParciais: number;
  quantidadeRecebidas: number;
  quantidadeVencidas: number;
  quantidadeCanceladas: number;
  aging: {
    aVencer: number;
    vencido1a30: number;
    vencido31a60: number;
    vencido61mais: number;
  };
};

export class RegistrarRecebimentoContaReceberDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsString()
  @IsIn(['pix', 'boleto', 'transferencia', 'cartao_credito', 'cartao_debito', 'dinheiro', 'a_combinar'])
  metodoPagamento: string;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  origemId?: string;
}

export class CriarLancamentoAvulsoContaReceberDto {
  @IsUUID()
  clienteId: string;

  @IsOptional()
  @IsUUID()
  usuarioResponsavelId?: string;

  @IsDateString()
  dataVencimento: string;

  @IsString()
  descricao: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsOptional()
  @IsString()
  @IsIn(['instalacao', 'servico_avulso', 'reembolso', 'solicitacao_servico', 'outro'])
  tipoLancamentoAvulso?: TipoLancamentoAvulsoContaReceber;

  @IsOptional()
  @IsString()
  @IsIn(['pix', 'boleto', 'transferencia', 'cartao_credito', 'cartao_debito', 'dinheiro', 'a_combinar'])
  formaPagamentoPreferida?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  origemId?: string;
}

export class ReenviarCobrancaContaReceberDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  assunto?: string;

  @IsOptional()
  @IsString()
  conteudo?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  origemId?: string;
}
