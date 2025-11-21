import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  GatewayMetodoPagamento,
  GatewayOperacao,
  GatewayTransacaoStatus,
} from '../entities/transacao-gateway.entity';
import { GatewayProvider } from '../entities/configuracao-gateway.entity';

export class CreateTransacaoGatewayDto {
  @IsUUID()
  configuracaoId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  faturaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pagamentoId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  referenciaGateway: string;

  @IsOptional()
  @IsEnum(GatewayTransacaoStatus)
  status?: GatewayTransacaoStatus;

  @IsOptional()
  @IsEnum(GatewayOperacao)
  tipoOperacao?: GatewayOperacao;

  @IsOptional()
  @IsEnum(GatewayMetodoPagamento)
  metodo?: GatewayMetodoPagamento;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  origem?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorBruto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorLiquido?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxa?: number;

  @IsOptional()
  @IsObject()
  payloadEnvio?: Record<string, any>;

  @IsOptional()
  @IsObject()
  payloadResposta?: Record<string, any>;

  @IsOptional()
  @IsString()
  mensagemErro?: string;

  @IsOptional()
  @IsDateString()
  processadoEm?: string;
}

export class UpdateTransacaoGatewayDto extends PartialType(CreateTransacaoGatewayDto) { }

export class ListTransacoesGatewayDto {
  @IsOptional()
  @IsEnum(GatewayTransacaoStatus)
  status?: GatewayTransacaoStatus;

  @IsOptional()
  @IsEnum(GatewayMetodoPagamento)
  metodo?: GatewayMetodoPagamento;

  @IsOptional()
  @IsEnum(GatewayOperacao)
  tipoOperacao?: GatewayOperacao;

  @IsOptional()
  @IsEnum(GatewayProvider)
  gateway?: GatewayProvider;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  faturaId?: number;

  @IsOptional()
  @IsUUID()
  configuracaoId?: string;

  @IsOptional()
  @IsString()
  referenciaGateway?: string;
}
