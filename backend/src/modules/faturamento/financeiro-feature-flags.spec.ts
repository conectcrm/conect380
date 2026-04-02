import { getFinanceiroFeatureFlags } from './financeiro-feature-flags';

describe('getFinanceiroFeatureFlags (backend)', () => {
  const originalEnv = {
    FINANCEIRO_MVP_MODE: process.env.FINANCEIRO_MVP_MODE,
    MVP_MODE: process.env.MVP_MODE,
    FINANCEIRO_FISCAL_DOCS_ENABLED: process.env.FINANCEIRO_FISCAL_DOCS_ENABLED,
    FINANCEIRO_BOLETO_ENABLED: process.env.FINANCEIRO_BOLETO_ENABLED,
  };

  afterEach(() => {
    process.env.FINANCEIRO_MVP_MODE = originalEnv.FINANCEIRO_MVP_MODE;
    process.env.MVP_MODE = originalEnv.MVP_MODE;
    process.env.FINANCEIRO_FISCAL_DOCS_ENABLED = originalEnv.FINANCEIRO_FISCAL_DOCS_ENABLED;
    process.env.FINANCEIRO_BOLETO_ENABLED = originalEnv.FINANCEIRO_BOLETO_ENABLED;
  });

  it('desabilita fiscal e boleto quando FINANCEIRO_MVP_MODE estiver ativo', () => {
    process.env.FINANCEIRO_MVP_MODE = 'true';
    process.env.MVP_MODE = 'false';
    process.env.FINANCEIRO_FISCAL_DOCS_ENABLED = 'true';
    process.env.FINANCEIRO_BOLETO_ENABLED = 'true';

    const flags = getFinanceiroFeatureFlags();

    expect(flags.fiscalDocumentsEnabled).toBe(false);
    expect(flags.boletoEnabled).toBe(false);
    expect(flags.fiscalDisabledReason).toContain('fora do escopo');
    expect(flags.boletoDisabledReason).toContain('fora do escopo');
  });

  it('tambem desabilita quando MVP_MODE legado estiver ativo', () => {
    process.env.FINANCEIRO_MVP_MODE = 'false';
    process.env.MVP_MODE = 'true';
    process.env.FINANCEIRO_FISCAL_DOCS_ENABLED = 'true';
    process.env.FINANCEIRO_BOLETO_ENABLED = 'true';

    const flags = getFinanceiroFeatureFlags();

    expect(flags.fiscalDocumentsEnabled).toBe(false);
    expect(flags.boletoEnabled).toBe(false);
  });

  it('mantem emissao fiscal desabilitada mesmo com env fiscal ligado', () => {
    process.env.FINANCEIRO_MVP_MODE = 'false';
    process.env.MVP_MODE = 'false';
    process.env.FINANCEIRO_FISCAL_DOCS_ENABLED = 'true';
    process.env.FINANCEIRO_BOLETO_ENABLED = 'false';

    const flags = getFinanceiroFeatureFlags();

    expect(flags.fiscalDocumentsEnabled).toBe(false);
    expect(flags.boletoEnabled).toBe(false);
    expect(flags.fiscalDisabledReason).toContain('desabilitada');
    expect(flags.boletoDisabledReason).toContain('desabilitado');
  });
});
