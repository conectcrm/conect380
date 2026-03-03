export type CatalogoFeaturesConfig = {
  combosEnabled: boolean;
};

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};

export const getCatalogoFeaturesConfig = (): CatalogoFeaturesConfig => {
  const combosEnabled = parseBooleanFlag(process.env.REACT_APP_CATALOGO_COMBOS_ENABLED, false);

  return {
    combosEnabled,
  };
};
