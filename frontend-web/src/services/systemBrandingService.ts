import { api, apiPublic } from './api';

export interface SystemBrandingEffectiveConfig {
  logoFullUrl: string;
  logoFullLightUrl: string;
  logoIconUrl: string;
  loadingLogoUrl: string;
  faviconUrl: string;
}

export interface SystemBrandingAdminData {
  logoFullUrl: string | null;
  logoFullLightUrl: string | null;
  logoIconUrl: string | null;
  loadingLogoUrl: string | null;
  faviconUrl: string | null;
}

export interface SystemBrandingAdminResponse {
  data: SystemBrandingAdminData;
  effective: SystemBrandingEffectiveConfig;
  defaults: SystemBrandingEffectiveConfig;
  updatedAt: string | null;
}

export const DEFAULT_SYSTEM_BRANDING: SystemBrandingEffectiveConfig = {
  logoFullUrl: '/brand/conect360-logo-horizontal.svg',
  logoFullLightUrl: '/brand/conect360-logo-horizontal-light.svg',
  logoIconUrl: '/brand/conect360-logo-icon.svg',
  loadingLogoUrl: '/brand/conect360-logo-icon.svg',
  faviconUrl: '/favicon.svg',
};

export const systemBrandingService = {
  async getPublicBranding(): Promise<SystemBrandingEffectiveConfig> {
    const response = await apiPublic.get<SystemBrandingEffectiveConfig>('/system-branding/public');
    return { ...DEFAULT_SYSTEM_BRANDING, ...response.data };
  },

  async getAdminBranding(): Promise<SystemBrandingAdminResponse> {
    const response = await api.get<SystemBrandingAdminResponse>('/admin/system-branding');
    return response.data;
  },

  async updateBranding(payload: Partial<SystemBrandingAdminData>): Promise<SystemBrandingAdminResponse> {
    const response = await api.put<SystemBrandingAdminResponse>('/admin/system-branding', payload);
    return response.data;
  },
};

export default systemBrandingService;
