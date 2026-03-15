export type CatalogoFeaturesConfig = {
  categoriasAvancadasEnabled: boolean;
  catalogApiEnabled: boolean;
  catalogApiTenantAllowlist: string[];
};

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};

const parseTenantAllowlist = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(/[;,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const getCatalogoFeaturesConfig = (): CatalogoFeaturesConfig => {
  const categoriasAvancadasEnabled = parseBooleanFlag(
    process.env.REACT_APP_CATALOGO_CATEGORIAS_AVANCADAS_ENABLED,
    true,
  );
  const catalogApiEnabled = parseBooleanFlag(process.env.REACT_APP_CATALOGO_API_ENABLED, false);
  const catalogApiTenantAllowlist = parseTenantAllowlist(
    process.env.REACT_APP_CATALOGO_API_TENANTS,
  );

  return {
    categoriasAvancadasEnabled,
    catalogApiEnabled,
    catalogApiTenantAllowlist,
  };
};

export const isCatalogApiEnabledForTenant = (empresaId?: string | null): boolean => {
  const { catalogApiEnabled, catalogApiTenantAllowlist } = getCatalogoFeaturesConfig();

  if (!catalogApiEnabled) {
    return false;
  }

  if (catalogApiTenantAllowlist.length === 0 || catalogApiTenantAllowlist.includes('*')) {
    return true;
  }

  if (!empresaId) {
    return false;
  }

  return catalogApiTenantAllowlist.includes(empresaId.trim().toLowerCase());
};
