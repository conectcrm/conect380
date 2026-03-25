import {
  canUserAccessPath,
  getDefaultAuthorizedPath,
  getMenuParaEmpresa,
  type MenuConfig,
} from '../menuConfig';

const ALL_MODULES = ['ATENDIMENTO', 'CRM', 'VENDAS', 'FINANCEIRO', 'BILLING', 'ADMINISTRACAO'];

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

  it('hides atendimento gestao entries when explicit permissions are scoped to chat only', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'lucas@empresa.com',
      role: 'gerente',
      permissions: ['atendimento.chats.read'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-inbox');
    expect(ids).not.toContain('atendimento-automacoes');
    expect(ids).not.toContain('atendimento-equipe');
  });

  it('uses explicit permissions as override even when role has broader defaults', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'scoped-user@empresa.com',
      role: 'user',
      permissions: ['atendimento.tickets.read', 'comercial.propostas.read', 'financeiro.pagamentos.read'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-tickets');
    expect(ids).not.toContain('atendimento-inbox');
    expect(ids).not.toContain('atendimento-analytics');
    expect(ids).toContain('comercial');
    expect(ids).toContain('comercial-propostas');
    expect(ids).toContain('comercial-contratos');
    expect(ids).toContain('comercial-cotacoes');
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
    expect(ids).toContain('comercial-contratos');
    expect(ids).not.toContain('comercial-pipeline');
  });

  it('does not expose removed administracao branch for manager alias role', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'gestor@empresa.com',
      role: 'manager',
      permissions: [],
    } as any);

    const ids = collectIds(menu);
    expect(ids).not.toContain('administracao');
    expect(ids).not.toContain('admin-usuarios');
  });

  it('keeps administracao branch for explicit admin manage permission even with custom role', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'custom',
      permissions: ['admin.empresas.manage'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('administracao');
    expect(ids).not.toContain('admin-sistema');
    expect(ids).not.toContain('configuracoes-branding');
  });

  it('removes duplicated usuarios entry from configuracoes when admin menu is available', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'admin',
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('admin-usuarios');
    expect(ids).not.toContain('configuracoes-usuarios');
  });

  it('treats owner legacy role alias as privileged for admin menu', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'dono@empresa.com',
      role: 'owner',
      permissions: ['admin.empresas.manage'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('administracao');
    expect(ids).toContain('admin-sistema');
  });

  it('shows branding global only for superadmin role and blocks admin role', () => {
    const adminAccess = canUserAccessPath('/configuracoes/sistema', ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'admin',
      permissions: ['admin.empresas.manage'],
    } as any);

    const superAdminAccess = canUserAccessPath('/configuracoes/sistema', ALL_MODULES, {
      email: 'superadmin@empresa.com',
      role: 'superadmin',
      permissions: ['admin.empresas.manage'],
    } as any);

    expect(adminAccess).toBe(false);
    expect(superAdminAccess).toBe(true);
  });

  it('keeps compatibility without user context (no permission pruning)', () => {
    const menu = getMenuParaEmpresa(['ATENDIMENTO']);
    const ids = collectIds(menu);

    expect(ids).toContain('atendimento');
    expect(ids).toContain('atendimento-inbox');
    expect(ids).toContain('atendimento-configuracoes');
  });

  it('resolves first allowed path when dashboard is not permitted', () => {
    const defaultPath = getDefaultAuthorizedPath(ALL_MODULES, {
      email: 'financeiro@empresa.com',
      role: 'custom',
      permissions: ['financeiro.faturamento.read'],
    } as any);

    expect(defaultPath).toBe('/nuclei/financeiro');
  });

  it('keeps configured fallback when user has no accessible menu path', () => {
    const defaultPath = getDefaultAuthorizedPath(ALL_MODULES, {
      email: 'sem-acesso@empresa.com',
      role: 'custom',
      permissions: [],
    } as any);

    expect(defaultPath).toBe('/dashboard');
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
    } as any);

    expect(hasAccess).toBe(true);
  });

  it('treats explicit empty permissions as override and blocks role defaults', () => {
    const hasAccess = canUserAccessPath('/configuracoes/usuarios', ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'admin',
      permissions: [],
    } as any);

    expect(hasAccess).toBe(false);
  });

  it('keeps admin role with tenant operational + governance defaults', () => {
    const adminUsers = canUserAccessPath('/configuracoes/usuarios', ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'admin',
    } as any);
    const adminComercial = canUserAccessPath('/propostas', ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'admin',
    } as any);
    const adminFinanceiro = canUserAccessPath('/financeiro/contas-pagar', ALL_MODULES, {
      email: 'admin@empresa.com',
      role: 'admin',
    } as any);

    expect(adminUsers).toBe(true);
    expect(adminComercial).toBe(true);
    expect(adminFinanceiro).toBe(true);
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

  it('requires comercial.propostas.read for contratos list and detail routes', () => {
    const withoutPermissionList = canUserAccessPath('/contratos', ALL_MODULES, {
      email: 'viewer@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const withPermissionList = canUserAccessPath('/contratos', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.read'],
    } as any);
    const withPermissionDetail = canUserAccessPath('/contratos/123', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.read'],
    } as any);

    expect(withoutPermissionList).toBe(false);
    expect(withPermissionList).toBe(true);
    expect(withPermissionDetail).toBe(true);
  });

  it('requires CRM read permissions for comercial CRM canonical routes', () => {
    const clientesWithoutPermission = canUserAccessPath('/crm/clientes', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const clientesWithPermission = canUserAccessPath('/crm/clientes', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const clienteDetailWithPermission = canUserAccessPath('/crm/clientes/123', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const leadsWithoutPermission = canUserAccessPath('/crm/leads', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const leadsWithPermission = canUserAccessPath('/crm/leads', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.leads.read'],
    } as any);
    const pipelineWithoutPermission = canUserAccessPath('/crm/pipeline', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['crm.leads.read'],
    } as any);
    const pipelineWithPermission = canUserAccessPath('/crm/pipeline', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.oportunidades.read'],
    } as any);
    const interacoesWithClientesRead = canUserAccessPath('/crm/interacoes', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);

    expect(clientesWithoutPermission).toBe(false);
    expect(clientesWithPermission).toBe(true);
    expect(clienteDetailWithPermission).toBe(true);
    expect(leadsWithoutPermission).toBe(false);
    expect(leadsWithPermission).toBe(true);
    expect(pipelineWithoutPermission).toBe(false);
    expect(pipelineWithPermission).toBe(true);
    expect(interacoesWithClientesRead).toBe(true);
  });

  it('requires comercial.propostas.read for propostas canonical and aliases', () => {
    const propostasWithoutPermission = canUserAccessPath('/vendas/propostas', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const propostasWithPermission = canUserAccessPath('/vendas/propostas', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.read'],
    } as any);
    const propostaDetailWithPermission = canUserAccessPath('/propostas/123', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.read'],
    } as any);

    expect(propostasWithoutPermission).toBe(false);
    expect(propostasWithPermission).toBe(true);
    expect(propostaDetailWithPermission).toBe(true);
  });

  it('requires crm.produtos.read and crm.agenda.read for comercial catalog and agenda routes', () => {
    const produtosWithoutPermission = canUserAccessPath('/vendas/produtos', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const produtosWithPermission = canUserAccessPath('/vendas/produtos', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.produtos.read'],
    } as any);
    const categoriasWithPermission = canUserAccessPath('/produtos/categorias', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.produtos.read'],
    } as any);
    const agendaWithoutPermission = canUserAccessPath('/crm/agenda', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const agendaWithPermission = canUserAccessPath('/crm/agenda', ALL_MODULES, {
      email: 'sales@empresa.com',
      role: 'custom',
      permissions: ['crm.agenda.read'],
    } as any);

    expect(produtosWithoutPermission).toBe(false);
    expect(produtosWithPermission).toBe(true);
    expect(categoriasWithPermission).toBe(true);
    expect(agendaWithoutPermission).toBe(false);
    expect(agendaWithPermission).toBe(true);
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

  it('requires atendimento.chats.read for inbox route', () => {
    const withoutPermission = canUserAccessPath('/atendimento/inbox', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const withPermission = canUserAccessPath('/atendimento/inbox', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.chats.read'],
    } as any);

    expect(withoutPermission).toBe(false);
    expect(withPermission).toBe(true);
  });

  it('requires atendimento.tickets.read for tickets list route', () => {
    const withoutPermission = canUserAccessPath('/atendimento/tickets', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.chats.read'],
    } as any);
    const withPermission = canUserAccessPath('/atendimento/tickets', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);

    expect(withoutPermission).toBe(false);
    expect(withPermission).toBe(true);
  });

  it('requires explicit permissions for atendimento automacoes and equipe routes', () => {
    const automacoesWithoutPermission = canUserAccessPath('/atendimento/automacoes', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const automacoesWithConfig = canUserAccessPath('/atendimento/automacoes', ALL_MODULES, {
      email: 'coordinator@empresa.com',
      role: 'custom',
      permissions: ['config.automacoes.manage'],
    } as any);
    const automacoesWithFilas = canUserAccessPath('/atendimento/automacoes', ALL_MODULES, {
      email: 'coordinator@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);
    const equipeWithoutPermission = canUserAccessPath('/atendimento/equipe', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.tickets.read'],
    } as any);
    const equipeWithUsersRead = canUserAccessPath('/atendimento/equipe', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['users.read'],
    } as any);
    const equipeWithFilas = canUserAccessPath('/atendimento/equipe', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);
    const configuracoesWithoutPermission = canUserAccessPath(
      '/atendimento/configuracoes',
      ALL_MODULES,
      {
        email: 'agent@empresa.com',
        role: 'custom',
        permissions: ['atendimento.tickets.read'],
      } as any,
    );
    const configuracoesWithFilas = canUserAccessPath('/atendimento/configuracoes', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);
    const configuracoesWithSla = canUserAccessPath('/atendimento/configuracoes', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['atendimento.sla.manage'],
    } as any);

    expect(automacoesWithoutPermission).toBe(false);
    expect(automacoesWithConfig).toBe(true);
    expect(automacoesWithFilas).toBe(true);
    expect(equipeWithoutPermission).toBe(false);
    expect(equipeWithUsersRead).toBe(true);
    expect(equipeWithFilas).toBe(true);
    expect(configuracoesWithoutPermission).toBe(false);
    expect(configuracoesWithFilas).toBe(true);
    expect(configuracoesWithSla).toBe(true);
  });

  it('requires specific permissions for configuracoes/tickets subroutes', () => {
    const niveisWithoutPermission = canUserAccessPath('/configuracoes/tickets/niveis', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);
    const niveisWithSla = canUserAccessPath('/configuracoes/tickets/niveis', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['atendimento.sla.manage'],
    } as any);
    const statusWithoutPermission = canUserAccessPath('/configuracoes/tickets/status', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.sla.manage'],
    } as any);
    const statusWithFilas = canUserAccessPath('/configuracoes/tickets/status', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);
    const tiposWithFilas = canUserAccessPath('/configuracoes/tickets/tipos', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);

    expect(niveisWithoutPermission).toBe(false);
    expect(niveisWithSla).toBe(true);
    expect(statusWithoutPermission).toBe(false);
    expect(statusWithFilas).toBe(true);
    expect(tiposWithFilas).toBe(true);
  });

  it('requires proper permissions for atendimento legacy nucleus routes', () => {
    const canalEmailWithoutPermission = canUserAccessPath('/nuclei/atendimento/canais/email', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.filas.manage'],
    } as any);
    const canalEmailWithIntegracoes = canUserAccessPath('/nuclei/atendimento/canais/email', ALL_MODULES, {
      email: 'manager@empresa.com',
      role: 'custom',
      permissions: ['config.integracoes.manage'],
    } as any);
    const templatesWithoutPermission = canUserAccessPath('/nuclei/atendimento/templates', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.chats.read'],
    } as any);
    const templatesWithReply = canUserAccessPath('/nuclei/atendimento/templates', ALL_MODULES, {
      email: 'agent@empresa.com',
      role: 'custom',
      permissions: ['atendimento.chats.reply'],
    } as any);

    expect(canalEmailWithoutPermission).toBe(false);
    expect(canalEmailWithIntegracoes).toBe(true);
    expect(templatesWithoutPermission).toBe(false);
    expect(templatesWithReply).toBe(true);
  });

  it('requires financeiro.pagamentos.read for cotacoes routes and keeps legacy alias', () => {
    const financeiroRead = canUserAccessPath('/financeiro/cotacoes', ALL_MODULES, {
      email: 'finance.read@empresa.com',
      role: 'custom',
      permissions: ['financeiro.pagamentos.read'],
    } as any);
    const legacyAlias = canUserAccessPath('/vendas/cotacoes', ALL_MODULES, {
      email: 'finance.alias@empresa.com',
      role: 'custom',
      permissions: ['financeiro.pagamentos.read'],
    } as any);
    const comercialReadOnly = canUserAccessPath('/financeiro/cotacoes', ALL_MODULES, {
      email: 'seller.read@empresa.com',
      role: 'custom',
      permissions: ['comercial.propostas.read'],
    } as any);

    expect(financeiroRead).toBe(true);
    expect(legacyAlias).toBe(true);
    expect(comercialReadOnly).toBe(false);
  });

  it('requires financeiro.pagamentos.manage for aprovacoes de compras routes', () => {
    const readOnly = canUserAccessPath('/financeiro/compras/aprovacoes', ALL_MODULES, {
      email: 'finance.read@empresa.com',
      role: 'custom',
      permissions: ['financeiro.pagamentos.read'],
    } as any);
    const manage = canUserAccessPath('/financeiro/compras/aprovacoes', ALL_MODULES, {
      email: 'finance.manage@empresa.com',
      role: 'custom',
      permissions: ['financeiro.pagamentos.manage'],
    } as any);
    const legacyAlias = canUserAccessPath('/vendas/aprovacoes', ALL_MODULES, {
      email: 'finance.alias@empresa.com',
      role: 'custom',
      permissions: ['financeiro.pagamentos.manage'],
    } as any);

    expect(readOnly).toBe(false);
    expect(manage).toBe(true);
    expect(legacyAlias).toBe(true);
  });

  it('requires financeiro.pagamentos.read for contas-pagar and fornecedores routes', () => {
    const faturamentoOnlyContasPagar = canUserAccessPath('/financeiro/contas-pagar', ALL_MODULES, {
      email: 'billing@empresa.com',
      role: 'custom',
      permissions: ['financeiro.faturamento.read'],
    } as any);
    const faturamentoOnlyFornecedores = canUserAccessPath('/financeiro/fornecedores', ALL_MODULES, {
      email: 'billing@empresa.com',
      role: 'custom',
      permissions: ['financeiro.faturamento.read'],
    } as any);
    const pagamentosReadContasPagar = canUserAccessPath('/financeiro/contas-pagar', ALL_MODULES, {
      email: 'payables@empresa.com',
      role: 'custom',
      permissions: ['financeiro.pagamentos.read'],
    } as any);
    const pagamentosReadFornecedorPerfil = canUserAccessPath(
      '/financeiro/fornecedores/forn-123',
      ALL_MODULES,
      {
        email: 'payables@empresa.com',
        role: 'custom',
        permissions: ['financeiro.pagamentos.read'],
      } as any,
    );

    expect(faturamentoOnlyContasPagar).toBe(false);
    expect(faturamentoOnlyFornecedores).toBe(false);
    expect(pagamentosReadContasPagar).toBe(true);
    expect(pagamentosReadFornecedorPerfil).toBe(true);
  });

  it('keeps legacy gestao/empresas alias with empresas/minhas permission model', () => {
    const withoutManage = canUserAccessPath('/gestao/empresas', ALL_MODULES, {
      email: 'config@empresa.com',
      role: 'custom',
      permissions: ['config.empresa.read'],
    } as any);
    const withManage = canUserAccessPath('/gestao/empresas', ALL_MODULES, {
      email: 'admin.manager@empresa.com',
      role: 'admin',
      permissions: ['admin.empresas.manage'],
    } as any);

    expect(withoutManage).toBe(false);
    expect(withManage).toBe(true);
  });

  it('blocks legacy admin aliases in cliente app regardless of permission set', () => {
    const withoutManage = canUserAccessPath('/admin/empresas', ALL_MODULES, {
      email: 'viewer@empresa.com',
      role: 'custom',
      permissions: ['config.empresa.read'],
    } as any);
    const withManage = canUserAccessPath('/admin/empresas', ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'admin',
      permissions: ['admin.empresas.manage'],
    } as any);
    const withManageOnDetail = canUserAccessPath('/admin/empresas/emp-1', ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'admin',
      permissions: ['admin.empresas.manage'],
    } as any);
    const withoutManageOnNucleo = canUserAccessPath('/nuclei/administracao', ALL_MODULES, {
      email: 'analyst@empresa.com',
      role: 'custom',
      permissions: ['relatorios.read'],
    } as any);

    expect(withoutManage).toBe(false);
    expect(withManage).toBe(false);
    expect(withManageOnDetail).toBe(false);
    expect(withoutManageOnNucleo).toBe(false);
  });

  it('allows empresas minhas route only for admin.empresas.manage', () => {
    const withoutManage = canUserAccessPath('/empresas/minhas', ALL_MODULES, {
      email: 'viewer@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);
    const withManage = canUserAccessPath('/empresas/minhas', ALL_MODULES, {
      email: 'superadmin@empresa.com',
      role: 'super_admin',
      permissions: ['admin.empresas.manage'],
    } as any);

    expect(withoutManage).toBe(false);
    expect(withManage).toBe(true);
  });

  it('blocks empresas minhas when ADMINISTRACAO module is not active', () => {
    const withoutAdminModule = canUserAccessPath(
      '/empresas/minhas',
      ['ATENDIMENTO', 'CRM', 'VENDAS', 'FINANCEIRO', 'BILLING'],
      {
        email: 'superadmin@empresa.com',
        role: 'super_admin',
        permissions: ['admin.empresas.manage'],
      } as any,
    );

    expect(withoutAdminModule).toBe(false);
  });

  it('blocks financeiro routes when FINANCEIRO module is not active', () => {
    const withoutFinanceiroModule = canUserAccessPath(
      '/financeiro/cotacoes',
      ['ATENDIMENTO', 'CRM', 'VENDAS', 'BILLING', 'ADMINISTRACAO'],
      {
        email: 'finance@empresa.com',
        role: 'custom',
        permissions: ['financeiro.pagamentos.read'],
      } as any,
    );

    expect(withoutFinanceiroModule).toBe(false);
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

  it('requires users.read + admin.empresas.manage for legacy permission routes', () => {
    const usersReadOnly = canUserAccessPath('/gestao/permissoes', ALL_MODULES, {
      email: 'users.read@empresa.com',
      role: 'custom',
      permissions: ['users.read'],
    } as any);
    const adminManageOnly = canUserAccessPath('/gestao/permissoes', ALL_MODULES, {
      email: 'admin.manage@empresa.com',
      role: 'custom',
      permissions: ['admin.empresas.manage'],
    } as any);
    const fullLegacyAccess = canUserAccessPath('/gestao/permissoes', ALL_MODULES, {
      email: 'full@empresa.com',
      role: 'custom',
      permissions: ['users.read', 'admin.empresas.manage'],
    } as any);

    const empresaPermissoesReadOnly = canUserAccessPath('/empresas/emp-1/permissoes', ALL_MODULES, {
      email: 'users.read@empresa.com',
      role: 'custom',
      permissions: ['users.read'],
    } as any);
    const empresaPermissoesFull = canUserAccessPath('/empresas/emp-1/permissoes', ALL_MODULES, {
      email: 'full@empresa.com',
      role: 'custom',
      permissions: ['users.read', 'admin.empresas.manage'],
    } as any);

    expect(usersReadOnly).toBe(false);
    expect(adminManageOnly).toBe(false);
    expect(fullLegacyAccess).toBe(true);
    expect(empresaPermissoesReadOnly).toBe(false);
    expect(empresaPermissoesFull).toBe(true);
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

  it('shows billing self-service menu without legacy faturas/pagamentos duplication', () => {
    const menu = getMenuParaEmpresa(ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'custom',
      permissions: ['planos.manage'],
    } as any);

    const ids = collectIds(menu);
    expect(ids).toContain('billing');
    expect(ids).not.toContain('billing-assinaturas');
    expect(ids).not.toContain('billing-planos');
    expect(ids).not.toContain('billing-faturas');
    expect(ids).not.toContain('billing-pagamentos');
  });

  it('allows billing self-service routes only with planos.manage permission', () => {
    const withPermissionAssinatura = canUserAccessPath('/billing/assinaturas', ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'custom',
      permissions: ['planos.manage'],
    } as any);
    const withPermissionPlanos = canUserAccessPath('/billing/planos', ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'custom',
      permissions: ['planos.manage'],
    } as any);
    const withoutPermission = canUserAccessPath('/billing/assinaturas', ALL_MODULES, {
      email: 'usuario@empresa.com',
      role: 'custom',
      permissions: ['crm.clientes.read'],
    } as any);

    expect(withPermissionAssinatura).toBe(true);
    expect(withPermissionPlanos).toBe(true);
    expect(withoutPermission).toBe(false);
  });

  it('blocks billing self-service routes when BILLING module is not active', () => {
    const withoutBillingModule = canUserAccessPath(
      '/billing/assinaturas',
      ['ATENDIMENTO', 'CRM', 'VENDAS', 'FINANCEIRO', 'ADMINISTRACAO'],
      {
        email: 'owner@empresa.com',
        role: 'custom',
        permissions: ['planos.manage'],
      } as any,
    );

    expect(withoutBillingModule).toBe(false);
  });

  it('maps legacy billing faturas/pagamentos aliases to billing self-service permission', () => {
    const planosManageFaturas = canUserAccessPath('/billing/faturas', ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'custom',
      permissions: ['planos.manage'],
    } as any);
    const planosManagePagamentos = canUserAccessPath('/billing/pagamentos', ALL_MODULES, {
      email: 'owner@empresa.com',
      role: 'custom',
      permissions: ['planos.manage'],
    } as any);
    const financeiroOnly = canUserAccessPath('/billing/faturas', ALL_MODULES, {
      email: 'finance.reader@empresa.com',
      role: 'custom',
      permissions: ['financeiro.faturamento.read'],
    } as any);

    expect(planosManageFaturas).toBe(true);
    expect(planosManagePagamentos).toBe(true);
    expect(financeiroOnly).toBe(false);
  });
});
