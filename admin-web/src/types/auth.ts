export type AdminRole = 'superadmin' | 'admin' | 'gerente';

export type ProfileUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  permissoes?: string[];
  permissions?: string[];
  empresa_id?: string;
  empresa?: {
    id?: string;
    nome?: string;
    slug?: string;
  };
};

export type LoginSuccessPayload = {
  access_token: string;
  user: ProfileUser;
};

export type MfaRequiredPayload = {
  challengeId: string;
  email: string;
  expiresInSeconds: number;
  canResendAfterSeconds: number;
  deliveryChannel?: 'email' | 'dev_fallback';
  devCode?: string;
};

export type ApiAuthResponse = {
  success?: boolean;
  action?: 'SUCCESS' | 'MFA_REQUIRED' | 'TROCAR_SENHA';
  message?: string;
  data?: unknown;
};

export const ADMIN_ROLES = new Set<AdminRole>(['superadmin', 'admin', 'gerente']);

export const isAdminRole = (role: string | undefined | null): role is AdminRole => {
  if (!role) {
    return false;
  }
  return ADMIN_ROLES.has(role.toLowerCase() as AdminRole);
};
