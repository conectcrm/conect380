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
  BarChart,
  FileText,
  Shield,
  Database,
  UserCog,
  Archive,
  Phone,
  Zap,
  LineChart,
  Receipt,
  Calculator,
  Wallet,
  Mail,
  Shuffle,
  Clock,
  CheckCircle,
  Calendar,
  ClipboardList,
  Ticket,
  Layers,
  ListChecks,
  Tag,
} from 'lucide-react';
import { isMenuItemAllowedInMvp } from './mvpScope';
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
];

const ATENDIMENTO_FULL_PERMISSIONS = [
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

const FINANCEIRO_FULL_PERMISSIONS = [
  'financeiro.faturamento.read',
  'financeiro.faturamento.manage',
  'financeiro.pagamentos.read',
  'financeiro.pagamentos.manage',
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
  'comercial.propostas.read',
  'crm.clientes.read',
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  superadmin: [...ALL_PERMISSION_VALUES],
  admin: [
    ...USER_MANAGEMENT_PERMISSIONS,
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...CRM_FULL_PERMISSIONS,
    ...COMERCIAL_FULL_PERMISSIONS,
    ...ATENDIMENTO_FULL_PERMISSIONS,
    ...FINANCEIRO_FULL_PERMISSIONS,
    ...CONFIG_FULL_PERMISSIONS,
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
  user: 'suporte',
  usuario: 'suporte',
  operacional: 'suporte',
};

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

  // Explicit permissions override role defaults.
  // Role defaults are only used for users without explicit assignments.
  if (explicitPermissions.size > 0) {
    explicitPermissions.forEach((permission) => resolved.add(permission));
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

const isAdminLike = (user?: PermissionAwareUser | null): boolean => {
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
    return normalizedRole === 'superadmin' || normalizedRole === 'admin' || normalizedRole === 'gerente';
  });

  if (hasPrivilegedRole) {
    return true;
  }

  return typeof user.email === 'string' && user.email.toLowerCase().includes('admin');
};

type PermissionFilterContext = {
  resolvedPermissions: Set<string>;
  isAdmin: boolean;
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

  const context: PermissionFilterContext = {
    resolvedPermissions: resolveUserPermissions(user),
    isAdmin: isAdminLike(user),
  };

  return filterMenuByPermissionsInternal(items, context);
};

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
  {
    id: 'atendimento',
    title: 'Atendimento',
    shortTitle: 'Atend.',
    icon: MessageSquare,
    href: '/atendimento',
    color: 'purple',
    permissions: ['atendimento.chats.read', 'atendimento.tickets.read', 'ATENDIMENTO'],
    requiredModule: 'ATENDIMENTO', // Requer licenca de Atendimento
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'atendimento-inbox',
        title: 'Chat',
        icon: MessageSquare,
        href: '/atendimento/inbox',
        color: 'purple',
        permissions: ['atendimento.chats.read'],
        contextBadgeKey: 'atendimentoUnread',
        group: 'Opera\u00e7\u00e3o',
      },
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
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    icon: TrendingUp,
    href: '/nuclei/crm',
    color: 'blue',
    permissions: ['crm.clientes.read', 'crm.leads.read', 'crm.oportunidades.read', 'comercial.propostas.read'],
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
        id: 'comercial-interacoes',
        title: 'Intera\u00e7\u00f5es',
        icon: MessageSquare,
        href: '/crm/interacoes',
        color: 'blue',
        permissions: ['crm.clientes.read', 'crm.leads.read'],
        requiredModule: 'CRM',
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
        id: 'comercial-analytics',
        title: 'Analytics Comercial',
        icon: BarChart3,
        href: '/relatorios/analytics',
        color: 'blue',
        permissions: ['relatorios.read'],
        requiredModule: 'CRM',
        group: 'Vendas',
      },
      {
        id: 'comercial-cotacoes',
        title: 'Cota\u00e7\u00f5es',
        icon: Calculator,
        href: '/vendas/cotacoes',
        color: 'blue',
        permissions: ['comercial.propostas.create'],
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-aprovacoes',
        title: 'Minhas Aprova\u00e7\u00f5es',
        shortTitle: 'Aprova\u00e7\u00f5es',
        icon: CheckCircle,
        href: '/vendas/aprovacoes',
        color: 'blue',
        permissions: ['comercial.propostas.update'],
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-produtos',
        title: 'Produtos',
        icon: ShoppingBag,
        href: '/vendas/produtos',
        color: 'blue',
        permissions: ['crm.produtos.read'],
        requiredModule: 'VENDAS',
        group: 'Cat\u00e1logo',
      },
      {
        id: 'comercial-combos',
        title: 'Combos',
        icon: Archive,
        href: '/vendas/combos',
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
    permissions: ['financeiro.faturamento.read', 'financeiro.pagamentos.read'],
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
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-contas-receber',
        title: 'Contas a Receber',
        shortTitle: 'A Receber',
        icon: TrendingUp,
        href: '/financeiro/contas-receber',
        color: 'orange',
        permissions: ['financeiro.faturamento.read'],
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-contas-pagar',
        title: 'Contas a Pagar',
        shortTitle: 'A Pagar',
        icon: Calculator,
        href: '/financeiro/contas-pagar',
        color: 'orange',
        permissions: ['financeiro.faturamento.read'],
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-fluxo-caixa',
        title: 'Fluxo de Caixa',
        shortTitle: 'Caixa',
        icon: LineChart,
        href: '/financeiro/fluxo-caixa',
        color: 'orange',
        permissions: ['financeiro.faturamento.read'],
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-fornecedores',
        title: 'Fornecedores',
        icon: Building2,
        href: '/financeiro/fornecedores',
        color: 'orange',
        permissions: ['financeiro.faturamento.read'],
        group: 'Cadastros',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Cobran\u00e7as',
    shortTitle: 'Cob.',
    icon: CreditCard,
    href: '/billing',
    color: 'green',
    permissions: ['financeiro.pagamentos.read', 'planos.manage'],
    requiredModule: 'BILLING', //  Requer licenca de Billing
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'billing-assinaturas',
        title: 'Assinaturas',
        icon: Zap,
        href: '/billing/assinaturas',
        color: 'green',
        permissions: ['planos.manage'],
        group: 'Gest\u00e3o',
      },
      {
        id: 'billing-planos',
        title: 'Planos',
        icon: Archive,
        href: '/billing/planos',
        color: 'green',
        permissions: ['planos.manage'],
        group: 'Gest\u00e3o',
      },
      {
        id: 'billing-faturas',
        title: 'Faturas',
        icon: Receipt,
        href: '/billing/faturas',
        color: 'green',
        permissions: ['financeiro.pagamentos.read', 'financeiro.faturamento.read'],
        group: 'Cobran\u00e7a',
      },
      {
        id: 'billing-pagamentos',
        title: 'Pagamentos',
        icon: Wallet,
        href: '/billing/pagamentos',
        color: 'green',
        permissions: ['financeiro.pagamentos.read', 'financeiro.pagamentos.manage'],
        group: 'Cobran\u00e7a',
      },
    ],
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
        id: 'configuracoes-backup',
        title: 'Backup & Sincroniza\u00e7\u00e3o',
        shortTitle: 'Backup',
        icon: Database,
        href: '/sistema/backup',
        color: 'purple',
        permissions: ['admin.empresas.manage'],
        group: 'Governan\u00e7a',
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
    href: '/nuclei/administracao',
    color: 'blue',
    adminOnly: true,
    permissions: ['users.read', 'admin.empresas.manage', 'planos.manage'],
    //  SEM requiredModule - Sempre disponivel para admins
    section: 'Administra\u00e7\u00e3o',
    children: [
      {
        id: 'admin-console',
        title: 'Dashboard Executivo',
        shortTitle: 'Dashboard',
        icon: BarChart,
        href: '/admin/console',
        color: 'blue',
        permissions: ['relatorios.read'],
        group: 'Vis\u00e3o Executiva',
      },
      {
        id: 'admin-empresas',
        title: 'Gest\u00e3o de Empresas',
        shortTitle: 'Empresas',
        icon: Users,
        href: '/admin/empresas',
        color: 'blue',
        permissions: ['admin.empresas.manage'],
        group: 'Opera\u00e7\u00e3o',
      },
      {
        id: 'admin-usuarios',
        title: 'Usu\u00e1rios do Sistema',
        shortTitle: 'Usu\u00e1rios',
        icon: Users,
        href: '/admin/usuarios',
        color: 'blue',
        permissions: ['users.read'],
        group: 'Opera\u00e7\u00e3o',
      },
      {
        id: 'admin-sistema',
        title: 'Branding Global',
        shortTitle: 'Branding',
        icon: Settings,
        href: '/admin/sistema',
        color: 'blue',
        permissions: ['planos.manage'],
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

const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  {
    pattern: '/atendimento/tickets/novo',
    permissions: ['atendimento.tickets.create', 'crm.clientes.read'],
    match: 'all',
  },
  { pattern: '/atendimento/tickets/:id', permissions: ['atendimento.tickets.read'] },
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
    pattern: '/vendas/cotacoes',
    permissions: [
      'comercial.propostas.read',
      'comercial.propostas.create',
      'crm.clientes.read',
      'crm.produtos.read',
    ],
    match: 'all',
  },
  {
    pattern: '/combos/novo',
    permissions: ['crm.produtos.create', 'crm.produtos.read'],
    match: 'all',
  },
  {
    pattern: '/vendas/combos/novo',
    permissions: ['crm.produtos.create', 'crm.produtos.read'],
    match: 'all',
  },
  {
    pattern: '/combos/:id/editar',
    permissions: ['crm.produtos.update', 'crm.produtos.read'],
    match: 'all',
  },
  {
    pattern: '/vendas/combos/:id/editar',
    permissions: ['crm.produtos.update', 'crm.produtos.read'],
    match: 'all',
  },
  { pattern: '/financeiro', permissions: ['financeiro.faturamento.read', 'financeiro.pagamentos.read'] },
  {
    pattern: '/financeiro/relatorios',
    permissions: ['financeiro.faturamento.read', 'relatorios.read'],
    match: 'all',
  },
  { pattern: '/financeiro/conciliacao', permissions: ['financeiro.pagamentos.read'] },
  { pattern: '/financeiro/centro-custos', permissions: ['financeiro.faturamento.read'] },
  { pattern: '/financeiro/tesouraria', permissions: ['financeiro.faturamento.read'] },
  { pattern: '/configuracoes/departamentos', permissions: ['config.automacoes.manage'] },
  { pattern: '/relatorios/analytics', permissions: ['relatorios.read'] },
  { pattern: '/gestao/permissoes', permissions: ['users.read', 'admin.empresas.manage'] },
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
  { pattern: '/admin/relatorios', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/auditoria', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/monitoramento', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/analytics', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/conformidade', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/acesso', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/sistema', permissions: ['admin.empresas.manage'] },
  { pattern: '/admin/branding', permissions: ['admin.empresas.manage'] },
  { pattern: '/nuclei/configuracoes/empresas', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/minhas', permissions: ['admin.empresas.manage'] },
  { pattern: '/sistema/backup', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/:empresaId/configuracoes', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/:empresaId/relatorios', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/:empresaId/permissoes', permissions: ['admin.empresas.manage'] },
  { pattern: '/empresas/:empresaId/backup', permissions: ['admin.empresas.manage'] },
];

const ROUTE_PATH_ALIASES: Record<string, string[]> = {
  '/clientes': ['/crm/clientes'],
  '/contatos': ['/crm/contatos'],
  '/leads': ['/crm/leads'],
  '/interacoes': ['/crm/interacoes'],
  '/pipeline': ['/crm/pipeline'],
  '/funil-vendas': ['/crm/pipeline'],
  '/oportunidades': ['/crm/pipeline'],
  '/propostas': ['/vendas/propostas'],
  '/cotacoes': ['/vendas/cotacoes'],
  '/orcamentos': ['/vendas/cotacoes'],
  '/aprovacoes/pendentes': ['/vendas/aprovacoes'],
  '/produtos': ['/vendas/produtos'],
  '/produtos/categorias': ['/vendas/produtos'],
  '/combos': ['/vendas/combos'],
  '/agenda': ['/crm/agenda'],
  '/assinaturas': ['/billing/assinaturas'],
  '/faturamento': ['/financeiro/faturamento'],
  '/financeiro': ['/nuclei/financeiro', '/financeiro/faturamento'],
  '/demandas': ['/atendimento/tickets'],
  '/nuclei/atendimento/demandas': ['/atendimento/tickets'],
  '/nuclei/atendimento/tickets': ['/atendimento/tickets'],
  '/nuclei/atendimento/tickets/novo': ['/atendimento/tickets/novo'],
  '/gestao/empresas': ['/admin/empresas', '/nuclei/configuracoes/empresas'],
  '/admin/sistema': ['/admin/branding'],
  '/gestao/usuarios': ['/configuracoes/usuarios', '/nuclei/configuracoes/usuarios'],
  '/gestao/fluxos': ['/atendimento/automacoes'],
  '/configuracoes/email': ['/nuclei/configuracoes/email', '/configuracoes/empresa'],
  '/configuracoes/departamentos': ['/nuclei/configuracoes/departamentos'],
  '/configuracoes/tickets': ['/atendimento/configuracoes'],
  '/configuracoes': ['/nuclei/configuracoes'],
  '/configuracoes/sistema': ['/configuracoes/empresa'],
  '/configuracoes/empresa': ['/nuclei/configuracoes/empresa'],
  '/configuracoes/seguranca': ['/configuracoes/empresa'],
  '/configuracoes/usuarios': ['/nuclei/configuracoes/usuarios'],
  '/configuracoes/metas': ['/nuclei/configuracoes/metas'],
  '/configuracoes/integracoes': ['/nuclei/configuracoes/integracoes'],
  '/configuracoes/tickets/niveis': ['/nuclei/configuracoes/tickets/niveis'],
  '/configuracoes/tickets/status': ['/nuclei/configuracoes/tickets/status'],
  '/configuracoes/tickets/tipos': ['/nuclei/configuracoes/tickets/tipos'],
};

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

export const canUserAccessPath = (
  pathname: string,
  modulosAtivos: string[],
  user?: PermissionAwareUser | null,
): boolean => {
  const normalizedPath = normalizePathname(pathname);

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

export default menuConfig;
