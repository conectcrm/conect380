import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const parseOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

const parseOptionalInteger = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) ? parsed : value;
};

export interface PropostaDto {
  id: string;
  numero: string;
  titulo?: string;
  status: string;
  motivoPerda?: string;
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
  parcelas?: number;
  validadeDias?: number;
  oportunidade?: {
    id: string;
    titulo: string;
    estagio: string;
    valor: number;
  };
  isPropostaPrincipal?: boolean;
}

// DTO permissivo para preservar compatibilidade com payloads legados do frontend.
// Valida apenas campos conhecidos no topo, sem bloquear estruturas extras enquanto
// o contrato do modulo ainda esta sendo normalizado.
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
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return String(value).trim();
  })
  @IsUUID()
  oportunidadeId?: string;

  @IsOptional()
  @IsArray()
  produtos?: Array<Record<string, unknown>>;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  descontoGlobal?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  impostos?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  total?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @IsOptional()
  @Transform(parseOptionalInteger)
  @IsInt()
  @Min(1)
  @Max(24)
  parcelas?: number;

  @IsOptional()
  @Transform(parseOptionalInteger)
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
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return String(value).trim();
  })
  @IsUUID()
  oportunidadeId?: string;

  @IsOptional()
  @IsArray()
  produtos?: Array<Record<string, unknown>>;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  descontoGlobal?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  impostos?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  total?: number;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @IsOptional()
  @Transform(parseOptionalInteger)
  @IsInt()
  @Min(1)
  @Max(24)
  parcelas?: number;

  @IsOptional()
  @Transform(parseOptionalInteger)
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

  @IsOptional()
  @IsString()
  motivoPerda?: string;
}

export interface PropostaResponseDto {
  success: boolean;
  message?: string;
  proposta?: PropostaDto;
  timestamp?: string;
  error?: string;
}
