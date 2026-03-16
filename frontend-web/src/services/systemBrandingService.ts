import { api, apiPublic } from './api';

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

const EMPTY_ADMIN_BRANDING_DATA: SystemBrandingAdminData = {
  logoFullUrl: null,
  logoFullLightUrl: null,
  logoIconUrl: null,
  loadingLogoUrl: null,
  faviconUrl: null,
  maintenanceEnabled: false,
  maintenanceTitle: null,
  maintenanceMessage: null,
  maintenanceStartsAt: null,
  maintenanceExpectedEndAt: null,
  maintenanceSeverity: 'warning',
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

const isAdminBrandingResponse = (payload: unknown): payload is SystemBrandingAdminResponse => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<SystemBrandingAdminResponse>;
  return Boolean(candidate.data) && Boolean(candidate.effective) && Boolean(candidate.defaults);
};

const normalizeAdminBrandingResponse = (
  payload: SystemBrandingAdminResponse | { data?: SystemBrandingAdminResponse } | null | undefined,
): SystemBrandingAdminResponse => {
  const raw = isAdminBrandingResponse(payload)
    ? payload
    : isAdminBrandingResponse((payload as { data?: unknown } | null | undefined)?.data)
      ? ((payload as { data?: SystemBrandingAdminResponse }).data as SystemBrandingAdminResponse)
      : null;

  if (!raw) {
    return {
      data: { ...EMPTY_ADMIN_BRANDING_DATA },
      effective: normalizeBranding(DEFAULT_SYSTEM_BRANDING),
      defaults: normalizeBranding(DEFAULT_SYSTEM_BRANDING),
      updatedAt: null,
    };
  }

  return {
    data: {
      ...EMPTY_ADMIN_BRANDING_DATA,
      ...raw.data,
      maintenanceEnabled:
        typeof raw.data?.maintenanceEnabled === 'boolean'
          ? raw.data.maintenanceEnabled
          : EMPTY_ADMIN_BRANDING_DATA.maintenanceEnabled,
      maintenanceSeverity:
        raw.data?.maintenanceSeverity || EMPTY_ADMIN_BRANDING_DATA.maintenanceSeverity,
    },
    effective: normalizeBranding(raw.effective),
    defaults: normalizeBranding(raw.defaults),
    updatedAt: raw.updatedAt ?? null,
  };
};

export const systemBrandingService = {
  async getPublicBranding(): Promise<SystemBrandingEffectiveConfig> {
    const response = await apiPublic.get<SystemBrandingEffectiveConfig>('/system-branding/public');
    return normalizeBranding(response.data);
  },

  async getAdminBranding(): Promise<SystemBrandingAdminResponse> {
    const response = await api.get<SystemBrandingAdminResponse | { data?: SystemBrandingAdminResponse }>(
      '/admin/system-branding',
    );

    return normalizeAdminBrandingResponse(response.data);
  },

  async updateBranding(
    payload: Partial<SystemBrandingAdminData>,
  ): Promise<SystemBrandingAdminResponse> {
    const response = await api.put<SystemBrandingAdminResponse | { data?: SystemBrandingAdminResponse }>(
      '/admin/system-branding',
      payload,
    );

    return normalizeAdminBrandingResponse(response.data);
  },

  normalizeBranding,
};

export default systemBrandingService;
