import { IsUUID, IsEnum, IsOptional, IsObject, IsInt, IsString, IsBoolean, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusFluxo } from '../entities/fluxo-automatizado.entity';

export class CreateFluxoAutomatizadoDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  propostaId: string;

  @IsOptional()
  @IsObject()
  configuracoes?: {
    enviarEmailsAutomaticos?: boolean;
    gerarContratoAutomatico?: boolean;
    criarFaturaAutomatica?: boolean;
    cobrarRecorrentemente?: boolean;
    intervaloDias?: number;
    templateContrato?: string;
    templateEmail?: string;
    observacoes?: string;
  };

  @IsOptional()
  @IsObject()
  metadados?: {
    clienteId?: string;
    vendedorId?: string;
    valorTotalProposta?: number;
    moeda?: string;
    prazoEntrega?: number;
    condicoesEspeciais?: string[];
    tagsPersonalizadas?: string[];
  };

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxTentativas?: number;
}

export class UpdateFluxoAutomatizadoDto {
  @IsOptional()
  @IsEnum(StatusFluxo)
  status?: StatusFluxo;

  @IsOptional()
  @IsInt()
  @Min(1)
  etapaAtual?: number;

  @IsOptional()
  @IsObject()
  configuracoes?: {
    enviarEmailsAutomaticos?: boolean;
    gerarContratoAutomatico?: boolean;
    criarFaturaAutomatica?: boolean;
    cobrarRecorrentemente?: boolean;
    intervaloDias?: number;
    templateContrato?: string;
    templateEmail?: string;
    observacoes?: string;
  };

  @IsOptional()
  @IsObject()
  metadados?: {
    clienteId?: string;
    vendedorId?: string;
    valorTotalProposta?: number;
    moeda?: string;
    prazoEntrega?: number;
    condicoesEspeciais?: string[];
    tagsPersonalizadas?: string[];
  };

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxTentativas?: number;
}

export class ProcessarFluxoDto {
  @IsUUID()
  fluxoId: string;

  @IsOptional()
  @IsBoolean()
  forcarProcessamento?: boolean;

  @IsOptional()
  @IsObject()
  parametrosCustomizados?: any;
}

export class ConfiguracaoOrquestradorDto {
  @IsOptional()
  @IsBoolean()
  ativarProcessamentoAutomatico?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  intervaloVerificacaoMinutos?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  loteProcessamento?: number;

  @IsOptional()
  @IsBoolean()
  processarEmBackground?: boolean;

  @IsOptional()
  @IsObject()
  configuracoesEmail?: {
    templatePadrao?: string;
    remetentePadrao?: string;
    copiaVendedor?: boolean;
    copiaGerente?: boolean;
  };

  @IsOptional()
  @IsObject()
  configuracoesContrato?: {
    templatePadrao?: string;
    assinaturaAutomatica?: boolean;
    validadeDias?: number;
  };

  @IsOptional()
  @IsObject()
  configuracoesFaturamento?: {
    criarAutomaticamente?: boolean;
    vencimentoDias?: number;
    incluirJuros?: boolean;
    taxaJuros?: number;
  };
}

export class FiltroFluxosDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsEnum(StatusFluxo)
  status?: StatusFluxo;

  @IsOptional()
  @IsUUID()
  propostaId?: string;

  @IsOptional()
  @IsUUID()
  contratoId?: string;

  @IsOptional()
  @IsUUID()
  faturaId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  etapaAtual?: number;

  @IsOptional()
  @IsDateString()
  dataInicioApos?: string;

  @IsOptional()
  @IsDateString()
  dataInicioAntes?: string;

  @IsOptional()
  @IsDateString()
  dataConclusaoApos?: string;

  @IsOptional()
  @IsDateString()
  dataConclusaoAntes?: string;

  @IsOptional()
  @IsBoolean()
  comErros?: boolean;

  @IsOptional()
  @IsBoolean()
  vencidos?: boolean;

  @IsOptional()
  @IsString()
  ordenarPor?: string;

  @IsOptional()
  @IsString()
  direcao?: 'ASC' | 'DESC';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class EstatisticasFluxoDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsBoolean()
  incluirDetalhes?: boolean;

  @IsOptional()
  @IsBoolean()
  agruparPorStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  agruparPorEtapa?: boolean;
}
