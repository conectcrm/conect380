const parseBoolean = (value: string | undefined): boolean | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return null;
};

const isProduction = process.env.NODE_ENV === 'production';

export const isOmnichannelEnabled = (() => {
  const explicitValue = parseBoolean(process.env.REACT_APP_ENABLE_OMNICHANNEL);
  if (explicitValue !== null) {
    return explicitValue;
  }

  return !isProduction;
})();

export const isAtendimentoModuleVisible = (() => {
  const explicitValue = parseBoolean(process.env.REACT_APP_ENABLE_ATENDIMENTO_MODULE);
  if (explicitValue !== null) {
    return explicitValue;
  }

  // Em producao fica oculto por padrao ate o modulo ser retomado.
  return !isProduction;
})();
