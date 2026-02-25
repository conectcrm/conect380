import { UserRole } from '../../modules/users/user.entity';
import {
  ALL_PERMISSIONS,
  Permission,
  ROLE_DEFAULT_PERMISSIONS,
} from './permissions.constants';
import { hasRequiredPermissions, resolveUserPermissions } from './permissions.utils';

describe('permissions.utils', () => {
  describe('ROLE_DEFAULT_PERMISSIONS', () => {
    it('deve garantir que superadmin tenha todas as permissoes', () => {
      expect(ROLE_DEFAULT_PERMISSIONS[UserRole.SUPERADMIN]).toHaveLength(ALL_PERMISSIONS.length);
      expect(new Set(ROLE_DEFAULT_PERMISSIONS[UserRole.SUPERADMIN])).toEqual(new Set(ALL_PERMISSIONS));
    });

    it('deve manter perfil vendedor sem permissoes de administracao de usuarios', () => {
      const vendedorPerms = new Set(ROLE_DEFAULT_PERMISSIONS[UserRole.VENDEDOR]);

      expect(vendedorPerms.has(Permission.CRM_CLIENTES_READ)).toBe(true);
      expect(vendedorPerms.has(Permission.COMERCIAL_PROPOSTAS_CREATE)).toBe(true);
      expect(vendedorPerms.has(Permission.USERS_CREATE)).toBe(false);
      expect(vendedorPerms.has(Permission.ADMIN_EMPRESAS_MANAGE)).toBe(false);
    });

    it('deve manter perfil financeiro com foco em faturamento/pagamentos', () => {
      const financeiroPerms = new Set(ROLE_DEFAULT_PERMISSIONS[UserRole.FINANCEIRO]);

      expect(financeiroPerms.has(Permission.FINANCEIRO_FATURAMENTO_MANAGE)).toBe(true);
      expect(financeiroPerms.has(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)).toBe(true);
      expect(financeiroPerms.has(Permission.USERS_CREATE)).toBe(false);
    });
  });

  describe('resolveUserPermissions', () => {
    it('deve normalizar aliases legados e priorizar permissoes explicitas', () => {
      const resolved = resolveUserPermissions({
        role: 'manager',
        permissions: [
          'CRM_CLIENTES_READ',
          'ATENDIMENTO_TICKETS_CREATE',
          'atendimento.tickets.update',
        ],
      });

      expect(resolved.has(Permission.CRM_CLIENTES_READ)).toBe(true);
      expect(resolved.has(Permission.ATENDIMENTO_TICKETS_CREATE)).toBe(true);
      expect(resolved.has(Permission.ATENDIMENTO_TICKETS_UPDATE)).toBe(true);
      expect(resolved.has(Permission.USERS_CREATE)).toBe(false);
    });

    it('deve considerar permissoes de multiplos roles quando informado em user.roles', () => {
      const resolved = resolveUserPermissions({
        roles: [UserRole.SUPORTE, UserRole.FINANCEIRO],
      });

      expect(resolved.has(Permission.ATENDIMENTO_TICKETS_READ)).toBe(true);
      expect(resolved.has(Permission.FINANCEIRO_FATURAMENTO_READ)).toBe(true);
      expect(resolved.has(Permission.USERS_CREATE)).toBe(false);
    });

    it('deve usar permissoes padrao do role quando nao houver permissoes explicitas', () => {
      const resolved = resolveUserPermissions({
        role: 'manager',
      });

      expect(resolved.has(Permission.USERS_CREATE)).toBe(true);
      expect(resolved.has(Permission.CRM_CLIENTES_READ)).toBe(true);
    });

    it('deve tratar permissoes explicitas como override mesmo para role financeiro', () => {
      const resolved = resolveUserPermissions({
        role: UserRole.FINANCEIRO,
        permissoes: 'dashboard.read,comercial.propostas.read',
      });

      expect(resolved.has(Permission.DASHBOARD_READ)).toBe(true);
      expect(resolved.has(Permission.COMERCIAL_PROPOSTAS_READ)).toBe(true);
      expect(resolved.has(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)).toBe(false);
      expect(resolved.has(Permission.FINANCEIRO_FATURAMENTO_MANAGE)).toBe(false);
    });
  });

  describe('hasRequiredPermissions', () => {
    it('deve permitir quando usuario tem todas as permissoes requeridas', () => {
      const allowed = hasRequiredPermissions(
        {
          role: UserRole.ADMIN,
        },
        [Permission.ATENDIMENTO_TICKETS_ASSIGN, Permission.CRM_CLIENTES_READ],
      );

      expect(allowed).toBe(true);
    });

    it('deve negar quando falta ao menos uma permissao requerida', () => {
      const allowed = hasRequiredPermissions(
        {
          role: UserRole.SUPORTE,
        },
        [Permission.FINANCEIRO_PAGAMENTOS_MANAGE],
      );

      expect(allowed).toBe(false);
    });
  });
});
