import { apiPublic } from './api';

export type SystemMaintenanceSeverity = 'info' | 'warning' | 'critical';

export interface SystemMaintenanceBannerConfig {
  enabled: boolean;
  title: string;
  message: string;
  severity: SystemMaintenanceSeverity;
  startsAt: string | null;
  expectedEndAt: string | null;
}

export interface SystemBrandingEffectiveConfig {
  logoFullUrl: string;
  logoFullLightUrl: string;
  logoIconUrl: string;
  loadingLogoUrl: string;
  faviconUrl: string;
  maintenanceBanner: SystemMaintenanceBannerConfig;
}

export interface SystemBrandingAdminData {
  logoFullUrl: string | null;
  logoFullLightUrl: string | null;
  logoIconUrl: string | null;
  loadingLogoUrl: string | null;
  faviconUrl: string | null;
  maintenanceEnabled: boolean;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  maintenanceStartsAt: string | null;
  maintenanceExpectedEndAt: string | null;
  maintenanceSeverity: SystemMaintenanceSeverity;
}

export interface SystemBrandingAdminResponse {
  data: SystemBrandingAdminData;
  effective: SystemBrandingEffectiveConfig;
  defaults: SystemBrandingEffectiveConfig;
  updatedAt: string | null;
}

export const DEFAULT_SYSTEM_BRANDING: SystemBrandingEffectiveConfig = {
  logoFullUrl: '',
  logoFullLightUrl: '',
  logoIconUrl: '',
  loadingLogoUrl: '',
  faviconUrl: '/favicon.svg',
  maintenanceBanner: {
    enabled: false,
    title: 'Manutencao programada',
    message: 'O sistema pode apresentar instabilidade durante o deploy.',
    severity: 'warning',
    startsAt: null,
    expectedEndAt: null,
  },
};

const normalizeBranding = (
  payload: Partial<SystemBrandingEffectiveConfig> | null | undefined,
): SystemBrandingEffectiveConfig => {
  const maintenancePayload: Partial<SystemMaintenanceBannerConfig> = payload?.maintenanceBanner || {};

  return {
    ...DEFAULT_SYSTEM_BRANDING,
    ...payload,
    maintenanceBanner: {
      ...DEFAULT_SYSTEM_BRANDING.maintenanceBanner,
      ...maintenancePayload,
      enabled:
        typeof maintenancePayload.enabled === 'boolean'
          ? maintenancePayload.enabled
          : DEFAULT_SYSTEM_BRANDING.maintenanceBanner.enabled,
    },
  };
};

export const systemBrandingService = {
  async getPublicBranding(): Promise<SystemBrandingEffectiveConfig> {
    const response = await apiPublic.get<SystemBrandingEffectiveConfig>('/system-branding/public');
    return normalizeBranding(response.data);
  },

  normalizeBranding,
};

export default systemBrandingService;
