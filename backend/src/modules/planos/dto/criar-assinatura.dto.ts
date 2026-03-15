import { IsString, IsEnum, IsOptional, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import {
  ASSINATURA_STATUS_VALUES,
  AssinaturaStatus,
} from '../entities/assinatura-empresa.entity';

export class CriarAssinaturaDto {
  @IsString()
  empresaId: string;

  @IsString()
  planoId: string;

  @IsOptional()
  @IsEnum(ASSINATURA_STATUS_VALUES)
  status?: AssinaturaStatus;

  @IsDateString()
  dataInicio: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsDateString()
  proximoVencimento: string;

  @IsNumber()
  valorMensal: number;

  @IsOptional()
  @IsBoolean()
  renovacaoAutomatica?: boolean;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
