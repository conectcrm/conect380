export interface FinanceiroFeatureFlags {
  fiscalDocumentsEnabled: boolean;
  boletoEnabled: boolean;
  fiscalDisabledReason: string;
  boletoDisabledReason: string;
}

const parseBooleanEnv = (rawValue: string | undefined, fallback: boolean): boolean => {
  if (!rawValue || typeof rawValue !== 'string') {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'sim'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off', 'nao'].includes(normalized)) {
    return false;
  }

  return fallback;
};

export const getFinanceiroFeatureFlags = (): FinanceiroFeatureFlags => {
  const mvpMode =
    parseBooleanEnv(process.env.FINANCEIRO_MVP_MODE, false) ||
    parseBooleanEnv(process.env.MVP_MODE, false);
  const fiscalDocumentsEnabled = parseBooleanEnv(
    process.env.FINANCEIRO_FISCAL_DOCS_ENABLED,
    false,
  );
  const boletoEnabled = parseBooleanEnv(process.env.FINANCEIRO_BOLETO_ENABLED, false);

  if (mvpMode) {
    return {
      fiscalDocumentsEnabled: false,
      boletoEnabled: false,
      fiscalDisabledReason: 'Emissao fiscal fora do escopo da release atual.',
      boletoDisabledReason: 'Boleto fora do escopo da release atual.',
    };
  }

  return {
    fiscalDocumentsEnabled,
    boletoEnabled,
    fiscalDisabledReason: fiscalDocumentsEnabled
      ? ''
      : 'Emissao fiscal (NF-e/NFS-e) desabilitada neste ambiente.',
    boletoDisabledReason: boletoEnabled
      ? ''
      : 'Boleto desabilitado neste ambiente para foco no fluxo financeiro essencial.',
  };
};
