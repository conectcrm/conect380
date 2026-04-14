export type PlatformScopedUser = {
  role?: string | null;
  empresa_id?: string | null;
  empresaId?: string | null;
  platform_owner_access?: boolean | null;
  platformOwnerAccess?: boolean | null;
  empresa?: {
    id?: string | null;
  } | null;
};

const PLATFORM_ROLE_ALIASES = new Set([
  'superadmin',
]);

export function isPlatformUser(user?: PlatformScopedUser | null): boolean {
  if (!user) {
    return false;
  }

  if (user.platform_owner_access === true || user.platformOwnerAccess === true) {
    return true;
  }

  const normalizedRole =
    typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';

  return PLATFORM_ROLE_ALIASES.has(normalizedRole);
}
