import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export interface PropostaDto {
  id: string;
  numero: string;
  titulo?: string;
  status: string;
  cliente: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
  source?: string;
  observacoes?: string;
  vendedor?:
    | string
    | {
        id: string;
        nome: string;
        email: string;
        tipo: string;
        ativo: boolean;
      };
  formaPagamento?: string;
  validadeDias?: number;
}

// DTO permissivo para preservar compatibilidade com payloads legados do frontend.
// Valida apenas campos conhecidos no topo, sem bloquear estruturas extras enquanto
// o contrato do modulo ainda está sendo normalizado.
export class CriarPropostaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  cliente?: string | Record<string, unknown>;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsArray()
  produtos?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  descontoGlobal?: number;

  @IsOptional()
  @IsNumber()
  impostos?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  validadeDias?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  incluirImpostosPDF?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  dataVencimento?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  vendedor?: string | Record<string, unknown>;

  @IsOptional()
  @IsObject()
  clienteExtra?: Record<string, unknown>;
}

export class AtualizarPropostaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  cliente?: string | Record<string, unknown>;

  @IsOptional()
  @IsArray()
  produtos?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  descontoGlobal?: number;

  @IsOptional()
  @IsNumber()
  impostos?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  validadeDias?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  incluirImpostosPDF?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  dataVencimento?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  vendedor?: string | Record<string, unknown>;
}

export class AtualizarStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export interface PropostaResponseDto {
  success: boolean;
  message?: string;
  proposta?: PropostaDto;
  timestamp?: string;
  error?: string;
}
