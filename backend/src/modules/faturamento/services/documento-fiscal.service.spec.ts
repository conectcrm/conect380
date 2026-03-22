import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'crypto';
import { DocumentoFiscalService } from './documento-fiscal.service';
import { Fatura, StatusFatura, TipoFatura } from '../entities/fatura.entity';

function createInMemoryRepositories() {
  const faturas: any[] = [];
  const itens: any[] = [];

  const faturaRepository = {
    findOne: jest.fn(async ({ where }: any) => {
      return (
        faturas.find(
          (fatura) =>
            fatura.id === where?.id &&
            fatura.empresaId === where?.empresaId &&
            fatura.ativo === where?.ativo,
        ) || null
      );
    }),
    save: jest.fn(async (entity: any) => {
      const idx = faturas.findIndex((item) => item.id === entity.id);
      if (idx >= 0) {
        faturas[idx] = entity;
      } else {
        faturas.push(entity);
      }
      return entity;
    }),
  };

  const itemRepository = {
    find: jest.fn(async ({ where }: any) =>
      itens.filter((item) => item.faturaId === where?.faturaId),
    ),
  };

  return {
    faturas,
    itens,
    faturaRepository,
    itemRepository,
  };
}

function criarFaturaBase(): Fatura {
  return {
    id: 101,
    numero: 'FT2026000101',
    empresaId: 'empresa-teste',
    contratoId: 50,
    clienteId: '2fd6c389-1cc7-4760-8f74-8f6908eb6f1e',
    usuarioResponsavelId: 'ea0a1e8a-1816-45aa-9ca6-30f9426de89a',
    tipo: TipoFatura.UNICA,
    status: StatusFatura.PENDENTE,
    descricao: 'Fatura para teste fiscal',
    valorTotal: 1120,
    valorPago: 0,
    valorDesconto: 0,
    valorImpostos: 120,
    percentualImpostos: 12,
    diasCarenciaJuros: 0,
    percentualJuros: 0,
    percentualMulta: 0,
    valorJuros: 0,
    valorMulta: 0,
    dataEmissao: new Date('2026-03-20T00:00:00Z'),
    dataVencimento: new Date('2026-04-20T00:00:00Z'),
    dataPagamento: null as any,
    observacoes: null as any,
    linkPagamento: null as any,
    qrCodePix: null as any,
    codigoBoleto: null as any,
    metadados: null as any,
    detalhesTributarios: null,
    itens: [],
    pagamentos: [],
    ativo: true,
    createdAt: new Date('2026-03-20T00:00:00Z'),
    updatedAt: new Date('2026-03-20T00:00:00Z'),
    empresa: null as any,
    contrato: null as any,
    cliente: null as any,
    usuarioResponsavel: null as any,
    formaPagamentoPreferida: null as any,
    isPaga: () => false,
    isVencida: () => false,
    getValorRestante: () => 0,
    getValorComJurosMulta: () => 0,
    getDiasAtraso: () => 0,
    getPercentualPago: () => 0,
  } as Fatura;
}

describe('DocumentoFiscalService', () => {
  it('deve aplicar configuracao fiscal por empresa (multi-CNPJ) sobre o fallback global', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;

    process.env.FISCAL_PROVIDER = 'fiscal_stub_local';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'false';
    process.env.FISCAL_OFFICIAL_BASE_URL = '';
    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = '';

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const empresaConfigRepository = {
        findOne: jest.fn(async ({ where }: any) => {
          if (where?.empresaId !== 'empresa-teste') {
            return null;
          }
          return {
            empresaId: 'empresa-teste',
            fiscalProvider: 'fiscal_oficial',
            fiscalOfficialHttpEnabled: true,
            fiscalOfficialBaseUrl: 'https://tenant-provider-fiscal.local',
            fiscalOfficialApiToken: 'tenant-token',
            fiscalOfficialWebhookSecret: 'tenant-webhook-secret',
          };
        }),
      };

      const service = new DocumentoFiscalService(
        faturaRepository as any,
        itemRepository as any,
        empresaConfigRepository as any,
      );

      const diagnostico = await service.obterDiagnosticoConfiguracaoFiscalPorEmpresa(
        'empresa-teste',
      );

      expect(empresaConfigRepository.findOne).toHaveBeenCalledTimes(1);
      expect(diagnostico.providerEfetivo).toBe('fiscal_oficial');
      expect(diagnostico.officialProviderSelected).toBe(true);
      expect(diagnostico.officialHttpEnabled).toBe(true);
      expect(diagnostico.officialBaseUrlConfigured).toBe(true);
      expect(diagnostico.webhookSecretConfigured).toBe(true);
      expect(diagnostico.readyForOfficialEmission).toBe(true);
      expect(diagnostico.blockers).toHaveLength(0);
      expect(diagnostico.configurationSources.provider).toBe('tenant');
      expect(diagnostico.configurationSources.officialBaseUrl).toBe('tenant');
      expect(diagnostico.usingGlobalFallback).toBe(true);
    } finally {
      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
    }
  });

  it('deve aplicar overrides avancados por empresa no runtime fiscal', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalCorrelationHeader = process.env.FISCAL_OFFICIAL_CORRELATION_HEADER;
    const originalWebhookAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
    const originalStrictResponse = process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://global-provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_CORRELATION_HEADER = 'X-CID-GLOBAL';
    process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'false';
    process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = 'true';
    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = '';

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const empresaConfigRepository = {
        findOne: jest.fn(async () => ({
          empresaId: 'empresa-teste',
          fiscalProvider: 'fiscal_stub_local',
          fiscalRequireOfficialProvider: false,
          fiscalOfficialHttpEnabled: true,
          fiscalOfficialBaseUrl: 'https://tenant-provider-fiscal.local',
          fiscalOfficialStrictResponse: false,
          fiscalOfficialWebhookAllowInsecure: true,
          fiscalOfficialCorrelationHeader: 'X-CID-TENANT',
        })),
      };

      const service = new DocumentoFiscalService(
        faturaRepository as any,
        itemRepository as any,
        empresaConfigRepository as any,
      );

      const diagnostico = await service.obterDiagnosticoConfiguracaoFiscalPorEmpresa(
        'empresa-teste',
      );

      expect(diagnostico.providerEfetivo).toBe('fiscal_stub_local');
      expect(diagnostico.requireOfficialProvider).toBe(false);
      expect(diagnostico.officialStrictResponse).toBe(false);
      expect(diagnostico.webhookAllowInsecure).toBe(true);
      expect(diagnostico.officialCorrelationHeader).toBe('X-CID-TENANT');
      expect(diagnostico.blockers).toHaveLength(0);
      expect(diagnostico.warnings.some((item) => item.includes('WEBHOOK_ALLOW_INSECURE'))).toBe(
        true,
      );
    } finally {
      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalCorrelationHeader === undefined) {
        delete process.env.FISCAL_OFFICIAL_CORRELATION_HEADER;
      } else {
        process.env.FISCAL_OFFICIAL_CORRELATION_HEADER = originalCorrelationHeader;
      }
      if (originalWebhookAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalWebhookAllowInsecure;
      }
      if (originalStrictResponse === undefined) {
        delete process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
      } else {
        process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = originalStrictResponse;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
    }
  });

  it('deve usar fallback de ambiente quando empresa nao possuir configuracao fiscal dedicada', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://global-provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'global-webhook-secret';

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const empresaConfigRepository = {
        findOne: jest.fn(async () => null),
      };

      const service = new DocumentoFiscalService(
        faturaRepository as any,
        itemRepository as any,
        empresaConfigRepository as any,
      );

      const diagnostico = await service.obterDiagnosticoConfiguracaoFiscalPorEmpresa(
        'empresa-sem-config',
      );

      expect(empresaConfigRepository.findOne).toHaveBeenCalledTimes(1);
      expect(diagnostico.providerEfetivo).toBe('fiscal_oficial');
      expect(diagnostico.officialHttpEnabled).toBe(true);
      expect(diagnostico.officialBaseUrlConfigured).toBe(true);
      expect(diagnostico.officialProviderSelected).toBe(true);
      expect(diagnostico.readyForOfficialEmission).toBe(true);
      expect(diagnostico.configurationSources.provider).toBe('env');
      expect(diagnostico.configurationSources.officialBaseUrl).toBe('env');
    } finally {
      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
    }
  });

  it('deve retornar diagnostico de configuracao fiscal sem expor segredos', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalCorrelationHeader = process.env.FISCAL_OFFICIAL_CORRELATION_HEADER;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalWebhookAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
    const originalStrictResponse = process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
    const originalRootPaths = process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS;
    const originalStatusKeys = process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_CORRELATION_HEADER = 'X-CID';
    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'super-secret';
    process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'false';
    process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = 'true';
    process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS = 'data.retorno';
    process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS = 'retorno.situacaoFiscal';

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const diagnostico = service.obterDiagnosticoConfiguracaoFiscal();

      expect(diagnostico.providerEfetivo).toBe('fiscal_oficial');
      expect(diagnostico.officialProviderSelected).toBe(true);
      expect(diagnostico.readyForOfficialEmission).toBe(true);
      expect(diagnostico.requireOfficialProvider).toBe(true);
      expect(diagnostico.officialHttpEnabled).toBe(true);
      expect(diagnostico.officialBaseUrlConfigured).toBe(true);
      expect(diagnostico.officialCorrelationHeader).toBe('X-CID');
      expect(diagnostico.webhookSecretConfigured).toBe(true);
      expect(diagnostico.webhookAllowInsecure).toBe(false);
      expect(diagnostico.responseRootPaths).toEqual(['data.retorno']);
      expect(diagnostico.responseAliases.status).toEqual(['retorno.situacaoFiscal']);
      expect(diagnostico.blockers).toHaveLength(0);
      expect(diagnostico.warnings).toHaveLength(0);
      expect(diagnostico.recommendations.length).toBeGreaterThan(0);
    } finally {
      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalCorrelationHeader === undefined) {
        delete process.env.FISCAL_OFFICIAL_CORRELATION_HEADER;
      } else {
        process.env.FISCAL_OFFICIAL_CORRELATION_HEADER = originalCorrelationHeader;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
      if (originalWebhookAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalWebhookAllowInsecure;
      }
      if (originalStrictResponse === undefined) {
        delete process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
      } else {
        process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = originalStrictResponse;
      }
      if (originalRootPaths === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS = originalRootPaths;
      }
      if (originalStatusKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS = originalStatusKeys;
      }
    }
  });

  it('deve sinalizar bloqueios quando provider oficial obrigatorio estiver incompleto', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalWebhookAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    process.env.FISCAL_PROVIDER = 'fiscal_stub_local';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'false';
    delete process.env.FISCAL_OFFICIAL_BASE_URL;
    delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'false';

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const diagnostico = service.obterDiagnosticoConfiguracaoFiscal();

      expect(diagnostico.readyForOfficialEmission).toBe(false);
      expect(diagnostico.officialProviderSelected).toBe(false);
      expect(diagnostico.blockers.length).toBeGreaterThan(0);
      expect(
        diagnostico.blockers.some((item) => item.includes('FISCAL_PROVIDER')),
      ).toBe(true);
      expect(
        diagnostico.blockers.some((item) => item.includes('FISCAL_OFFICIAL_HTTP_ENABLED')),
      ).toBe(true);
      expect(
        diagnostico.blockers.some((item) => item.includes('FISCAL_OFFICIAL_BASE_URL')),
      ).toBe(true);
    } finally {
      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
      if (originalWebhookAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalWebhookAllowInsecure;
      }
    }
  });

  it('nao deve tentar conectividade quando provider oficial nao esta selecionado', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_PROVIDER = 'fiscal_stub_local';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    const axiosSpy = jest.spyOn(axios, 'request');

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const resultado = await service.testarConectividadeProviderFiscal('empresa-teste');

      expect(resultado.attempted).toBe(false);
      expect(resultado.reachable).toBe(false);
      expect(resultado.success).toBe(false);
      expect(resultado.message).toContain('nao esta selecionado');
      expect(axiosSpy).not.toHaveBeenCalled();
    } finally {
      axiosSpy.mockRestore();

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve testar conectividade oficial com sucesso quando provider responder HTTP 200', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalHealthPath = process.env.FISCAL_OFFICIAL_HEALTH_PATH;
    const originalHealthMethod = process.env.FISCAL_OFFICIAL_HEALTH_METHOD;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_HEALTH_PATH = '/status';
    process.env.FISCAL_OFFICIAL_HEALTH_METHOD = 'GET';

    const axiosSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: { ok: true },
      headers: { 'x-request-id': 'req-123' },
    } as any);

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const resultado = await service.testarConectividadeProviderFiscal('empresa-teste');

      expect(resultado.attempted).toBe(true);
      expect(resultado.reachable).toBe(true);
      expect(resultado.success).toBe(true);
      expect(resultado.httpStatus).toBe(200);
      expect(resultado.requestId).toBe('req-123');
      expect(resultado.endpoint).toBe('https://provider-fiscal.local/status');
      expect(resultado.message).toContain('Conectividade validada com sucesso');
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    } finally {
      axiosSpy.mockRestore();

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalHealthPath === undefined) {
        delete process.env.FISCAL_OFFICIAL_HEALTH_PATH;
      } else {
        process.env.FISCAL_OFFICIAL_HEALTH_PATH = originalHealthPath;
      }
      if (originalHealthMethod === undefined) {
        delete process.env.FISCAL_OFFICIAL_HEALTH_METHOD;
      } else {
        process.env.FISCAL_OFFICIAL_HEALTH_METHOD = originalHealthMethod;
      }
    }
  });

  it('deve reportar conectividade sem sucesso quando provider responder 401', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    const axiosSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 401,
      data: { message: 'unauthorized' },
      headers: {},
    } as any);

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const resultado = await service.testarConectividadeProviderFiscal('empresa-teste');

      expect(resultado.attempted).toBe(true);
      expect(resultado.reachable).toBe(true);
      expect(resultado.success).toBe(false);
      expect(resultado.httpStatus).toBe(401);
      expect(resultado.message).toContain('recusou autenticacao');
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    } finally {
      axiosSpy.mockRestore();

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve retornar preflight com status ok quando configuracao e conectividade estiverem validas', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalStrictResponse = process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'secret-webhook-fiscal';
    process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = 'true';

    const axiosSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: { ok: true },
      headers: {},
    } as any);

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const resultado = await service.executarPreflightFiscal('empresa-teste');

      expect(resultado.status).toBe('ok');
      expect(resultado.readyForOfficialEmission).toBe(true);
      expect(resultado.blockers).toHaveLength(0);
      expect(resultado.warnings).toHaveLength(0);
      expect(resultado.conectividade.success).toBe(true);
      expect(resultado.configuracao.readyForOfficialEmission).toBe(true);
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    } finally {
      axiosSpy.mockRestore();

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
      if (originalStrictResponse === undefined) {
        delete process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
      } else {
        process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = originalStrictResponse;
      }
    }
  });

  it('deve retornar preflight com bloqueio quando conectividade falhar', async () => {
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalWebhookSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;

    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'secret-webhook-fiscal';

    const axiosSpy = jest.spyOn(axios, 'request').mockRejectedValue({
      response: { status: 503, data: { message: 'indisponivel' } },
      message: 'indisponivel',
    });

    try {
      const { faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const resultado = await service.executarPreflightFiscal('empresa-teste');

      expect(resultado.status).toBe('bloqueio');
      expect(resultado.readyForOfficialEmission).toBe(false);
      expect(resultado.blockers.length).toBeGreaterThan(0);
      expect(resultado.blockers.some((item) => item.includes('Falha de conectividade'))).toBe(true);
      expect(resultado.conectividade.success).toBe(false);
      expect(axiosSpy).toHaveBeenCalled();
    } finally {
      axiosSpy.mockRestore();

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }
      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }
      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
      if (originalWebhookSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalWebhookSecret;
      }
    }
  });

  it('deve criar rascunho fiscal padrao para NFSe', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico de implementacao',
      quantidade: 1,
      valorUnitario: 1000,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'SV-001',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.criarRascunho(
      fatura.id,
      fatura.empresaId,
      { observacoes: 'Preparar para emissao' },
      'usuario-1',
    );

    expect(status.status).toBe('rascunho');
    expect(status.tipo).toBe('nfse');
    expect(status.ambiente).toBe('homologacao');
    expect(status.ultimaMensagem).toBe('Preparar para emissao');
    expect(status.historico.length).toBe(1);
  });

  it('deve emitir documento fiscal e preencher numero/chave/protocolo', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfe',
      },
      fiscal: {
        status: 'rascunho',
      },
    };
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Produto',
      quantidade: 2,
      valorUnitario: 500,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'PRD-001',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.emitir(
      fatura.id,
      fatura.empresaId,
      { ambiente: 'homologacao' },
      'usuario-2',
    );

    expect(status.status).toBe('emitida');
    expect(status.tipo).toBe('nfe');
    expect(status.numeroDocumento).toContain('NFE-');
    expect((status.chaveAcesso || '').length).toBeGreaterThanOrEqual(44);
    expect((status.protocolo || '').startsWith('PRT-')).toBe(true);
  });

  it('deve bloquear emissao quando a fatura estiver cancelada', async () => {
    const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.status = StatusFatura.CANCELADA;
    faturas.push(fatura);

    await expect(service.emitir(fatura.id, fatura.empresaId, {}, 'usuario-3')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deve bloquear emissao com provider stub quando ambiente exige provider oficial', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    delete process.env.FISCAL_PROVIDER;
    delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    delete process.env.FISCAL_OFFICIAL_BASE_URL;

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: {
          tipo: 'nfse',
        },
        fiscal: {
          status: 'rascunho',
          provider: 'fiscal_stub_local',
        },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-200',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      await expect(
        service.emitir(fatura.id, fatura.empresaId, { ambiente: 'homologacao' }, 'usuario-3b'),
      ).rejects.toThrow('configure um provedor fiscal oficial');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve bloquear emissao com provider oficial sem integracao ativa no modo estrito', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    delete process.env.FISCAL_OFFICIAL_BASE_URL;

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: {
          tipo: 'nfse',
        },
        fiscal: {
          status: 'rascunho',
          provider: 'fiscal_oficial',
        },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico oficial',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-OFICIAL-1',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      await expect(
        service.emitir(fatura.id, fatura.empresaId, { ambiente: 'producao' }, 'usuario-3c'),
      ).rejects.toThrow('provedor oficial selecionado sem integracao ativa');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve usar retorno do provider oficial na emissao quando integracao HTTP estiver ativa', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      const providerSpy = jest
        .spyOn(service as any, 'chamarProviderFiscalOficial')
        .mockResolvedValue({
          data: {
            status: 'emitida',
            numeroDocumento: 'NFSE-OFICIAL-2026-000001',
            serie: '55',
            chaveAcesso: '12345678901234567890123456789012345678901234',
            protocolo: 'PRT-OF-0001',
            codigoRetorno: '100',
            referenciaExterna: 'OFFICIAL-REF-1',
            mensagem: 'Documento autorizado pelo provider oficial.',
          },
        });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico provider oficial',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-OFFICIAL-EMIT',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-provider',
      );

      expect(providerSpy).toHaveBeenCalled();
      expect(status.status).toBe('emitida');
      expect(status.numeroDocumento).toBe('NFSE-OFICIAL-2026-000001');
      expect(status.protocolo).toBe('PRT-OF-0001');
      expect(status.codigoRetorno).toBe('100');
      expect(status.referenciaExterna).toBe('OFFICIAL-REF-1');
      expect(status.ultimaMensagem).toContain('provider oficial');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve registrar auditoria de integracao oficial no historico da emissao', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        data: {
          status: 'emitida',
          numeroDocumento: 'NFSE-AUDIT-2026-0001',
          protocolo: 'PRT-AUDIT-0001',
          code: '100',
          message: 'Documento autorizado com trilha de auditoria.',
        },
        __audit: {
          operacao: 'emissao fiscal',
          method: 'POST',
          path: '/documentos/emitir',
          httpStatus: 202,
          requestId: 'req-fiscal-audit-001',
          correlationId: 'cid-fiscal-audit-001',
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico auditoria fiscal',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-AUDIT-OFICIAL',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-auditoria',
      );

      const ultimoEvento = status.historico[status.historico.length - 1];
      const metadata = (ultimoEvento?.metadata || {}) as Record<string, unknown>;
      const audit = (metadata.audit || {}) as Record<string, unknown>;

      expect(ultimoEvento?.acao).toBe('documento_emitido');
      expect(audit.method).toBe('POST');
      expect(audit.path).toBe('/documentos/emitir');
      expect(audit.httpStatus).toBe(202);
      expect(audit.requestId).toBe('req-fiscal-audit-001');
      expect(audit.correlationId).toBe('cid-fiscal-audit-001');
      expect(audit.payloadHash).toEqual(expect.any(String));
      expect(String(audit.payloadHash || '')).toHaveLength(64);
      expect(audit.providerCodigoBruto).toBe('100');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve bloquear emissao com resposta oficial fora do contrato quando modo estrito estiver ativo', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalStrictResponse = process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = 'true';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        data: {
          message: 'Retorno sem status, codigo e identificacao.',
        },
        __audit: {
          operacao: 'emissao fiscal',
          method: 'POST',
          path: '/documentos/emitir',
          httpStatus: 200,
          requestId: 'req-contrato-invalido-001',
          correlationId: 'cid-contrato-invalido-001',
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico contrato invalido',
        quantidade: 1,
        valorUnitario: 900,
        valorTotal: 900,
        unidade: 'un',
        codigoProduto: 'SV-CONTRATO-INVALIDO',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 900,
        calcularValorDesconto: () => 0,
      });

      await expect(
        service.emitir(fatura.id, fatura.empresaId, { ambiente: 'producao' }, 'usuario-contrato'),
      ).rejects.toThrow('fora do contrato');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }

      if (originalStrictResponse === undefined) {
        delete process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
      } else {
        process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = originalStrictResponse;
      }
    }
  });

  it('deve permitir emissao com resposta parcial quando modo estrito estiver desativado', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalStrictResponse = process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = 'false';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        data: {
          message: 'Retorno parcial aceito em homologacao.',
        },
        __audit: {
          operacao: 'emissao fiscal',
          method: 'POST',
          path: '/documentos/emitir',
          httpStatus: 200,
          requestId: 'req-contrato-parcial-001',
          correlationId: 'cid-contrato-parcial-001',
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico contrato parcial',
        quantidade: 1,
        valorUnitario: 850,
        valorTotal: 850,
        unidade: 'un',
        codigoProduto: 'SV-CONTRATO-PARCIAL',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 850,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-contrato-parcial',
      );

      expect(status.status).toBe('emitida');
      expect(status.codigoRetorno).toBe('EMISSAO_AUTORIZADA');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }

      if (originalStrictResponse === undefined) {
        delete process.env.FISCAL_OFFICIAL_STRICT_RESPONSE;
      } else {
        process.env.FISCAL_OFFICIAL_STRICT_RESPONSE = originalStrictResponse;
      }
    }
  });

  it('deve mapear campos do provider oficial usando aliases customizados por env', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalStatusKeys = process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS;
    const originalCodeKeys = process.env.FISCAL_OFFICIAL_RESPONSE_CODE_KEYS;
    const originalNumberKeys = process.env.FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS;
    const originalSerieKeys = process.env.FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS;
    const originalAccessKeyKeys = process.env.FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS;
    const originalProtocolKeys = process.env.FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS;
    const originalBatchKeys = process.env.FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS;
    const originalMessageKeys = process.env.FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS;
    const originalReferenceKeys = process.env.FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS = 'retorno.situacaoFiscal';
    process.env.FISCAL_OFFICIAL_RESPONSE_CODE_KEYS = 'retorno.codRetorno';
    process.env.FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS = 'retorno.numDoc';
    process.env.FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS = 'retorno.serieDoc';
    process.env.FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS = 'retorno.chaveFiscal';
    process.env.FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS = 'retorno.protocoloFiscal';
    process.env.FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS = 'retorno.loteFiscal';
    process.env.FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS = 'retorno.msg';
    process.env.FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS = 'retorno.refExterna';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        data: {
          retorno: {
            situacaoFiscal: 'autorizada',
            codRetorno: '100',
            numDoc: 'NFSE-CUSTOM-0001',
            serieDoc: 'A9',
            chaveFiscal: '12345678901234567890123456789012345678901234',
            protocoloFiscal: 'PRT-CUSTOM-0001',
            loteFiscal: 'LOT-CUSTOM-1',
            msg: 'Autorizada via alias customizado',
            refExterna: 'REF-CUSTOM-1',
          },
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico aliases customizados',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-CUSTOM-ALIAS',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-alias-custom',
      );

      expect(status.status).toBe('emitida');
      expect(status.codigoRetorno).toBe('100');
      expect(status.numeroDocumento).toBe('NFSE-CUSTOM-0001');
      expect(status.serie).toBe('A9');
      expect(status.chaveAcesso).toBe('12345678901234567890123456789012345678901234');
      expect(status.protocolo).toBe('PRT-CUSTOM-0001');
      expect(status.loteId).toBe('LOT-CUSTOM-1');
      expect(status.ultimaMensagem).toContain('alias customizado');
      expect(status.referenciaExterna).toBe('REF-CUSTOM-1');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }

      if (originalStatusKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_STATUS_KEYS = originalStatusKeys;
      }
      if (originalCodeKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_CODE_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_CODE_KEYS = originalCodeKeys;
      }
      if (originalNumberKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_NUMBER_KEYS = originalNumberKeys;
      }
      if (originalSerieKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_SERIE_KEYS = originalSerieKeys;
      }
      if (originalAccessKeyKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_ACCESS_KEY_KEYS = originalAccessKeyKeys;
      }
      if (originalProtocolKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_PROTOCOL_KEYS = originalProtocolKeys;
      }
      if (originalBatchKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_BATCH_KEYS = originalBatchKeys;
      }
      if (originalMessageKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_MESSAGE_KEYS = originalMessageKeys;
      }
      if (originalReferenceKeys === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_REFERENCE_KEYS = originalReferenceKeys;
      }
    }
  });

  it('deve mapear retorno oficial com envelope raiz customizado por env', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalRootPaths = process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS = 'data.payloadFiscal.retorno';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        data: {
          payloadFiscal: {
            retorno: {
              status: 'autorizada',
              codigo: '100',
              numero: 'NFSE-ROOT-0001',
              serie: 'R1',
              chaveAcesso: '12345678901234567890123456789012345678901234',
              protocolo: 'PRT-ROOT-0001',
              loteId: 'LOT-ROOT-1',
              mensagem: 'Autorizada em envelope profundo',
              referenciaExterna: 'REF-ROOT-1',
            },
          },
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico root path custom',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-ROOT-PATH',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-root-path',
      );

      expect(status.status).toBe('emitida');
      expect(status.codigoRetorno).toBe('100');
      expect(status.numeroDocumento).toBe('NFSE-ROOT-0001');
      expect(status.protocolo).toBe('PRT-ROOT-0001');
      expect(status.loteId).toBe('LOT-ROOT-1');
      expect(status.referenciaExterna).toBe('REF-ROOT-1');
      expect(status.ultimaMensagem).toContain('envelope profundo');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }

      if (originalRootPaths === undefined) {
        delete process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS;
      } else {
        process.env.FISCAL_OFFICIAL_RESPONSE_ROOT_PATHS = originalRootPaths;
      }
    }
  });

  it('deve repetir chamada HTTP oficial em falha transiente e concluir emissao', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalMaxRetries = process.env.FISCAL_OFFICIAL_MAX_RETRIES;
    const originalRetryDelay = process.env.FISCAL_OFFICIAL_RETRY_DELAY_MS;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_MAX_RETRIES = '1';
    process.env.FISCAL_OFFICIAL_RETRY_DELAY_MS = '1';

    const axiosSpy = jest.spyOn(axios, 'request');
    axiosSpy
      .mockRejectedValueOnce({
        response: { status: 503, data: { message: 'servico temporariamente indisponivel' } },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            status: 'emitida',
            numeroDocumento: 'NFSE-RETRY-2026-001',
            protocolo: 'PRT-RETRY-001',
            codigoRetorno: '100',
            mensagem: 'Documento autorizado apos retry.',
          },
        },
      } as any);

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico retry oficial',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-RETRY-OFICIAL',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-retry',
      );

      expect(axiosSpy).toHaveBeenCalledTimes(2);
      expect(status.status).toBe('emitida');
      expect(status.numeroDocumento).toBe('NFSE-RETRY-2026-001');
      expect(status.protocolo).toBe('PRT-RETRY-001');
    } finally {
      axiosSpy.mockRestore();

      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }

      if (originalMaxRetries === undefined) {
        delete process.env.FISCAL_OFFICIAL_MAX_RETRIES;
      } else {
        process.env.FISCAL_OFFICIAL_MAX_RETRIES = originalMaxRetries;
      }

      if (originalRetryDelay === undefined) {
        delete process.env.FISCAL_OFFICIAL_RETRY_DELAY_MS;
      } else {
        process.env.FISCAL_OFFICIAL_RETRY_DELAY_MS = originalRetryDelay;
      }
    }
  });

  it('nao deve repetir chamada HTTP oficial em erro funcional 400', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalProvider = process.env.FISCAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;
    const originalMaxRetries = process.env.FISCAL_OFFICIAL_MAX_RETRIES;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_PROVIDER = 'fiscal_oficial';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';
    process.env.FISCAL_OFFICIAL_MAX_RETRIES = '2';

    const axiosSpy = jest.spyOn(axios, 'request');
    axiosSpy.mockRejectedValue({
      response: { status: 400, data: { message: 'payload invalido' } },
    });

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico erro funcional',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-ERRO-FUNCIONAL',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      await expect(
        service.emitir(fatura.id, fatura.empresaId, { ambiente: 'producao' }, 'usuario-erro400'),
      ).rejects.toThrow('HTTP 400');
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    } finally {
      axiosSpy.mockRestore();

      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalProvider === undefined) {
        delete process.env.FISCAL_PROVIDER;
      } else {
        process.env.FISCAL_PROVIDER = originalProvider;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }

      if (originalMaxRetries === undefined) {
        delete process.env.FISCAL_OFFICIAL_MAX_RETRIES;
      } else {
        process.env.FISCAL_OFFICIAL_MAX_RETRIES = originalMaxRetries;
      }
    }
  });

  it('deve cancelar documento fiscal emitido com motivo', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfse',
        numero: 'NFSE-2026-000101',
        serie: 'A1',
        chaveAcesso: '12345678901234567890123456789012345678901234',
      },
      fiscal: {
        tipo: 'nfse',
        status: 'emitida',
        protocolo: 'PRT-1',
        historico: [],
      },
    };
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico',
      quantidade: 1,
      valorUnitario: 1000,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'SV-100',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.cancelarOuInutilizar(
      fatura.id,
      fatura.empresaId,
      { tipoOperacao: 'cancelar', motivo: 'Solicitacao de cancelamento pelo financeiro.' },
      'usuario-4',
    );

    expect(status.status).toBe('cancelada');
    expect(status.numeroDocumento).toBe('NFSE-2026-000101');
    expect(status.historico[status.historico.length - 1]?.acao).toBe('documento_cancelado');
  });

  it('deve usar retorno do provider oficial no cancelamento fiscal', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      const providerSpy = jest
        .spyOn(service as any, 'chamarProviderFiscalOficial')
        .mockResolvedValue({
          data: {
            status: 'cancelada',
            protocolo: 'PRT-CANCEL-OFICIAL',
            codigoRetorno: '135',
            mensagem: 'Cancelamento homologado no provider oficial.',
          },
        });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: {
          tipo: 'nfse',
          numero: 'NFSE-2026-009900',
          serie: 'A1',
          chaveAcesso: '12345678901234567890123456789012345678901234',
        },
        fiscal: {
          tipo: 'nfse',
          provider: 'fiscal_oficial',
          status: 'emitida',
          protocolo: 'PRT-LOCAL',
          historico: [],
        },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico cancelamento oficial',
        quantidade: 1,
        valorUnitario: 300,
        valorTotal: 300,
        unidade: 'un',
        codigoProduto: 'SV-OFFICIAL-CANCEL',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 300,
        calcularValorDesconto: () => 0,
      });

      const status = await service.cancelarOuInutilizar(
        fatura.id,
        fatura.empresaId,
        { tipoOperacao: 'cancelar', motivo: 'Cancelamento a pedido do cliente.' },
        'usuario-cancel-provider',
      );

      expect(providerSpy).toHaveBeenCalled();
      expect(status.status).toBe('cancelada');
      expect(status.protocolo).toBe('PRT-CANCEL-OFICIAL');
      expect(status.codigoRetorno).toBe('135');
      expect(status.ultimaMensagem).toContain('provider oficial');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve bloquear inutilizacao quando documento ja foi emitido', async () => {
    const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfe',
      },
      fiscal: {
        status: 'emitida',
      },
    };
    faturas.push(fatura);

    await expect(
      service.cancelarOuInutilizar(
        fatura.id,
        fatura.empresaId,
        {
          tipoOperacao: 'inutilizar',
          motivo: 'Tentativa de inutilizar numero ja emitido.',
        },
        'usuario-5',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve emitir em lote com status pendente_emissao e metadados de retorno', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfse',
      },
      fiscal: {
        status: 'rascunho',
      },
    };
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico em lote',
      quantidade: 1,
      valorUnitario: 1000,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'SV-LOTE-1',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.emitir(
      fatura.id,
      fatura.empresaId,
      { modoProcessamento: 'lote', contingencia: true },
      'usuario-lote',
    );

    expect(status.status).toBe('pendente_emissao');
    expect(status.modoProcessamento).toBe('lote');
    expect(status.contingencia).toBe(true);
    expect(status.codigoRetorno).toBe('LOTE_ENFILEIRADO');
    expect(status.loteId).toBeTruthy();
    expect(status.historico[status.historico.length - 1]?.acao).toBe('documento_enfileirado');
  });

  it('deve sincronizar status pendente_emissao para emitida ao consultar com sincronizar=true', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfse',
      },
      fiscal: {
        tipo: 'nfse',
        provider: 'fiscal_oficial',
        status: 'pendente_emissao',
        modoProcessamento: 'lote',
        loteId: 'LOT-TEST-001',
        historico: [],
      },
    };
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico sincronizacao',
      quantidade: 1,
      valorUnitario: 900,
      valorTotal: 900,
      unidade: 'un',
      codigoProduto: 'SV-SYNC-1',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 900,
      calcularValorDesconto: () => 0,
    });

    const status = await service.consultarStatus(fatura.id, fatura.empresaId, {
      sincronizar: true,
      userId: 'usuario-sync',
    });

    expect(status.status).toBe('emitida');
    expect(status.codigoRetorno).toBe('EMISSAO_AUTORIZADA');
    expect(status.protocolo).toContain('PRT-');
    expect(status.referenciaExterna).toContain('NFSE-REF-');
    expect(status.historico[status.historico.length - 1]?.acao).toBe(
      'status_sincronizado_emitido',
    );
  });

  it('deve usar retorno do provider oficial na sincronizacao de status', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      const providerSpy = jest
        .spyOn(service as any, 'chamarProviderFiscalOficial')
        .mockResolvedValue({
          data: {
            status: 'emitida',
            protocolo: 'PRT-STATUS-900',
            codigoRetorno: 'STATUS_OK',
            mensagem: 'Status confirmado no provider oficial.',
          },
        });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: {
          tipo: 'nfse',
          numero: 'NFSE-LOCAL-900',
        },
        fiscal: {
          tipo: 'nfse',
          provider: 'fiscal_oficial',
          status: 'pendente_emissao',
          modoProcessamento: 'lote',
          loteId: 'LOT-LOCAL-900',
          historico: [],
        },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico sync oficial',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-OFFICIAL-SYNC',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.consultarStatus(fatura.id, fatura.empresaId, {
        sincronizar: true,
        userId: 'usuario-sync-provider',
      });

      expect(providerSpy).toHaveBeenCalled();
      expect(status.status).toBe('emitida');
      expect(status.protocolo).toBe('PRT-STATUS-900');
      expect(status.codigoRetorno).toBe('STATUS_OK');
      expect(status.ultimaMensagem).toContain('provider oficial');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve mapear retorno textual do provider oficial (autorizada) para status emitida', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        result: {
          situacao: 'autorizada',
          numero: 'NFSE-ALT-2026-100',
          serie: '22',
          chave: '12345678901234567890123456789012345678901234',
          protocol: 'PRT-ALT-100',
          code: '100',
          external_reference: 'ALT-REF-100',
          details: 'Autorizado com sucesso.',
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'rascunho', provider: 'fiscal_oficial' },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico alias autorizada',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-ALIAS-AUTORIZADA',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.emitir(
        fatura.id,
        fatura.empresaId,
        { ambiente: 'producao' },
        'usuario-alias-autorizada',
      );

      expect(status.status).toBe('emitida');
      expect(status.numeroDocumento).toBe('NFSE-ALT-2026-100');
      expect(status.codigoRetorno).toBe('100');
      expect(status.referenciaExterna).toBe('ALT-REF-100');
      expect(status.ultimaMensagem).toContain('Autorizado');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve mapear retorno textual do provider oficial (processando) para pendente_emissao', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    process.env.FISCAL_OFFICIAL_HTTP_ENABLED = 'true';
    process.env.FISCAL_OFFICIAL_BASE_URL = 'https://provider-fiscal.local';

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);
      jest.spyOn(service as any, 'chamarProviderFiscalOficial').mockResolvedValue({
        data: {
          status: 'processando',
          lote: 'LOT-ALT-2026-001',
          codigo: '202',
          message: 'Documento em processamento no provider.',
        },
      });

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: {
          tipo: 'nfse',
          numero: 'NFSE-LOCAL-2026-001',
        },
        fiscal: {
          tipo: 'nfse',
          provider: 'fiscal_oficial',
          status: 'pendente_emissao',
          modoProcessamento: 'lote',
          loteId: 'LOT-LOCAL-2026-001',
          historico: [],
        },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico alias processando',
        quantidade: 1,
        valorUnitario: 1000,
        valorTotal: 1000,
        unidade: 'un',
        codigoProduto: 'SV-ALIAS-PROCESSANDO',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 1000,
        calcularValorDesconto: () => 0,
      });

      const status = await service.consultarStatus(fatura.id, fatura.empresaId, {
        sincronizar: true,
        userId: 'usuario-alias-processando',
      });

      expect(status.status).toBe('pendente_emissao');
      expect(status.loteId).toBe('LOT-ALT-2026-001');
      expect(status.codigoRetorno).toBe('202');
      expect(status.ultimaMensagem).toContain('processamento');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('deve bloquear sincronizacao fiscal oficial sem integracao ativa no modo estrito', async () => {
    const originalRequireOfficial = process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
    const originalOfficialHttpEnabled = process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    const originalOfficialBaseUrl = process.env.FISCAL_OFFICIAL_BASE_URL;

    process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = 'true';
    delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
    delete process.env.FISCAL_OFFICIAL_BASE_URL;

    try {
      const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: {
          tipo: 'nfse',
        },
        fiscal: {
          tipo: 'nfse',
          provider: 'fiscal_oficial',
          status: 'pendente_emissao',
          historico: [],
        },
      };
      faturas.push(fatura);
      itens.push({
        id: 1,
        faturaId: fatura.id,
        descricao: 'Servico bloqueio sync',
        quantidade: 1,
        valorUnitario: 500,
        valorTotal: 500,
        unidade: 'un',
        codigoProduto: 'SV-BLOCK-SYNC',
        percentualDesconto: 0,
        valorDesconto: 0,
        fatura: null as any,
        calcularValorTotal: () => 500,
        calcularValorDesconto: () => 0,
      });

      await expect(
        service.consultarStatus(fatura.id, fatura.empresaId, {
          sincronizar: true,
          userId: 'usuario-sync-estrito',
        }),
      ).rejects.toThrow('sincronizacao de status');
    } finally {
      if (originalRequireOfficial === undefined) {
        delete process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER;
      } else {
        process.env.FISCAL_REQUIRE_OFFICIAL_PROVIDER = originalRequireOfficial;
      }

      if (originalOfficialHttpEnabled === undefined) {
        delete process.env.FISCAL_OFFICIAL_HTTP_ENABLED;
      } else {
        process.env.FISCAL_OFFICIAL_HTTP_ENABLED = originalOfficialHttpEnabled;
      }

      if (originalOfficialBaseUrl === undefined) {
        delete process.env.FISCAL_OFFICIAL_BASE_URL;
      } else {
        process.env.FISCAL_OFFICIAL_BASE_URL = originalOfficialBaseUrl;
      }
    }
  });

  it('nao deve gerar numeracao fiscal ao sincronizar status quando emissao nao foi iniciada', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {};
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico baseline',
      quantidade: 1,
      valorUnitario: 100,
      valorTotal: 100,
      unidade: 'un',
      codigoProduto: 'SV-BASE-1',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 100,
      calcularValorDesconto: () => 0,
    });

    const status = await service.consultarStatus(fatura.id, fatura.empresaId, {
      sincronizar: true,
      userId: 'usuario-sync-baseline',
    });

    expect(status.status).toBe('nao_iniciado');
    expect(status.codigoRetorno).toBe('SEM_EMISSAO');
    expect(status.numeroDocumento).toBeNull();
    expect(status.chaveAcesso).toBeNull();
    expect(status.protocolo).toBeNull();
  });

  it('deve processar webhook fiscal oficial assinado e atualizar status da fatura', async () => {
    const originalSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'secret-webhook-fiscal';
    delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    try {
      const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'pendente_emissao', provider: 'fiscal_oficial', historico: [] },
      };
      faturas.push(fatura);

      const payload: Record<string, unknown> = {
        faturaId: fatura.id,
        data: {
          status: 'autorizada',
          numeroDocumento: 'NFSE-WEBHOOK-001',
          protocolo: 'PRT-WEBHOOK-001',
          code: '100',
          message: 'Autorizada via callback.',
        },
      };
      const signature = createHmac('sha256', process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET as string)
        .update(JSON.stringify(payload))
        .digest('hex');

      const resultado = await service.processarWebhookProviderOficial({
        empresaId: fatura.empresaId,
        payload,
        headers: {
          signature,
          eventId: 'evt-fiscal-001',
          correlationId: 'cid-fiscal-001',
        },
      });

      expect(resultado.success).toBe(true);
      expect(resultado.accepted).toBe(true);
      expect(resultado.duplicate).toBe(false);
      expect(resultado.status).toBe('emitida');
      expect(resultado.faturaId).toBe(fatura.id);
    } finally {
      if (originalSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalSecret;
      }

      if (originalAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalAllowInsecure;
      }
    }
  });

  it('deve ignorar webhook fiscal duplicado pelo mesmo event key', async () => {
    const originalSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'secret-webhook-fiscal';
    delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    try {
      const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'pendente_emissao', provider: 'fiscal_oficial', historico: [] },
      };
      faturas.push(fatura);

      const payload: Record<string, unknown> = {
        faturaId: fatura.id,
        data: { status: 'autorizada', code: '100' },
      };
      const signature = createHmac('sha256', process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET as string)
        .update(JSON.stringify(payload))
        .digest('hex');

      await service.processarWebhookProviderOficial({
        empresaId: fatura.empresaId,
        payload,
        headers: { signature, eventId: 'evt-fiscal-dup-001' },
      });

      const duplicado = await service.processarWebhookProviderOficial({
        empresaId: fatura.empresaId,
        payload,
        headers: { signature, eventId: 'evt-fiscal-dup-001' },
      });

      expect(duplicado.success).toBe(true);
      expect(duplicado.accepted).toBe(true);
      expect(duplicado.duplicate).toBe(true);
    } finally {
      if (originalSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalSecret;
      }

      if (originalAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalAllowInsecure;
      }
    }
  });

  it('deve rejeitar webhook fiscal com assinatura invalida quando secret estiver configurado', async () => {
    const originalSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = 'secret-webhook-fiscal';
    delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    try {
      const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      faturas.push(fatura);

      await expect(
        service.processarWebhookProviderOficial({
          empresaId: fatura.empresaId,
          payload: { faturaId: fatura.id, data: { status: 'autorizada' } },
          headers: { signature: 'assinatura-invalida' },
        }),
      ).rejects.toThrow('assinatura invalida');
    } finally {
      if (originalSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalSecret;
      }

      if (originalAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalAllowInsecure;
      }
    }
  });

  it('deve aceitar webhook fiscal inseguro apenas quando flag de desenvolvimento estiver ativa', async () => {
    const originalSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'true';

    try {
      const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
      const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'pendente_emissao', provider: 'fiscal_oficial', historico: [] },
      };
      faturas.push(fatura);

      const resultado = await service.processarWebhookProviderOficial({
        empresaId: fatura.empresaId,
        payload: { faturaId: fatura.id, data: { status: 'autorizada', code: '100' } },
        headers: { eventId: 'evt-dev-insecure' },
      });

      expect(resultado.success).toBe(true);
      expect(resultado.accepted).toBe(true);
      expect(resultado.duplicate).toBe(false);
      expect(resultado.status).toBe('emitida');
    } finally {
      if (originalSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalSecret;
      }

      if (originalAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalAllowInsecure;
      }
    }
  });

  it('deve aceitar webhook sem assinatura quando tenant habilita modo inseguro, mesmo com env desabilitado', async () => {
    const originalSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'false';

    try {
      const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
      const empresaConfigRepository = {
        findOne: jest.fn(async () => ({
          empresaId: 'empresa-teste',
          fiscalOfficialWebhookAllowInsecure: true,
          fiscalOfficialWebhookSecret: null,
        })),
      };
      const service = new DocumentoFiscalService(
        faturaRepository as any,
        itemRepository as any,
        empresaConfigRepository as any,
      );

      const fatura = criarFaturaBase();
      fatura.detalhesTributarios = {
        documento: { tipo: 'nfse' },
        fiscal: { status: 'pendente_emissao', provider: 'fiscal_oficial', historico: [] },
      };
      faturas.push(fatura);

      const resultado = await service.processarWebhookProviderOficial({
        empresaId: fatura.empresaId,
        payload: { faturaId: fatura.id, data: { status: 'autorizada', code: '100' } },
        headers: { eventId: 'evt-tenant-insecure-allow' },
      });

      expect(resultado.success).toBe(true);
      expect(resultado.accepted).toBe(true);
      expect(resultado.duplicate).toBe(false);
      expect(resultado.status).toBe('emitida');
    } finally {
      if (originalSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalSecret;
      }

      if (originalAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalAllowInsecure;
      }
    }
  });

  it('deve rejeitar webhook sem assinatura quando tenant desabilita modo inseguro, mesmo com env habilitado', async () => {
    const originalSecret = process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    const originalAllowInsecure = process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;

    delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
    process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = 'true';

    try {
      const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
      const empresaConfigRepository = {
        findOne: jest.fn(async () => ({
          empresaId: 'empresa-teste',
          fiscalOfficialWebhookAllowInsecure: false,
          fiscalOfficialWebhookSecret: null,
        })),
      };
      const service = new DocumentoFiscalService(
        faturaRepository as any,
        itemRepository as any,
        empresaConfigRepository as any,
      );

      const fatura = criarFaturaBase();
      faturas.push(fatura);

      await expect(
        service.processarWebhookProviderOficial({
          empresaId: fatura.empresaId,
          payload: { faturaId: fatura.id, data: { status: 'autorizada' } },
          headers: { eventId: 'evt-tenant-insecure-deny' },
        }),
      ).rejects.toThrow('Webhook fiscal rejeitado');
    } finally {
      if (originalSecret === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_SECRET = originalSecret;
      }

      if (originalAllowInsecure === undefined) {
        delete process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE;
      } else {
        process.env.FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE = originalAllowInsecure;
      }
    }
  });
});
