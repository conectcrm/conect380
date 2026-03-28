export interface MvpBlockedRouteInfo {
  moduleName: string;
  description: string;
  estimatedCompletion: string;
  features: string[];
}

interface MvpBlockedRouteRule {
  prefix: string;
  info: MvpBlockedRouteInfo;
}

const MVP_MODE_ENABLED = process.env.REACT_APP_MVP_MODE === 'true';

const MVP_ALLOWED_TOP_LEVEL_MENU_IDS = new Set<string>([
  'dashboard',
  'comercial',
  'compras',
  'financeiro',
  'configuracoes',
  'administracao',
]);

const MVP_ALLOWED_CHILD_MENU_IDS = new Set<string>([
  'comercial-leads',
  'comercial-pipeline',
  'comercial-propostas',
  'comercial-contratos',
  'comercial-analytics',
  'comercial-produtos',
  'comercial-veiculos',
  'comercial-cotacoes',
  'comercial-aprovacoes',
  'configuracoes-empresa',
  'configuracoes-usuarios',
  'admin-empresas',
  'admin-usuarios',
  'admin-sistema',
]);

const BLOCKED_COMMERCIAL_INFO: MvpBlockedRouteInfo = {
  moduleName: 'Comercial Avancado',
  description:
    'Este fluxo foi removido do MVP para acelerar o go-live comercial com menor risco operacional.',
  estimatedCompletion: 'Pos-MVP',
  features: [
    'Cotacoes avancadas',
    'Aprovacoes comerciais',
    'Fluxo legado de catalogo',
    'Agenda comercial expandida',
  ],
};

const BLOCKED_RELATIONSHIP_INFO: MvpBlockedRouteInfo = {
  moduleName: 'Relacionamento Avancado',
  description:
    'Clientes, contatos e interacoes foram temporariamente retirados do MVP ate estabilizacao completa.',
  estimatedCompletion: 'Pos-MVP',
  features: [
    'Cadastro detalhado de clientes',
    'Gestao completa de contatos',
    'Timeline de interacoes',
    'Agenda conectada',
  ],
};

const BLOCKED_FINANCE_INFO: MvpBlockedRouteInfo = {
  moduleName: 'Financeiro e Billing',
  description:
    'Somente o fluxo de compras (cotacoes/aprovacoes) esta liberado no MVP. Billing e financeiro avancado seguem pos-MVP.',
  estimatedCompletion: 'Pos-MVP',
  features: [
    'Fluxo financeiro completo fora de compras',
    'Assinaturas e billing',
    'Faturamento e cobrancas',
    'Relatorios financeiros avancados',
  ],
};

const BLOCKED_SUPPORT_INFO: MvpBlockedRouteInfo = {
  moduleName: 'Atendimento (Omnichannel)',
  description:
    'Este modulo foi removido do MVP inicial para reduzir risco operacional enquanto passa por estabilizacao e ajustes de UX.',
  estimatedCompletion: 'Pos-MVP',
  features: [
    'Inbox/Chat omnichannel',
    'Tickets + fluxo de triagem completo',
    'Distribuicao automatica e capacidade por atendente',
    'SLA tracking e automacoes completas',
  ],
};

const BLOCKED_ROUTE_RULES: MvpBlockedRouteRule[] = [
  { prefix: '/atendimento', info: BLOCKED_SUPPORT_INFO },
  { prefix: '/nuclei/atendimento', info: BLOCKED_SUPPORT_INFO },
  { prefix: '/billing', info: BLOCKED_FINANCE_INFO },
  { prefix: '/assinaturas', info: BLOCKED_FINANCE_INFO },
  { prefix: '/faturamento', info: BLOCKED_FINANCE_INFO },
  { prefix: '/financeiro', info: BLOCKED_FINANCE_INFO },
  { prefix: '/nuclei/financeiro', info: BLOCKED_FINANCE_INFO },
  { prefix: '/contratos', info: BLOCKED_FINANCE_INFO },
  { prefix: '/clientes', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/contatos', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/interacoes', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/crm/clientes', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/crm/contatos', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/crm/interacoes', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/agenda', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/crm/agenda', info: BLOCKED_RELATIONSHIP_INFO },
  { prefix: '/compras', info: BLOCKED_COMMERCIAL_INFO },
  { prefix: '/cotacoes', info: BLOCKED_COMMERCIAL_INFO },
  { prefix: '/financeiro/cotacoes', info: BLOCKED_COMMERCIAL_INFO },
  { prefix: '/orcamentos', info: BLOCKED_COMMERCIAL_INFO },
  { prefix: '/aprovacoes/pendentes', info: BLOCKED_COMMERCIAL_INFO },
  { prefix: '/financeiro/compras/aprovacoes', info: BLOCKED_COMMERCIAL_INFO },
];

const MVP_ALLOWED_ROUTE_PREFIXES: string[] = [
  '/compras/cotacoes',
  '/compras/aprovacoes',
  '/cotacoes',
  '/financeiro/cotacoes',
  '/orcamentos',
  '/aprovacoes/pendentes',
  '/financeiro/compras/aprovacoes',
  '/contratos',
];

const normalizePath = (pathname: string): string => {
  if (!pathname) {
    return '/';
  }

  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const matchesPrefix = (pathname: string, prefix: string): boolean => {
  if (pathname === prefix) {
    return true;
  }

  return pathname.startsWith(`${prefix}/`);
};

export const isMvpModeEnabled = (): boolean => MVP_MODE_ENABLED;

export const isMenuItemAllowedInMvp = (menuId: string, depth: number): boolean => {
  if (!MVP_MODE_ENABLED) {
    return true;
  }

  if (depth <= 0) {
    return MVP_ALLOWED_TOP_LEVEL_MENU_IDS.has(menuId);
  }

  return MVP_ALLOWED_CHILD_MENU_IDS.has(menuId);
};

export const getMvpBlockedRouteInfo = (pathname: string): MvpBlockedRouteInfo | null => {
  if (!MVP_MODE_ENABLED) {
    return null;
  }

  const normalizedPath = normalizePath(pathname);
  const isAllowedInMvp = MVP_ALLOWED_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(normalizedPath, prefix),
  );

  if (isAllowedInMvp) {
    return null;
  }

  const matchedRule = BLOCKED_ROUTE_RULES.find((rule) => matchesPrefix(normalizedPath, rule.prefix));
  return matchedRule?.info ?? null;
};
