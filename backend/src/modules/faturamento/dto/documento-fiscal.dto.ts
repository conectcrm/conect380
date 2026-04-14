import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const TIPOS_DOCUMENTO_FISCAL = ['nfse', 'nfe'] as const;
export type TipoDocumentoFiscal = (typeof TIPOS_DOCUMENTO_FISCAL)[number];

export const AMBIENTES_DOCUMENTO_FISCAL = ['homologacao', 'producao'] as const;
export type AmbienteDocumentoFiscal = (typeof AMBIENTES_DOCUMENTO_FISCAL)[number];

export const OPERACOES_DOCUMENTO_FISCAL = ['cancelar', 'inutilizar'] as const;
export type OperacaoDocumentoFiscal = (typeof OPERACOES_DOCUMENTO_FISCAL)[number];

export const MODOS_PROCESSAMENTO_DOCUMENTO_FISCAL = ['sincrono', 'lote'] as const;
export type ModoProcessamentoDocumentoFiscal =
  (typeof MODOS_PROCESSAMENTO_DOCUMENTO_FISCAL)[number];

export class CriarRascunhoDocumentoFiscalDto {
  @IsOptional()
  @IsString()
  @IsIn(TIPOS_DOCUMENTO_FISCAL)
  tipo?: TipoDocumentoFiscal;

  @IsOptional()
  @IsString()
  @IsIn(AMBIENTES_DOCUMENTO_FISCAL)
  ambiente?: AmbienteDocumentoFiscal;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class EmitirDocumentoFiscalDto {
  @IsOptional()
  @IsString()
  @IsIn(TIPOS_DOCUMENTO_FISCAL)
  tipo?: TipoDocumentoFiscal;

  @IsOptional()
  @IsString()
  @IsIn(AMBIENTES_DOCUMENTO_FISCAL)
  ambiente?: AmbienteDocumentoFiscal;

  @IsOptional()
  @IsBoolean()
  forcarReemissao?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(MODOS_PROCESSAMENTO_DOCUMENTO_FISCAL)
  modoProcessamento?: ModoProcessamentoDocumentoFiscal;

  @IsOptional()
  @IsBoolean()
  contingencia?: boolean;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CancelarDocumentoFiscalDto {
  @IsOptional()
  @IsString()
  @IsIn(OPERACOES_DOCUMENTO_FISCAL)
  tipoOperacao?: OperacaoDocumentoFiscal;

  @IsString()
  @IsNotEmpty()
  motivo!: string;

  @IsOptional()
  @IsString()
  @IsIn(AMBIENTES_DOCUMENTO_FISCAL)
  ambiente?: AmbienteDocumentoFiscal;
}
