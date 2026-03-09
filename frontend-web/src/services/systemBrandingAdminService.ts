import { api } from './api';
import type { SystemBrandingAdminData, SystemBrandingAdminResponse } from './systemBrandingService';

const systemBrandingAdminService = {
  async getAdminBranding(): Promise<SystemBrandingAdminResponse> {
    const response = await api.get<SystemBrandingAdminResponse>('/admin/system-branding');
    return response.data;
  },

  async updateBranding(payload: Partial<SystemBrandingAdminData>): Promise<SystemBrandingAdminResponse> {
    const response = await api.put<SystemBrandingAdminResponse>('/admin/system-branding', payload);
    return response.data;
  },
};

export default systemBrandingAdminService;

