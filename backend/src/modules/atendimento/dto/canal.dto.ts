import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { TipoCanal, StatusCanal } from '../entities/canal.entity';

export class CriarCanalDto {
  @IsString()
  nome: string;

  @IsEnum(TipoCanal)
  tipo: TipoCanal;

  @IsOptional()
  @IsString()
  provider?: string; // whatsapp_business_api, telegram_bot_api, etc.

  @IsOptional()
  @IsEnum(StatusCanal)
  status?: StatusCanal;

  @IsOptional()
  @IsObject()
  configuracao?: Record<string, any>; // tokens, credenciais, etc.

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}

export class AtualizarCanalDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsEnum(StatusCanal)
  status?: StatusCanal;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsObject()
  configuracao?: Record<string, any>;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
