import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  IsIP,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { TipoAssinatura } from '../entities/assinatura-contrato.entity';

export class CreateAssinaturaDto {
  @IsNumber()
  contratoId: number;

  @IsUUID('4')
  usuarioId: string;

  @IsEnum(TipoAssinatura)
  tipo: TipoAssinatura;

  @IsOptional()
  @IsString()
  certificadoDigital?: string;

  @IsOptional()
  @IsObject()
  metadados?: {
    localizacao?: string;
    dispositivo?: string;
    navegador?: string;
    versaoApp?: string;
  };

  @IsOptional()
  @IsDateString()
  dataExpiracao?: string;
}

export class ProcessarAssinaturaDto {
  @IsString()
  tokenValidacao: string;

  @IsString()
  hashAssinatura: string;

  @IsOptional()
  @IsIP()
  ipAssinatura?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  metadados?: {
    localizacao?: string;
    dispositivo?: string;
    navegador?: string;
    versaoApp?: string;
  };
}

export class RejeitarAssinaturaDto {
  @IsString()
  tokenValidacao: string;

  @IsString()
  motivoRejeicao: string;
}
