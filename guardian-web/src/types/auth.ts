export type GuardianRole = 'superadmin';

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

export const GUARDIAN_ROLES = new Set<GuardianRole>(['superadmin']);

export const isGuardianRole = (role: string | undefined | null): role is GuardianRole => {
  if (!role) {
    return false;
  }
  return GUARDIAN_ROLES.has(role.toLowerCase() as GuardianRole);
};
