import React from 'react';
import { useAuth } from './auth/useAuth';
import { useCallback } from 'react';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

type AuthUser = ReturnType<typeof useAuth>['user'];

type ExtendedUser = (AuthUser extends null ? never : AuthUser) & {
  roles?: string[];
  role?: string;
  permissions?: string[];
  department?: string;
  companyId?: string;
};

export function usePermissionControl() {
  const { user } = useAuth();
  const typedUser = (user ?? null) as ExtendedUser | null;

  const userRoles = useCallback((): string[] => {
    if (!typedUser) return [];
    if (Array.isArray(typedUser.roles) && typedUser.roles.length > 0) {
      return typedUser.roles;
    }
    return typedUser.role ? [typedUser.role] : [];
  }, [typedUser]);

  const userPermissions = useCallback((): string[] => {
    if (!typedUser) return [];
    return Array.isArray(typedUser.permissions) ? typedUser.permissions : [];
  }, [typedUser]);

  // Modo desenvolvimento - permite tudo se não houver usuário ou em ambiente de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development' || !user;

  const hasPermission = useCallback((
    permission: string | string[],
    resource?: any,
    context?: Record<string, any>
  ): boolean => {
    // Em desenvolvimento, sempre retorna true
    if (isDevelopment) {
      return true;
    }

    if (!user) return false;

    // Admin tem todas as permissões
    const roles = userRoles();
    if (roles.includes('admin') || roles.includes('super_admin')) {
      return true;
    }

    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];

    return permissionsToCheck.some(perm => {
      // Verificar permissão direta do usuário
      if (userPermissions().includes(perm)) {
        return checkResourceConditions(perm, resource, context);
      }

      // Verificar permissões através de roles
      return roles.some(roleId => {
        const role = getRoleById(roleId);
        if (role?.permissions.includes(perm)) {
          return checkResourceConditions(perm, resource, context);
        }
        return false;
      });
    });
  }, [user, isDevelopment, userPermissions, userRoles]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const canAccessResource = useCallback((
    resource: string,
    action: string,
    data?: any
  ): boolean => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission, data);
  }, [hasPermission]);

  const filterByPermission = useCallback(<T>(
    items: T[],
    getPermission: (item: T) => string,
    action: string = 'read'
  ): T[] => {
    return items.filter(item => {
      const permission = `${getPermission(item)}.${action}`;
      return hasPermission(permission, item);
    });
  }, [hasPermission]);

  const checkResourceConditions = (
    permission: string,
    resource?: any,
    context?: Record<string, any>
  ): boolean => {
    const permissionConfig = getPermissionConfig(permission);

    if (!permissionConfig?.conditions) return true;

    // Verificar condições baseadas no proprietário
    if (permissionConfig.conditions.owner && resource) {
      return resource.userId === typedUser?.id || resource.createdBy === typedUser?.id;
    }

    // Verificar condições baseadas no departamento
    if (permissionConfig.conditions.department && resource) {
      return resource.department === typedUser?.department;
    }

    // Verificar condições baseadas na empresa
    if (permissionConfig.conditions.company && resource) {
      return resource.companyId === typedUser?.companyId;
    }

    // Verificar condições personalizadas
    if (permissionConfig.conditions.custom && context) {
      return permissionConfig.conditions.custom(typedUser, resource, context);
    }

    return true;
  };

  const getPermissionConfig = (permission: string): Permission | null => {
    // TODO: Implementar cache de configurações de permissão
    // Esta função deveria buscar a configuração da permissão do backend
    return null;
  };

  const getRoleById = (roleId: string): Role | null => {
    // TODO: Implementar cache de roles
    // Esta função deveria buscar o role do backend
    return null;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
    filterByPermission,
    user: typedUser
  };
}

// Hook para componentes que precisam verificar permissões específicas
export function useRequirePermission(permission: string | string[]) {
  const { hasPermission } = usePermissionControl();

  // Em desenvolvimento, sempre permite acesso
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasRequiredPermission = isDevelopment ? true : hasPermission(permission);

  if (!hasRequiredPermission) {
    return {
      hasPermission: false,
      component: React.createElement('div',
        { className: "flex items-center justify-center p-8" },
        React.createElement('div',
          { className: "text-center" },
          React.createElement('div',
            { className: "w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center" },
            React.createElement('svg',
              {
                className: "w-8 h-8 text-red-600",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              },
              React.createElement('path', {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              })
            )
          ),
          React.createElement('h3',
            { className: "text-lg font-medium text-gray-900 mb-2" },
            "Acesso Negado"
          ),
          React.createElement('p',
            { className: "text-gray-600" },
            "Você não tem permissão para acessar este recurso."
          )
        )
      )
    };
  }

  return {
    hasPermission: true,
    component: null
  };
}

// HOC para proteger componentes com permissões
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string | string[]
) {
  return function PermissionWrapper(props: P) {
    const { hasPermission, component } = useRequirePermission(permission);

    if (!hasPermission) {
      return component;
    }

    return React.createElement(Component, props);
  };
}

// Utility para validar permissões no backend (para usar em services)
export function validarPermissaoAcao(user: any, permissions: string[]): boolean {
  if (!user) return false;

  // Admin tem todas as permissões
  if (user.roles?.includes('admin') || user.roles?.includes('super_admin')) {
    return true;
  }

  return permissions.some(permission => {
    // Verificar permissão direta
    if (user.permissions?.includes(permission)) {
      return true;
    }

    // Verificar através de roles
    return user.roles?.some((roleId: string) => {
      // TODO: Implementar verificação de role
      return false;
    });
  });
}
