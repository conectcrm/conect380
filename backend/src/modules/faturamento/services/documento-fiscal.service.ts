import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { EmpresaConfig } from '../../empresas/entities/empresa-config.entity';
import { Fatura, StatusFatura } from '../entities/fatura.entity';
import { ItemFatura } from '../entities/item-fatura.entity';
import {
  AmbienteDocumentoFiscal,
  AMBIENTES_DOCUMENTO_FISCAL,
  CancelarDocumentoFiscalDto,
  CriarRascunhoDocumentoFiscalDto,
  EmitirDocumentoFiscalDto,
  ModoProcessamentoDocumentoFiscal,
  MODOS_PROCESSAMENTO_DOCUMENTO_FISCAL,
  OperacaoDocumentoFiscal,
  TipoDocumentoFiscal,
  TIPOS_DOCUMENTO_FISCAL,
} from '../dto/documento-fiscal.dto';

const DOCUMENTOS_FISCAIS_SUPORTADOS = new Set<string>(TIPOS_DOCUMENTO_FISCAL);
const AMBIENTES_SUPORTADOS = new Set<string>(AMBIENTES_DOCUMENTO_FISCAL);
const DEFAULT_PROVIDER = 'fiscal_stub_local';
const OFFICIAL_PROVIDER_FALLBACK = 'fiscal_oficial';
const ENV_FISCAL_OFFICIAL_HTTP_ENABLED = 'FISCAL_OFFICIAL_HTTP_ENABLED';
const ENV_FISCAL_OFFICIAL_BASE_URL = 'FISCAL_OFFICIAL_BASE_URL';
const ENV_FISCAL_OFFICIAL_API_TOKEN = 'FISCAL_OFFICIAL_API_TOKEN';
const ENV_FISCAL_OFFICIAL_TIMEOUT_MS = 'FISCAL_OFFICIAL_TIMEOUT_MS';
const ENV_FISCAL_OFFICIAL_MAX_RETRIES = 'FISCAL_OFFICIAL_MAX_RETRIES';
const ENV_FISCAL_OFFICIAL_RETRY_DELAY_MS = 'FISCAL_OFFICIAL_RETRY_DELAY_MS';
const ENV_FISCAL_OFFICIAL_EMIT_PATH = 'FISCAL_OFFICIAL_EMIT_PATH';
const ENV_FISCAL_OFFICIAL_EMIT_METHOD = 'FISCAL_OFFICIAL_EMIT_METHOD';
const ENV_FISCAL_OFFICIAL_STATUS_PATH = 'FISCAL_OFFICIAL_STATUS_PATH';
const ENV_FISCAL_OFFICIAL_STATUS_METHOD = 'FISCAL_OFFICIAL_STATUS_METHOD';
const ENV_FISCAL_OFFICIAL_FINALIZE_PATH = 'FISCAL_OFFICIAL_FINALIZE_PATH';
const ENV_FISCAL_OFFICIAL_FINALIZE_METHOD = 'FISCAL_OFFICIAL_FINALIZE_METHOD';
const ENV_FISCAL_OFFICIAL_HEALTH_PATH = 'FISCAL_OFFICIAL_HEALTH_PATH';
const ENV_FISCAL_OFFICIAL_HEALTH_METHOD = 'FISCAL_OFFICIAL_HEALTH_METHOD';
const ENV_FISCAL_OFFICIAL_CORRELATION_HEADER = 'FISCAL_OFFICIAL_CORRELATION_HEADER';
const ENV_FISCAL_OFFICIAL_STRICT_RESPONSE = 'FISCAL_OFFICIAL_STRICT_RESPONSE';
const ENV_FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS = 'FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS';
const ENV_FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS = 'FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_CODE_KEYS = 'FISCAL_OFFICIAL_RESPONSE_CODE_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS = 'FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS = 'FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS = 'FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS = 'FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS = 'FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS = 'FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS';
const ENV_FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS = 'FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS';
const ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET = 'FISCAL_OFFICIAL_WEBHOOK_SECRET';
const ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE';
const DEFAULT_FISCAL_OFFICIAL_TIMEOUT_MS = 15000;
const DEFAULT_FISCAL_OFFICIAL_MAX_RETRIES = 1;
const DEFAULT_FISCAL_OFFICIAL_RETRY_DELAY_MS = 500;
const DEFAULT_FISCAL_OFFICIAL_EMIT_PATH = '/documentos/emitir';
const DEFAULT_FISCAL_OFFICIAL_STATUS_PATH = '/documentos/status';
const DEFAULT_FISCAL_OFFICIAL_FINALIZE_PATH = '/documentos/operacao-final';
const DEFAULT_FISCAL_OFFICIAL_HEALTH_PATH = '/health';
const DEFAULT_FISCAL_OFFICIAL_CORRELATION_HEADER = 'X-Correlation-Id';
const FISCAL_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH'] as const;
type ProviderHttpMethod = (typeof FISCAL_HTTP_METHODS)[number];
type RuntimeConfigSource = 'tenant' | 'env' | 'default' | 'state';

interface FiscalRuntimeConfigSources {
  provider: RuntimeConfigSource;
  requireOfficialProvider: RuntimeConfigSource;
  officialHttpEnabled: RuntimeConfigSource;
  officialBaseUrl: RuntimeConfigSource;
  officialApiToken: RuntimeConfigSource;
  officialWebhookSecret: RuntimeConfigSource;
  officialStrictResponse: RuntimeConfigSource;
  webhookAllowInsecure: RuntimeConfigSource;
  officialCorrelationHeader: RuntimeConfigSource;
}

interface FiscalRuntimeConfig {
  providerEfetivo: string;
  requireOfficialProvider: boolean;
  officialHttpEnabled: boolean;
  officialBaseUrl: string | null;
  officialApiToken: string | null;
  officialWebhookSecret: string | null;
  officialStrictResponse: boolean;
  webhookAllowInsecure: boolean;
  officialCorrelationHeader: string;
  sources: FiscalRuntimeConfigSources;
}

export type StatusDocumentoFiscal =
  | 'nao_iniciado'
  | 'rascunho'
  | 'pendente_emissao'
  | 'emitida'
  | 'erro'
  | 'cancelada';

interface EventoDocumentoFiscal {
  timestamp: string;
  acao: string;
  status: StatusDocumentoFiscal;
  mensagem?: string | null;
  usuarioId?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface DocumentoFiscalState {
  provider?: string;
  tipo?: TipoDocumentoFiscal;
  ambiente?: AmbienteDocumentoFiscal;
  status?: StatusDocumentoFiscal;
  numeroDocumento?: string | null;
  serie?: string | null;
  chaveAcesso?: string | null;
  protocolo?: string | null;
  loteId?: string | null;
  ultimaMensagem?: string | null;
  atualizadoEm?: string | null;
  atualizadoPor?: string | null;
  historico?: EventoDocumentoFiscal[];
  resumo?: {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  };
  modoProcessamento?: ModoProcessamentoDocumentoFiscal;
  contingencia?: boolean;
  codigoRetorno?: string | null;
  referenciaExterna?: string | null;
}

interface ProviderFiscalMutationResult {
  status?: StatusDocumentoFiscal;
  numeroDocumento?: string | null;
  serie?: string | null;
  chaveAcesso?: string | null;
  protocolo?: string | null;
  loteId?: string | null;
  mensagem?: string | null;
  codigoRetorno?: string | null;
  referenciaExterna?: string | null;
  audit?: ProviderFiscalAuditMetadata;
}

interface ProviderFiscalAuditMetadata {
  operacao?: string | null;
  method?: ProviderHttpMethod | null;
  path?: string | null;
  httpStatus?: number | null;
  requestId?: string | null;
  correlationId?: string | null;
  providerStatusBruto?: string | null;
  providerCodigoBruto?: string | null;
  payloadHash?: string | null;
}

type FiscalWebhookHeaders = {
  signature?: string;
  requestId?: string;
  idempotencyKey?: string;
  eventId?: string;
  correlationId?: string;
};

export interface DocumentoFiscalStatusResponse {
  faturaId: number;
  faturaNumero: string;
  tipo: TipoDocumentoFiscal | null;
  ambiente: AmbienteDocumentoFiscal;
  status: StatusDocumentoFiscal;
  provider: string | null;
  numeroDocumento: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  protocolo: string | null;
  loteId: string | null;
  ultimaMensagem: string | null;
  atualizadoEm: string | null;
  modoProcessamento: ModoProcessamentoDocumentoFiscal;
  contingencia: boolean;
  codigoRetorno: string | null;
  referenciaExterna: string | null;
  historico: EventoDocumentoFiscal[];
  resumo: {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  };
}

export interface DocumentoFiscalConfiguracaoDiagnostico {
  providerEfetivo: string;
  officialProviderSelected: boolean;
  readyForOfficialEmission: boolean;
  requireOfficialProvider: boolean;
  officialHttpEnabled: boolean;
  officialBaseUrlConfigured: boolean;
  officialStrictResponse: boolean;
  webhookSecretConfigured: boolean;
  webhookAllowInsecure: boolean;
  officialCorrelationHeader: string;
  configurationSources: FiscalRuntimeConfigSources;
  usingGlobalFallback: boolean;
  globalFallbackFields: string[];
  responseRootPaths: string[];
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  responseAliases: {
    status: string[];
    codigo: string[];
    numero: string[];
    serie: string[];
    chaveAcesso: string[];
    protocolo: string[];
    lote: string[];
    mensagem: string[];
    referenciaExterna: string[];
  };
}

export interface DocumentoFiscalConectividadeDiagnostico {
  providerEfetivo: string;
  officialProviderSelected: boolean;
  readyForOfficialEmission: boolean;
  officialHttpEnabled: boolean;
  officialBaseUrlConfigured: boolean;
  attempted: boolean;
  reachable: boolean;
  success: boolean;
  endpoint: string | null;
  method: ProviderHttpMethod | null;
  httpStatus: number | null;
  latencyMs: number | null;
  requestId: string | null;
  correlationId: string | null;
  message: string;
  timestamp: string;
}

export interface DocumentoFiscalPreflightDiagnostico {
  providerEfetivo: string;
  readyForOfficialEmission: boolean;
  status: 'ok' | 'alerta' | 'bloqueio';
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  configuracao: DocumentoFiscalConfiguracaoDiagnostico;
  conectividade: DocumentoFiscalConectividadeDiagnostico;
  timestamp: string;
}

@Injectable()
export class DocumentoFiscalService {
  private readonly logger = new Logger(DocumentoFiscalService.name);

  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(ItemFatura)
    private readonly itemFaturaRepository: Repository<ItemFatura>,
    @InjectRepository(EmpresaConfig)
    private readonly empresaConfigRepository?: Repository<EmpresaConfig>,
  ) {}

  obterDiagnosticoConfiguracaoFiscal(): DocumentoFiscalConfiguracaoDiagnostico {
    return this.montarDiagnosticoConfiguracaoFiscal(this.resolverConfiguracaoFiscalRuntimeFromEnv());
  }

  async obterDiagnosticoConfiguracaoFiscalPorEmpresa(
    empresaId?: string,
  ): Promise<DocumentoFiscalConfiguracaoDiagnostico> {
    const runtime = await this.resolverConfiguracaoFiscalRuntime(empresaId);
    return this.montarDiagnosticoConfiguracaoFiscal(runtime);
  }

  private montarDiagnosticoConfiguracaoFiscal(
    runtime: FiscalRuntimeConfig,
  ): DocumentoFiscalConfiguracaoDiagnostico {
    const providerEfetivo = runtime.providerEfetivo;
    const officialProviderSelected = this.isProviderFiscalOficial(providerEfetivo);
    const requireOfficialProvider = runtime.requireOfficialProvider;
    const officialHttpEnabled = runtime.officialHttpEnabled;
    const officialBaseUrlConfigured = !!runtime.officialBaseUrl;
    const officialStrictResponse = runtime.officialStrictResponse;
    const webhookSecretConfigured = !!runtime.officialWebhookSecret;
    const webhookAllowInsecure = runtime.webhookAllowInsecure;
    const officialCorrelationHeader = runtime.officialCorrelationHeader;
    const globalFallbackFields = Object.entries(runtime.sources)
      .filter(([, source]) => source === 'env' || source === 'default')
      .map(([key]) => key);
    const usingGlobalFallback = globalFallbackFields.length > 0;
    const responseRootPaths = this.getProviderResponsePathsFromEnv(
      ENV_FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS,
      ['result', 'data', 'documento'],
    );
    const responseAliases = {
      status: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS, [
        'status',
        'situacao',
        'state',
        'resultado',
        'statusDocumento',
        'fiscalStatus',
      ]),
      codigo: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_CODE_KEYS, [
        'codigoRetorno',
        'codigo',
        'code',
        'statusCode',
      ]),
      numero: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS, [
        'numeroDocumento',
        'numero',
        'documentNumber',
        'invoiceNumber',
      ]),
      serie: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS, [
        'serie',
        'series',
      ]),
      chaveAcesso: this.getProviderResponsePathsFromEnv(
        ENV_FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS,
        ['chaveAcesso', 'chave', 'accessKey', 'chave_acesso'],
      ),
      protocolo: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS, [
        'protocolo',
        'protocol',
        'authorizationProtocol',
      ]),
      lote: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS, [
        'loteId',
        'lote',
        'batchId',
      ]),
      mensagem: this.getProviderResponsePathsFromEnv(ENV_FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS, [
        'mensagem',
        'message',
        'descricao',
        'detail',
        'details',
      ]),
      referenciaExterna: this.getProviderResponsePathsFromEnv(
        ENV_FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS,
        ['referenciaExterna', 'externalReference', 'external_reference'],
      ),
    };

    const blockers: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (requireOfficialProvider && !officialProviderSelected) {
      blockers.push(
        'Nenhum provider fiscal oficial foi definido para a empresa (fallback: FISCAL_PROVIDER).',
      );
    }

    if (requireOfficialProvider && !officialHttpEnabled) {
      blockers.push(`${ENV_FISCAL_OFFICIAL_HTTP_ENABLED}=true e obrigatorio neste ambiente.`);
    }

    if (requireOfficialProvider && !officialBaseUrlConfigured) {
      blockers.push(`${ENV_FISCAL_OFFICIAL_BASE_URL} deve ser configurado neste ambiente.`);
    }

    if (!requireOfficialProvider && officialProviderSelected && !officialHttpEnabled) {
      warnings.push('Provider oficial selecionado sem integracao HTTP habilitada.');
    }

    if (officialHttpEnabled && !officialBaseUrlConfigured) {
      blockers.push('Integracao HTTP ativa sem base URL configurada.');
    }

    if (officialStrictResponse && (responseAliases.status.length === 0 || responseAliases.codigo.length === 0)) {
      blockers.push('Modo estrito exige mapeamento de status e codigo no retorno oficial.');
    }

    if (!webhookSecretConfigured) {
      if (requireOfficialProvider && !webhookAllowInsecure) {
        blockers.push(`${ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET} deve ser configurado para callbacks oficiais.`);
      } else {
        warnings.push('Webhook fiscal sem secret configurado.');
      }
    }

    if (webhookAllowInsecure) {
      warnings.push(`${ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE}=true deve ser usado apenas em ambiente controlado.`);
    }

    if (!officialStrictResponse) {
      warnings.push('Validacao estrita de contrato fiscal desativada.');
    }

    if (!officialProviderSelected) {
      recommendations.push(
        'Definir provider fiscal oficial na configuracao da empresa (ou fallback em FISCAL_PROVIDER).',
      );
    }

    if (!officialHttpEnabled) {
      recommendations.push(`Habilitar ${ENV_FISCAL_OFFICIAL_HTTP_ENABLED}=true para integracao real com o provider.`);
    }

    if (!officialBaseUrlConfigured) {
      recommendations.push(`Configurar ${ENV_FISCAL_OFFICIAL_BASE_URL} com a URL oficial do fornecedor.`);
    }

    if (!webhookSecretConfigured) {
      recommendations.push(`Configurar ${ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET} para validacao de assinatura de callbacks.`);
    }

    if (webhookAllowInsecure) {
      recommendations.push(`Desativar ${ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE} em producao.`);
    }

    if (officialProviderSelected && officialHttpEnabled && officialBaseUrlConfigured) {
      recommendations.push('Executar emissao de teste em homologacao e validar protocolo/codigo de retorno.');
    }

    const readyForOfficialEmission =
      officialProviderSelected &&
      officialHttpEnabled &&
      officialBaseUrlConfigured &&
      blockers.length === 0 &&
      (webhookSecretConfigured || webhookAllowInsecure);

    return {
      providerEfetivo,
      officialProviderSelected,
      readyForOfficialEmission,
      requireOfficialProvider,
      officialHttpEnabled,
      officialBaseUrlConfigured,
      officialStrictResponse,
      webhookSecretConfigured,
      webhookAllowInsecure,
      officialCorrelationHeader,
      configurationSources: runtime.sources,
      usingGlobalFallback,
      globalFallbackFields,
      responseRootPaths,
      blockers,
      warnings,
      recommendations,
      responseAliases,
    };
  }

  private resolverConfiguracaoFiscalRuntimeFromEnv(providerAtual?: unknown): FiscalRuntimeConfig {
    const providerAtualNormalizado = this.toNullableString(providerAtual);
    const providerEnv = this.toNullableString(process.env.FISCAL_PROVIDER);
    const providerEfetivo = this.resolverProviderFiscal(providerAtual);
    const officialCorrelationHeaderEnv = this.toNullableString(
      process.env[ENV_FISCAL_OFFICIAL_CORRELATION_HEADER],
    );
    return {
      providerEfetivo,
      requireOfficialProvider: this.requerProviderFiscalOficial(),
      officialHttpEnabled: this.booleanFromEnv(ENV_FISCAL_OFFICIAL_HTTP_ENABLED),
      officialBaseUrl: this.toNullableString(process.env[ENV_FISCAL_OFFICIAL_BASE_URL]),
      officialApiToken: this.toNullableString(process.env[ENV_FISCAL_OFFICIAL_API_TOKEN]),
      officialWebhookSecret: this.toNullableString(process.env[ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET]),
      officialStrictResponse: this.booleanFromEnv(ENV_FISCAL_OFFICIAL_STRICT_RESPONSE),
      webhookAllowInsecure: this.booleanFromEnv(ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE),
      officialCorrelationHeader: officialCorrelationHeaderEnv || DEFAULT_FISCAL_OFFICIAL_CORRELATION_HEADER,
      sources: {
        provider: providerAtualNormalizado ? 'state' : providerEnv ? 'env' : 'default',
        requireOfficialProvider: this.hasEnvSetting('FISCAL_REQUIRE_OFFICIAL_PROVIDER')
          ? 'env'
          : 'default',
        officialHttpEnabled: this.hasEnvSetting(ENV_FISCAL_OFFICIAL_HTTP_ENABLED) ? 'env' : 'default',
        officialBaseUrl: this.hasEnvSetting(ENV_FISCAL_OFFICIAL_BASE_URL) ? 'env' : 'default',
        officialApiToken: this.hasEnvSetting(ENV_FISCAL_OFFICIAL_API_TOKEN) ? 'env' : 'default',
        officialWebhookSecret: this.hasEnvSetting(ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET)
          ? 'env'
          : 'default',
        officialStrictResponse: this.hasEnvSetting(ENV_FISCAL_OFFICIAL_STRICT_RESPONSE)
          ? 'env'
          : 'default',
        webhookAllowInsecure: this.hasEnvSetting(ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE)
          ? 'env'
          : 'default',
        officialCorrelationHeader: officialCorrelationHeaderEnv ? 'env' : 'default',
      },
    };
  }

  private async carregarConfigFiscalEmpresa(empresaId?: string): Promise<EmpresaConfig | null> {
    const tenantId = this.toNullableString(empresaId);
    if (!tenantId || !this.empresaConfigRepository) {
      return null;
    }

    try {
      return await this.empresaConfigRepository.findOne({
        where: { empresaId: tenantId },
      });
    } catch {
      this.logger.warn(
        `Falha ao carregar configuracao fiscal da empresa ${tenantId}; fallback para .env sera aplicado.`,
      );
      return null;
    }
  }

  private async resolverConfiguracaoFiscalRuntime(
    empresaId?: string,
    providerAtual?: unknown,
  ): Promise<FiscalRuntimeConfig> {
    const envRuntime = this.resolverConfiguracaoFiscalRuntimeFromEnv(providerAtual);
    const configEmpresa = await this.carregarConfigFiscalEmpresa(empresaId);

    if (!configEmpresa) {
      return envRuntime;
    }

    const providerConfigurado = this.toNullableString(configEmpresa.fiscalProvider);
    const providerAtualNormalizado = this.toNullableString(providerAtual);
    const providerEfetivo = this.resolverProviderFiscal(providerAtual, providerConfigurado);
    const providerSource: RuntimeConfigSource = providerAtualNormalizado
      ? 'state'
      : providerConfigurado
        ? 'tenant'
        : envRuntime.sources.provider;
    const tenantRequireOfficialProvider = this.toNullableBoolean(
      configEmpresa.fiscalRequireOfficialProvider,
    );
    const requireOfficialProvider =
      tenantRequireOfficialProvider ?? envRuntime.requireOfficialProvider;
    const tenantOfficialHttpEnabled = this.toNullableBoolean(configEmpresa.fiscalOfficialHttpEnabled);
    const officialHttpEnabled =
      tenantOfficialHttpEnabled ?? envRuntime.officialHttpEnabled;
    const tenantOfficialStrictResponse = this.toNullableBoolean(
      configEmpresa.fiscalOfficialStrictResponse,
    );
    const officialStrictResponse =
      tenantOfficialStrictResponse ?? envRuntime.officialStrictResponse;
    const tenantWebhookAllowInsecure = this.toNullableBoolean(
      configEmpresa.fiscalOfficialWebhookAllowInsecure,
    );
    const webhookAllowInsecure =
      tenantWebhookAllowInsecure ?? envRuntime.webhookAllowInsecure;
    const tenantOfficialCorrelationHeader = this.toNullableString(
      configEmpresa.fiscalOfficialCorrelationHeader,
    );
    const officialCorrelationHeader =
      tenantOfficialCorrelationHeader || envRuntime.officialCorrelationHeader;
    const tenantOfficialBaseUrl = this.toNullableString(configEmpresa.fiscalOfficialBaseUrl);
    const tenantOfficialApiToken = this.toNullableString(configEmpresa.fiscalOfficialApiToken);
    const tenantOfficialWebhookSecret = this.toNullableString(configEmpresa.fiscalOfficialWebhookSecret);

    return {
      ...envRuntime,
      providerEfetivo,
      requireOfficialProvider,
      officialHttpEnabled,
      officialStrictResponse,
      webhookAllowInsecure,
      officialCorrelationHeader,
      officialBaseUrl: tenantOfficialBaseUrl || envRuntime.officialBaseUrl,
      officialApiToken: tenantOfficialApiToken || envRuntime.officialApiToken,
      officialWebhookSecret: tenantOfficialWebhookSecret || envRuntime.officialWebhookSecret,
      sources: {
        provider: providerSource,
        requireOfficialProvider:
          tenantRequireOfficialProvider !== null ? 'tenant' : envRuntime.sources.requireOfficialProvider,
        officialHttpEnabled:
          tenantOfficialHttpEnabled !== null ? 'tenant' : envRuntime.sources.officialHttpEnabled,
        officialBaseUrl: tenantOfficialBaseUrl ? 'tenant' : envRuntime.sources.officialBaseUrl,
        officialApiToken: tenantOfficialApiToken ? 'tenant' : envRuntime.sources.officialApiToken,
        officialWebhookSecret: tenantOfficialWebhookSecret
          ? 'tenant'
          : envRuntime.sources.officialWebhookSecret,
        officialStrictResponse:
          tenantOfficialStrictResponse !== null ? 'tenant' : envRuntime.sources.officialStrictResponse,
        webhookAllowInsecure:
          tenantWebhookAllowInsecure !== null ? 'tenant' : envRuntime.sources.webhookAllowInsecure,
        officialCorrelationHeader: tenantOfficialCorrelationHeader
          ? 'tenant'
          : envRuntime.sources.officialCorrelationHeader,
      },
    };
  }

  async testarConectividadeProviderFiscal(
    empresaId?: string,
  ): Promise<DocumentoFiscalConectividadeDiagnostico> {
    const runtime = await this.resolverConfiguracaoFiscalRuntime(empresaId);
    const diagnostico = this.montarDiagnosticoConfiguracaoFiscal(runtime);
    const method = this.getHttpMethodFromEnv(ENV_FISCAL_OFFICIAL_HEALTH_METHOD, 'GET');
    const path = this.getPathFromEnv(ENV_FISCAL_OFFICIAL_HEALTH_PATH, DEFAULT_FISCAL_OFFICIAL_HEALTH_PATH);
    const endpoint = diagnostico.officialBaseUrlConfigured
      ? `${String(runtime.officialBaseUrl || '').replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
      : null;

    const baseResult: Omit<
      DocumentoFiscalConectividadeDiagnostico,
      | 'attempted'
      | 'reachable'
      | 'success'
      | 'httpStatus'
      | 'latencyMs'
      | 'requestId'
      | 'correlationId'
      | 'message'
    > = {
      providerEfetivo: diagnostico.providerEfetivo,
      officialProviderSelected: diagnostico.officialProviderSelected,
      readyForOfficialEmission: diagnostico.readyForOfficialEmission,
      officialHttpEnabled: diagnostico.officialHttpEnabled,
      officialBaseUrlConfigured: diagnostico.officialBaseUrlConfigured,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    };

    if (!diagnostico.officialProviderSelected) {
      return {
        ...baseResult,
        attempted: false,
        reachable: false,
        success: false,
        httpStatus: null,
        latencyMs: null,
        requestId: null,
        correlationId: null,
        message: 'Provider fiscal oficial nao esta selecionado no ambiente atual.',
      };
    }

    if (!diagnostico.officialHttpEnabled) {
      return {
        ...baseResult,
        attempted: false,
        reachable: false,
        success: false,
        httpStatus: null,
        latencyMs: null,
        requestId: null,
        correlationId: null,
        message: `${ENV_FISCAL_OFFICIAL_HTTP_ENABLED}=false. Habilite a integracao HTTP para testar conectividade.`,
      };
    }

    if (!diagnostico.officialBaseUrlConfigured) {
      return {
        ...baseResult,
        attempted: false,
        reachable: false,
        success: false,
        httpStatus: null,
        latencyMs: null,
        requestId: null,
        correlationId: null,
        message: `${ENV_FISCAL_OFFICIAL_BASE_URL} nao configurada. Defina a URL do provider oficial.`,
      };
    }

    const timeout = this.getPositiveIntFromEnv(
      ENV_FISCAL_OFFICIAL_TIMEOUT_MS,
      DEFAULT_FISCAL_OFFICIAL_TIMEOUT_MS,
    );
    const maxRetries = this.getNonNegativeIntFromEnv(
      ENV_FISCAL_OFFICIAL_MAX_RETRIES,
      DEFAULT_FISCAL_OFFICIAL_MAX_RETRIES,
    );
    const retryDelayMs = this.getPositiveIntFromEnv(
      ENV_FISCAL_OFFICIAL_RETRY_DELAY_MS,
      DEFAULT_FISCAL_OFFICIAL_RETRY_DELAY_MS,
    );
    const token = runtime.officialApiToken;
    const correlationHeader = runtime.officialCorrelationHeader;
    const correlationId = this.gerarCorrelationId();
    const startedAt = Date.now();

    for (let tentativa = 0; tentativa <= maxRetries; tentativa += 1) {
      try {
        const url = this.montarUrlProviderOficial(path, runtime);
        const payload = {
          tipo: 'connectivity_probe',
          empresaId,
          timestamp: new Date().toISOString(),
        };

        const response = await axios.request({
          method,
          url,
          timeout,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json',
            [correlationHeader]: correlationId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          ...(method === 'GET' ? { params: payload } : { data: payload }),
        });

        const responseHeaders = this.toObject(response.headers);
        const requestId = this.extrairHeaderTexto(responseHeaders, [
          'x-request-id',
          'request-id',
          'x-id-request',
          'x-correlation-id',
          'correlation-id',
        ]);
        const httpStatus = Number.isFinite(response.status) ? Number(response.status) : null;
        const reachable = httpStatus !== null;
        const success = reachable && httpStatus >= 200 && httpStatus < 300;
        const message = this.montarMensagemConectividadeFiscal(success, httpStatus);

        return {
          ...baseResult,
          attempted: true,
          reachable,
          success,
          httpStatus,
          latencyMs: Math.max(0, Date.now() - startedAt),
          requestId,
          correlationId,
          message,
        };
      } catch (error) {
        const axiosError = error as {
          message?: string;
          code?: string;
          response?: {
            data?: unknown;
            status?: number;
            headers?: Record<string, unknown>;
          };
        };
        const statusCode = axiosError.response?.status;
        const detalhe = this.toNullableString(
          this.toNullableString(
            (axiosError.response?.data as Record<string, unknown> | undefined)?.message,
          ) ||
            this.toNullableString((axiosError.response?.data as Record<string, unknown> | undefined)?.erro) ||
            axiosError.message,
        );
        const podeTentarNovamente =
          tentativa < maxRetries &&
          this.deveRepetirChamadaFiscal(statusCode, axiosError.code, detalhe);

        if (podeTentarNovamente) {
          const retryAfterMs = this.obterRetryAfterMs(axiosError.response?.headers);
          const delay = retryAfterMs ?? retryDelayMs * (tentativa + 1);
          await this.sleep(delay);
          continue;
        }

        return {
          ...baseResult,
          attempted: true,
          reachable: false,
          success: false,
          httpStatus: Number.isFinite(statusCode) ? Number(statusCode) : null,
          latencyMs: Math.max(0, Date.now() - startedAt),
          requestId: null,
          correlationId,
          message: `Falha de conectividade com provider fiscal oficial: ${detalhe || 'erro nao detalhado'}.`,
        };
      }
    }

    return {
      ...baseResult,
      attempted: true,
      reachable: false,
      success: false,
      httpStatus: null,
      latencyMs: Math.max(0, Date.now() - startedAt),
      requestId: null,
      correlationId,
      message: 'Falha de conectividade com provider fiscal oficial: tentativa esgotada.',
    };
  }

  async executarPreflightFiscal(
    empresaId?: string,
  ): Promise<DocumentoFiscalPreflightDiagnostico> {
    const configuracao = await this.obterDiagnosticoConfiguracaoFiscalPorEmpresa(empresaId);
    const conectividade = await this.testarConectividadeProviderFiscal(empresaId);

    const blockers = [...configuracao.blockers];
    const warnings = [...configuracao.warnings];
    const recommendations = [...configuracao.recommendations];

    if (conectividade.attempted && !conectividade.reachable) {
      blockers.push(conectividade.message);
    } else if (conectividade.attempted && conectividade.reachable && !conectividade.success) {
      warnings.push(conectividade.message);
    } else if (!conectividade.attempted) {
      warnings.push(conectividade.message);
    }

    if (!conectividade.success) {
      recommendations.push(
        'Executar validacao com credencial definitiva do provider e confirmar endpoint de health.',
      );
    }

    const status: 'ok' | 'alerta' | 'bloqueio' =
      blockers.length > 0 ? 'bloqueio' : warnings.length > 0 ? 'alerta' : 'ok';

    return {
      providerEfetivo: configuracao.providerEfetivo,
      readyForOfficialEmission:
        configuracao.readyForOfficialEmission && conectividade.success && blockers.length === 0,
      status,
      blockers,
      warnings,
      recommendations,
      configuracao,
      conectividade,
      timestamp: new Date().toISOString(),
    };
  }

  async criarRascunho(
    faturaId: number,
    empresaId: string,
    dto: CriarRascunhoDocumentoFiscalDto = {},
    userId?: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    const detalhes = this.toObject(fatura.detalhesTributarios);

    const tipoDocumento = this.normalizarTipoDocumento(
      dto.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || 'nfse',
    );
    const ambiente = this.normalizarAmbiente(dto.ambiente);
    const resumo = this.montarResumoFinanceiro(fatura);

    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;
    const runtime = await this.resolverConfiguracaoFiscalRuntime(empresaId, fiscalAtual.provider);
    const provider = runtime.providerEfetivo;

    const proximoFiscal: DocumentoFiscalState = {
      provider,
      tipo: tipoDocumento,
      ambiente,
      status: 'rascunho',
      numeroDocumento: this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero),
      serie: this.toNullableString(fiscalAtual.serie || documentoAtual.serie),
      chaveAcesso: this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso),
      protocolo: this.toNullableString(fiscalAtual.protocolo),
      loteId: this.toNullableString(fiscalAtual.loteId),
      ultimaMensagem:
        dto.observacoes?.trim() || 'Rascunho fiscal criado e pronto para emissao.',
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || null,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: 'rascunho_criado',
        status: 'rascunho',
        mensagem: dto.observacoes || 'Rascunho fiscal criado.',
        usuarioId: userId,
        metadata: {
          tipoDocumento,
          ambiente,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: proximoFiscal.numeroDocumento,
        serie: proximoFiscal.serie,
        chaveAcesso: proximoFiscal.chaveAcesso,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async emitir(
    faturaId: number,
    empresaId: string,
    dto: EmitirDocumentoFiscalDto = {},
    userId?: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    if (fatura.status === StatusFatura.CANCELADA) {
      throw new BadRequestException('Nao e possivel emitir documento fiscal para fatura cancelada.');
    }

    const detalhes = this.toObject(fatura.detalhesTributarios);
    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;

    const tipoDocumento = this.normalizarTipoDocumento(
      dto.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || fiscalAtual.tipo,
    );
    const ambiente = this.normalizarAmbiente(dto.ambiente || fiscalAtual.ambiente);
    const runtime = await this.resolverConfiguracaoFiscalRuntime(empresaId, fiscalAtual.provider);
    const provider = runtime.providerEfetivo;
    const modoProcessamento = this.normalizarModoProcessamento(
      dto.modoProcessamento || fiscalAtual.modoProcessamento,
    );
    const contingencia = dto.contingencia === true || fiscalAtual.contingencia === true;

    if (fiscalAtual.status === 'emitida' && !dto.forcarReemissao) {
      return this.montarRespostaStatus(fatura, detalhes);
    }
    this.assertEmissaoFiscalPermitida(provider, runtime);

    const numeroDocumento =
      this.toNullableString(documentoAtual.numero) ||
      this.toNullableString(fiscalAtual.numeroDocumento) ||
      this.gerarNumeroDocumento(fatura, tipoDocumento);
    const serie =
      this.toNullableString(documentoAtual.serie) ||
      this.toNullableString(fiscalAtual.serie) ||
      (tipoDocumento === 'nfe' ? '1' : 'A1');
    const chaveAcesso =
      this.toNullableString(documentoAtual.chaveAcesso) ||
      this.toNullableString(fiscalAtual.chaveAcesso) ||
      this.gerarChaveAcesso();
    const resumo = this.montarResumoFinanceiro(fatura);
    const emLote = modoProcessamento === 'lote';
    const referenciaExterna =
      this.toNullableString(fiscalAtual.referenciaExterna) ||
      this.gerarReferenciaExternaProvider(fatura, tipoDocumento);

    const retornoProvider = this.deveUsarProviderFiscalOficialHttp(provider, runtime)
      ? await this.emitirViaProviderOficial({
          fatura,
          tipoDocumento,
          ambiente,
          modoProcessamento,
          contingencia,
          numeroDocumento,
          serie,
          chaveAcesso,
          referenciaExterna,
          runtime,
        })
      : null;

    const proximoStatus: StatusDocumentoFiscal =
      retornoProvider?.status || (emLote ? 'pendente_emissao' : 'emitida');
    const loteId =
      retornoProvider?.loteId ||
      this.toNullableString(fiscalAtual.loteId) ||
      (proximoStatus === 'pendente_emissao' ? this.gerarLoteId(fatura) : null);
    const protocolo =
      retornoProvider?.protocolo ||
      (proximoStatus === 'emitida'
        ? this.toNullableString(fiscalAtual.protocolo) || this.gerarProtocolo()
        : null);
    const codigoRetorno =
      retornoProvider?.codigoRetorno ||
      (proximoStatus === 'pendente_emissao' ? 'LOTE_ENFILEIRADO' : 'EMISSAO_AUTORIZADA');
    const numeroDocumentoFinal = retornoProvider?.numeroDocumento || numeroDocumento;
    const serieFinal = retornoProvider?.serie || serie;
    const chaveAcessoFinal = retornoProvider?.chaveAcesso || chaveAcesso;
    const referenciaExternaFinal = retornoProvider?.referenciaExterna || referenciaExterna;
    const ultimaMensagem =
      retornoProvider?.mensagem || dto.observacoes?.trim() || this.mensagemPadraoPorStatus(proximoStatus);

    const acaoHistorico = emLote
      ? 'documento_enfileirado'
      : dto.forcarReemissao
        ? 'documento_reemitido'
        : 'documento_emitido';

    const proximoFiscal: DocumentoFiscalState = {
      provider,
      tipo: tipoDocumento,
      ambiente,
      status: proximoStatus,
      numeroDocumento: numeroDocumentoFinal,
      serie: serieFinal,
      chaveAcesso: chaveAcessoFinal,
      protocolo,
      loteId,
      ultimaMensagem,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || null,
      modoProcessamento,
      contingencia,
      codigoRetorno,
      referenciaExterna: referenciaExternaFinal,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: acaoHistorico,
        status: proximoStatus,
        mensagem: ultimaMensagem,
        usuarioId: userId,
        metadata: {
          tipoDocumento,
          ambiente,
          contingencia,
          modoProcessamento,
          numeroDocumento: numeroDocumentoFinal,
          loteId,
          protocolo: protocolo || undefined,
          codigoRetorno,
          referenciaExterna: referenciaExternaFinal,
          audit: retornoProvider?.audit || undefined,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: numeroDocumentoFinal,
        serie: serieFinal,
        chaveAcesso: chaveAcessoFinal,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async cancelarOuInutilizar(
    faturaId: number,
    empresaId: string,
    dto: CancelarDocumentoFiscalDto,
    userId?: string,
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    const detalhes = this.toObject(fatura.detalhesTributarios);
    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;
    const statusAtual = this.normalizarStatusFiscal(fiscalAtual.status);
    const tipoOperacao = this.normalizarOperacao(dto.tipoOperacao);
    const motivo = String(dto.motivo || '').trim();
    const runtime = await this.resolverConfiguracaoFiscalRuntime(empresaId, fiscalAtual.provider);
    const provider = runtime.providerEfetivo;

    if (!motivo) {
      throw new BadRequestException('Informe o motivo do cancelamento/inutilizacao.');
    }

    if (statusAtual === 'cancelada') {
      throw new BadRequestException(
        'Documento fiscal ja esta cancelado/inutilizado para esta fatura.',
      );
    }

    if (tipoOperacao === 'cancelar' && statusAtual !== 'emitida') {
      throw new BadRequestException(
        'Documento fiscal ainda nao foi emitido. Utilize a inutilizacao da numeracao.',
      );
    }

    if (tipoOperacao === 'inutilizar' && statusAtual === 'emitida') {
      throw new BadRequestException(
        'Documento fiscal emitido deve ser cancelado, e nao inutilizado.',
      );
    }

    const tipoDocumento = this.normalizarTipoDocumento(
      fiscalAtual.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || 'nfse',
    );
    const ambiente = this.normalizarAmbiente(dto.ambiente || fiscalAtual.ambiente);
    this.assertOperacaoFiscalPermitida(provider, 'cancelamento/inutilizacao', runtime);
    const manterIdentificacao = tipoOperacao === 'cancelar';
    const numeroDocumento = manterIdentificacao
      ? this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero)
      : null;
    const serie = manterIdentificacao
      ? this.toNullableString(fiscalAtual.serie || documentoAtual.serie)
      : null;
    const chaveAcesso = manterIdentificacao
      ? this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso)
      : null;

    const retornoProvider = this.deveUsarProviderFiscalOficialHttp(provider, runtime)
      ? await this.executarOperacaoFinalViaProviderOficial({
          fatura,
          tipoOperacao,
          tipoDocumento,
          ambiente,
          motivo,
          numeroDocumento: numeroDocumento || undefined,
          serie: serie || undefined,
          chaveAcesso: chaveAcesso || undefined,
          referenciaExterna: this.toNullableString(fiscalAtual.referenciaExterna) || undefined,
          runtime,
        })
      : null;

    const resumo = this.montarResumoFinanceiro(fatura);
    const proximoFiscal: DocumentoFiscalState = {
      provider,
      tipo: tipoDocumento,
      ambiente,
      status: 'cancelada',
      numeroDocumento,
      serie,
      chaveAcesso,
      protocolo: retornoProvider?.protocolo || this.toNullableString(fiscalAtual.protocolo),
      loteId: this.toNullableString(fiscalAtual.loteId),
      ultimaMensagem: retornoProvider?.mensagem || motivo,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || null,
      modoProcessamento: this.normalizarModoProcessamento(fiscalAtual.modoProcessamento),
      contingencia: fiscalAtual.contingencia === true,
      codigoRetorno:
        retornoProvider?.codigoRetorno ||
        (tipoOperacao === 'cancelar' ? 'DOCUMENTO_CANCELADO' : 'NUMERACAO_INUTILIZADA'),
      referenciaExterna:
        retornoProvider?.referenciaExterna || this.toNullableString(fiscalAtual.referenciaExterna),
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: tipoOperacao === 'cancelar' ? 'documento_cancelado' : 'numeracao_inutilizada',
        status: 'cancelada',
        mensagem: retornoProvider?.mensagem || motivo,
        usuarioId: userId,
        metadata: {
          operacao: tipoOperacao,
          tipoDocumento,
          ambiente,
          numeroDocumento: numeroDocumento || undefined,
          codigoRetorno: retornoProvider?.codigoRetorno || undefined,
          audit: retornoProvider?.audit || undefined,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: numeroDocumento,
        serie,
        chaveAcesso,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async consultarStatus(
    faturaId: number,
    empresaId: string,
    options?: {
      sincronizar?: boolean;
      userId?: string;
    },
  ): Promise<DocumentoFiscalStatusResponse> {
    const fatura = await this.carregarFatura(faturaId, empresaId);
    const detalhes = this.toObject(fatura.detalhesTributarios);
    if (!options?.sincronizar) {
      return this.montarRespostaStatus(fatura, detalhes);
    }

    const detalhesAtualizados = await this.sincronizarStatusFiscalComProvider(
      fatura,
      detalhes,
      options?.userId,
    );
    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);
    return this.montarRespostaStatus(fatura, detalhesAtualizados);
  }

  async processarWebhookProviderOficial(input: {
    empresaId: string;
    payload: Record<string, unknown>;
    headers?: FiscalWebhookHeaders;
  }): Promise<{
    success: boolean;
    accepted: boolean;
    duplicate: boolean;
    reason?: string;
    faturaId?: number;
    status?: StatusDocumentoFiscal;
    eventKey: string;
    correlationId: string;
  }> {
    const payload = this.toObject(input.payload);
    const headers = input.headers || {};
    const runtime = await this.resolverConfiguracaoFiscalRuntime(input.empresaId);

    this.validarAssinaturaWebhookFiscal(
      payload,
      headers.signature || '',
      runtime.officialWebhookSecret,
      runtime.webhookAllowInsecure,
    );

    const eventKey = this.resolveWebhookFiscalEventKey(input.empresaId, payload, headers);
    const correlationId = this.resolveWebhookFiscalCorrelationId(payload, headers, eventKey);

    const fatura = await this.resolverFaturaDoWebhookFiscal(input.empresaId, payload);
    if (!fatura) {
      this.logger.warn(
        `Webhook fiscal oficial sem fatura correspondente empresa=${input.empresaId} key=${eventKey}`,
      );
      return {
        success: true,
        accepted: false,
        duplicate: false,
        reason: 'fatura_nao_encontrada',
        eventKey,
        correlationId,
      };
    }

    const detalhes = this.toObject(fatura.detalhesTributarios);
    const documentoAtual = this.toObject(detalhes.documento);
    const fiscalAtual = this.toObject(detalhes.fiscal) as Partial<DocumentoFiscalState>;
    const historicoAtual = this.normalizarHistorico(fiscalAtual.historico);

    const duplicate = historicoAtual.some((evento) => {
      const metadata = this.toObject(evento.metadata);
      const key = this.toNullableString(metadata.webhookEventKey);
      return key === eventKey;
    });
    if (duplicate) {
      return {
        success: true,
        accepted: true,
        duplicate: true,
        faturaId: fatura.id,
        status: this.normalizarStatusFiscal(fiscalAtual.status),
        eventKey,
        correlationId,
      };
    }

    const retornoProvider = this.mapearRetornoProviderFiscal(payload);
    const tipoDocumento = this.normalizarTipoDocumento(
      fiscalAtual.tipo || this.extrairTipoDocumentoDeDetalhes(detalhes) || 'nfse',
    );
    const ambiente = this.normalizarAmbiente(fiscalAtual.ambiente);
    const provider = runtime.providerEfetivo;
    const statusAtual = this.normalizarStatusFiscal(fiscalAtual.status);
    const statusFinal = retornoProvider.status || statusAtual;
    const numeroDocumentoFinal =
      retornoProvider.numeroDocumento ||
      this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero);
    const serieFinal = retornoProvider.serie || this.toNullableString(fiscalAtual.serie || documentoAtual.serie);
    const chaveAcessoFinal =
      retornoProvider.chaveAcesso ||
      this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso);
    const protocoloFinal = retornoProvider.protocolo || this.toNullableString(fiscalAtual.protocolo);
    const loteIdFinal = retornoProvider.loteId || this.toNullableString(fiscalAtual.loteId);
    const codigoRetornoFinal =
      retornoProvider.codigoRetorno || this.toNullableString(fiscalAtual.codigoRetorno) || 'WEBHOOK_RECEBIDO';
    const referenciaExternaFinal =
      retornoProvider.referenciaExterna || this.toNullableString(fiscalAtual.referenciaExterna);
    const mensagemFinal = retornoProvider.mensagem || 'Status fiscal atualizado via webhook oficial.';
    const resumo = this.montarResumoFinanceiro(fatura);

    const proximoFiscal: DocumentoFiscalState = {
      provider,
      tipo: tipoDocumento,
      ambiente,
      status: statusFinal,
      numeroDocumento: numeroDocumentoFinal,
      serie: serieFinal,
      chaveAcesso: chaveAcessoFinal,
      protocolo: protocoloFinal,
      loteId: loteIdFinal,
      ultimaMensagem: mensagemFinal,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: 'webhook:fiscal_oficial',
      modoProcessamento: this.normalizarModoProcessamento(fiscalAtual.modoProcessamento),
      contingencia: fiscalAtual.contingencia === true,
      codigoRetorno: codigoRetornoFinal,
      referenciaExterna: referenciaExternaFinal,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: 'webhook_status_atualizado',
        status: statusFinal,
        mensagem: mensagemFinal,
        metadata: {
          provider,
          codigoRetorno: codigoRetornoFinal,
          webhookEventKey: eventKey,
          correlationId,
          requestId: this.toNullableString(headers.requestId),
          audit: retornoProvider.audit || undefined,
        },
      }),
      resumo,
    };

    const detalhesAtualizados: Record<string, unknown> = {
      ...detalhes,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: numeroDocumentoFinal,
        serie: serieFinal,
        chaveAcesso: chaveAcessoFinal,
      },
      fiscal: proximoFiscal,
    };

    fatura.detalhesTributarios = detalhesAtualizados;
    await this.faturaRepository.save(fatura);

    return {
      success: true,
      accepted: true,
      duplicate: false,
      faturaId: fatura.id,
      status: statusFinal,
      eventKey,
      correlationId,
    };
  }

  private async carregarFatura(faturaId: number, empresaId: string): Promise<Fatura> {
    const fatura = await this.faturaRepository.findOne({
      where: {
        id: faturaId,
        empresaId,
        ativo: true,
      },
      relations: ['itens'],
    });

    if (!fatura) {
      throw new NotFoundException('Fatura nao encontrada.');
    }

    if (!Array.isArray(fatura.itens) || fatura.itens.length === 0) {
      fatura.itens = await this.itemFaturaRepository.find({
        where: { faturaId: fatura.id },
      });
    }

    return fatura;
  }

  private montarRespostaStatus(
    fatura: Fatura,
    detalhesTributarios: Record<string, unknown>,
  ): DocumentoFiscalStatusResponse {
    const documento = this.toObject(detalhesTributarios.documento);
    const fiscal = this.toObject(detalhesTributarios.fiscal) as Partial<DocumentoFiscalState>;
    const tipoDocumento = this.normalizarTipoDocumentoOptional(
      fiscal.tipo || this.toNullableString(documento.tipo),
    );
    const ambiente = this.normalizarAmbiente(fiscal.ambiente);
    const resumo =
      fiscal.resumo && typeof fiscal.resumo === 'object'
        ? {
            valorServicos: this.roundMoney((fiscal.resumo as Record<string, unknown>).valorServicos),
            valorTributos: this.roundMoney((fiscal.resumo as Record<string, unknown>).valorTributos),
            valorTotal: this.roundMoney((fiscal.resumo as Record<string, unknown>).valorTotal),
          }
        : this.montarResumoFinanceiro(fatura);

    return {
      faturaId: fatura.id,
      faturaNumero: String(fatura.numero || ''),
      tipo: tipoDocumento,
      ambiente,
      status: this.normalizarStatusFiscal(fiscal.status),
      provider: this.toNullableString(fiscal.provider),
      numeroDocumento: this.toNullableString(fiscal.numeroDocumento || documento.numero),
      serie: this.toNullableString(fiscal.serie || documento.serie),
      chaveAcesso: this.toNullableString(fiscal.chaveAcesso || documento.chaveAcesso),
      protocolo: this.toNullableString(fiscal.protocolo),
      loteId: this.toNullableString(fiscal.loteId),
      ultimaMensagem: this.toNullableString(fiscal.ultimaMensagem),
      atualizadoEm: this.toNullableString(fiscal.atualizadoEm),
      modoProcessamento: this.normalizarModoProcessamento(fiscal.modoProcessamento),
      contingencia: fiscal.contingencia === true,
      codigoRetorno: this.toNullableString(fiscal.codigoRetorno),
      referenciaExterna: this.toNullableString(fiscal.referenciaExterna),
      historico: this.normalizarHistorico(fiscal.historico),
      resumo,
    };
  }

  private async sincronizarStatusFiscalComProvider(
    fatura: Fatura,
    detalhesTributarios: Record<string, unknown>,
    userId?: string,
  ): Promise<Record<string, unknown>> {
    const documentoAtual = this.toObject(detalhesTributarios.documento);
    const fiscalAtual = this.toObject(detalhesTributarios.fiscal) as Partial<DocumentoFiscalState>;
    const runtime = await this.resolverConfiguracaoFiscalRuntime(
      fatura.empresaId,
      fiscalAtual.provider,
    );
    const provider = runtime.providerEfetivo;
    this.assertOperacaoFiscalPermitida(provider, 'sincronizacao de status', runtime);
    const tipoDocumento = this.normalizarTipoDocumento(
      fiscalAtual.tipo || this.extrairTipoDocumentoDeDetalhes(detalhesTributarios) || 'nfse',
    );
    const ambiente = this.normalizarAmbiente(fiscalAtual.ambiente);
    const modoProcessamento = this.normalizarModoProcessamento(fiscalAtual.modoProcessamento);
    const statusAtual = this.normalizarStatusFiscal(fiscalAtual.status);
    const resumo = this.montarResumoFinanceiro(fatura);
    const referenciaExterna =
      this.toNullableString(fiscalAtual.referenciaExterna) ||
      this.gerarReferenciaExternaProvider(fatura, tipoDocumento);

    const retornoProvider = this.deveUsarProviderFiscalOficialHttp(provider, runtime)
      ? await this.consultarStatusViaProviderOficial({
          fatura,
          tipoDocumento,
          ambiente,
          referenciaExterna,
          numeroDocumento:
            this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero) || undefined,
          serie: this.toNullableString(fiscalAtual.serie || documentoAtual.serie) || undefined,
          loteId: this.toNullableString(fiscalAtual.loteId) || undefined,
          protocolo: this.toNullableString(fiscalAtual.protocolo) || undefined,
          chaveAcesso:
            this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso) || undefined,
          runtime,
        })
      : null;

    const emLotePendente = statusAtual === 'pendente_emissao';
    const statusSincronizado: StatusDocumentoFiscal =
      retornoProvider?.status || (emLotePendente ? 'emitida' : statusAtual);
    const protocolo =
      retornoProvider?.protocolo ||
      (statusSincronizado === 'emitida'
        ? this.toNullableString(fiscalAtual.protocolo) || this.gerarProtocolo()
        : this.toNullableString(fiscalAtual.protocolo));
    const codigoRetorno =
      retornoProvider?.codigoRetorno ||
      (emLotePendente
        ? 'EMISSAO_AUTORIZADA'
        : statusAtual === 'emitida'
          ? 'STATUS_CONFIRMADO'
          : 'SEM_EMISSAO');
    const mensagem =
      retornoProvider?.mensagem ||
      (emLotePendente
        ? `Retorno do provider ${provider}: documento autorizado e emitido.`
        : statusAtual === 'emitida'
          ? `Consulta sincronizada com provider ${provider}.`
          : `Sem emissao ativa para consulta no provider ${provider}.`);
    const numeroDocumentoSincronizado =
      retornoProvider?.numeroDocumento ||
      (statusSincronizado === 'emitida'
        ? this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero) ||
          this.gerarNumeroDocumento(fatura, tipoDocumento)
        : this.toNullableString(fiscalAtual.numeroDocumento || documentoAtual.numero));
    const serieSincronizada =
      retornoProvider?.serie ||
      (statusSincronizado === 'emitida'
        ? this.toNullableString(fiscalAtual.serie || documentoAtual.serie) ||
          (tipoDocumento === 'nfe' ? '1' : 'A1')
        : this.toNullableString(fiscalAtual.serie || documentoAtual.serie));
    const chaveAcessoSincronizada =
      retornoProvider?.chaveAcesso ||
      (statusSincronizado === 'emitida'
        ? this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso) ||
          this.gerarChaveAcesso()
        : this.toNullableString(fiscalAtual.chaveAcesso || documentoAtual.chaveAcesso));

    const proximoFiscal: DocumentoFiscalState = {
      provider,
      tipo: tipoDocumento,
      ambiente,
      status: statusSincronizado,
      numeroDocumento: numeroDocumentoSincronizado,
      serie: serieSincronizada,
      chaveAcesso: chaveAcessoSincronizada,
      protocolo,
      loteId:
        retornoProvider?.loteId ||
        this.toNullableString(fiscalAtual.loteId) ||
        (statusSincronizado === 'pendente_emissao' ? this.gerarLoteId(fatura) : null),
      ultimaMensagem: mensagem,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId || fiscalAtual.atualizadoPor || null,
      modoProcessamento,
      contingencia: fiscalAtual.contingencia === true,
      codigoRetorno,
      referenciaExterna: retornoProvider?.referenciaExterna || referenciaExterna,
      historico: this.adicionarHistorico(fiscalAtual.historico, {
        acao: emLotePendente ? 'status_sincronizado_emitido' : 'status_sincronizado',
        status: statusSincronizado,
        mensagem,
        usuarioId: userId,
        metadata: {
          provider,
          ambiente,
          modoProcessamento,
          codigoRetorno,
          protocolo,
          referenciaExterna: retornoProvider?.referenciaExterna || referenciaExterna,
          audit: retornoProvider?.audit || undefined,
        },
      }),
      resumo,
    };

    return {
      ...detalhesTributarios,
      documento: {
        ...documentoAtual,
        tipo: tipoDocumento,
        numero: numeroDocumentoSincronizado,
        serie: serieSincronizada,
        chaveAcesso: chaveAcessoSincronizada,
      },
      fiscal: proximoFiscal,
    };
  }

  private extrairTipoDocumentoDeDetalhes(
    detalhesTributarios: Record<string, unknown>,
  ): TipoDocumentoFiscal | null {
    const documento = this.toObject(detalhesTributarios.documento);
    return this.normalizarTipoDocumentoOptional(this.toNullableString(documento.tipo));
  }

  private montarResumoFinanceiro(fatura: Fatura): {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  } {
    const itens = Array.isArray(fatura.itens) ? fatura.itens : [];
    const valorServicos = this.roundMoney(
      itens.reduce((acc, item) => acc + this.toNumber(item?.valorTotal), 0),
    );
    const valorTributos = this.roundMoney(fatura.valorImpostos);
    const valorTotal = this.roundMoney(fatura.valorTotal);

    return { valorServicos, valorTributos, valorTotal };
  }

  private gerarNumeroDocumento(fatura: Fatura, tipo: TipoDocumentoFiscal): string {
    const prefixo = tipo === 'nfe' ? 'NFE' : 'NFSE';
    const ano = new Date().getFullYear();
    return `${prefixo}-${ano}-${String(fatura.id).padStart(6, '0')}`;
  }

  private gerarChaveAcesso(): string {
    const base = `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`;
    return base.slice(0, 44).padEnd(44, '0');
  }

  private gerarProtocolo(): string {
    return `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
  }

  private gerarLoteId(fatura: Fatura): string {
    return `LOT-${fatura.id}-${Date.now()}`;
  }

  private gerarReferenciaExternaProvider(fatura: Fatura, tipo: TipoDocumentoFiscal): string {
    const prefixo = tipo === 'nfe' ? 'NFE' : 'NFSE';
    return `${prefixo}-REF-${fatura.id}-${Date.now()}`;
  }

  private adicionarHistorico(
    historicoAtual: unknown,
    evento: {
      acao: string;
      status: StatusDocumentoFiscal;
      mensagem?: string;
      usuarioId?: string;
      metadata?: Record<string, unknown>;
    },
  ): EventoDocumentoFiscal[] {
    const historico = this.normalizarHistorico(historicoAtual);
    historico.push({
      timestamp: new Date().toISOString(),
      acao: evento.acao,
      status: evento.status,
      mensagem: evento.mensagem || null,
      usuarioId: evento.usuarioId || null,
      metadata: evento.metadata || null,
    });

    return historico.slice(-80);
  }

  private normalizarHistorico(historicoAtual: unknown): EventoDocumentoFiscal[] {
    if (!Array.isArray(historicoAtual)) {
      return [];
    }

    return historicoAtual
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => {
        const evento = item as Record<string, unknown>;
        return {
          timestamp: String(evento.timestamp || new Date().toISOString()),
          acao: String(evento.acao || 'atualizacao'),
          status: this.normalizarStatusFiscal(evento.status),
          mensagem: this.toNullableString(evento.mensagem),
          usuarioId: this.toNullableString(evento.usuarioId),
          metadata:
            evento.metadata && typeof evento.metadata === 'object' && !Array.isArray(evento.metadata)
              ? (evento.metadata as Record<string, unknown>)
              : null,
        };
      });
  }

  private normalizarStatusFiscal(value: unknown): StatusDocumentoFiscal {
    const status = String(value || '').trim().toLowerCase();
    const validos: StatusDocumentoFiscal[] = [
      'nao_iniciado',
      'rascunho',
      'pendente_emissao',
      'emitida',
      'erro',
      'cancelada',
    ];

    return validos.includes(status as StatusDocumentoFiscal)
      ? (status as StatusDocumentoFiscal)
      : 'nao_iniciado';
  }

  private normalizarStatusFiscalOptional(value: unknown): StatusDocumentoFiscal | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'number') {
      return this.normalizarStatusFiscalPorCodigoRetorno(String(value));
    }

    const status = String(value).trim().toLowerCase();
    if (!status) {
      return null;
    }

    const aliases: Record<string, StatusDocumentoFiscal> = {
      nao_iniciado: 'nao_iniciado',
      not_started: 'nao_iniciado',
      sem_emissao: 'nao_iniciado',
      draft: 'rascunho',
      rascunho: 'rascunho',
      pending: 'pendente_emissao',
      processando: 'pendente_emissao',
      processamento: 'pendente_emissao',
      em_processamento: 'pendente_emissao',
      em_fila: 'pendente_emissao',
      aguardando_autorizacao: 'pendente_emissao',
      autorizado: 'emitida',
      autorizada: 'emitida',
      approved: 'emitida',
      emitida: 'emitida',
      issued: 'emitida',
      success: 'emitida',
      concluida: 'emitida',
      concluido: 'emitida',
      erro: 'erro',
      error: 'erro',
      failed: 'erro',
      rejeitada: 'erro',
      rejeitado: 'erro',
      denegada: 'erro',
      denegado: 'erro',
      cancelada: 'cancelada',
      cancelado: 'cancelada',
      canceled: 'cancelada',
      inutilizada: 'cancelada',
      inutilizado: 'cancelada',
      voided: 'cancelada',
    };

    if (aliases[status]) {
      return aliases[status];
    }

    if (status.includes('autoriz')) {
      return 'emitida';
    }
    if (status.includes('process') || status.includes('pend')) {
      return 'pendente_emissao';
    }
    if (status.includes('cancel') || status.includes('inutil')) {
      return 'cancelada';
    }
    if (status.includes('erro') || status.includes('fail') || status.includes('rejeit')) {
      return 'erro';
    }

    return null;
  }

  private normalizarStatusFiscalPorCodigoRetorno(codigoRaw: unknown): StatusDocumentoFiscal | null {
    const codigo = String(codigoRaw || '')
      .trim()
      .toUpperCase();
    if (!codigo) {
      return null;
    }

    if (codigo === 'LOTE_ENFILEIRADO' || codigo.startsWith('2')) {
      return 'pendente_emissao';
    }

    if (codigo === 'EMISSAO_AUTORIZADA' || codigo === 'STATUS_OK' || codigo === '100') {
      return 'emitida';
    }

    if (codigo === '135' || codigo === '151' || codigo === 'DOCUMENTO_CANCELADO') {
      return 'cancelada';
    }

    if (codigo.startsWith('4') || codigo.startsWith('5') || codigo === 'REJEICAO') {
      return 'erro';
    }

    return null;
  }

  private normalizarOperacao(value: unknown): OperacaoDocumentoFiscal {
    const operacao = String(value || 'cancelar')
      .trim()
      .toLowerCase();
    return operacao === 'inutilizar' ? 'inutilizar' : 'cancelar';
  }

  private normalizarModoProcessamento(value: unknown): ModoProcessamentoDocumentoFiscal {
    const modo = String(value || 'sincrono')
      .trim()
      .toLowerCase();

    if (MODOS_PROCESSAMENTO_DOCUMENTO_FISCAL.includes(modo as ModoProcessamentoDocumentoFiscal)) {
      return modo as ModoProcessamentoDocumentoFiscal;
    }

    return 'sincrono';
  }

  private normalizarTipoDocumento(value: unknown): TipoDocumentoFiscal {
    const tipo = this.normalizarTipoDocumentoOptional(value);
    if (!tipo) {
      throw new BadRequestException('Tipo de documento fiscal invalido. Use nfse ou nfe.');
    }
    return tipo;
  }

  private normalizarTipoDocumentoOptional(value: unknown): TipoDocumentoFiscal | null {
    const tipo = String(value || '')
      .trim()
      .toLowerCase();
    if (!tipo) {
      return null;
    }
    return DOCUMENTOS_FISCAIS_SUPORTADOS.has(tipo) ? (tipo as TipoDocumentoFiscal) : null;
  }

  private normalizarAmbiente(value: unknown): AmbienteDocumentoFiscal {
    const ambiente = String(value || '')
      .trim()
      .toLowerCase();
    if (AMBIENTES_SUPORTADOS.has(ambiente)) {
      return ambiente as AmbienteDocumentoFiscal;
    }
    return 'homologacao';
  }

  private resolverProviderFiscal(providerAtual?: unknown, providerConfigurado?: string | null): string {
    const providerPadrao = this.toNullableString(providerConfigurado) || this.toNullableString(process.env.FISCAL_PROVIDER);
    const providerAtualNormalizado = this.toNullableString(providerAtual);

    return (
      providerAtualNormalizado ||
      providerPadrao ||
      (this.requerProviderFiscalOficial() ? OFFICIAL_PROVIDER_FALLBACK : DEFAULT_PROVIDER)
    );
  }

  private requerProviderFiscalOficial(): boolean {
    const valor = String(process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER || '')
      .trim()
      .toLowerCase();
    return ['1', 'true', 'yes', 'sim'].includes(valor);
  }

  private isProviderFiscalOficial(provider: string): boolean {
    const valor = String(provider || '')
      .trim()
      .toLowerCase();
    return valor.length > 0 && valor !== DEFAULT_PROVIDER;
  }

  private assertEmissaoFiscalPermitida(provider: string, runtime: FiscalRuntimeConfig): void {
    if (!runtime.requireOfficialProvider) {
      return;
    }

    if (!this.isProviderFiscalOficial(provider)) {
      throw new BadRequestException(
        'Emissao fiscal bloqueada: configure um provedor fiscal oficial para este ambiente.',
      );
    }

    if (!this.provedorFiscalOficialConfigurado(runtime)) {
      throw new BadRequestException(
        `Emissao fiscal bloqueada: provedor oficial selecionado sem integracao ativa. Configure ${ENV_FISCAL_OFFICIAL_HTTP_ENABLED}=true e ${ENV_FISCAL_OFFICIAL_BASE_URL}.`,
      );
    }
  }

  private assertOperacaoFiscalPermitida(
    provider: string,
    operacao: string,
    runtime: FiscalRuntimeConfig,
  ): void {
    if (!runtime.requireOfficialProvider) {
      return;
    }

    if (!this.isProviderFiscalOficial(provider)) {
      throw new BadRequestException(
        `Operacao fiscal (${operacao}) bloqueada: configure um provedor fiscal oficial para este ambiente.`,
      );
    }

    if (!this.provedorFiscalOficialConfigurado(runtime)) {
      throw new BadRequestException(
        `Operacao fiscal (${operacao}) bloqueada: provedor oficial selecionado sem integracao ativa. Configure ${ENV_FISCAL_OFFICIAL_HTTP_ENABLED}=true e ${ENV_FISCAL_OFFICIAL_BASE_URL}.`,
      );
    }
  }

  private provedorFiscalOficialConfigurado(runtime: FiscalRuntimeConfig): boolean {
    return runtime.officialHttpEnabled && !!runtime.officialBaseUrl;
  }

  private deveUsarProviderFiscalOficialHttp(provider: string, runtime: FiscalRuntimeConfig): boolean {
    return this.isProviderFiscalOficial(provider) && this.provedorFiscalOficialConfigurado(runtime);
  }

  private mensagemPadraoPorStatus(status: StatusDocumentoFiscal): string {
    if (status === 'pendente_emissao') {
      return 'Documento fiscal enviado para processamento em lote.';
    }
    if (status === 'emitida') {
      return 'Documento fiscal emitido com sucesso.';
    }
    if (status === 'erro') {
      return 'Falha ao processar documento fiscal no provider.';
    }
    return 'Documento fiscal processado.';
  }

  private async emitirViaProviderOficial(input: {
    fatura: Fatura;
    tipoDocumento: TipoDocumentoFiscal;
    ambiente: AmbienteDocumentoFiscal;
    modoProcessamento: ModoProcessamentoDocumentoFiscal;
    contingencia: boolean;
    numeroDocumento: string;
    serie: string;
    chaveAcesso: string;
    referenciaExterna: string;
    runtime: FiscalRuntimeConfig;
  }): Promise<ProviderFiscalMutationResult | null> {
    const response = await this.chamarProviderFiscalOficial(
      this.getHttpMethodFromEnv(ENV_FISCAL_OFFICIAL_EMIT_METHOD, 'POST'),
      this.getPathFromEnv(ENV_FISCAL_OFFICIAL_EMIT_PATH, DEFAULT_FISCAL_OFFICIAL_EMIT_PATH),
      {
        empresaId: input.fatura.empresaId,
        faturaId: input.fatura.id,
        faturaNumero: input.fatura.numero,
        tipoDocumento: input.tipoDocumento,
        ambiente: input.ambiente,
        modoProcessamento: input.modoProcessamento,
        contingencia: input.contingencia,
        numeroDocumento: input.numeroDocumento,
        serie: input.serie,
        chaveAcesso: input.chaveAcesso,
        referenciaExterna: input.referenciaExterna,
        valorTotal: this.roundMoney(input.fatura.valorTotal),
        valorImpostos: this.roundMoney(input.fatura.valorImpostos),
      },
      'emissao fiscal',
      input.runtime,
    );

    const retorno = this.mapearRetornoProviderFiscal(response);
    this.validarContratoRetornoProviderOficial('emissao', retorno);
    return retorno;
  }

  private async consultarStatusViaProviderOficial(input: {
    fatura: Fatura;
    tipoDocumento: TipoDocumentoFiscal;
    ambiente: AmbienteDocumentoFiscal;
    referenciaExterna: string;
    numeroDocumento?: string;
    serie?: string;
    protocolo?: string;
    loteId?: string;
    chaveAcesso?: string;
    runtime: FiscalRuntimeConfig;
  }): Promise<ProviderFiscalMutationResult | null> {
    const response = await this.chamarProviderFiscalOficial(
      this.getHttpMethodFromEnv(ENV_FISCAL_OFFICIAL_STATUS_METHOD, 'GET'),
      this.getPathFromEnv(ENV_FISCAL_OFFICIAL_STATUS_PATH, DEFAULT_FISCAL_OFFICIAL_STATUS_PATH),
      {
        empresaId: input.fatura.empresaId,
        faturaId: input.fatura.id,
        tipoDocumento: input.tipoDocumento,
        ambiente: input.ambiente,
        referenciaExterna: input.referenciaExterna,
        numeroDocumento: input.numeroDocumento,
        serie: input.serie,
        protocolo: input.protocolo,
        loteId: input.loteId,
        chaveAcesso: input.chaveAcesso,
      },
      'sincronizacao de status fiscal',
      input.runtime,
    );

    const retorno = this.mapearRetornoProviderFiscal(response);
    this.validarContratoRetornoProviderOficial('status', retorno);
    return retorno;
  }

  private async executarOperacaoFinalViaProviderOficial(input: {
    fatura: Fatura;
    tipoOperacao: OperacaoDocumentoFiscal;
    tipoDocumento: TipoDocumentoFiscal;
    ambiente: AmbienteDocumentoFiscal;
    motivo: string;
    numeroDocumento?: string;
    serie?: string;
    chaveAcesso?: string;
    referenciaExterna?: string;
    runtime: FiscalRuntimeConfig;
  }): Promise<ProviderFiscalMutationResult | null> {
    const response = await this.chamarProviderFiscalOficial(
      this.getHttpMethodFromEnv(ENV_FISCAL_OFFICIAL_FINALIZE_METHOD, 'POST'),
      this.getPathFromEnv(ENV_FISCAL_OFFICIAL_FINALIZE_PATH, DEFAULT_FISCAL_OFFICIAL_FINALIZE_PATH),
      {
        empresaId: input.fatura.empresaId,
        faturaId: input.fatura.id,
        tipoOperacao: input.tipoOperacao,
        tipoDocumento: input.tipoDocumento,
        ambiente: input.ambiente,
        motivo: input.motivo,
        numeroDocumento: input.numeroDocumento,
        serie: input.serie,
        chaveAcesso: input.chaveAcesso,
        referenciaExterna: input.referenciaExterna,
      },
      'operacao final fiscal',
      input.runtime,
    );

    const retorno = this.mapearRetornoProviderFiscal(response);
    this.validarContratoRetornoProviderOficial('operacao_final', retorno);
    return retorno;
  }

  private async chamarProviderFiscalOficial(
    method: ProviderHttpMethod,
    path: string,
    payload: Record<string, unknown>,
    operacao: string,
    runtime: FiscalRuntimeConfig,
  ): Promise<Record<string, unknown>> {
    const url = this.montarUrlProviderOficial(path, runtime);
    const timeout = this.getPositiveIntFromEnv(
      ENV_FISCAL_OFFICIAL_TIMEOUT_MS,
      DEFAULT_FISCAL_OFFICIAL_TIMEOUT_MS,
    );
    const maxRetries = this.getNonNegativeIntFromEnv(
      ENV_FISCAL_OFFICIAL_MAX_RETRIES,
      DEFAULT_FISCAL_OFFICIAL_MAX_RETRIES,
    );
    const retryDelayMs = this.getPositiveIntFromEnv(
      ENV_FISCAL_OFFICIAL_RETRY_DELAY_MS,
      DEFAULT_FISCAL_OFFICIAL_RETRY_DELAY_MS,
    );
    const token = runtime.officialApiToken;
    const correlationHeader = runtime.officialCorrelationHeader;
    const correlationId = this.gerarCorrelationId();

    for (let tentativa = 0; tentativa <= maxRetries; tentativa += 1) {
      try {
        const response = await axios.request({
          method,
          url,
          timeout,
          headers: {
            'Content-Type': 'application/json',
            [correlationHeader]: correlationId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          ...(method === 'GET' ? { params: payload } : { data: payload }),
        });

        const responsePayload = this.toObject(response.data);
        const responseHeaders = this.toObject(response.headers);
        const requestId = this.extrairHeaderTexto(responseHeaders, [
          'x-request-id',
          'request-id',
          'x-id-request',
          'x-correlation-id',
          'correlation-id',
        ]);

        return {
          ...responsePayload,
          __audit: {
            operacao,
            method,
            path: path.startsWith('/') ? path : `/${path}`,
            httpStatus: Number.isFinite(response.status) ? Number(response.status) : null,
            requestId,
            correlationId,
          },
        };
      } catch (error) {
        const axiosError = error as {
          message?: string;
          code?: string;
          response?: {
            data?: unknown;
            status?: number;
            headers?: Record<string, unknown>;
          };
        };
        const statusCode = axiosError.response?.status;
        const detalhe = this.toNullableString(
          this.toNullableString(
            (axiosError.response?.data as Record<string, unknown> | undefined)?.message,
          ) ||
            this.toNullableString((axiosError.response?.data as Record<string, unknown> | undefined)?.erro) ||
            axiosError.message,
        );

        const podeTentarNovamente =
          tentativa < maxRetries &&
          this.deveRepetirChamadaFiscal(statusCode, axiosError.code, detalhe);

        if (podeTentarNovamente) {
          const retryAfterMs = this.obterRetryAfterMs(axiosError.response?.headers);
          const delay = retryAfterMs ?? retryDelayMs * (tentativa + 1);
          await this.sleep(delay);
          continue;
        }

        throw new BadRequestException(
          `Falha na ${operacao} com provider fiscal oficial${statusCode ? ` (HTTP ${statusCode})` : ''}: ${detalhe || 'erro nao detalhado'}.`,
        );
      }
    }

    throw new BadRequestException(`Falha na ${operacao} com provider fiscal oficial: erro desconhecido.`);
  }

  private mapearRetornoProviderFiscal(response: Record<string, unknown>): ProviderFiscalMutationResult {
    const envelope = this.toObject(response);
    const payload = this.extrairPayloadProvider(envelope);
    const rawAudit = this.toObject(envelope.__audit);
    const codigoRetorno = this.toNullableString(
      this.extrairCampoProvider(
        payload,
        ENV_FISCAL_OFFICIAL_RESPONSE_CODE_KEYS,
        ['codigoRetorno', 'codigo', 'code', 'statusCode'],
      ),
    );
    const statusBruto = this.toNullableString(
      this.extrairCampoProvider(
        payload,
        ENV_FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS,
        ['status', 'situacao', 'state', 'resultado', 'statusDocumento', 'fiscalStatus'],
      ),
    );
    const status =
      this.normalizarStatusFiscalOptional(
        statusBruto ||
          this.extrairCampoProvider(
            payload,
            ENV_FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS,
            ['status', 'situacao', 'state', 'resultado', 'statusDocumento', 'fiscalStatus'],
          ),
      ) || this.normalizarStatusFiscalPorCodigoRetorno(codigoRetorno);

    const payloadHash = createHash('sha256')
      .update(JSON.stringify(payload || {}))
      .digest('hex');
    const audit: ProviderFiscalAuditMetadata = {
      operacao: this.toNullableString(rawAudit.operacao),
      method: this.toProviderHttpMethod(rawAudit.method),
      path: this.toNullableString(rawAudit.path),
      httpStatus: this.toNullableNumber(rawAudit.httpStatus),
      requestId: this.toNullableString(rawAudit.requestId),
      correlationId: this.toNullableString(rawAudit.correlationId),
      providerStatusBruto: statusBruto,
      providerCodigoBruto: codigoRetorno,
      payloadHash,
    };

    return {
      status: status || undefined,
      numeroDocumento: this.toNullableString(
        this.extrairCampoProvider(
          payload,
          ENV_FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS,
          ['numeroDocumento', 'numero', 'documentNumber', 'invoiceNumber'],
        ),
      ),
      serie: this.toNullableString(
        this.extrairCampoProvider(payload, ENV_FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS, ['serie', 'series']),
      ),
      chaveAcesso: this.toNullableString(
        this.extrairCampoProvider(
          payload,
          ENV_FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS,
          ['chaveAcesso', 'chave', 'accessKey', 'chave_acesso'],
        ),
      ),
      protocolo: this.toNullableString(
        this.extrairCampoProvider(
          payload,
          ENV_FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS,
          ['protocolo', 'protocol', 'authorizationProtocol'],
        ),
      ),
      loteId: this.toNullableString(
        this.extrairCampoProvider(payload, ENV_FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS, ['loteId', 'lote', 'batchId']),
      ),
      mensagem: this.toNullableString(
        this.extrairCampoProvider(
          payload,
          ENV_FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS,
          ['mensagem', 'message', 'descricao', 'detail', 'details'],
        ),
      ),
      codigoRetorno,
      referenciaExterna: this.toNullableString(
        this.extrairCampoProvider(
          payload,
          ENV_FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS,
          ['referenciaExterna', 'externalReference', 'external_reference'],
        ),
      ),
      audit: this.isAuditMetadataVazia(audit) ? undefined : audit,
    };
  }

  private extrairCampoProvider(
    payload: Record<string, unknown>,
    envName: string,
    fallbackPaths: string[],
  ): unknown {
    const paths = this.getProviderResponsePathsFromEnv(envName, fallbackPaths);
    for (const path of paths) {
      const value = this.extrairValorPorPath(payload, path);
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value === 'string') {
        if (value.trim()) {
          return value;
        }
        continue;
      }
      return value;
    }

    return undefined;
  }

  private getProviderResponsePathsFromEnv(envName: string, fallbackPaths: string[]): string[] {
    const raw = String(process.env[envName] || '').trim();
    if (!raw) {
      return fallbackPaths;
    }

    const custom = raw
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    return custom.length > 0 ? custom : fallbackPaths;
  }

  private extrairValorPorPath(source: Record<string, unknown>, path: string): unknown {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) {
      return undefined;
    }

    if (!normalizedPath.includes('.')) {
      return source[normalizedPath];
    }

    const segments = normalizedPath
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return undefined;
    }

    let current: unknown = source;
    for (const segment of segments) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  private validarContratoRetornoProviderOficial(
    operacao: 'emissao' | 'status' | 'operacao_final',
    retorno: ProviderFiscalMutationResult | null,
  ): void {
    if (!retorno) {
      return;
    }

    const strict = this.booleanFromEnv(ENV_FISCAL_OFFICIAL_STRICT_RESPONSE);
    const temSinalDeStatus = !!(retorno.status || retorno.codigoRetorno);
    const audit = retorno.audit;
    const contexto =
      audit?.requestId || audit?.correlationId
        ? ` (requestId=${audit?.requestId || 'n/a'}, correlationId=${audit?.correlationId || 'n/a'})`
        : '';

    if (!temSinalDeStatus) {
      const mensagem =
        `Retorno do provider fiscal oficial sem status/codigo na operacao ${operacao}${contexto}.`;
      if (strict) {
        throw new BadRequestException(`Retorno do provider fiscal oficial fora do contrato: ${mensagem}`);
      }
      this.logger.warn(mensagem);
    }

    if (operacao !== 'emissao') {
      return;
    }

    const temIdentificacaoDocumento = !!(
      retorno.numeroDocumento ||
      retorno.chaveAcesso ||
      retorno.protocolo ||
      retorno.referenciaExterna
    );

    if (!temIdentificacaoDocumento) {
      const mensagem =
        `Retorno do provider fiscal oficial na emissao sem identificacao de documento${contexto}.`;
      if (strict) {
        throw new BadRequestException(`Retorno do provider fiscal oficial fora do contrato: ${mensagem}`);
      }
      this.logger.warn(mensagem);
    }
  }

  private extrairPayloadProvider(response: Record<string, unknown>): Record<string, unknown> {
    const rootPaths = this.getProviderResponsePathsFromEnv(
      ENV_FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS,
      ['result', 'data', 'documento'],
    );

    for (const rootPath of rootPaths) {
      const normalized = String(rootPath || '').trim().toLowerCase();
      if (['root', '.', '$'].includes(normalized)) {
        return response;
      }

      const candidate = this.extrairValorPorPath(response, rootPath);
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }

    return response;
  }

  private montarUrlProviderOficial(path: string, runtime: FiscalRuntimeConfig): string {
    const baseUrl = runtime.officialBaseUrl;
    if (!baseUrl) {
      throw new BadRequestException(
        'Integracao fiscal oficial sem base URL configurada (FISCAL_OFFICIAL_BASE_URL).',
      );
    }

    return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private montarMensagemConectividadeFiscal(success: boolean, httpStatus: number | null): string {
    if (success) {
      return 'Conectividade validada com sucesso com o provider fiscal oficial.';
    }

    if (httpStatus === 401 || httpStatus === 403) {
      return `Provider respondeu (HTTP ${httpStatus}), mas recusou autenticacao/token.`;
    }

    if (httpStatus === 404) {
      return `Provider respondeu (HTTP 404), mas o endpoint de health nao foi encontrado. Revise ${ENV_FISCAL_OFFICIAL_HEALTH_PATH}.`;
    }

    if (httpStatus !== null && httpStatus >= 500) {
      return `Provider respondeu com erro interno (HTTP ${httpStatus}).`;
    }

    if (httpStatus !== null) {
      return `Provider respondeu com HTTP ${httpStatus}.`;
    }

    return 'Provider nao respondeu ao teste de conectividade.';
  }

  private getPathFromEnv(envName: string, fallback: string): string {
    return this.toNullableString(process.env[envName]) || fallback;
  }

  private getHttpMethodFromEnv(envName: string, fallback: ProviderHttpMethod): ProviderHttpMethod {
    const raw = String(process.env[envName] || '')
      .trim()
      .toUpperCase();

    if (FISCAL_HTTP_METHODS.includes(raw as ProviderHttpMethod)) {
      return raw as ProviderHttpMethod;
    }

    return fallback;
  }

  private toProviderHttpMethod(value: unknown): ProviderHttpMethod | null {
    const raw = String(value || '')
      .trim()
      .toUpperCase();

    if (!raw) {
      return null;
    }

    return FISCAL_HTTP_METHODS.includes(raw as ProviderHttpMethod)
      ? (raw as ProviderHttpMethod)
      : null;
  }

  private toNullableNumber(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed;
  }

  private isAuditMetadataVazia(value: ProviderFiscalAuditMetadata): boolean {
    return !(
      value.operacao ||
      value.method ||
      value.path ||
      (value.httpStatus !== null && value.httpStatus !== undefined) ||
      value.requestId ||
      value.correlationId ||
      value.providerStatusBruto ||
      value.providerCodigoBruto ||
      value.payloadHash
    );
  }

  private extrairHeaderTexto(headers: Record<string, unknown>, nomes: string[]): string | null {
    if (!headers || typeof headers !== 'object') {
      return null;
    }

    for (const nome of nomes) {
      const lower = nome.toLowerCase();
      const valorDireto = headers[nome] ?? headers[lower];

      if (Array.isArray(valorDireto)) {
        const first = this.toNullableString(valorDireto[0]);
        if (first) {
          return first;
        }
      } else {
        const str = this.toNullableString(valorDireto);
        if (str) {
          return str;
        }
      }

      const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lower);
      if (!entry) {
        continue;
      }

      const value = entry[1];
      if (Array.isArray(value)) {
        const first = this.toNullableString(value[0]);
        if (first) {
          return first;
        }
      } else {
        const str = this.toNullableString(value);
        if (str) {
          return str;
        }
      }
    }

    return null;
  }

  private gerarCorrelationId(): string {
    return `fiscal-${Date.now()}-${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }

  private booleanFromEnv(envName: string): boolean {
    const valor = String(process.env[envName] || '')
      .trim()
      .toLowerCase();
    return ['1', 'true', 'yes', 'sim'].includes(valor);
  }

  private hasEnvSetting(envName: string): boolean {
    const raw = process.env[envName];
    if (raw === undefined || raw === null) {
      return false;
    }
    return String(raw).trim().length > 0;
  }

  private getPositiveIntFromEnv(envName: string, fallback: number): number {
    const raw = Number(process.env[envName]);
    if (!Number.isFinite(raw) || raw <= 0) {
      return fallback;
    }
    return Math.floor(raw);
  }

  private getNonNegativeIntFromEnv(envName: string, fallback: number): number {
    const raw = Number(process.env[envName]);
    if (!Number.isFinite(raw) || raw < 0) {
      return fallback;
    }
    return Math.floor(raw);
  }

  private deveRepetirChamadaFiscal(
    statusCode?: number,
    errorCode?: string,
    detalhe?: string | null,
  ): boolean {
    const transientHttpStatus = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
    if (statusCode && transientHttpStatus.has(statusCode)) {
      return true;
    }

    const transientCodes = new Set([
      'ECONNABORTED',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'EAI_AGAIN',
      'ERR_NETWORK',
    ]);
    if (errorCode && transientCodes.has(String(errorCode).toUpperCase())) {
      return true;
    }

    if (!statusCode && detalhe) {
      const texto = detalhe.toLowerCase();
      return texto.includes('timeout') || texto.includes('network') || texto.includes('temporar');
    }

    return false;
  }

  private obterRetryAfterMs(headers?: Record<string, unknown>): number | null {
    if (!headers || typeof headers !== 'object') {
      return null;
    }

    const retryAfterRaw =
      headers['retry-after'] ||
      headers['Retry-After'] ||
      headers['x-retry-after'] ||
      headers['X-Retry-After'];

    if (!retryAfterRaw) {
      return null;
    }

    const value = String(retryAfterRaw).trim();
    if (!value) {
      return null;
    }

    const asSeconds = Number(value);
    if (Number.isFinite(asSeconds) && asSeconds > 0) {
      return Math.floor(asSeconds * 1000);
    }

    const asDate = Date.parse(value);
    if (Number.isFinite(asDate)) {
      const diff = asDate - Date.now();
      if (diff > 0) {
        return diff;
      }
    }

    return null;
  }

  private async sleep(ms: number): Promise<void> {
    const delay = Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : 0;
    if (delay <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private validarAssinaturaWebhookFiscal(
    payload: Record<string, unknown>,
    signatureHeader: string,
    tenantWebhookSecret?: string | null,
    tenantAllowInsecure?: boolean | null,
  ): void {
    const secret =
      this.toNullableString(tenantWebhookSecret) ||
      this.toNullableString(process.env[ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET]);
    const allowInsecure =
      this.toNullableBoolean(tenantAllowInsecure) ??
      this.booleanFromEnv(ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE);

    if (!secret) {
      if (allowInsecure) {
        return;
      }
      throw new UnauthorizedException(
        `Webhook fiscal rejeitado: configure ${ENV_FISCAL_OFFICIAL_WEBHOOK_SECRET} ou habilite ${ENV_FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE}=true somente em ambiente controlado.`,
      );
    }

    const assinatura = String(signatureHeader || '').trim();
    if (!assinatura) {
      throw new UnauthorizedException('Webhook fiscal rejeitado: assinatura ausente.');
    }

    const expectedHash = createHmac('sha256', secret).update(JSON.stringify(payload || {})).digest('hex');
    const candidates = this.extractSignatureCandidates(assinatura);

    const valid = candidates.some((candidate) => this.safeCompare(candidate, expectedHash));
    if (!valid) {
      throw new UnauthorizedException('Webhook fiscal rejeitado: assinatura invalida.');
    }
  }

  private extractSignatureCandidates(signatureHeader: string): string[] {
    const trimmed = String(signatureHeader || '').trim();
    if (!trimmed) {
      return [];
    }

    const candidates: string[] = [];

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((part) => part.trim());
      const v1 = parts.find((part) => part.startsWith('v1='))?.slice(3);
      if (v1) {
        candidates.push(v1);
      }
    }

    if (trimmed.startsWith('sha256=')) {
      candidates.push(trimmed.slice(7));
    } else {
      candidates.push(trimmed);
    }

    return candidates.filter((item) => !!item && /^[a-f0-9]+$/i.test(item));
  }

  private safeCompare(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(String(received || ''), 'utf8');
    const expectedBuffer = Buffer.from(String(expected || ''), 'utf8');

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  }

  private resolveWebhookFiscalEventKey(
    empresaId: string,
    payload: Record<string, unknown>,
    headers: FiscalWebhookHeaders,
  ): string {
    const sections = this.webhookPayloadSections(payload);
    const rawCandidate =
      this.toNullableString(headers.idempotencyKey) ||
      this.toNullableString(headers.eventId) ||
      this.firstStringFromSections(sections, ['eventId', 'event_id', 'id', 'event']) ||
      this.firstStringFromSections(sections, ['chaveEvento', 'chave_evento']);

    if (rawCandidate) {
      return rawCandidate.slice(0, 180);
    }

    return createHash('sha256')
      .update(`${empresaId}:${JSON.stringify(payload || {})}`)
      .digest('hex');
  }

  private resolveWebhookFiscalCorrelationId(
    payload: Record<string, unknown>,
    headers: FiscalWebhookHeaders,
    fallback: string,
  ): string {
    const sections = this.webhookPayloadSections(payload);
    return (
      this.toNullableString(headers.correlationId) ||
      this.firstStringFromSections(sections, ['correlationId', 'correlation_id']) ||
      fallback
    ).slice(0, 180);
  }

  private async resolverFaturaDoWebhookFiscal(
    empresaId: string,
    payload: Record<string, unknown>,
  ): Promise<Fatura | null> {
    const sections = this.webhookPayloadSections(payload);
    const faturaId = this.firstNumberFromSections(sections, [
      'faturaId',
      'fatura_id',
      'invoiceId',
      'invoice_id',
      'idFatura',
      'id_fatura',
    ]);

    if (faturaId) {
      return this.carregarFaturaSafely(faturaId, empresaId);
    }

    const referenciaExterna = this.firstStringFromSections(sections, [
      'referenciaExterna',
      'referencia_externa',
      'externalReference',
      'external_reference',
      'ref',
      'reference',
    ]);
    const faturaIdDaReferencia = this.extrairIdFaturaDaReferenciaExterna(referenciaExterna);
    if (faturaIdDaReferencia) {
      return this.carregarFaturaSafely(faturaIdDaReferencia, empresaId);
    }

    return null;
  }

  private async carregarFaturaSafely(faturaId: number, empresaId: string): Promise<Fatura | null> {
    try {
      return await this.carregarFatura(faturaId, empresaId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }

  private extrairIdFaturaDaReferenciaExterna(referencia?: string | null): number | null {
    const raw = this.toNullableString(referencia);
    if (!raw) {
      return null;
    }

    const pattern = /(?:NFE|NFSE)-REF-(\d+)-/i;
    const match = raw.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  private webhookPayloadSections(payload: Record<string, unknown>): Record<string, unknown>[] {
    const root = this.toObject(payload);
    const data = this.toObject(root.data);
    const result = this.toObject(root.result);
    const documento = this.toObject(root.documento);
    return [root, data, result, documento];
  }

  private firstStringFromSections(
    sections: Record<string, unknown>[],
    keys: string[],
  ): string | null {
    for (const section of sections) {
      for (const key of keys) {
        const value = this.toNullableString(section[key]);
        if (value) {
          return value;
        }
      }
    }
    return null;
  }

  private firstNumberFromSections(
    sections: Record<string, unknown>[],
    keys: string[],
  ): number | null {
    const raw = this.firstStringFromSections(sections, keys);
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private toObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private toNullableString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private toNullableBoolean(value: unknown): boolean | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (['1', 'true', 'yes', 'sim'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'nao', 'não'].includes(normalized)) {
      return false;
    }

    return null;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundMoney(value: unknown): number {
    const amount = this.toNumber(value);
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }
}
