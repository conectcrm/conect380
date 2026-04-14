import { getFinanceiroFeatureFlags } from '../financeiroFeatureFlags';

describe('getFinanceiroFeatureFlags (frontend)', () => {
  const originalEnv = {
    REACT_APP_MVP_MODE: process.env.REACT_APP_MVP_MODE,
    REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED: process.env.REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED,
    REACT_APP_FINANCEIRO_BOLETO_ENABLED: process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED,
  };

  afterEach(() => {
    process.env.REACT_APP_MVP_MODE = originalEnv.REACT_APP_MVP_MODE;
    process.env.REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED =
      originalEnv.REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED;
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = originalEnv.REACT_APP_FINANCEIRO_BOLETO_ENABLED;
  });

  it('forca desabilitacao total quando MVP mode estiver ativo', () => {
    process.env.REACT_APP_MVP_MODE = 'true';
    process.env.REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED = 'true';
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = 'true';

    const flags = getFinanceiroFeatureFlags();

    expect(flags.fiscalDocumentsEnabled).toBe(false);
    expect(flags.boletoEnabled).toBe(false);
    expect(flags.fiscalDisabledReason).toContain('fora do escopo');
    expect(flags.boletoDisabledReason).toContain('fora do escopo');
  });

  it('mantem fiscal desabilitado mesmo com flag ligada quando MVP estiver desativado', () => {
    process.env.REACT_APP_MVP_MODE = 'false';
    process.env.REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED = 'true';
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = 'true';

    const flags = getFinanceiroFeatureFlags();

    expect(flags.fiscalDocumentsEnabled).toBe(false);
    expect(flags.boletoEnabled).toBe(true);
    expect(flags.fiscalDisabledReason).toContain('desabilitada');
    expect(flags.boletoDisabledReason).toBe('');
  });

  it('mantem fluxo essencial quando flags estiverem desligadas', () => {
    process.env.REACT_APP_MVP_MODE = 'false';
    process.env.REACT_APP_FINANCEIRO_FISCAL_DOCS_ENABLED = 'false';
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = 'false';

    const flags = getFinanceiroFeatureFlags();

    expect(flags.fiscalDocumentsEnabled).toBe(false);
    expect(flags.boletoEnabled).toBe(false);
    expect(flags.fiscalDisabledReason).toContain('desabilitada');
    expect(flags.boletoDisabledReason).toContain('desabilitado');
  });
});
