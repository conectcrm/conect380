import { canUserAccessPath, getMenuParaEmpresa, type MenuConfig } from '../menuConfig';

const ALL_MODULES = ['ATENDIMENTO', 'CRM', 'VENDAS', 'FINANCEIRO', 'BILLING'];

const collectIds = (items: MenuConfig[]): string[] => {
  const ids: string[] = [];

  const visit = (entry: MenuConfig): void => {
    ids.push(entry.id);
    (entry.children || []).forEach(visit);
  };

  items.forEach(visit);
  return ids;
};

describe('menuConfig permission filtering', () => {
  it('shows only allowed atendimento submenu entries for scoped user', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-tickets');
    expect(ids).not.toContain('atendimento-inbox');
    expect(ids).not.toContain('comercial');
  });

  it('uses explicit permissions as override even when role has broader defaults', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'scoped-user@empresa.com',
      role: 'user',
      permissions: ['atendimento.tickets.read', 'comercial.propostas.read'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-tickets');
    expect(ids).not.toContain('atendimento-inbox');
    expect(ids).not.toContain('atendimento-analytics');
    expect(ids).toContain('comercial');
    expect(ids).toContain('comercial-propostas');
    expect(ids).not.toContain('comercial-cotacoes');
    expect(ids).not.toContain('comercial-aprovacoes');
    expect(ids).not.toContain('comercial-leads');
    expect(ids).not.toContain('comercial-pipeline');
  });

  it('accepts legacy atendimento alias when filtering menu', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'legacy@empresa.com',
      role: 'custom',
      permissions: ['ATENDIMENTO'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-tickets');
    expect(ids).not.toContain('atendimento-inbox');
  });

  it('accepts legacy comercial alias and keeps only permitted child', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['COMERCIAL'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('comercial');
    expect(ids).toContain('comercial-propostas');
    expect(ids).not.toContain('comercial-pipeline');
  });

  it('allows admin-only branch for manager alias role', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'gestor@empresa.com',
      role: 'manager',
      permissions: [],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('administracao');
    expect(ids).toContain('admin-usuarios');
  });

  it('keeps compatibility without user context (no permission pruning)', () => {
    const menu = getMenuParaEmpresa(['ATENDIMENTO']);
    const ids = collectIds(menu);

    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-inbox');
    expect(ids).toContain('atendimento-configuracoes');
  });

  it('blocks direct URL access for canonical config route without permission', () => {
    const hasAccess = canUserAccessPath('/configuracoes/usuarios', ALL_MODULES, {
      email: 'basic@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);

    expect(hasAccess).toBe(false);
  });

  it('allows direct URL access for canonical config route with permission', () => {
    const hasAccess = canUserAccessPath('/configuracoes/usuarios', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'manager',
      permissions: [],
    } as any);

    expect(hasAccess).toBe(true);
  });

  it('requires both ticket create and cliente read for ticket create page', () => {
    const readOnlyUser = canUserAccessPath('/atendimento/tickets/novo', ALL_MODULES, {
      email: 'reader@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const creatorOnly = canUserAccessPath('/atendimento/tickets/novo', ALL_MODULES, {
      email: 'creator@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.create'],
    } as any);
    const creatorWithClientes = canUserAccessPath('/atendimento/tickets/novo', ALL_MODULES, {
      email: 'creator.crm@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.create', 'crm.clientes.read'],
    } as any);

    expect(readOnlyUser).toBe(false);
    expect(creatorOnly).toBe(false);
    expect(creatorWithClientes).toBe(true);
  });

  it('protects legacy CRM alias routes using canonical permissions', () => {
    const withoutCrm = canUserAccessPath('/clientes', ALL_MODULES, {
      email: 'support@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const withCrm = canUserAccessPath('/clientes', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);

    expect(withoutCrm).toBe(false);
    expect(withCrm).toBe(true);
  });

  it('requires atendimento.filas.manage for distribuicao route', () => {
    const withoutManage = canUserAccessPath('/atendimento/distribuicao', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const withManage = canUserAccessPath('/atendimento/distribuicao', ALL_MODULES, {
      email: 'coordinator@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);

    expect(withoutManage).toBe(false);
    expect(withManage).toBe(true);
  });

  it('requires combined comercial + CRM permissions for cotacoes route', () => {
    const readOnly = canUserAccessPath('/vendas/cotacoes', ALL_MODULES, {
      email: 'seller.read@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.read'],
    } as any);
    const creatorOnly = canUserAccessPath('/vendas/cotacoes', ALL_MODULES, {
      email: 'seller.create@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.create'],
    } as any);
    const fullAccess = canUserAccessPath('/vendas/cotacoes', ALL_MODULES, {
      email: 'seller.full@empresa.com',
      role: 'custom',
      permissions: [
        'comercial.propostas.read',
        'comercial.propostas.create',
        'crm.clientes.read',
        'crm.produtos.read',
      ],
    } as any);

    expect(readOnly).toBe(false);
    expect(creatorOnly).toBe(false);
    expect(fullAccess).toBe(true);
  });

  it('does not grant admin subroute via generic configuracoes parent prefix', () => {
    const configReader = canUserAccessPath('/nuclei/configuracoes/empresas', ALL_MODULES, {
      email: 'config@empresa.com',
      role: 'custom',
      permissions: ['config.empresa.read'],
    } as any);
    const adminManager = canUserAccessPath('/nuclei/configuracoes/empresas', ALL_MODULES, {
      email: 'admin.manager@empresa.com',
      role: 'admin',
      permissions: ['admin.empresas.manage'],
    } as any);

    expect(configReader).toBe(false);
    expect(adminManager).toBe(true);
  });

  it('keeps nested access for leaf routes when permission is present', () => {
    const withRead = canUserAccessPath('/crm/clientes/123', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const withoutRead = canUserAccessPath('/crm/clientes/123', ALL_MODULES, {
      email: 'guest@empresa.com',
      role: 'custom',
      permissions: [],
    } as any);

    expect(withRead).toBe(true);
    expect(withoutRead).toBe(false);
  });

  it('requires automacoes permission for gestao de fluxos routes', () => {
    const withoutPermission = canUserAccessPath('/gestao/fluxos/novo/builder', ALL_MODULES, {
      email: 'ops@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const withPermission = canUserAccessPath('/gestao/fluxos/novo/builder', ALL_MODULES, {
      email: 'ops.manager@empresa.com',
      role: 'custom',
      permissions: ['config.automacoes.manage'],
    } as any);

    expect(withoutPermission).toBe(false);
    expect(withPermission).toBe(true);
  });

  it('requires admin permission for admin observability routes', () => {
    const relatoriosOnly = canUserAccessPath('/admin/monitoramento', ALL_MODULES, {
      email: 'analyst@empresa.com',
      role: 'custom',
      permissions: ['relatorios.read'],
    } as any);
    const adminPermission = canUserAccessPath('/admin/monitoramento', ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'custom',
      permissions: ['admin.empresas.manage'],
    } as any);

    expect(relatoriosOnly).toBe(false);
    expect(adminPermission).toBe(true);
  });

  it('requires read + create for combos create route', () => {
    const createOnly = canUserAccessPath('/combos/novo', ALL_MODULES, {
      email: 'catalog.create@empresa.com',
      role: 'custom',
      permissions: ['crm.produtos.create'],
    } as any);
    const full = canUserAccessPath('/combos/novo', ALL_MODULES, {
      email: 'catalog.full@empresa.com',
      role: 'custom',
      permissions: ['crm.produtos.create', 'crm.produtos.read'],
    } as any);

    expect(createOnly).toBe(false);
    expect(full).toBe(true);
  });

  it('requires financeiro + relatorios for financeiro relatorios route', () => {
    const financeiroOnly = canUserAccessPath('/financeiro/relatorios', ALL_MODULES, {
      email: 'finance@empresa.com',
      role: 'custom',
      permissions: ['financeiro.faturamento.read'],
    } as any);
    const relatoriosOnly = canUserAccessPath('/financeiro/relatorios', ALL_MODULES, {
      email: 'analyst@empresa.com',
      role: 'custom',
      permissions: ['relatorios.read'],
    } as any);
    const combined = canUserAccessPath('/financeiro/relatorios', ALL_MODULES, {
      email: 'finance.analyst@empresa.com',
      role: 'custom',
      permissions: ['financeiro.faturamento.read', 'relatorios.read'],
    } as any);

    expect(financeiroOnly).toBe(false);
    expect(relatoriosOnly).toBe(false);
    expect(combined).toBe(true);
  });
});
