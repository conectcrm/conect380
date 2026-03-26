import {
  type LucideIcon,
  Home,
  Users,
  Settings,
  ShoppingBag,
  DollarSign,
  CreditCard,
  MessageSquare,
  Building2,
  TrendingUp,
  Target,
  BarChart3,
  FileText,
  UserCog,
  Car,
  Phone,
  Zap,
  Receipt,
  Calculator,
  Wallet,
  Shuffle,
  CheckCircle,
  Calendar,
  Ticket,
  Layers,
  ListChecks,
  Tag,
  Palette,
} from 'lucide-react';
import { isMenuItemAllowedInMvp } from './mvpScope';
import { isAtendimentoModuleVisible, isOmnichannelEnabled } from './featureFlags';
import type { User } from '../types';

export interface MenuConfig {
  id: string;
  title: string;
  shortTitle?: string;
  icon: LucideIcon;
  href?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  badge?: string;
  contextBadgeKey?: string;
  group?: string;
  children?: MenuConfig[];
  permissions?: string[];
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  requiredModule?: string; // Novo: modulo necessario para exibir item
  section?: string;
}

const filterMenuByModules = (items: MenuConfig[], modulosAtivos: string[]): MenuConfig[] => {
  return items.reduce<MenuConfig[]>((acc, item) => {
    if (item.requiredModule && !modulosAtivos.includes(item.requiredModule)) {
      return acc;
    }

    const filteredChildren = item.children ? filterMenuByModules(item.children, modulosAtivos) : undefined;

    if (item.children && (!filteredChildren || filteredChildren.length === 0)) {
      return acc;
    }

    if (filteredChildren) {
      acc.push({ ...item, children: filteredChildren });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
};

const filterMenuForMvp = (items: MenuConfig[], depth = 0): MenuConfig[] => {
  return items.reduce<MenuConfig[]>((acc, item) => {
    if (!isMenuItemAllowedInMvp(item.id, depth)) {
      return acc;
    }

    const filteredChildren = item.children ? filterMenuForMvp(item.children, depth + 1) : undefined;

    if (item.children && (!filteredChildren || filteredChildren.length === 0)) {
      return acc;
    }

    if (filteredChildren) {
      acc.push({ ...item, children: filteredChildren });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
};

export type PermissionAwareUser = Pick<User, 'email'> & {
  role?: unknown;
  roles?: unknown;
  permissoes?: unknown;
  permissions?: unknown;
};

const ALL_PERMISSION_VALUES: string[] = [
  'users.profile.update',
  'users.read',
  'users.create',
  'users.update',
  'users.reset-password',
  'users.status.update',
  'users.bulk.update',
  'planos.manage',
  'admin.empresas.manage',
  'dashboard.read',
  'relatorios.read',
  'crm.clientes.read',
  'crm.clientes.create',
  'crm.clientes.update',
  'crm.clientes.delete',
  'crm.leads.read',
  'crm.leads.create',
  'crm.leads.update',
  'crm.leads.delete',
  'crm.oportunidades.read',
  'crm.oportunidades.create',
  'crm.oportunidades.update',
  'crm.oportunidades.delete',
  'crm.produtos.read',
  'crm.produtos.create',
  'crm.produtos.update',
  'crm.produtos.delete',
  'crm.agenda.read',
  'crm.agenda.create',
  'crm.agenda.update',
  'crm.agenda.delete',
  'comercial.propostas.read',
  'comercial.propostas.create',
  'comercial.propostas.update',
  'comercial.propostas.delete',
  'comercial.propostas.send',
  'comercial.propostas.approve.override',
  'atendimento.chats.read',
  'atendimento.chats.reply',
  'atendimento.tickets.read',
  'atendimento.tickets.create',
  'atendimento.tickets.update',
  'atendimento.tickets.assign',
  'atendimento.tickets.close',
  'atendimento.filas.manage',
  'atendimento.sla.manage',
  'atendimento.dlq.manage',
  'financeiro.faturamento.read',
  'financeiro.faturamento.manage',
  'financeiro.pagamentos.read',
  'financeiro.pagamentos.manage',
  'financeiro.contas-pagar.read',
  'financeiro.contas-pagar.manage',
  'financeiro.fornecedores.read',
  'financeiro.fornecedores.manage',
  'financeiro.contas-bancarias.read',
  'financeiro.contas-bancarias.manage',
  'financeiro.conciliacao.read',
  'financeiro.conciliacao.manage',
  'financeiro.centro-custos.read',
  'financeiro.centro-custos.manage',
  'financeiro.alertas.read',
  'financeiro.alertas.manage',
  'financeiro.aprovacoes.read',
  'financeiro.aprovacoes.manage',
  'config.empresa.read',
  'config.empresa.update',
  'config.integracoes.manage',
  'config.automacoes.manage',
];

const ALL_PERMISSION_SET = new Set(ALL_PERMISSION_VALUES);

const USER_MANAGEMENT_PERMISSIONS = [
  'users.read',
  'users.create',
  'users.update',
  'users.reset-password',
  'users.status.update',
  'users.bulk.update',
];

const BASIC_PROFILE_PERMISSIONS = ['users.profile.update'];

const INSIGHTS_PERMISSIONS = ['dashboard.read', 'relatorios.read'];

const CRM_FULL_PERMISSIONS = [
  'crm.clientes.read',
  'crm.clientes.create',
  'crm.clientes.update',
  'crm.clientes.delete',
  'crm.leads.read',
  'crm.leads.create',
  'crm.leads.update',
  'crm.leads.delete',
  'crm.oportunidades.read',
  'crm.oportunidades.create',
  'crm.oportunidades.update',
  'crm.oportunidades.delete',
  'crm.produtos.read',
  'crm.produtos.create',
  'crm.produtos.update',
  'crm.produtos.delete',
  'crm.agenda.read',
  'crm.agenda.create',
  'crm.agenda.update',
  'crm.agenda.delete',
];

const COMERCIAL_FULL_PERMISSIONS = [
  'comercial.propostas.read',
  'comercial.propostas.create',
  'comercial.propostas.update',
  'comercial.propostas.delete',
  'comercial.propostas.send',
  'comercial.propostas.approve.override',
];

const ATENDIMENTO_MANAGER_PERMISSIONS = [
  'atendimento.chats.read',
  'atendimento.chats.reply',
  'atendimento.tickets.read',
  'atendimento.tickets.create',
  'atendimento.tickets.update',
  'atendimento.tickets.assign',
  'atendimento.tickets.close',
  'atendimento.filas.manage',
  'atendimento.sla.manage',
];

const CONFIG_FULL_PERMISSIONS = [
  'config.empresa.read',
  'config.empresa.update',
  'config.integracoes.manage',
  'config.automacoes.manage',
];

const VENDEDOR_CRM_PERMISSIONS = [
  'crm.clientes.read',
  'crm.clientes.create',
  'crm.clientes.update',
  'crm.leads.read',
  'crm.leads.create',
  'crm.leads.update',
  'crm.oportunidades.read',
  'crm.oportunidades.create',
  'crm.oportunidades.update',
  'crm.produtos.read',
  'crm.agenda.read',
  'crm.agenda.create',
  'crm.agenda.update',
];

const VENDEDOR_COMERCIAL_PERMISSIONS = [
  'comercial.propostas.read',
  'comercial.propostas.create',
  'comercial.propostas.update',
  'comercial.propostas.send',
];

const SUPORTE_CRM_PERMISSIONS = [
  'crm.clientes.read',
  'crm.clientes.update',
  'crm.leads.read',
];

const SUPORTE_ATENDIMENTO_PERMISSIONS = [
  'atendimento.chats.read',
  'atendimento.chats.reply',
  'atendimento.tickets.read',
  'atendimento.tickets.create',
  'atendimento.tickets.update',
  'atendimento.tickets.assign',
  'atendimento.tickets.close',
];

const FINANCEIRO_DEFAULT_PERMISSIONS = [
  'financeiro.faturamento.read',
  'financeiro.faturamento.manage',
  'financeiro.pagamentos.read',
  'financeiro.pagamentos.manage',
  'financeiro.contas-pagar.read',
  'financeiro.contas-pagar.manage',
  'financeiro.fornecedores.read',
  'financeiro.fornecedores.manage',
  'financeiro.contas-bancarias.read',
  'financeiro.contas-bancarias.manage',
  'financeiro.conciliacao.read',
  'financeiro.conciliacao.manage',
  'financeiro.centro-custos.read',
  'financeiro.centro-custos.manage',
  'financeiro.alertas.read',
  'financeiro.alertas.manage',
  'financeiro.aprovacoes.read',
  'financeiro.aprovacoes.manage',
  'comercial.propostas.read',
  'crm.clientes.read',
];

const ADMIN_OPERATIONAL_PERMISSIONS = [
  ...CRM_FULL_PERMISSIONS,
  ...COMERCIAL_FULL_PERMISSIONS,
  ...ATENDIMENTO_MANAGER_PERMISSIONS,
  ...FINANCEIRO_DEFAULT_PERMISSIONS,
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  superadmin: [...ALL_PERMISSION_VALUES],
  admin: [
    ...USER_MANAGEMENT_PERMISSIONS,
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...CONFIG_FULL_PERMISSIONS,
    ...ADMIN_OPERATIONAL_PERMISSIONS,
    'planos.manage',
    'admin.empresas.manage',
  ],
  gerente: [
    ...USER_MANAGEMENT_PERMISSIONS,
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...CRM_FULL_PERMISSIONS,
    ...COMERCIAL_FULL_PERMISSIONS,
    ...ATENDIMENTO_MANAGER_PERMISSIONS,
    'config.empresa.read',
    'config.automacoes.manage',
  ],
  vendedor: [
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...VENDEDOR_CRM_PERMISSIONS,
    ...VENDEDOR_COMERCIAL_PERMISSIONS,
  ],
  suporte: [...BASIC_PROFILE_PERMISSIONS, ...INSIGHTS_PERMISSIONS, ...SUPORTE_CRM_PERMISSIONS, ...SUPORTE_ATENDIMENTO_PERMISSIONS],
  financeiro: [...BASIC_PROFILE_PERMISSIONS, ...INSIGHTS_PERMISSIONS, ...FINANCEIRO_DEFAULT_PERMISSIONS],
};

const GENERATED_LEGACY_PERMISSION_ALIASES: Record<string, string> = ALL_PERMISSION_VALUES.reduce(
  (acc, permission) => {
    const alias = permission.toUpperCase().replace(/[.-]/g, '_');
    acc[alias] = permission;
    return acc;
  },
  {} as Record<string, string>,
);

const LEGACY_PERMISSION_ALIASES: Record<string, string> = {
  ...GENERATED_LEGACY_PERMISSION_ALIASES,
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_RESET_PASSWORD: 'users.reset-password',
  USERS_STATUS_UPDATE: 'users.status.update',
  USERS_BULK_UPDATE: 'users.bulk.update',
  USERS_PROFILE_UPDATE: 'users.profile.update',
  ADMIN_EMPRESAS_MANAGE: 'admin.empresas.manage',
  PLANOS_MANAGE: 'planos.manage',
  DASHBOARD_READ: 'dashboard.read',
  RELATORIOS_READ: 'relatorios.read',
  ATENDIMENTO_DLQ_MANAGE: 'atendimento.dlq.manage',
  COMERCIAL: 'comercial.propostas.read',
  CRM: 'crm.clientes.read',
  FINANCEIRO: 'financeiro.faturamento.read',
  CONFIGURACOES: 'config.empresa.read',
  DASHBOARD: 'dashboard.read',
  RELATORIOS: 'relatorios.read',
  USUARIOS: 'users.read',
  ATENDIMENTO: 'atendimento.tickets.read',
};

const ROLE_ALIASES: Record<string, string> = {
  manager: 'gerente',
  gestor: 'gerente',
  administrador: 'admin',
  super_admin: 'superadmin',
  owner: 'superadmin',
  proprietario: 'superadmin',
  proprietário: 'superadmin',
  user: 'suporte',
  usuario: 'suporte',
  operacional: 'suporte',
};

const FINANCEIRO_PAGAMENTOS_READ_EQUIVALENCES = [
  'financeiro.pagamentos.read',
  'financeiro.contas-pagar.read',
  'financeiro.fornecedores.read',
  'financeiro.contas-bancarias.read',
  'financeiro.conciliacao.read',
  'financeiro.centro-custos.read',
  'financeiro.alertas.read',
  'financeiro.aprovacoes.read',
];

const FINANCEIRO_PAGAMENTOS_MANAGE_EQUIVALENCES = [
  'financeiro.pagamentos.manage',
  'financeiro.contas-pagar.manage',
  'financeiro.fornecedores.manage',
  'financeiro.contas-bancarias.manage',
  'financeiro.conciliacao.manage',
  'financeiro.centro-custos.manage',
  'financeiro.alertas.manage',
  'financeiro.aprovacoes.manage',
];

const FINANCEIRO_MANAGE_TO_READ_EQUIVALENCES: Array<[string, string]> = [
  ['financeiro.faturamento.manage', 'financeiro.faturamento.read'],
  ['financeiro.pagamentos.manage', 'financeiro.pagamentos.read'],
  ['financeiro.contas-pagar.manage', 'financeiro.contas-pagar.read'],
  ['financeiro.fornecedores.manage', 'financeiro.fornecedores.read'],
  ['financeiro.contas-bancarias.manage', 'financeiro.contas-bancarias.read'],
  ['financeiro.conciliacao.manage', 'financeiro.conciliacao.read'],
  ['financeiro.centro-custos.manage', 'financeiro.centro-custos.read'],
  ['financeiro.alertas.manage', 'financeiro.alertas.read'],
  ['financeiro.aprovacoes.manage', 'financeiro.aprovacoes.read'],
];

const normalizeRole = (role: unknown): string | null => {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return ROLE_ALIASES[normalized] ?? normalized;
};

const normalizePermissionToken = (permission: unknown): string | null => {
  if (typeof permission !== 'string') {
    return null;
  }

  const trimmed = permission.trim();
  if (!trimmed) {
    return null;
  }

  const canonicalCandidate = trimmed.toLowerCase();
  if (ALL_PERMISSION_SET.has(canonicalCandidate)) {
    return canonicalCandidate;
  }

  const legacyCandidate = trimmed.toUpperCase();
  return LEGACY_PERMISSION_ALIASES[legacyCandidate] ?? null;
};

const addRolePermissions = (target: Set<string>, role: unknown): void => {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return;
  }

  const defaults = ROLE_DEFAULT_PERMISSIONS[normalizedRole] ?? [];
  defaults.forEach((permission) => target.add(permission));
};

const expandEquivalentPermissions = (target: Set<string>): void => {
  for (const [managePermission, readPermission] of FINANCEIRO_MANAGE_TO_READ_EQUIVALENCES) {
    if (target.has(managePermission)) {
      target.add(readPermission);
    }
  }

  const hasPagamentosRead = target.has('financeiro.pagamentos.read');
  const hasPagamentosManage = target.has('financeiro.pagamentos.manage');

  if (hasPagamentosRead || hasPagamentosManage) {
    FINANCEIRO_PAGAMENTOS_READ_EQUIVALENCES.forEach((permission) => target.add(permission));
  }

  if (hasPagamentosManage) {
    FINANCEIRO_PAGAMENTOS_MANAGE_EQUIVALENCES.forEach((permission) => target.add(permission));
  }
};

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
    const values = rawPermissions.includes(',') ? rawPermissions.split(',') : [rawPermissions];
    for (const item of values) {
      yield item;
    }
  }
}

const hasExplicitPermissionInput = (rawPermissions: unknown): boolean =>
  rawPermissions !== undefined && rawPermissions !== null;

export const resolveUserPermissions = (user?: PermissionAwareUser | null): Set<string> => {
  const resolved = new Set<string>();

  if (!user) {
    return resolved;
  }

  const explicitPermissions = new Set<string>();
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

  const hasExplicitPermissionSource =
    hasExplicitPermissionInput(user.permissoes) || hasExplicitPermissionInput(user.permissions);

  // Explicit permissions override role defaults.
  // Role defaults are only used for users without explicit assignments.
  if (explicitPermissions.size > 0 || hasExplicitPermissionSource) {
    explicitPermissions.forEach((permission) => resolved.add(permission));
    expandEquivalentPermissions(resolved);
    return resolved;
  }

  const roleInputs = Array.isArray(user.roles)
    ? user.roles
    : user.role !== undefined
      ? [user.role]
      : [];

  if (roleInputs.length === 0) {
    addRolePermissions(resolved, user.role);
  } else {
    roleInputs.forEach((role) => addRolePermissions(resolved, role));
  }

  expandEquivalentPermissions(resolved);

  return resolved;
};

export const userHasPermission = (
  user: PermissionAwareUser | null | undefined,
  permission: string,
): boolean => {
  const resolvedPermissions = resolveUserPermissions(user);
  return hasRequiredPermission(resolvedPermissions, permission);
};

const hasRequiredPermission = (resolvedPermissions: Set<string>, requiredPermission: string): boolean => {
  const requiredRaw = requiredPermission.trim();
  if (!requiredRaw) {
    return true;
  }

  if (requiredRaw.endsWith('.*')) {
    const prefix = requiredRaw.slice(0, -1).toLowerCase();
    for (const permission of resolvedPermissions) {
      if (permission.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  const normalizedRequired = normalizePermissionToken(requiredRaw) ?? requiredRaw.toLowerCase();
  return resolvedPermissions.has(normalizedRequired);
};

const isAdminLike = (
  user: PermissionAwareUser | null | undefined,
  resolvedPermissions?: Set<string>,
): boolean => {
  if (!user) {
    return false;
  }

  const roleInputs = Array.isArray(user.roles)
    ? user.roles
    : user.role !== undefined
      ? [user.role]
      : [];

  const hasPrivilegedRole = roleInputs.some((role) => {
    const normalizedRole = normalizeRole(role);
    return normalizedRole === 'superadmin' || normalizedRole === 'admin';
  });

  if (hasPrivilegedRole) {
    return true;
  }

  const permissions = resolvedPermissions ?? resolveUserPermissions(user);
  if (permissions.has('admin.empresas.manage')) {
    return true;
  }

  return false;
};

const isSuperAdminLike = (user: PermissionAwareUser | null | undefined): boolean => {
  if (!user) {
    return false;
  }

  const roleInputs = Array.isArray(user.roles)
    ? user.roles
    : user.role !== undefined
      ? [user.role]
      : [];

  return roleInputs.some((role) => normalizeRole(role) === 'superadmin');
};

type PermissionFilterContext = {
  resolvedPermissions: Set<string>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const canAccessMenuItem = (item: MenuConfig, context: PermissionFilterContext): boolean => {
  if (!item.permissions || item.permissions.length === 0) {
    return true;
  }

  return item.permissions.some((requiredPermission) =>
    hasRequiredPermission(context.resolvedPermissions, requiredPermission),
  );
};

const filterMenuByPermissionsInternal = (
  items: MenuConfig[],
  context: PermissionFilterContext,
): MenuConfig[] => {
  return items.reduce<MenuConfig[]>((acc, item) => {
    if (item.adminOnly && !context.isAdmin) {
      return acc;
    }

    if (item.superAdminOnly && !context.isSuperAdmin) {
      return acc;
    }

    const filteredChildren = item.children
      ? filterMenuByPermissionsInternal(item.children, context)
      : undefined;
    const hasChildren = Array.isArray(filteredChildren) && filteredChildren.length > 0;
    const hasItemAccess = canAccessMenuItem(item, context);

    if (item.children) {
      if (!hasChildren && !hasItemAccess) {
        return acc;
      }

      if (hasChildren) {
        acc.push({ ...item, children: filteredChildren });
        return acc;
      }

      acc.push({ ...item, children: undefined });
      return acc;
    }

    if (!hasItemAccess) {
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
};

const filterMenuByPermissions = (
  items: MenuConfig[],
  user?: PermissionAwareUser | null,
): MenuConfig[] => {
  if (!user) {
    return items;
  }

  const resolvedPermissions = resolveUserPermissions(user);

  const context: PermissionFilterContext = {
    resolvedPermissions,
    isAdmin: isAdminLike(user, resolvedPermissions),
    isSuperAdmin: isSuperAdminLike(user),
  };

  const filteredMenu = filterMenuByPermissionsInternal(items, context);

  // Evita duplicidade visual para perfis administrativos:
  // "Usuarios" fica centralizado em Administracao.
  if (!context.isAdmin) {
    return filteredMenu;
  }

  return filteredMenu.map((item) => {
    if (item.id !== 'configuracoes' || !Array.isArray(item.children)) {
      return item;
    }

    return {
      ...item,
      children: item.children.filter((child) => child.id !== 'configuracoes-usuarios'),
    };
  });
};

const atendimentoChildren: MenuConfig[] = [
  {
    id: 'atendimento-tickets',
    title: 'Tickets',
    icon: Ticket,
    href: '/atendimento/tickets',
    color: 'purple',
    permissions: ['atendimento.tickets.read', 'ATENDIMENTO'],
    contextBadgeKey: 'slaRisk',
    group: 'Opera\u00e7\u00e3o',
  },
  {
    id: 'atendimento-automacoes',
    title: 'Automa\u00e7\u00f5es',
    icon: Zap,
    href: '/atendimento/automacoes',
    color: 'purple',
    permissions: ['config.automacoes.manage', 'atendimento.filas.manage'],
    group: 'Gest\u00e3o',
  },
  {
    id: 'atendimento-equipe',
    title: 'Equipe',
    icon: Users,
    href: '/atendimento/equipe',
    color: 'purple',
    permissions: ['users.read', 'atendimento.filas.manage'],
    group: 'Gest\u00e3o',
  },
  {
    id: 'atendimento-analytics',
    title: 'Analytics',
    icon: BarChart3,
    href: '/atendimento/analytics',
    color: 'purple',
    permissions: ['relatorios.read'],
    group: 'Configura\u00e7\u00e3o',
  },
  {
    id: 'atendimento-configuracoes',
    title: 'Configura\u00e7\u00f5es',
    icon: Settings,
    href: '/atendimento/configuracoes',
    color: 'purple',
    permissions: ['atendimento.filas.manage', 'atendimento.sla.manage'],
    group: 'Configura\u00e7\u00e3o',
  },
];

if (isOmnichannelEnabled) {
  atendimentoChildren.unshift({
    id: 'atendimento-inbox',
    title: 'Chat',
    icon: MessageSquare,
    href: '/atendimento/inbox',
    color: 'purple',
    permissions: ['atendimento.chats.read'],
    contextBadgeKey: 'atendimentoUnread',
    group: 'Opera\u00e7\u00e3o',
  });
}

export const menuConfig: MenuConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'blue',
    permissions: ['dashboard.read'],
    section: 'Vis\u00e3o Geral',
  },
  ...(isAtendimentoModuleVisible
    ? [
        {
          id: 'atendimento',
          title: 'Atendimento',
          shortTitle: 'Atend.',
          icon: MessageSquare,
          href: isOmnichannelEnabled ? '/atendimento' : '/atendimento/tickets',
          color: 'purple',
          permissions: ['atendimento.chats.read', 'atendimento.tickets.read', 'ATENDIMENTO'],
          requiredModule: 'ATENDIMENTO', // Requer licenca de Atendimento
          section: 'Opera\u00e7\u00f5es',
          children: atendimentoChildren,
        } as MenuConfig,
      ]
    : []),
  {
    id: 'comercial',
    title: 'Comercial',
    icon: TrendingUp,
    href: '/nuclei/crm',
    color: 'blue',
    permissions: [
      'crm.clientes.read',
      'crm.leads.read',
      'crm.oportunidades.read',
      'comercial.propostas.read',
      'crm.produtos.read',
    ],
    requiredModule: 'CRM', //  Requer licenca CRM (base para comercial)
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'comercial-clientes',
        title: 'Clientes',
        icon: Users,
        href: '/crm/clientes',
        color: 'blue',
        permissions: ['crm.clientes.read'],
        group: 'Relacionamento',
      },
      {
        id: 'comercial-contatos',
        title: 'Contatos',
        icon: Phone,
        href: '/crm/contatos',
        color: 'blue',
        permissions: ['crm.clientes.read'],
        group: 'Relacionamento',
      },
      {
        id: 'comercial-leads',
        title: 'Leads',
        icon: Target,
        href: '/crm/leads',
        color: 'blue',
        permissions: ['crm.leads.read'],
        group: 'Relacionamento',
      },
      {
        id: 'comercial-agenda',
        title: 'Agenda',
        icon: Calendar,
        href: '/crm/agenda',
        color: 'blue',
        permissions: ['crm.agenda.read'],
        requiredModule: 'CRM',
        group: 'Relacionamento',
      },
      {
        id: 'comercial-pipeline',
        title: 'Pipeline de Vendas',
        shortTitle: 'Pipeline',
        icon: TrendingUp,
        href: '/crm/pipeline',
        color: 'blue',
        permissions: ['crm.oportunidades.read'],
        group: 'Vendas',
      },
      {
        id: 'comercial-propostas',
        title: 'Propostas',
        icon: FileText,
        href: '/vendas/propostas',
        color: 'blue',
        permissions: ['comercial.propostas.read'],
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-contratos',
        title: 'Contratos',
        icon: FileText,
        href: '/contratos',
        color: 'blue',
        permissions: ['comercial.propostas.read'],
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-analytics',
        title: 'Central de Relatorios',
        icon: BarChart3,
        href: '/relatorios',
        color: 'blue',
        permissions: ['relatorios.read'],
        requiredModule: 'CRM',
        group: 'Vendas',
      },
      {
        id: 'comercial-produtos',
        title: 'Catalogo de Itens',
        shortTitle: 'Itens',
        icon: ShoppingBag,
        href: '/vendas/produtos',
        color: 'blue',
        permissions: ['crm.produtos.read'],
        requiredModule: 'VENDAS',
        group: 'Cat\u00e1logo',
      },
      {
        id: 'comercial-veiculos',
        title: 'Estoque de Veiculos',
        shortTitle: 'Veiculos',
        icon: Car,
        href: '/vendas/veiculos',
        color: 'blue',
        permissions: ['crm.produtos.read'],
        requiredModule: 'VENDAS',
        group: 'Cat\u00e1logo',
      },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    shortTitle: 'Fin.',
    icon: DollarSign,
    href: '/nuclei/financeiro',
    color: 'orange',
    permissions: [
      'financeiro.faturamento.read',
      'financeiro.pagamentos.read',
      'financeiro.contas-pagar.read',
      'financeiro.fornecedores.read',
      'financeiro.contas-bancarias.read',
      'financeiro.conciliacao.read',
      'financeiro.centro-custos.read',
      'financeiro.alertas.read',
      'financeiro.aprovacoes.read',
    ],
    requiredModule: 'FINANCEIRO', //  Requer licenca de Financeiro
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'financeiro-faturamento',
        title: 'Faturamento',
        icon: Receipt,
        href: '/financeiro/faturamento',
        color: 'orange',
        permissions: ['financeiro.faturamento.read', 'financeiro.faturamento.manage'],
        requiredModule: 'BILLING',
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-contas-pagar',
        title: 'Contas a Pagar',
        shortTitle: 'A Pagar',
        icon: Calculator,
        href: '/financeiro/contas-pagar',
        color: 'orange',
        permissions: ['financeiro.contas-pagar.read'],
        group: 'Fluxo Financeiro',
      },
      {
        id: 'comercial-cotacoes',
        title: 'Cotacoes de Compras',
        shortTitle: 'Cotacoes',
        icon: Calculator,
        href: '/financeiro/cotacoes',
        color: 'orange',
        permissions: ['financeiro.contas-pagar.read'],
        requiredModule: 'FINANCEIRO',
        group: 'Compras',
      },
      {
        id: 'comercial-aprovacoes',
        title: 'Aprovacoes de Compras',
        shortTitle: 'Aprovacoes',
        icon: CheckCircle,
        href: '/financeiro/compras/aprovacoes',
        color: 'orange',
        permissions: ['financeiro.aprovacoes.manage'],
        requiredModule: 'FINANCEIRO',
        group: 'Compras',
      },
      {
        id: 'financeiro-fornecedores',
        title: 'Fornecedores',
        icon: Building2,
        href: '/financeiro/fornecedores',
        color: 'orange',
        permissions: ['financeiro.fornecedores.read'],
        group: 'Cadastros',
      },
      {
        id: 'financeiro-contas-bancarias',
        title: 'Contas Bancarias',
        shortTitle: 'Bancarias',
        icon: Wallet,
        href: '/financeiro/contas-bancarias',
        color: 'orange',
        permissions: ['financeiro.contas-bancarias.read'],
        group: 'Cadastros',
      },
      {
        id: 'financeiro-centro-custos',
        title: 'Centro de Custos',
        shortTitle: 'Centros',
        icon: Layers,
        href: '/financeiro/centro-custos',
        color: 'orange',
        permissions: ['financeiro.centro-custos.read'],
        group: 'Cadastros',
      },
      {
        id: 'financeiro-aprovacoes',
        title: 'Aprovacoes Financeiras',
        shortTitle: 'Aprovacoes',
        icon: ListChecks,
        href: '/financeiro/aprovacoes',
        color: 'orange',
        permissions: ['financeiro.aprovacoes.manage'],
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-conciliacao',
        title: 'Conciliacao Bancaria',
        shortTitle: 'Conciliacao',
        icon: Shuffle,
        href: '/financeiro/conciliacao',
        color: 'orange',
        permissions: ['financeiro.conciliacao.read'],
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-relatorios',
        title: 'Relatorios Financeiros',
        shortTitle: 'Relatorios',
        icon: BarChart3,
        href: '/financeiro/relatorios',
        color: 'orange',
        permissions: ['financeiro.faturamento.read', 'relatorios.read'],
        group: 'Fluxo Financeiro',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Assinatura',
    shortTitle: 'Assin.',
    icon: CreditCard,
    href: '/billing/assinaturas',
    color: 'green',
    permissions: ['planos.manage'],
    requiredModule: 'BILLING', //  Requer licenca de Billing
    section: 'Opera\u00e7\u00f5es',
  },
  {
    id: 'configuracoes',
    title: 'Configura\u00e7\u00f5es',
    shortTitle: 'Config',
    icon: Settings,
    href: '/configuracoes/empresa',
    color: 'purple',
    permissions: ['config.empresa.read', 'users.read', 'config.integracoes.manage'],
    section: 'Administra\u00e7\u00e3o',
    children: [
      {
        id: 'configuracoes-empresa',
        title: 'Empresa',
        icon: Building2,
        href: '/configuracoes/empresa',
        color: 'purple',
        permissions: ['config.empresa.read'],
        group: 'Base',
      },
      {
        id: 'configuracoes-usuarios',
        title: 'Usu\u00e1rios',
        icon: UserCog,
        href: '/configuracoes/usuarios',
        color: 'purple',
        permissions: ['users.read'],
        group: 'Base',
      },
      {
        id: 'configuracoes-metas',
        title: 'Metas Comerciais',
        shortTitle: 'Metas',
        icon: Target,
        href: '/configuracoes/metas',
        color: 'purple',
        permissions: ['config.empresa.update'],
        group: 'Comercial',
      },
      {
        id: 'configuracoes-integracoes',
        title: 'Integra\u00e7\u00f5es',
        icon: Zap,
        href: '/configuracoes/integracoes',
        color: 'purple',
        permissions: ['config.integracoes.manage'],
        group: 'Comercial',
      },
      {
        id: 'configuracoes-tickets',
        title: 'Tickets',
        icon: Settings,
        color: 'purple',
        permissions: ['atendimento.filas.manage', 'atendimento.sla.manage'],
        group: 'Atendimento',
        children: [
          {
            id: 'configuracoes-tickets-niveis',
            title: 'N\u00edveis de Atendimento',
            shortTitle: 'N\u00edveis',
            icon: Layers,
            href: '/configuracoes/tickets/niveis',
            color: 'purple',
            permissions: ['atendimento.sla.manage'],
          },
          {
            id: 'configuracoes-tickets-status',
            title: 'Status Customizados',
            shortTitle: 'Status',
            icon: ListChecks,
            href: '/configuracoes/tickets/status',
            color: 'purple',
            permissions: ['atendimento.filas.manage'],
          },
          {
            id: 'configuracoes-tickets-tipos',
            title: 'Tipos de Servi\u00e7o',
            shortTitle: 'Tipos',
            icon: Tag,
            href: '/configuracoes/tickets/tipos',
            color: 'purple',
            permissions: ['atendimento.filas.manage'],
          },
        ],
      },
    ],
  },
  {
    id: 'administracao',
    title: 'Administra\u00e7\u00e3o',
    shortTitle: 'Admin',
    icon: Building2,
    color: 'blue',
    adminOnly: true,
    requiredModule: 'ADMINISTRACAO',
    section: 'Administra\u00e7\u00e3o',
    children: [
      {
        id: 'admin-empresas',
        title: 'Gest\u00e3o de Empresas',
        shortTitle: 'Empresas',
        icon: Users,
        href: '/empresas/minhas',
        color: 'blue',
        permissions: ['admin.empresas.manage'],
        group: 'Governan\u00e7a',
      },
      {
        id: 'admin-usuarios',
        title: 'Usu\u00e1rios do Sistema',
        shortTitle: 'Usu\u00e1rios',
        icon: UserCog,
        href: '/configuracoes/usuarios',
        color: 'blue',
        permissions: ['users.read'],
        group: 'Governan\u00e7a',
      },
      {
        id: 'admin-sistema',
        title: 'Branding Global',
        shortTitle: 'Branding',
        icon: Palette,
        href: '/configuracoes/sistema',
        color: 'blue',
        permissions: ['admin.empresas.manage'],
        superAdminOnly: true,
        group: 'Governan\u00e7a',
      },
    ],
  },
];

/**
 * Filtra menu com base nos modulos ativos da empresa
 * @param modulosAtivos Array de modulos que a empresa tem licenca
 * @param user Usuario logado para filtro de permissoes
 * @returns Menu filtrado
 */
export const getMenuParaEmpresa = (
  modulosAtivos: string[],
  user?: PermissionAwareUser | null,
): MenuConfig[] => {
  const menuPorModulo = filterMenuByModules(menuConfig, modulosAtivos);
  const menuPorPermissao = filterMenuByPermissions(menuPorModulo, user);
  return filterMenuForMvp(menuPorPermissao);
};

type RoutePermissionRule = {
  pattern: string;
  permissions: string[];
  match?: 'any' | 'all';
};

type LicensedModule =
  | 'ATENDIMENTO'
  | 'CRM'
  | 'VENDAS'
  | 'FINANCEIRO'
  | 'BILLING'
  | 'ADMINISTRACAO';

const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { pattern: '/atendimento/inbox', permissions: ['atendimento.chats.read'] },
  { pattern: '/atendimento/tickets', permissions: ['atendimento.tickets.read'] },
  {
    pattern: '/atendimento/automacoes',
    permissions: ['config.automacoes.manage', 'atendimento.filas.manage'],
  },
  {
    pattern: '/atendimento/equipe',
    permissions: ['users.read', 'atendimento.filas.manage'],
  },
  {
    pattern: '/atendimento/configuracoes',
    permissions: ['atendimento.filas.manage', 'atendimento.sla.manage'],
  },
  {
    pattern: '/configuracoes/tickets',
    permissions: ['atendimento.filas.manage', 'atendimento.sla.manage'],
  },
  { pattern: '/configuracoes/tickets/niveis', permissions: ['atendimento.sla.manage'] },
  { pattern: '/configuracoes/tickets/status', permissions: ['atendimento.filas.manage'] },
  { pattern: '/configuracoes/tickets/tipos', permissions: ['atendimento.filas.manage'] },
  {
    pattern: '/atendimento/tickets/novo',
    permissions: ['atendimento.tickets.create', 'crm.clientes.read'],
    match: 'all',
  },
  { pattern: '/atendimento/tickets/:id', permissions: ['atendimento.tickets.read'] },
  { pattern: '/clientes', permissions: ['crm.clientes.read'] },
  { pattern: '/clientes/:id', permissions: ['crm.clientes.read'] },
  { pattern: '/crm/clientes', permissions: ['crm.clientes.read'] },
  { pattern: '/crm/clientes/:id', permissions: ['crm.clientes.read'] },
  { pattern: '/contatos', permissions: ['crm.clientes.read'] },
  { pattern: '/crm/contatos', permissions: ['crm.clientes.read'] },
  { pattern: '/crm/interacoes', permissions: ['crm.clientes.read'] },
  { pattern: '/leads', permissions: ['crm.leads.read'] },
  { pattern: '/crm/leads', permissions: ['crm.leads.read'] },
  { pattern: '/pipeline', permissions: ['crm.oportunidades.read'] },
  { pattern: '/crm/pipeline', permissions: ['crm.oportunidades.read'] },
  { pattern: '/agenda', permissions: ['crm.agenda.read'] },
  { pattern: '/crm/agenda', permissions: ['crm.agenda.read'] },
  { pattern: '/propostas', permissions: ['comercial.propostas.read'] },
  { pattern: '/propostas/:id', permissions: ['comercial.propostas.read'] },
  { pattern: '/vendas/propostas', permissions: ['comercial.propostas.read'] },
  { pattern: '/vendas/propostas/:id', permissions: ['comercial.propostas.read'] },
  { pattern: '/produtos', permissions: ['crm.produtos.read'] },
  { pattern: '/produtos/categorias', permissions: ['crm.produtos.read'] },
  { pattern: '/vendas/produtos', permissions: ['crm.produtos.read'] },
  { pattern: '/contratos', permissions: ['comercial.propostas.read'] },
  { pattern: '/contratos/:id', permissions: ['comercial.propostas.read'] },
  { pattern: '/atendimento/distribuicao', permissions: ['atendimento.filas.manage'] },
  { pattern: '/atendimento/distribuicao/dashboard', permissions: ['relatorios.read'] },
  { pattern: '/atendimento/fechamento-automatico', permissions: ['atendimento.sla.manage'] },
  { pattern: '/atendimento/analytics', permissions: ['relatorios.read'] },
  { pattern: '/atendimento/dashboard-analytics', permissions: ['relatorios.read'] },
  { pattern: '/nuclei/atendimento/canais/email', permissions: ['config.integracoes.manage'] },
  { pattern: '/nuclei/atendimento/sla/configuracoes', permissions: ['atendimento.sla.manage'] },
  { pattern: '/nuclei/atendimento/distribuicao/configuracao', permissions: ['atendimento.filas.manage'] },
  { pattern: '/nuclei/atendimento/distribuicao/skills', permissions: ['atendimento.filas.manage'] },
  { pattern: '/nuclei/atendimento/sla/dashboard', permissions: ['relatorios.read'] },
  { pattern: '/nuclei/atendimento/distribuicao/dashboard', permissions: ['relatorios.read'] },
  { pattern: '/nuclei/atendimento/templates', permissions: ['atendimento.chats.reply'] },
  { pattern: '/atendimento/bot', permissions: ['config.automacoes.manage'] },
  { pattern: '/atendimento/regras', permissions: ['config.automacoes.manage'] },
  { pattern: '/nuclei/atendimento/filas', permissions: ['atendimento.filas.manage'] },
  { pattern: '/nuclei/atendimento/atendentes', permissions: ['atendimento.filas.manage'] },
  { pattern: '/nuclei/atendimento/skills', permissions: ['atendimento.filas.manage'] },
  {
    pattern: '/financeiro/cotacoes',
    permissions: ['financeiro.contas-pagar.read'],
  },
  {
    pattern: '/financeiro/compras/aprovacoes',
    permissions: ['financeiro.aprovacoes.manage'],
  },
  {
    pattern: '/vendas/cotacoes',
    permissions: ['financeiro.contas-pagar.read'],
  },
  {
    pattern: '/vendas/aprovacoes',
    permissions: ['financeiro.aprovacoes.manage'],
  },
  {
    pattern: '/veiculos',
    permissions: ['crm.produtos.read'],
  },
  {
    pattern: '/vendas/veiculos',
    permissions: ['crm.produtos.read'],
  },
  {
    pattern: '/financeiro',
    permissions: [
      'financeiro.faturamento.read',
      'financeiro.pagamentos.read',
      'financeiro.contas-pagar.read',
      'financeiro.fornecedores.read',
      'financeiro.contas-bancarias.read',
      'financeiro.conciliacao.read',
      'financeiro.centro-custos.read',
      'financeiro.alertas.read',
      'financeiro.aprovacoes.read',
    ],
  },
  { pattern: '/financeiro/faturamento', permissions: ['financeiro.faturamento.read'] },
  { pattern: '/financeiro/contas-pagar', permissions: ['financeiro.contas-pagar.read'] },
  { pattern: '/financeiro/fornecedores', permissions: ['financeiro.fornecedores.read'] },
  { pattern: '/financeiro/fornecedores/:fornecedorId', permissions: ['financeiro.fornecedores.read'] },
  { pattern: '/financeiro/contas-bancarias', permissions: ['financeiro.contas-bancarias.read'] },
  {
    pattern: '/financeiro/relatorios',
    permissions: ['financeiro.faturamento.read', 'relatorios.read'],
    match: 'all',
  },
  { pattern: '/relatorios', permissions: ['relatorios.read'] },
  {
    pattern: '/relatorios/comercial',
    permissions: ['crm.oportunidades.read', 'relatorios.read'],
    match: 'all',
  },
  {
    pattern: '/relatorios/comercial/drilldown',
    permissions: ['crm.oportunidades.read', 'relatorios.read'],
    match: 'all',
  },
  {
    pattern: '/relatorios/comercial/propostas-contratos',
    permissions: ['comercial.propostas.read', 'relatorios.read'],
    match: 'all',
  },
  {
    pattern: '/relatorios/comercial/clientes-leads',
    permissions: ['crm.clientes.read', 'crm.leads.read', 'relatorios.read'],
    match: 'all',
  },
  {
    pattern: '/relatorios/agenda',
    permissions: ['crm.agenda.read', 'relatorios.read'],
    match: 'all',
  },
  {
    pattern: '/relatorios/financeiro',
    permissions: ['financeiro.faturamento.read', 'relatorios.read'],
    match: 'all',
  },
  { pattern: '/financeiro/contas-receber', permissions: ['financeiro.faturamento.read'] },
  { pattern: '/financeiro/fluxo-caixa', permissions: ['financeiro.faturamento.read'] },
  { pattern: '/financeiro/conciliacao', permissions: ['financeiro.conciliacao.read'] },
  { pattern: '/financeiro/aprovacoes', permissions: ['financeiro.aprovacoes.manage'] },
  { pattern: '/financeiro/centro-custos', permissions: ['financeiro.centro-custos.read'] },
  { pattern: '/financeiro/tesouraria', permissions: ['financeiro.faturamento.read'] },
  { pattern: '/configuracoes/departamentos', permissions: ['config.automacoes.manage'] },
  {
    pattern: '/gestao/permissoes',
    permissions: ['users.read', 'admin.empresas.manage'],
    match: 'all',
  },
  { pattern: '/gestao/empresas', permissions: ['admin.empresas.manage'] },
  { pattern: '/gestao/nucleos', permissions: ['admin.empresas.manage'] },
  { pattern: '/gestao/equipes', permissions: ['users.read'] },
  { pattern: '/gestao/atendentes', permissions: ['atendimento.filas.manage'] },
  { pattern: '/gestao/tags', permissions: ['atendimento.filas.manage'] },
  { pattern: '/gestao/atribuicoes', permissions: ['atendimento.filas.manage'] },
  { pattern: '/gestao/departamentos', permissions: ['config.automacoes.manage'] },
  { pattern: '/gestao/fluxos', permissions: ['config.automacoes.manage'] },
  { pattern: '/gestao/fluxos/:id/builder', permissions: ['config.automacoes.manage'] },
  { pattern: '/gestao/fluxos/novo/builder', permissions: ['config.automacoes.manage'] },
  { pattern: '/agenda/eventos/:id', permissions: ['crm.agenda.read'] },
  { pattern: '/crm/agenda/eventos/:id', permissions: ['crm.agenda.read'] },
  { pattern: '/empresas/minhas', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/:empresaId/configuracoes', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/:empresaId/relatorios', permissions: ['admin.empresas.manage'] },
  {
    pattern: '/empresas/:empresaId/permissoes',
    permissions: ['users.read', 'admin.empresas.manage'],
    match: 'all',
  },
];

const ROUTE_PATH_ALIASES: Record<string, string[]> = {
  '/clientes': ['/crm/clientes'],
  '/contatos': ['/crm/contatos'],
  '/leads': ['/crm/leads'],
  '/pipeline': ['/crm/pipeline'],
  '/funil-vendas': ['/crm/pipeline'],
  '/oportunidades': ['/crm/pipeline'],
  '/propostas': ['/vendas/propostas'],
  '/cotacoes': ['/financeiro/cotacoes', '/vendas/cotacoes'],
  '/orcamentos': ['/financeiro/cotacoes', '/vendas/cotacoes'],
  '/aprovacoes/pendentes': ['/financeiro/compras/aprovacoes', '/vendas/aprovacoes'],
  '/produtos': ['/vendas/produtos'],
  '/produtos/categorias': ['/vendas/produtos'],
  '/veiculos': ['/vendas/veiculos'],
  '/agenda': ['/crm/agenda'],
  '/billing': ['/billing/assinaturas'],
  '/assinaturas': ['/billing/assinaturas'],
  '/billing/faturas': ['/billing/assinaturas'],
  '/billing/pagamentos': ['/billing/assinaturas'],
  '/faturamento': ['/financeiro/faturamento'],
  '/financeiro': ['/nuclei/financeiro', '/financeiro/faturamento'],
  '/demandas': ['/atendimento/tickets'],
  '/nuclei/atendimento/demandas': ['/atendimento/tickets'],
  '/nuclei/atendimento/tickets': ['/atendimento/tickets'],
  '/nuclei/atendimento/tickets/novo': ['/atendimento/tickets/novo'],
  '/gestao/empresas': ['/empresas/minhas'],
  '/gestao/usuarios': ['/configuracoes/usuarios', '/nuclei/configuracoes/usuarios'],
  '/gestao/fluxos': ['/atendimento/automacoes'],
  '/configuracoes/email': ['/nuclei/configuracoes/email', '/configuracoes/empresa'],
  '/configuracoes/departamentos': ['/nuclei/configuracoes/departamentos'],
  '/configuracoes/tickets': ['/atendimento/configuracoes'],
  '/configuracoes': ['/nuclei/configuracoes'],
  '/configuracoes/empresa': ['/nuclei/configuracoes/empresa'],
  '/configuracoes/seguranca': ['/configuracoes/empresa'],
  '/configuracoes/usuarios': ['/nuclei/configuracoes/usuarios'],
  '/configuracoes/metas': ['/nuclei/configuracoes/metas'],
  '/configuracoes/integracoes': ['/nuclei/configuracoes/integracoes'],
  '/configuracoes/tickets/niveis': ['/nuclei/configuracoes/tickets/niveis'],
  '/configuracoes/tickets/status': ['/nuclei/configuracoes/tickets/status'],
  '/configuracoes/tickets/tipos': ['/nuclei/configuracoes/tickets/tipos'],
};

const ROUTE_MODULE_REQUIREMENTS: Array<{ pattern: string; module: LicensedModule }> = [
  { pattern: '/billing', module: 'BILLING' },
  { pattern: '/assinaturas', module: 'BILLING' },
  { pattern: '/faturamento', module: 'BILLING' },

  { pattern: '/financeiro', module: 'FINANCEIRO' },
  { pattern: '/vendas/cotacoes', module: 'FINANCEIRO' },
  { pattern: '/vendas/aprovacoes', module: 'FINANCEIRO' },

  { pattern: '/atendimento', module: 'ATENDIMENTO' },
  { pattern: '/nuclei/atendimento', module: 'ATENDIMENTO' },
  { pattern: '/gestao/atendentes', module: 'ATENDIMENTO' },
  { pattern: '/gestao/tags', module: 'ATENDIMENTO' },
  { pattern: '/gestao/atribuicoes', module: 'ATENDIMENTO' },
  { pattern: '/gestao/departamentos', module: 'ATENDIMENTO' },
  { pattern: '/gestao/fluxos', module: 'ATENDIMENTO' },
  { pattern: '/configuracoes/departamentos', module: 'ATENDIMENTO' },

  { pattern: '/clientes', module: 'CRM' },
  { pattern: '/contatos', module: 'CRM' },
  { pattern: '/crm', module: 'CRM' },
  { pattern: '/leads', module: 'CRM' },
  { pattern: '/pipeline', module: 'CRM' },
  { pattern: '/oportunidades', module: 'CRM' },
  { pattern: '/agenda', module: 'CRM' },
  { pattern: '/veiculos', module: 'CRM' },
  { pattern: '/produtos', module: 'CRM' },

  { pattern: '/contratos', module: 'VENDAS' },
  { pattern: '/propostas', module: 'VENDAS' },
  { pattern: '/relatorios/comercial/propostas-contratos', module: 'VENDAS' },
  { pattern: '/relatorios/comercial/clientes-leads', module: 'CRM' },

  { pattern: '/gestao/permissoes', module: 'ADMINISTRACAO' },
  { pattern: '/gestao/empresas', module: 'ADMINISTRACAO' },
  { pattern: '/gestao/nucleos', module: 'ADMINISTRACAO' },
  { pattern: '/empresas/minhas', module: 'ADMINISTRACAO' },
  { pattern: '/configuracoes/sistema', module: 'ADMINISTRACAO' },
  { pattern: '/empresas/:empresaId/configuracoes', module: 'ADMINISTRACAO' },
  { pattern: '/empresas/:empresaId/relatorios', module: 'ADMINISTRACAO' },
  { pattern: '/empresas/:empresaId/permissoes', module: 'ADMINISTRACAO' },
];

const normalizePathname = (pathname: string): string => {
  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

const isPathMatch = (pathname: string, candidate: string): boolean => {
  const normalizedPath = normalizePathname(pathname);
  const normalizedCandidate = normalizePathname(candidate);

  if (normalizedPath === normalizedCandidate) {
    return true;
  }

  return normalizedPath.startsWith(`${normalizedCandidate}/`);
};

type PathMatchRule = {
  path: string;
  allowNested: boolean;
};

const isPathMatchRule = (pathname: string, rule: PathMatchRule): boolean => {
  const normalizedPath = normalizePathname(pathname);
  const normalizedRulePath = normalizePathname(rule.path);

  if (normalizedPath === normalizedRulePath) {
    return true;
  }

  if (!rule.allowNested) {
    return false;
  }

  return normalizedPath.startsWith(`${normalizedRulePath}/`);
};

const flattenMenuPathRules = (items: MenuConfig[]): PathMatchRule[] => {
  const rules: PathMatchRule[] = [];

  const visit = (entry: MenuConfig): void => {
    if (entry.href) {
      const hasChildren = Array.isArray(entry.children) && entry.children.length > 0;
      rules.push({
        path: entry.href,
        allowNested: !hasChildren,
      });
    }

    (entry.children || []).forEach(visit);
  };

  items.forEach(visit);
  return rules;
};

const matchesPattern = (pathname: string, pattern: string): boolean => {
  const normalizedPath = normalizePathname(pathname);
  const normalizedPattern = normalizePathname(pattern);
  const pathParts = normalizedPath.split('/').filter(Boolean);
  const patternParts = normalizedPattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) {
    return false;
  }

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(':')) {
      continue;
    }

    if (patternPart !== pathPart) {
      return false;
    }
  }

  return true;
};

const buildAliasLookup = (): Record<string, string[]> => {
  const lookup: Record<string, Set<string>> = {};

  const add = (from: string, to: string): void => {
    if (!lookup[from]) {
      lookup[from] = new Set<string>();
    }
    lookup[from].add(to);
  };

  Object.entries(ROUTE_PATH_ALIASES).forEach(([source, aliases]) => {
    aliases.forEach((alias) => {
      add(source, alias);
      add(alias, source);
    });
  });

  return Object.fromEntries(
    Object.entries(lookup).map(([key, values]) => [key, Array.from(values)]),
  );
};

const ROUTE_ALIAS_LOOKUP = buildAliasLookup();

const resolveRequiredModuleForPath = (pathname: string): LicensedModule | null => {
  const normalizedPath = normalizePathname(pathname);
  const candidates = [normalizedPath, ...(ROUTE_ALIAS_LOOKUP[normalizedPath] || [])];

  let bestMatch: { pattern: string; module: LicensedModule } | null = null;

  ROUTE_MODULE_REQUIREMENTS.forEach((rule) => {
    const hasMatch = candidates.some(
      (candidate) => matchesPattern(candidate, rule.pattern) || isPathMatch(candidate, rule.pattern),
    );

    if (!hasMatch) {
      return;
    }

    if (!bestMatch || rule.pattern.length > bestMatch.pattern.length) {
      bestMatch = rule;
    }
  });

  return bestMatch?.module ?? null;
};

const mergePathRules = (rules: PathMatchRule[]): PathMatchRule[] => {
  const merged = new Map<string, boolean>();
  rules.forEach((rule) => {
    const normalizedPath = normalizePathname(rule.path);
    const current = merged.get(normalizedPath) ?? false;
    merged.set(normalizedPath, current || rule.allowNested);
  });

  return Array.from(merged.entries()).map(([path, allowNested]) => ({
    path,
    allowNested,
  }));
};

const expandRouteAliases = (rules: PathMatchRule[]): PathMatchRule[] => {
  const expanded = new Map<string, boolean>();
  const queue: PathMatchRule[] = [];

  mergePathRules(rules).forEach((rule) => {
    const normalizedPath = normalizePathname(rule.path);
    expanded.set(normalizedPath, rule.allowNested);
    queue.push({
      path: normalizedPath,
      allowNested: rule.allowNested,
    });
  });

  while (queue.length > 0) {
    const currentRule = queue.shift();
    if (!currentRule) {
      continue;
    }

    const aliases = ROUTE_ALIAS_LOOKUP[currentRule.path] || [];
    aliases.forEach((alias) => {
      const normalizedAlias = normalizePathname(alias);
      const previousAllowNested = expanded.get(normalizedAlias) ?? false;
      const nextAllowNested = previousAllowNested || currentRule.allowNested;

      if (!expanded.has(normalizedAlias) || previousAllowNested !== nextAllowNested) {
        expanded.set(normalizedAlias, nextAllowNested);
        queue.push({
          path: normalizedAlias,
          allowNested: nextAllowNested,
        });
      }
    });
  }

  return Array.from(expanded.entries()).map(([path, allowNested]) => ({
    path,
    allowNested,
  }));
};

const ALL_PROTECTED_ROUTE_PREFIXES: string[] = (() => {
  const all = new Set<string>(flattenMenuPathRules(menuConfig).map((rule) => rule.path));
  Object.entries(ROUTE_PATH_ALIASES).forEach(([source, aliases]) => {
    all.add(source);
    aliases.forEach((alias) => all.add(alias));
  });

  ROUTE_PERMISSION_RULES.forEach((rule) => {
    const staticPrefix = normalizePathname(rule.pattern).split('/:')[0];
    if (staticPrefix) {
      all.add(staticPrefix);
    }
  });

  return Array.from(all);
})();

const BLOCKED_LEGACY_ROUTE_PREFIXES = ['/admin'];

export const canUserAccessPath = (
  pathname: string,
  modulosAtivos: string[],
  user?: PermissionAwareUser | null,
): boolean => {
  const normalizedPath = normalizePathname(pathname);

  const isBlockedLegacyNucleusAdministrationPath =
    normalizedPath.startsWith('/nuclei/') && normalizedPath.includes('administracao');

  if (
    BLOCKED_LEGACY_ROUTE_PREFIXES.some((prefix) => isPathMatch(normalizedPath, prefix)) ||
    isBlockedLegacyNucleusAdministrationPath
  ) {
    return false;
  }

  const requiredModule = resolveRequiredModuleForPath(normalizedPath);
  if (requiredModule && !modulosAtivos.includes(requiredModule)) {
    return false;
  }

  const matchedRule = ROUTE_PERMISSION_RULES.find((rule) => matchesPattern(normalizedPath, rule.pattern));
  if (matchedRule) {
    const resolvedPermissions = resolveUserPermissions(user);
    if (matchedRule.match === 'all') {
      return matchedRule.permissions.every((permission) =>
        hasRequiredPermission(resolvedPermissions, permission),
      );
    }

    return matchedRule.permissions.some((permission) =>
      hasRequiredPermission(resolvedPermissions, permission),
    );
  }

  const isProtectedPath = ALL_PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    isPathMatch(normalizedPath, prefix),
  );

  if (!isProtectedPath) {
    return true;
  }

  const allowedMenu = getMenuParaEmpresa(modulosAtivos, user);
  const allowedPathRules = expandRouteAliases(flattenMenuPathRules(allowedMenu));

  return allowedPathRules.some((allowedRule) =>
    isPathMatchRule(normalizedPath, allowedRule),
  );
};

const collectNavigableMenuPaths = (items: MenuConfig[]): string[] => {
  const paths: string[] = [];

  const visit = (entry: MenuConfig): void => {
    if (entry.href) {
      paths.push(normalizePathname(entry.href));
    }

    (entry.children || []).forEach(visit);
  };

  items.forEach(visit);
  return paths;
};

export const getDefaultAuthorizedPath = (
  modulosAtivos: string[],
  user?: PermissionAwareUser | null,
  options?: {
    fallbackPath?: string;
    excludePaths?: string[];
  },
): string => {
  const fallbackPath = normalizePathname(options?.fallbackPath ?? '/dashboard');
  const excludedPaths = new Set(
    (options?.excludePaths ?? []).map((path) => normalizePathname(path)),
  );
  const allowedMenu = getMenuParaEmpresa(modulosAtivos, user);
  const orderedPaths = collectNavigableMenuPaths(allowedMenu);

  for (const candidatePath of orderedPaths) {
    if (excludedPaths.has(candidatePath)) {
      continue;
    }

    if (canUserAccessPath(candidatePath, modulosAtivos, user)) {
      return candidatePath;
    }
  }

  if (
    !excludedPaths.has(fallbackPath) &&
    canUserAccessPath(fallbackPath, modulosAtivos, user)
  ) {
    return fallbackPath;
  }

  return fallbackPath;
};

export default menuConfig;
