import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/user.entity';

/**
 * Marca handlers/classes que exigem determinados perfis de usuário.
 * O RolesGuard consome essa metadata para permitir ou bloquear o acesso.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
