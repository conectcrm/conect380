import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { StatusPagamento, TipoPagamento } from '../entities/pagamento.entity';

export class CreatePagamentoDto {
  @IsNumber()
  faturaId: number;

  @IsString()
  transacaoId: string;

  @IsEnum(TipoPagamento)
  tipo: TipoPagamento;

  @IsNumber()
  valor: number;

  @IsString()
  metodoPagamento: string;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  gatewayTransacaoId?: string;

  @IsOptional()
  @IsNumber()
  taxa?: number;

  @IsOptional()
  @IsObject()
  dadosCompletos?: any;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdatePagamentoDto {
  @IsOptional()
  @IsEnum(StatusPagamento)
  status?: StatusPagamento;

  @IsOptional()
  @IsString()
  gatewayStatusRaw?: string;

  @IsOptional()
  @IsString()
  motivoRejeicao?: string;

  @IsOptional()
  @IsObject()
  dadosCompletos?: any;
}

export class ProcessarPagamentoDto {
  @IsString()
  gatewayTransacaoId: string;

  @IsEnum(StatusPagamento)
  novoStatus: StatusPagamento;

  @IsOptional()
  @IsString()
  motivoRejeicao?: string;

  @IsOptional()
  @IsObject()
  webhookData?: any;
}
