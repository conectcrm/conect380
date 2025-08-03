import { IsString, IsEnum, IsOptional, IsDateString, IsNumber, IsBoolean } from 'class-validator';

export class CriarAssinaturaDto {
  @IsString()
  empresaId: string;

  @IsString()
  planoId: string;

  @IsOptional()
  @IsEnum(['ativa', 'cancelada', 'suspensa', 'pendente'])
  status?: 'ativa' | 'cancelada' | 'suspensa' | 'pendente';

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
