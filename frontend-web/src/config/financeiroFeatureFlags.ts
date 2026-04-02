type FinanceiroFeatureFlags = {
  fiscalDocumentsEnabled: boolean;
  boletoEnabled: boolean;
  fiscalDisabledReason: string;
  boletoDisabledReason: string;
};

const parseBooleanEnv = (rawValue: string | undefined, fallback: boolean): boolean => {
  if (!rawValue || typeof rawValue !== 'string') {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

export const getFinanceiroFeatureFlags = (): FinanceiroFeatureFlags => {
  const mvpMode = parseBooleanEnv(process.env.REACT_APP_MVP_MODE, false);
  // Emissao fiscal permanece fora do escopo desta fase do financeiro.
  const fiscalDocumentsEnabled = false;
  const boletoEnabled = parseBooleanEnv(process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED, false);

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
