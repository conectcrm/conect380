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

  DASHBOARD_READ = 'dashboard.read',
  RELATORIOS_READ = 'relatorios.read',

  CRM_CLIENTES_READ = 'crm.clientes.read',
  CRM_CLIENTES_CREATE = 'crm.clientes.create',
  CRM_CLIENTES_UPDATE = 'crm.clientes.update',
  CRM_CLIENTES_DELETE = 'crm.clientes.delete',

  CRM_LEADS_READ = 'crm.leads.read',
  CRM_LEADS_CREATE = 'crm.leads.create',
  CRM_LEADS_UPDATE = 'crm.leads.update',
  CRM_LEADS_DELETE = 'crm.leads.delete',

  CRM_OPORTUNIDADES_READ = 'crm.oportunidades.read',
  CRM_OPORTUNIDADES_CREATE = 'crm.oportunidades.create',
  CRM_OPORTUNIDADES_UPDATE = 'crm.oportunidades.update',
  CRM_OPORTUNIDADES_DELETE = 'crm.oportunidades.delete',

  CRM_PRODUTOS_READ = 'crm.produtos.read',
  CRM_PRODUTOS_CREATE = 'crm.produtos.create',
  CRM_PRODUTOS_UPDATE = 'crm.produtos.update',
  CRM_PRODUTOS_DELETE = 'crm.produtos.delete',

  CRM_AGENDA_READ = 'crm.agenda.read',
  CRM_AGENDA_CREATE = 'crm.agenda.create',
  CRM_AGENDA_UPDATE = 'crm.agenda.update',
  CRM_AGENDA_DELETE = 'crm.agenda.delete',

  COMERCIAL_PROPOSTAS_READ = 'comercial.propostas.read',
  COMERCIAL_PROPOSTAS_CREATE = 'comercial.propostas.create',
  COMERCIAL_PROPOSTAS_UPDATE = 'comercial.propostas.update',
  COMERCIAL_PROPOSTAS_DELETE = 'comercial.propostas.delete',
  COMERCIAL_PROPOSTAS_SEND = 'comercial.propostas.send',
  COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE = 'comercial.propostas.approve.override',

  ATENDIMENTO_CHATS_READ = 'atendimento.chats.read',
  ATENDIMENTO_CHATS_REPLY = 'atendimento.chats.reply',
  ATENDIMENTO_TICKETS_READ = 'atendimento.tickets.read',
  ATENDIMENTO_TICKETS_CREATE = 'atendimento.tickets.create',
  ATENDIMENTO_TICKETS_UPDATE = 'atendimento.tickets.update',
  ATENDIMENTO_TICKETS_ASSIGN = 'atendimento.tickets.assign',
  ATENDIMENTO_TICKETS_CLOSE = 'atendimento.tickets.close',
  ATENDIMENTO_FILAS_MANAGE = 'atendimento.filas.manage',
  ATENDIMENTO_SLA_MANAGE = 'atendimento.sla.manage',
  ATENDIMENTO_DLQ_MANAGE = 'atendimento.dlq.manage',

  FINANCEIRO_FATURAMENTO_READ = 'financeiro.faturamento.read',
  FINANCEIRO_FATURAMENTO_MANAGE = 'financeiro.faturamento.manage',
  FINANCEIRO_PAGAMENTOS_READ = 'financeiro.pagamentos.read',
  FINANCEIRO_PAGAMENTOS_MANAGE = 'financeiro.pagamentos.manage',
  FINANCEIRO_CONTAS_PAGAR_READ = 'financeiro.contas-pagar.read',
  FINANCEIRO_CONTAS_PAGAR_MANAGE = 'financeiro.contas-pagar.manage',
  FINANCEIRO_FORNECEDORES_READ = 'financeiro.fornecedores.read',
  FINANCEIRO_FORNECEDORES_MANAGE = 'financeiro.fornecedores.manage',
  FINANCEIRO_CONTAS_BANCARIAS_READ = 'financeiro.contas-bancarias.read',
  FINANCEIRO_CONTAS_BANCARIAS_MANAGE = 'financeiro.contas-bancarias.manage',
  FINANCEIRO_CONCILIACAO_READ = 'financeiro.conciliacao.read',
  FINANCEIRO_CONCILIACAO_MANAGE = 'financeiro.conciliacao.manage',
  FINANCEIRO_CENTRO_CUSTOS_READ = 'financeiro.centro-custos.read',
  FINANCEIRO_CENTRO_CUSTOS_MANAGE = 'financeiro.centro-custos.manage',
  FINANCEIRO_ALERTAS_READ = 'financeiro.alertas.read',
  FINANCEIRO_ALERTAS_MANAGE = 'financeiro.alertas.manage',
  FINANCEIRO_APROVACOES_READ = 'financeiro.aprovacoes.read',
  FINANCEIRO_APROVACOES_MANAGE = 'financeiro.aprovacoes.manage',

  COMPRAS_COTACOES_READ = 'compras.cotacoes.read',
  COMPRAS_COTACOES_MANAGE = 'compras.cotacoes.manage',
  COMPRAS_APROVACOES_READ = 'compras.aprovacoes.read',
  COMPRAS_APROVACOES_MANAGE = 'compras.aprovacoes.manage',

  CONFIG_EMPRESA_READ = 'config.empresa.read',
  CONFIG_EMPRESA_UPDATE = 'config.empresa.update',
  CONFIG_INTEGRACOES_MANAGE = 'config.integracoes.manage',
  CONFIG_AUTOMACOES_MANAGE = 'config.automacoes.manage',
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
const INSIGHTS_PERMISSIONS: Permission[] = [Permission.DASHBOARD_READ, Permission.RELATORIOS_READ];

const CRM_FULL_PERMISSIONS: Permission[] = [
  Permission.CRM_CLIENTES_READ,
  Permission.CRM_CLIENTES_CREATE,
  Permission.CRM_CLIENTES_UPDATE,
  Permission.CRM_CLIENTES_DELETE,
  Permission.CRM_LEADS_READ,
  Permission.CRM_LEADS_CREATE,
  Permission.CRM_LEADS_UPDATE,
  Permission.CRM_LEADS_DELETE,
  Permission.CRM_OPORTUNIDADES_READ,
  Permission.CRM_OPORTUNIDADES_CREATE,
  Permission.CRM_OPORTUNIDADES_UPDATE,
  Permission.CRM_OPORTUNIDADES_DELETE,
  Permission.CRM_PRODUTOS_READ,
  Permission.CRM_PRODUTOS_CREATE,
  Permission.CRM_PRODUTOS_UPDATE,
  Permission.CRM_PRODUTOS_DELETE,
  Permission.CRM_AGENDA_READ,
  Permission.CRM_AGENDA_CREATE,
  Permission.CRM_AGENDA_UPDATE,
  Permission.CRM_AGENDA_DELETE,
];

const COMERCIAL_FULL_PERMISSIONS: Permission[] = [
  Permission.COMERCIAL_PROPOSTAS_READ,
  Permission.COMERCIAL_PROPOSTAS_CREATE,
  Permission.COMERCIAL_PROPOSTAS_UPDATE,
  Permission.COMERCIAL_PROPOSTAS_DELETE,
  Permission.COMERCIAL_PROPOSTAS_SEND,
  Permission.COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE,
];

const ATENDIMENTO_MANAGER_PERMISSIONS: Permission[] = [
  Permission.ATENDIMENTO_CHATS_READ,
  Permission.ATENDIMENTO_CHATS_REPLY,
  Permission.ATENDIMENTO_TICKETS_READ,
  Permission.ATENDIMENTO_TICKETS_CREATE,
  Permission.ATENDIMENTO_TICKETS_UPDATE,
  Permission.ATENDIMENTO_TICKETS_ASSIGN,
  Permission.ATENDIMENTO_TICKETS_CLOSE,
  Permission.ATENDIMENTO_FILAS_MANAGE,
  Permission.ATENDIMENTO_SLA_MANAGE,
];

const CONFIG_FULL_PERMISSIONS: Permission[] = [
  Permission.CONFIG_EMPRESA_READ,
  Permission.CONFIG_EMPRESA_UPDATE,
  Permission.CONFIG_INTEGRACOES_MANAGE,
  Permission.CONFIG_AUTOMACOES_MANAGE,
];

const VENDEDOR_CRM_PERMISSIONS: Permission[] = [
  Permission.CRM_CLIENTES_READ,
  Permission.CRM_CLIENTES_CREATE,
  Permission.CRM_CLIENTES_UPDATE,
  Permission.CRM_LEADS_READ,
  Permission.CRM_LEADS_CREATE,
  Permission.CRM_LEADS_UPDATE,
  Permission.CRM_OPORTUNIDADES_READ,
  Permission.CRM_OPORTUNIDADES_CREATE,
  Permission.CRM_OPORTUNIDADES_UPDATE,
  Permission.CRM_PRODUTOS_READ,
  Permission.CRM_AGENDA_READ,
  Permission.CRM_AGENDA_CREATE,
  Permission.CRM_AGENDA_UPDATE,
];

const VENDEDOR_COMERCIAL_PERMISSIONS: Permission[] = [
  Permission.COMERCIAL_PROPOSTAS_READ,
  Permission.COMERCIAL_PROPOSTAS_CREATE,
  Permission.COMERCIAL_PROPOSTAS_UPDATE,
  Permission.COMERCIAL_PROPOSTAS_SEND,
];

const SUPORTE_CRM_PERMISSIONS: Permission[] = [
  Permission.CRM_CLIENTES_READ,
  Permission.CRM_CLIENTES_UPDATE,
  Permission.CRM_LEADS_READ,
];

const SUPORTE_ATENDIMENTO_PERMISSIONS: Permission[] = [
  Permission.ATENDIMENTO_CHATS_READ,
  Permission.ATENDIMENTO_CHATS_REPLY,
  Permission.ATENDIMENTO_TICKETS_READ,
  Permission.ATENDIMENTO_TICKETS_CREATE,
  Permission.ATENDIMENTO_TICKETS_UPDATE,
  Permission.ATENDIMENTO_TICKETS_ASSIGN,
  Permission.ATENDIMENTO_TICKETS_CLOSE,
];

const FINANCEIRO_DEFAULT_PERMISSIONS: Permission[] = [
  Permission.FINANCEIRO_FATURAMENTO_READ,
  Permission.FINANCEIRO_FATURAMENTO_MANAGE,
  Permission.FINANCEIRO_PAGAMENTOS_READ,
  Permission.FINANCEIRO_PAGAMENTOS_MANAGE,
  Permission.FINANCEIRO_CONTAS_PAGAR_READ,
  Permission.FINANCEIRO_CONTAS_PAGAR_MANAGE,
  Permission.FINANCEIRO_FORNECEDORES_READ,
  Permission.FINANCEIRO_FORNECEDORES_MANAGE,
  Permission.FINANCEIRO_CONTAS_BANCARIAS_READ,
  Permission.FINANCEIRO_CONTAS_BANCARIAS_MANAGE,
  Permission.FINANCEIRO_CONCILIACAO_READ,
  Permission.FINANCEIRO_CONCILIACAO_MANAGE,
  Permission.FINANCEIRO_CENTRO_CUSTOS_READ,
  Permission.FINANCEIRO_CENTRO_CUSTOS_MANAGE,
  Permission.FINANCEIRO_ALERTAS_READ,
  Permission.FINANCEIRO_ALERTAS_MANAGE,
  Permission.FINANCEIRO_APROVACOES_READ,
  Permission.FINANCEIRO_APROVACOES_MANAGE,
  Permission.COMERCIAL_PROPOSTAS_READ,
  Permission.CRM_CLIENTES_READ,
];

const COMPRAS_DEFAULT_PERMISSIONS: Permission[] = [
  Permission.COMPRAS_COTACOES_READ,
  Permission.COMPRAS_COTACOES_MANAGE,
  Permission.COMPRAS_APROVACOES_READ,
  Permission.COMPRAS_APROVACOES_MANAGE,
];

const ADMIN_GOVERNANCE_PERMISSIONS: Permission[] = [
  ...USER_MANAGEMENT_PERMISSIONS,
  ...BASIC_PROFILE_PERMISSIONS,
  ...INSIGHTS_PERMISSIONS,
  ...CONFIG_FULL_PERMISSIONS,
  Permission.PLANOS_MANAGE,
  Permission.ADMIN_EMPRESAS_MANAGE,
];

const ADMIN_OPERATIONAL_PERMISSIONS: Permission[] = [
  ...CRM_FULL_PERMISSIONS,
  ...COMERCIAL_FULL_PERMISSIONS,
  ...ATENDIMENTO_MANAGER_PERMISSIONS,
  ...FINANCEIRO_DEFAULT_PERMISSIONS,
  ...COMPRAS_DEFAULT_PERMISSIONS,
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.SUPERADMIN]: ALL_PERMISSIONS,
  [UserRole.ADMIN]: [...ADMIN_GOVERNANCE_PERMISSIONS, ...ADMIN_OPERATIONAL_PERMISSIONS],
  [UserRole.GERENTE]: [
    ...USER_MANAGEMENT_PERMISSIONS,
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...CRM_FULL_PERMISSIONS,
    ...COMERCIAL_FULL_PERMISSIONS,
    ...ATENDIMENTO_MANAGER_PERMISSIONS,
    Permission.CONFIG_EMPRESA_READ,
    Permission.CONFIG_AUTOMACOES_MANAGE,
  ],
  [UserRole.VENDEDOR]: [
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...VENDEDOR_CRM_PERMISSIONS,
    ...VENDEDOR_COMERCIAL_PERMISSIONS,
  ],
  [UserRole.SUPORTE]: [
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...SUPORTE_CRM_PERMISSIONS,
    ...SUPORTE_ATENDIMENTO_PERMISSIONS,
  ],
  [UserRole.FINANCEIRO]: [
    ...BASIC_PROFILE_PERMISSIONS,
    ...INSIGHTS_PERMISSIONS,
    ...FINANCEIRO_DEFAULT_PERMISSIONS,
    ...COMPRAS_DEFAULT_PERMISSIONS,
  ],
};

const GENERATED_PERMISSION_ALIASES: Record<string, Permission> = ALL_PERMISSIONS.reduce(
  (acc, permission) => {
    const alias = permission.toUpperCase().replace(/[.-]/g, '_');
    acc[alias] = permission;
    return acc;
  },
  {} as Record<string, Permission>,
);

export const LEGACY_PERMISSION_ALIASES: Record<string, Permission> = {
  ...GENERATED_PERMISSION_ALIASES,
  USERS_READ: Permission.USERS_READ,
  USERS_CREATE: Permission.USERS_CREATE,
  USERS_UPDATE: Permission.USERS_UPDATE,
  USERS_RESET_PASSWORD: Permission.USERS_RESET_PASSWORD,
  USERS_STATUS_UPDATE: Permission.USERS_STATUS_UPDATE,
  USERS_BULK_UPDATE: Permission.USERS_BULK_UPDATE,
  USERS_PROFILE_UPDATE: Permission.USERS_PROFILE_UPDATE,
  ADMIN_EMPRESAS_MANAGE: Permission.ADMIN_EMPRESAS_MANAGE,
  PLANOS_MANAGE: Permission.PLANOS_MANAGE,
  DASHBOARD_READ: Permission.DASHBOARD_READ,
  RELATORIOS_READ: Permission.RELATORIOS_READ,
  ATENDIMENTO_DLQ_MANAGE: Permission.ATENDIMENTO_DLQ_MANAGE,
  COMERCIAL: Permission.COMERCIAL_PROPOSTAS_READ,
  CRM: Permission.CRM_CLIENTES_READ,
  COMPRAS: Permission.COMPRAS_COTACOES_READ,
  FINANCEIRO: Permission.FINANCEIRO_FATURAMENTO_READ,
  CONFIGURACOES: Permission.CONFIG_EMPRESA_READ,
  DASHBOARD: Permission.DASHBOARD_READ,
  RELATORIOS: Permission.RELATORIOS_READ,
  USUARIOS: Permission.USERS_READ,
  ATENDIMENTO: Permission.ATENDIMENTO_TICKETS_READ,
};

export type PermissionCatalogRole = UserRole | 'manager' | 'user';

export interface PermissionCatalogOption {
  value: string;
  label: string;
  legacy?: boolean;
}

export interface PermissionCatalogGroup {
  id: string;
  label: string;
  description?: string;
  roles: PermissionCatalogRole[];
  options: PermissionCatalogOption[];
}

export interface PermissionCatalog {
  version: string;
  groups: PermissionCatalogGroup[];
  defaultsByRole: Record<string, string[]>;
  allPermissions: string[];
  legacyAssignablePermissions: string[];
}

const ROLE_SUPORTE_KEYS: PermissionCatalogRole[] = [UserRole.SUPORTE, 'user'];
const ROLE_GERENTE_KEYS: PermissionCatalogRole[] = [UserRole.GERENTE, 'manager'];
const ROLE_ALL_BASE_KEYS: PermissionCatalogRole[] = [
  ...ROLE_SUPORTE_KEYS,
  UserRole.VENDEDOR,
  UserRole.FINANCEIRO,
  ...ROLE_GERENTE_KEYS,
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
];
const ROLE_OPERATIONAL_KEYS: PermissionCatalogRole[] = [
  ...ROLE_SUPORTE_KEYS,
  UserRole.VENDEDOR,
  UserRole.FINANCEIRO,
  ...ROLE_GERENTE_KEYS,
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
];

export const PERMISSION_CATALOG_GROUPS: PermissionCatalogGroup[] = [
  {
    id: 'perfil',
    label: 'Conta',
    description: 'Permissoes para ajustes do proprio perfil',
    roles: [...ROLE_ALL_BASE_KEYS],
    options: [
      { value: Permission.USERS_PROFILE_UPDATE, label: 'Perfil: atualizar dados pessoais' },
    ],
  },
  {
    id: 'insights',
    label: 'Dashboards e Relatorios',
    description: 'Visualizacao de indicadores e analises',
    roles: [...ROLE_ALL_BASE_KEYS],
    options: [
      { value: Permission.DASHBOARD_READ, label: 'Dashboard: visualizar' },
      { value: Permission.RELATORIOS_READ, label: 'Relatorios: visualizar' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Clientes, leads, oportunidades, produtos e agenda',
    roles: [...ROLE_OPERATIONAL_KEYS],
    options: [
      { value: Permission.CRM_CLIENTES_READ, label: 'Clientes: visualizar' },
      { value: Permission.CRM_CLIENTES_CREATE, label: 'Clientes: criar' },
      { value: Permission.CRM_CLIENTES_UPDATE, label: 'Clientes: editar' },
      { value: Permission.CRM_CLIENTES_DELETE, label: 'Clientes: excluir' },
      { value: Permission.CRM_LEADS_READ, label: 'Leads: visualizar' },
      { value: Permission.CRM_LEADS_CREATE, label: 'Leads: criar' },
      { value: Permission.CRM_LEADS_UPDATE, label: 'Leads: editar' },
      { value: Permission.CRM_LEADS_DELETE, label: 'Leads: excluir' },
      { value: Permission.CRM_OPORTUNIDADES_READ, label: 'Oportunidades: visualizar' },
      { value: Permission.CRM_OPORTUNIDADES_CREATE, label: 'Oportunidades: criar' },
      { value: Permission.CRM_OPORTUNIDADES_UPDATE, label: 'Oportunidades: editar' },
      { value: Permission.CRM_OPORTUNIDADES_DELETE, label: 'Oportunidades: excluir' },
      { value: Permission.CRM_PRODUTOS_READ, label: 'Produtos: visualizar' },
      { value: Permission.CRM_PRODUTOS_CREATE, label: 'Produtos: criar' },
      { value: Permission.CRM_PRODUTOS_UPDATE, label: 'Produtos: editar' },
      { value: Permission.CRM_PRODUTOS_DELETE, label: 'Produtos: excluir' },
      { value: Permission.CRM_AGENDA_READ, label: 'Agenda: visualizar' },
      { value: Permission.CRM_AGENDA_CREATE, label: 'Agenda: criar' },
      { value: Permission.CRM_AGENDA_UPDATE, label: 'Agenda: editar' },
      { value: Permission.CRM_AGENDA_DELETE, label: 'Agenda: excluir' },
    ],
  },
  {
    id: 'atendimento',
    label: 'Atendimento',
    description: 'Controle de acesso para chats, tickets e filas',
    roles: [
      ...ROLE_SUPORTE_KEYS,
      UserRole.VENDEDOR,
      ...ROLE_GERENTE_KEYS,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ],
    options: [
      { value: Permission.ATENDIMENTO_CHATS_READ, label: 'Chats: visualizar' },
      { value: Permission.ATENDIMENTO_CHATS_REPLY, label: 'Chats: responder' },
      { value: Permission.ATENDIMENTO_TICKETS_READ, label: 'Tickets: visualizar' },
      { value: Permission.ATENDIMENTO_TICKETS_CREATE, label: 'Tickets: criar ticket' },
      { value: Permission.ATENDIMENTO_TICKETS_UPDATE, label: 'Tickets: editar ticket' },
      { value: Permission.ATENDIMENTO_TICKETS_ASSIGN, label: 'Tickets: atribuir' },
      { value: Permission.ATENDIMENTO_TICKETS_CLOSE, label: 'Tickets: encerrar/reabrir' },
      { value: Permission.ATENDIMENTO_FILAS_MANAGE, label: 'Filas: gerenciar' },
      { value: Permission.ATENDIMENTO_SLA_MANAGE, label: 'SLA: gerenciar' },
      { value: Permission.ATENDIMENTO_DLQ_MANAGE, label: 'Atendimento: DLQ' },
      { value: 'ATENDIMENTO', label: 'Atendimento (legado)', legacy: true },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    description: 'Acesso aos recursos comerciais',
    roles: [
      ...ROLE_SUPORTE_KEYS,
      UserRole.VENDEDOR,
      UserRole.FINANCEIRO,
      ...ROLE_GERENTE_KEYS,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ],
    options: [
      { value: Permission.COMERCIAL_PROPOSTAS_READ, label: 'Propostas: visualizar' },
      { value: Permission.COMERCIAL_PROPOSTAS_CREATE, label: 'Propostas: criar' },
      { value: Permission.COMERCIAL_PROPOSTAS_UPDATE, label: 'Propostas: editar' },
      { value: Permission.COMERCIAL_PROPOSTAS_DELETE, label: 'Propostas: excluir' },
      { value: Permission.COMERCIAL_PROPOSTAS_SEND, label: 'Propostas: enviar' },
      {
        value: Permission.COMERCIAL_PROPOSTAS_APPROVE_OVERRIDE,
        label: 'Propostas: override aprovar rascunho',
      },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    description: 'Cotacoes, orcamentos e aprovacoes de compras',
    roles: [UserRole.FINANCEIRO, ...ROLE_GERENTE_KEYS, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: Permission.COMPRAS_COTACOES_READ, label: 'Cotacoes de compras: visualizar' },
      { value: Permission.COMPRAS_COTACOES_MANAGE, label: 'Cotacoes de compras: gerenciar' },
      { value: Permission.COMPRAS_APROVACOES_READ, label: 'Aprovacoes de compras: visualizar' },
      { value: Permission.COMPRAS_APROVACOES_MANAGE, label: 'Aprovacoes de compras: gerenciar' },
      { value: 'COMPRAS', label: 'Compras (legado)', legacy: true },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Faturamento, contas a pagar, fornecedores, bancos, conciliacao e alertas',
    roles: [UserRole.FINANCEIRO, ...ROLE_GERENTE_KEYS, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: Permission.FINANCEIRO_FATURAMENTO_READ, label: 'Faturamento: visualizar' },
      { value: Permission.FINANCEIRO_FATURAMENTO_MANAGE, label: 'Faturamento: gerenciar' },
      { value: Permission.FINANCEIRO_PAGAMENTOS_READ, label: 'Pagamentos: visualizar' },
      { value: Permission.FINANCEIRO_PAGAMENTOS_MANAGE, label: 'Pagamentos: gerenciar' },
      { value: Permission.FINANCEIRO_CONTAS_PAGAR_READ, label: 'Contas a pagar: visualizar' },
      { value: Permission.FINANCEIRO_CONTAS_PAGAR_MANAGE, label: 'Contas a pagar: gerenciar' },
      { value: Permission.FINANCEIRO_FORNECEDORES_READ, label: 'Fornecedores: visualizar' },
      { value: Permission.FINANCEIRO_FORNECEDORES_MANAGE, label: 'Fornecedores: gerenciar' },
      {
        value: Permission.FINANCEIRO_CONTAS_BANCARIAS_READ,
        label: 'Contas bancarias: visualizar',
      },
      {
        value: Permission.FINANCEIRO_CONTAS_BANCARIAS_MANAGE,
        label: 'Contas bancarias: gerenciar',
      },
      { value: Permission.FINANCEIRO_CONCILIACAO_READ, label: 'Conciliacao bancaria: visualizar' },
      { value: Permission.FINANCEIRO_CONCILIACAO_MANAGE, label: 'Conciliacao bancaria: gerenciar' },
      { value: Permission.FINANCEIRO_CENTRO_CUSTOS_READ, label: 'Centro de custos: visualizar' },
      { value: Permission.FINANCEIRO_CENTRO_CUSTOS_MANAGE, label: 'Centro de custos: gerenciar' },
      { value: Permission.FINANCEIRO_ALERTAS_READ, label: 'Alertas operacionais: visualizar' },
      { value: Permission.FINANCEIRO_ALERTAS_MANAGE, label: 'Alertas operacionais: gerenciar' },
      { value: Permission.FINANCEIRO_APROVACOES_READ, label: 'Aprovacoes financeiras: visualizar' },
      {
        value: Permission.FINANCEIRO_APROVACOES_MANAGE,
        label: 'Aprovacoes financeiras: gerenciar',
      },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configuracoes',
    description: 'Empresa, integracoes e automacoes',
    roles: [...ROLE_GERENTE_KEYS, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: Permission.CONFIG_EMPRESA_READ, label: 'Empresa: visualizar configuracoes' },
      { value: Permission.CONFIG_EMPRESA_UPDATE, label: 'Empresa: atualizar configuracoes' },
      { value: Permission.CONFIG_INTEGRACOES_MANAGE, label: 'Integracoes: gerenciar' },
      { value: Permission.CONFIG_AUTOMACOES_MANAGE, label: 'Automacoes: gerenciar' },
    ],
  },
  {
    id: 'administracao',
    label: 'Administracao',
    description: 'Gestao de usuarios e governanca da plataforma',
    roles: [...ROLE_GERENTE_KEYS, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: Permission.USERS_READ, label: 'Usuarios: visualizar' },
      { value: Permission.USERS_CREATE, label: 'Usuarios: criar' },
      { value: Permission.USERS_UPDATE, label: 'Usuarios: editar' },
      { value: Permission.USERS_RESET_PASSWORD, label: 'Usuarios: resetar senha' },
      { value: Permission.USERS_STATUS_UPDATE, label: 'Usuarios: alterar status' },
      { value: Permission.USERS_BULK_UPDATE, label: 'Usuarios: acao em massa' },
      { value: Permission.PLANOS_MANAGE, label: 'Planos: gerenciar' },
      { value: Permission.ADMIN_EMPRESAS_MANAGE, label: 'Empresas: administracao' },
    ],
  },
];

const ROLE_DEFAULT_PERMISSION_ALIAS_MAP: Record<string, UserRole> = {
  [UserRole.SUPERADMIN]: UserRole.SUPERADMIN,
  [UserRole.ADMIN]: UserRole.ADMIN,
  [UserRole.GERENTE]: UserRole.GERENTE,
  manager: UserRole.GERENTE,
  [UserRole.VENDEDOR]: UserRole.VENDEDOR,
  [UserRole.SUPORTE]: UserRole.SUPORTE,
  user: UserRole.SUPORTE,
  [UserRole.FINANCEIRO]: UserRole.FINANCEIRO,
};

const LEGACY_ASSIGNABLE_PERMISSION_VALUES = ['ATENDIMENTO', 'COMPRAS'];

const toUniquePermissionList = (permissions: Permission[]): string[] =>
  Array.from(new Set(permissions));

const buildRoleDefaultPermissionsWithAliases = (): Record<string, string[]> => {
  const defaultsByRole: Record<string, string[]> = {};

  for (const [roleKey, canonicalRole] of Object.entries(ROLE_DEFAULT_PERMISSION_ALIAS_MAP)) {
    defaultsByRole[roleKey] = toUniquePermissionList(ROLE_DEFAULT_PERMISSIONS[canonicalRole] ?? []);
  }

  return defaultsByRole;
};

export const PERMISSION_CATALOG: PermissionCatalog = {
  version: '2026-03-27',
  groups: PERMISSION_CATALOG_GROUPS,
  defaultsByRole: buildRoleDefaultPermissionsWithAliases(),
  allPermissions: [...ALL_PERMISSIONS],
  legacyAssignablePermissions: [...LEGACY_ASSIGNABLE_PERMISSION_VALUES],
};

export function getPermissionCatalog(): PermissionCatalog {
  return {
    version: PERMISSION_CATALOG.version,
    groups: PERMISSION_CATALOG.groups.map((group) => ({
      ...group,
      roles: [...group.roles],
      options: group.options.map((option) => ({ ...option })),
    })),
    defaultsByRole: Object.fromEntries(
      Object.entries(PERMISSION_CATALOG.defaultsByRole).map(([role, permissions]) => [
        role,
        [...permissions],
      ]),
    ),
    allPermissions: [...PERMISSION_CATALOG.allPermissions],
    legacyAssignablePermissions: [...PERMISSION_CATALOG.legacyAssignablePermissions],
  };
}
