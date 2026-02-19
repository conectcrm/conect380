import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions/permissions.constants';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marca handlers/classes que exigem permissao granular.
 * O PermissionsGuard consome essa metadata para permitir ou bloquear acesso.
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
