import { UserRole } from '../../modules/users/user.entity';
import {
  LEGACY_PERMISSION_ALIASES,
  Permission,
  ROLE_DEFAULT_PERMISSIONS,
} from './permissions.constants';

export interface PermissionUserContext {
  role?: unknown;
  roles?: unknown;
  permissoes?: unknown;
  permissions?: unknown;
}

const CANONICAL_PERMISSION_VALUES = new Set<string>(Object.values(Permission));

const ROLE_ALIASES: Record<string, string> = {
  manager: UserRole.GERENTE,
  gestor: UserRole.GERENTE,
  administrador: UserRole.ADMIN,
  user: UserRole.SUPORTE,
  usuario: UserRole.SUPORTE,
  operacional: UserRole.SUPORTE,
};

function normalizeRole(role: unknown): string | null {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return ROLE_ALIASES[normalized] ?? normalized;
}

function normalizePermissionToken(permission: unknown): Permission | null {
  if (typeof permission !== 'string') {
    return null;
  }

  const trimmed = permission.trim();
  if (!trimmed) {
    return null;
  }

  const canonicalCandidate = trimmed.toLowerCase();
  if (CANONICAL_PERMISSION_VALUES.has(canonicalCandidate)) {
    return canonicalCandidate as Permission;
  }

  const legacyCandidate = trimmed.toUpperCase();
  return LEGACY_PERMISSION_ALIASES[legacyCandidate] ?? null;
}

function addRolePermissions(target: Set<Permission>, role: unknown): void {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return;
  }

  const defaults = ROLE_DEFAULT_PERMISSIONS[normalizedRole] ?? [];
  defaults.forEach((permission) => target.add(permission));
}

function* iteratePermissionInputs(rawPermissions: unknown): Generator<unknown> {
  if (!rawPermissions) {
    return;
  }

  if (Array.isArray(rawPermissions)) {
    for (const item of rawPermissions) {
      yield item;
    }
    return;
  }

  if (typeof rawPermissions === 'string') {
    const values = rawPermissions.includes(',')
      ? rawPermissions.split(',')
      : [rawPermissions];
    for (const item of values) {
      yield item;
    }
  }
}

export function resolveUserPermissions(user?: PermissionUserContext): Set<Permission> {
  const resolved = new Set<Permission>();

  if (!user) {
    return resolved;
  }

  const explicitPermissions = new Set<Permission>();
  for (const permissionInput of iteratePermissionInputs(user.permissoes)) {
    const normalized = normalizePermissionToken(permissionInput);
    if (normalized) {
      explicitPermissions.add(normalized);
    }
  }

  for (const permissionInput of iteratePermissionInputs(user.permissions)) {
    const normalized = normalizePermissionToken(permissionInput);
    if (normalized) {
      explicitPermissions.add(normalized);
    }
  }

  // When explicit permissions are present, treat them as the final source of truth.
  // Role defaults are fallback-only for legacy users without explicit grants.
  if (explicitPermissions.size > 0) {
    explicitPermissions.forEach((permission) => resolved.add(permission));
    return resolved;
  }

  const roles = Array.isArray(user.roles)
    ? user.roles
    : user.role !== undefined
      ? [user.role]
      : [];

  if (roles.length === 0) {
    addRolePermissions(resolved, user.role);
  } else {
    roles.forEach((role) => addRolePermissions(resolved, role));
  }

  return resolved;
}

export function hasRequiredPermissions(
  user: PermissionUserContext | undefined,
  requiredPermissions: Permission[],
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const resolved = resolveUserPermissions(user);
  return requiredPermissions.every((permission) => resolved.has(permission));
}
