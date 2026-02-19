import { UserRole } from '../../modules/users/user.entity';

export enum Permission {
  USERS_PROFILE_UPDATE = 'users.profile.update',
  USERS_READ = 'users.read',
  USERS_CREATE = 'users.create',
  USERS_UPDATE = 'users.update',
  USERS_RESET_PASSWORD = 'users.reset-password',
  USERS_STATUS_UPDATE = 'users.status.update',
  USERS_BULK_UPDATE = 'users.bulk.update',
  PLANOS_MANAGE = 'planos.manage',
  ADMIN_EMPRESAS_MANAGE = 'admin.empresas.manage',
  ATENDIMENTO_DLQ_MANAGE = 'atendimento.dlq.manage',
}

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

const USER_MANAGEMENT_PERMISSIONS: Permission[] = [
  Permission.USERS_READ,
  Permission.USERS_CREATE,
  Permission.USERS_UPDATE,
  Permission.USERS_RESET_PASSWORD,
  Permission.USERS_STATUS_UPDATE,
  Permission.USERS_BULK_UPDATE,
];

const BASIC_PROFILE_PERMISSIONS: Permission[] = [Permission.USERS_PROFILE_UPDATE];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.SUPERADMIN]: ALL_PERMISSIONS,
  [UserRole.ADMIN]: [
    ...USER_MANAGEMENT_PERMISSIONS,
    ...BASIC_PROFILE_PERMISSIONS,
    Permission.PLANOS_MANAGE,
    Permission.ADMIN_EMPRESAS_MANAGE,
    Permission.ATENDIMENTO_DLQ_MANAGE,
  ],
  [UserRole.GERENTE]: [...USER_MANAGEMENT_PERMISSIONS, ...BASIC_PROFILE_PERMISSIONS],
  [UserRole.VENDEDOR]: [...BASIC_PROFILE_PERMISSIONS],
  [UserRole.SUPORTE]: [...BASIC_PROFILE_PERMISSIONS],
  [UserRole.FINANCEIRO]: [...BASIC_PROFILE_PERMISSIONS],
};

export const LEGACY_PERMISSION_ALIASES: Record<string, Permission> = {
  USERS_READ: Permission.USERS_READ,
  USERS_CREATE: Permission.USERS_CREATE,
  USERS_UPDATE: Permission.USERS_UPDATE,
  USERS_RESET_PASSWORD: Permission.USERS_RESET_PASSWORD,
  USERS_STATUS_UPDATE: Permission.USERS_STATUS_UPDATE,
  USERS_BULK_UPDATE: Permission.USERS_BULK_UPDATE,
  USERS_PROFILE_UPDATE: Permission.USERS_PROFILE_UPDATE,
  ADMIN_EMPRESAS_MANAGE: Permission.ADMIN_EMPRESAS_MANAGE,
  PLANOS_MANAGE: Permission.PLANOS_MANAGE,
  ATENDIMENTO_DLQ_MANAGE: Permission.ATENDIMENTO_DLQ_MANAGE,
};
