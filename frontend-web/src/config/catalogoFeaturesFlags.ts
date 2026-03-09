export type CatalogoFeaturesConfig = {
  combosEnabled: boolean;
  categoriasAvancadasEnabled: boolean;
};

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};

export const getCatalogoFeaturesConfig = (): CatalogoFeaturesConfig => {
  // Combos permanecem apenas por compatibilidade com fluxos legados.
  // O catálogo principal deve evoluir com itens hierárquicos, não com pacotes pré-definidos.
  const combosEnabled = parseBooleanFlag(process.env.REACT_APP_CATALOGO_COMBOS_ENABLED, false);
  const categoriasAvancadasEnabled = parseBooleanFlag(
    process.env.REACT_APP_CATALOGO_CATEGORIAS_AVANCADAS_ENABLED,
    true,
  );

  return {
    combosEnabled,
    categoriasAvancadasEnabled,
  };
};
