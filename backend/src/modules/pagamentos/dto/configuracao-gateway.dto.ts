import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  GatewayMode,
  GatewayProvider,
  GatewayStatus,
} from '../entities/configuracao-gateway.entity';

export class CreateConfiguracaoGatewayDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome: string;

  @IsEnum(GatewayProvider)
  gateway: GatewayProvider;

  @IsOptional()
  @IsEnum(GatewayMode)
  modoOperacao?: GatewayMode;

  @IsOptional()
  @IsEnum(GatewayStatus)
  status?: GatewayStatus;

  @IsOptional()
  @IsObject()
  credenciais?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  webhookSecret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metodosPermitidos?: string[];

  @IsOptional()
  @IsObject()
  configuracoesAdicionais?: Record<string, any>;
}

export class UpdateConfiguracaoGatewayDto extends PartialType(CreateConfiguracaoGatewayDto) {}

export class ListConfiguracoesGatewayDto {
  @IsOptional()
  @IsEnum(GatewayProvider)
  gateway?: GatewayProvider;

  @IsOptional()
  @IsEnum(GatewayMode)
  modoOperacao?: GatewayMode;

  @IsOptional()
  @IsEnum(GatewayStatus)
  status?: GatewayStatus;
}
