import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import {
  CoreAdminAccessChangeRequest,
  CoreAdminAccessReviewReport,
  CoreAdminAuditActivityItem,
  CoreAdminBillingItem,
  CoreAdminBreakGlassRequest,
  CoreAdminCapabilities,
  CoreAdminCompany,
  CoreAdminCompanyDetails,
  CoreAdminCompanyModule,
  CoreAdminCompanyPlanHistory,
  CoreAdminCriticalAuditItem,
  CoreAdminFeatureFlag,
  CoreAdminOverview,
  CoreAdminPlan,
  CoreAdminRuntimeContext,
  CoreAdminRuntimeHistoryItem,
  CoreAdminSystemModule,
  CoreAdminUser,
  coreAdminService,
} from './services/coreAdminService';

type CoreAdminTab =
  | 'overview'
  | 'governance'
  | 'companies'
  | 'plans'
  | 'billing'
  | 'access'
  | 'audit';
type UsersActiveFilter = 'all' | 'active' | 'inactive';

type PlanFormMode = 'create' | 'edit';

type PlanFormState = {
  nome: string;
  codigo: string;
  descricao: string;
  preco: string;
  periodicidadeCobranca: 'mensal' | 'anual';
  diasTrial: string;
  gatewayPriceId: string;
  publicadoCheckout: boolean;
  limiteUsuarios: string;
  limiteClientes: string;
  ativo: boolean;
  ordem: string;
  modulosInclusos: string[];
};

type ModuleLinkedScreen = {
  label: string;
  path: string;
};

const DEFAULT_PLAN_FORM: PlanFormState = {
  nome: '',
  codigo: '',
  descricao: '',
  preco: '0',
  periodicidadeCobranca: 'mensal',
  diasTrial: '0',
  gatewayPriceId: '',
  publicadoCheckout: true,
  limiteUsuarios: '-1',
  limiteClientes: '-1',
  ativo: true,
  ordem: '0',
  modulosInclusos: [],
};

const CORE_ADMIN_CANONICAL_ESSENTIAL_MODULE_CODES = new Set(['CRM', 'BILLING']);
const CORE_ADMIN_TAB_LABELS: Record<CoreAdminTab, string> = {
  overview: 'Overview',
  governance: 'Governanca Runtime',
  companies: 'Empresas e Flags',
  plans: 'Planos',
  billing: 'Billing',
  access: 'Acessos',
  audit: 'Auditoria',
};

const CORE_ADMIN_MODULE_LINKED_SCREENS: Record<string, ModuleLinkedScreen[]> = {
  CRM: [
    { label: 'Clientes', path: '/crm/clientes' },
    { label: 'Leads', path: '/crm/leads' },
    { label: 'Contatos', path: '/crm/contatos' },
    { label: 'Pipeline', path: '/crm/pipeline' },
    { label: 'Agenda', path: '/agenda' },
    { label: 'Relatorios comerciais', path: '/relatorios/comercial' },
  ],
  ATENDIMENTO: [
    { label: 'Inbox omnichannel', path: '/atendimento/inbox' },
    { label: 'Tickets', path: '/atendimento/tickets' },
    { label: 'Automacoes', path: '/atendimento/automacoes' },
    { label: 'Equipe', path: '/atendimento/equipe' },
    { label: 'Distribuicao', path: '/atendimento/distribuicao' },
    { label: 'Analytics', path: '/atendimento/analytics' },
  ],
  VENDAS: [
    { label: 'Propostas', path: '/propostas' },
    { label: 'Contratos', path: '/contratos' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Veiculos', path: '/veiculos' },
    { label: 'Categorias de produtos', path: '/produtos/categorias' },
    { label: 'Relatorio propostas e contratos', path: '/relatorios/comercial/propostas-contratos' },
  ],
  FINANCEIRO: [
    { label: 'Contas a pagar', path: '/financeiro/contas-pagar' },
    { label: 'Fornecedores', path: '/financeiro/fornecedores' },
    { label: 'Contas bancarias', path: '/financeiro/contas-bancarias' },
    { label: 'Aprovacoes', path: '/financeiro/aprovacoes' },
    { label: 'Faturamento', path: '/financeiro/faturamento' },
    { label: 'Relatorios financeiros', path: '/financeiro/relatorios' },
  ],
  COMPRAS: [
    { label: 'Cotacoes e orcamentos', path: '/compras/cotacoes' },
    { label: 'Aprovacoes de compras', path: '/compras/aprovacoes' },
  ],
  BILLING: [
    { label: 'Assinaturas', path: '/billing/assinaturas' },
    { label: 'Planos e upgrade', path: '/billing/planos' },
  ],
  ADMINISTRACAO: [
    { label: 'Minhas empresas', path: '/empresas/minhas' },
    { label: 'Configuracoes da empresa', path: '/configuracoes/empresa' },
    { label: 'Usuarios e permissoes', path: '/configuracoes/usuarios' },
    { label: 'Branding do sistema', path: '/configuracoes/sistema' },
  ],
};

const SUPER_ADMIN_ALIASES = new Set(['superadmin']);

const CoreAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CoreAdminTab>('overview');

  const [overview, setOverview] = useState<CoreAdminOverview>({});
  const [capabilities, setCapabilities] = useState<CoreAdminCapabilities | null>(null);
  const [runtimeContext, setRuntimeContext] = useState<CoreAdminRuntimeContext>({});
  const [runtimeHistory, setRuntimeHistory] = useState<CoreAdminRuntimeHistoryItem[]>([]);
  const [companies, setCompanies] = useState<CoreAdminCompany[]>([]);
  const [plans, setPlans] = useState<CoreAdminPlan[]>([]);
  const [billingItems, setBillingItems] = useState<CoreAdminBillingItem[]>([]);
  const [users, setUsers] = useState<CoreAdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize] = useState(20);
  const [usersSearchInput, setUsersSearchInput] = useState('');
  const [usersRoleInput, setUsersRoleInput] = useState('');
  const [usersActiveInput, setUsersActiveInput] = useState<UsersActiveFilter>('all');
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersActive, setUsersActive] = useState<UsersActiveFilter>('all');
  const [accessChangeRequests, setAccessChangeRequests] = useState<CoreAdminAccessChangeRequest[]>([]);
  const [breakGlassRequests, setBreakGlassRequests] = useState<CoreAdminBreakGlassRequest[]>([]);
  const [activeBreakGlassAccesses, setActiveBreakGlassAccesses] = useState<
    CoreAdminBreakGlassRequest[]
  >([]);
  const [accessReviewRoleInput, setAccessReviewRoleInput] = useState('');
  const [accessReviewIncludeInactiveInput, setAccessReviewIncludeInactiveInput] = useState(true);
  const [accessReviewRole, setAccessReviewRole] = useState('');
  const [accessReviewIncludeInactive, setAccessReviewIncludeInactive] = useState(true);
  const [accessReviewReport, setAccessReviewReport] = useState<CoreAdminAccessReviewReport | null>(
    null,
  );
  const [loadingAccessTab, setLoadingAccessTab] = useState(false);
  const [criticalAudit, setCriticalAudit] = useState<CoreAdminCriticalAuditItem[]>([]);
  const [criticalAuditMeta, setCriticalAuditMeta] = useState<any>(null);
  const [auditActivities, setAuditActivities] = useState<CoreAdminAuditActivityItem[]>([]);
  const [loadingAuditTab, setLoadingAuditTab] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(20);
  const [auditOutcomeInput, setAuditOutcomeInput] = useState('');
  const [auditMethodInput, setAuditMethodInput] = useState('');
  const [auditDateStartInput, setAuditDateStartInput] = useState('');
  const [auditDateEndInput, setAuditDateEndInput] = useState('');
  const [auditOutcome, setAuditOutcome] = useState('');
  const [auditMethod, setAuditMethod] = useState('');
  const [auditDateStart, setAuditDateStart] = useState('');
  const [auditDateEnd, setAuditDateEnd] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCompanyDetails, setSelectedCompanyDetails] =
    useState<CoreAdminCompanyDetails | null>(null);
  const [selectedCompanyUsers, setSelectedCompanyUsers] = useState<CoreAdminUser[]>([]);
  const [selectedCompanyModules, setSelectedCompanyModules] = useState<CoreAdminCompanyModule[]>([]);
  const [selectedCompanyPlanHistory, setSelectedCompanyPlanHistory] = useState<
    CoreAdminCompanyPlanHistory[]
  >([]);
  const [systemModules, setSystemModules] = useState<CoreAdminSystemModule[]>([]);
  const [loadingCompanyOps, setLoadingCompanyOps] = useState(false);
  const [newCompanyModuleCode, setNewCompanyModuleCode] = useState('');
  const [companyPlanCodeInput, setCompanyPlanCodeInput] = useState('');
  const [companyPlanReasonInput, setCompanyPlanReasonInput] = useState('');
  const [companyFlags, setCompanyFlags] = useState<CoreAdminFeatureFlag[]>([]);
  const [featureFlagCatalog, setFeatureFlagCatalog] = useState<string[]>([]);
  const [busyActions, setBusyActions] = useState<Record<string, boolean>>({});
  const [planFormMode, setPlanFormMode] = useState<PlanFormMode>('create');
  const [planEditingId, setPlanEditingId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(DEFAULT_PLAN_FORM);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [expandedPlanModuleCodes, setExpandedPlanModuleCodes] = useState<Record<string, boolean>>(
    {},
  );

  const isSuperAdmin = useMemo(() => {
    const role = String(user?.role || '')
      .trim()
      .toLowerCase();
    return SUPER_ADMIN_ALIASES.has(role);
  }, [user?.role]);

  const runAction = useCallback(async (key: string, action: () => Promise<void>) => {
    try {
      setBusyActions((current) => ({ ...current, [key]: true }));
      await action();
    } finally {
      setBusyActions((current) => ({ ...current, [key]: false }));
    }
  }, []);

  const loadCoreAdminData = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        overviewData,
        capabilitiesData,
        runtimeContextData,
        runtimeHistoryData,
        companiesData,
        plansData,
        billingData,
        modulesData,
      ] = await Promise.all([
        coreAdminService.getOverview(),
        coreAdminService.getCapabilities(),
        coreAdminService.getRuntimeContext(),
        coreAdminService.getRuntimeHistory(8),
        coreAdminService.listCompanies({ page: 1, limit: 20 }),
        coreAdminService.listPlans(true),
        coreAdminService.listBillingSubscriptions({ page: 1, limit: 20 }),
        coreAdminService.listSystemModules(true),
      ]);

      setOverview(overviewData);
      setCapabilities(capabilitiesData);
      setRuntimeContext(runtimeContextData);
      setRuntimeHistory(runtimeHistoryData);
      setCompanies(companiesData.data || []);
      setPlans(plansData || []);
      setBillingItems(billingData.data || []);
      setSystemModules(modulesData || []);

      setSelectedCompanyId((current) =>
        current || (companiesData.data?.length ? companiesData.data[0].id : ''),
      );
    } catch (loadError: any) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          'Falha ao carregar dados do Core Admin',
      );
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const loadFeatureFlags = useCallback(async () => {
    if (!selectedCompanyId || !isSuperAdmin) {
      setCompanyFlags([]);
      setFeatureFlagCatalog([]);
      return;
    }

    try {
      const [flags, catalog] = await Promise.all([
        coreAdminService.listFeatureFlags(selectedCompanyId),
        coreAdminService.listFeatureFlagCatalog(),
      ]);
      setCompanyFlags(flags);
      setFeatureFlagCatalog(catalog);
    } catch (loadError: any) {
      toast.error(
        loadError?.response?.data?.message || 'Nao foi possivel carregar feature flags da empresa',
      );
      setCompanyFlags([]);
      setFeatureFlagCatalog([]);
    }
  }, [isSuperAdmin, selectedCompanyId]);

  useEffect(() => {
    void loadCoreAdminData();
  }, [loadCoreAdminData]);

  useEffect(() => {
    void loadFeatureFlags();
  }, [loadFeatureFlags]);

  const loadSelectedCompanyOperations = useCallback(async () => {
    if (!isSuperAdmin || !selectedCompanyId) {
      setSelectedCompanyDetails(null);
      setSelectedCompanyUsers([]);
      setSelectedCompanyModules([]);
      setSelectedCompanyPlanHistory([]);
      setNewCompanyModuleCode('');
      return;
    }

    setLoadingCompanyOps(true);

    try {
      const [companyDetails, companyUsers, companyModules, companyPlanHistory, modulesCatalog] =
        await Promise.all([
          coreAdminService.getCompany(selectedCompanyId),
          coreAdminService.listCompanyUsers(selectedCompanyId),
          coreAdminService.listCompanyModules(selectedCompanyId),
          coreAdminService.listCompanyPlanHistory(selectedCompanyId),
          coreAdminService.listSystemModules(true),
        ]);

      setSelectedCompanyDetails(companyDetails);
      setSelectedCompanyUsers(companyUsers || []);
      setSelectedCompanyModules(companyModules || []);
      setSelectedCompanyPlanHistory(companyPlanHistory || []);
      setSystemModules(modulesCatalog || []);
      setCompanyPlanCodeInput(companyDetails?.plano || '');
    } catch (loadError: any) {
      toast.error(
        loadError?.response?.data?.message ||
          loadError?.message ||
          'Falha ao carregar operacoes da empresa selecionada',
      );
      setSelectedCompanyDetails(null);
      setSelectedCompanyUsers([]);
      setSelectedCompanyModules([]);
      setSelectedCompanyPlanHistory([]);
    } finally {
      setLoadingCompanyOps(false);
    }
  }, [isSuperAdmin, selectedCompanyId]);

  useEffect(() => {
    if (activeTab === 'companies') {
      void loadSelectedCompanyOperations();
    }
  }, [activeTab, loadSelectedCompanyOperations]);

  const loadAccessData = useCallback(
    async (forcedPage?: number) => {
      if (!isSuperAdmin) {
        return;
      }

      const targetPage = forcedPage ?? usersPage;
      setLoadingAccessTab(true);

      try {
        const [usersResult, accessRequestsResult, breakGlassResult, breakGlassActiveResult, review] =
          await Promise.all([
            coreAdminService.listUsers({
              busca: usersSearch || undefined,
              role: usersRole || undefined,
              ativo:
                usersActive === 'all' ? undefined : usersActive === 'active',
              limite: usersPageSize,
              pagina: targetPage,
            }),
            coreAdminService.listAccessChangeRequests({ status: 'REQUESTED', limit: 20 }),
            coreAdminService.listBreakGlassRequests({ status: 'REQUESTED', limit: 20 }),
            coreAdminService.listActiveBreakGlassAccesses({ limit: 20 }),
            coreAdminService.getAccessReviewReport({
              role: accessReviewRole || undefined,
              includeInactive: accessReviewIncludeInactive,
              limit: 100,
            }),
          ]);

        setUsers(usersResult.items || []);
        setUsersTotal(Number(usersResult.total || 0));
        setUsersPage(Number(usersResult.pagina || targetPage));
        setAccessChangeRequests(accessRequestsResult || []);
        setBreakGlassRequests(breakGlassResult || []);
        setActiveBreakGlassAccesses(breakGlassActiveResult || []);
        setAccessReviewReport(review || null);
      } catch (loadError: any) {
        toast.error(
          loadError?.response?.data?.message ||
            loadError?.message ||
            'Falha ao carregar dados de acesso do Core Admin',
        );
      } finally {
        setLoadingAccessTab(false);
      }
    },
    [
      accessReviewIncludeInactive,
      accessReviewRole,
      isSuperAdmin,
      usersActive,
      usersPage,
      usersPageSize,
      usersRole,
      usersSearch,
    ],
  );

  useEffect(() => {
    if (activeTab === 'access') {
      void loadAccessData();
    }
  }, [activeTab, loadAccessData]);

  const handleApplyUsersFilters = useCallback(() => {
    setUsersSearch(usersSearchInput.trim());
    setUsersRole(usersRoleInput.trim());
    setUsersActive(usersActiveInput);
    setUsersPage(1);
  }, [usersActiveInput, usersRoleInput, usersSearchInput]);

  const handleApplyAccessReviewFilters = useCallback(() => {
    setAccessReviewRole(accessReviewRoleInput.trim());
    setAccessReviewIncludeInactive(accessReviewIncludeInactiveInput);
  }, [accessReviewIncludeInactiveInput, accessReviewRoleInput]);

  const loadAuditData = useCallback(
    async (forcedPage?: number) => {
      if (!isSuperAdmin) {
        return;
      }

      const targetPage = forcedPage ?? auditPage;
      setLoadingAuditTab(true);

      try {
        const [criticalResult, activitiesResult] = await Promise.all([
          coreAdminService.listCriticalAudit({
            page: targetPage,
            limit: auditPageSize,
            outcome: auditOutcome || undefined,
            method: auditMethod || undefined,
            dataInicio: auditDateStart || undefined,
            dataFim: auditDateEnd || undefined,
          }),
          coreAdminService.listAuditActivities({
            limit: 30,
            dataInicio: auditDateStart || undefined,
            dataFim: auditDateEnd || undefined,
            adminOnly: true,
          }),
        ]);

        setCriticalAudit(criticalResult.data || []);
        setCriticalAuditMeta(criticalResult.meta || null);
        setAuditActivities(activitiesResult || []);
      } catch (loadError: any) {
        toast.error(
          loadError?.response?.data?.message ||
            loadError?.message ||
            'Falha ao carregar auditoria do Core Admin',
        );
      } finally {
        setLoadingAuditTab(false);
      }
    },
    [
      auditDateEnd,
      auditDateStart,
      auditMethod,
      auditOutcome,
      auditPage,
      auditPageSize,
      isSuperAdmin,
    ],
  );

  useEffect(() => {
    if (activeTab === 'audit') {
      void loadAuditData();
    }
  }, [activeTab, loadAuditData]);

  const handleApplyAuditFilters = useCallback(() => {
    setAuditOutcome(auditOutcomeInput.trim());
    setAuditMethod(auditMethodInput.trim().toUpperCase());
    setAuditDateStart(auditDateStartInput.trim());
    setAuditDateEnd(auditDateEndInput.trim());
    setAuditPage(1);
  }, [auditDateEndInput, auditDateStartInput, auditMethodInput, auditOutcomeInput]);

  const handleResetAuditFilters = useCallback(() => {
    setAuditOutcomeInput('');
    setAuditMethodInput('');
    setAuditDateStartInput('');
    setAuditDateEndInput('');
    setAuditOutcome('');
    setAuditMethod('');
    setAuditDateStart('');
    setAuditDateEnd('');
    setAuditPage(1);
  }, []);

  const handleToggleCompany = useCallback(
    async (company: CoreAdminCompany) => {
      if (!company?.id) {
        return;
      }

      await runAction(`company:${company.id}`, async () => {
        if (company.ativo) {
          const reason = window.prompt('Motivo da suspensao da empresa:');
          if (!reason?.trim()) {
            return;
          }
          await coreAdminService.suspendCompany(company.id, reason.trim());
          toast.success('Empresa suspensa com sucesso');
        } else {
          await coreAdminService.reactivateCompany(company.id);
          toast.success('Empresa reativada com sucesso');
        }

        await loadCoreAdminData();
      });
    },
    [loadCoreAdminData, runAction],
  );

  const handleTogglePlan = useCallback(
    async (planId: string) => {
      await runAction(`plan:${planId}`, async () => {
        await coreAdminService.togglePlanStatus(planId);
        toast.success('Status do plano atualizado');
        await loadCoreAdminData();
      });
    },
    [loadCoreAdminData, runAction],
  );

  const resolvePlanModuleIds = useCallback(
    (plan: CoreAdminPlan): string[] => {
      const availableModulesByCode = new Map<string, string>();
      systemModules.forEach((moduleItem) => {
        const code = String(moduleItem.codigo || '').trim().toLowerCase();
        if (code && moduleItem.id) {
          availableModulesByCode.set(code, moduleItem.id);
        }
      });

      const collectedIds = (plan.modulosInclusos || [])
        .map((moduleItem) => {
          const nestedId = String(moduleItem?.modulo?.id || '').trim();
          if (nestedId) {
            return nestedId;
          }

          const directCode = String(moduleItem?.codigo || moduleItem?.modulo?.codigo || '')
            .trim()
            .toLowerCase();
          if (directCode && availableModulesByCode.has(directCode)) {
            return String(availableModulesByCode.get(directCode));
          }

          const directId = String(moduleItem?.id || '').trim();
          return directId || '';
        })
        .filter(Boolean);

      return Array.from(new Set(collectedIds));
    },
    [systemModules],
  );

  const buildEmptyPlanForm = useCallback((): PlanFormState => {
    const activeModules = systemModules.filter((moduleItem) => moduleItem.ativo);
    const moduleCatalog = activeModules.length > 0 ? activeModules : systemModules;
    const essentialModuleIds = moduleCatalog
      .filter((moduleItem) =>
        CORE_ADMIN_CANONICAL_ESSENTIAL_MODULE_CODES.has(
          String(moduleItem.codigo || '').trim().toUpperCase(),
        ),
      )
      .map((moduleItem) => moduleItem.id);

    return {
      ...DEFAULT_PLAN_FORM,
      modulosInclusos: essentialModuleIds,
    };
  }, [systemModules]);

  const resetPlanForm = useCallback(() => {
    setPlanFormMode('create');
    setPlanEditingId(null);
    setPlanForm(buildEmptyPlanForm());
    setShowPlanForm(false);
  }, [buildEmptyPlanForm]);

  const handleOpenCreatePlanForm = useCallback(() => {
    setPlanFormMode('create');
    setPlanEditingId(null);
    setPlanForm(buildEmptyPlanForm());
    setShowPlanForm(true);
  }, [buildEmptyPlanForm]);

  const handleEditPlan = useCallback(
    (plan: CoreAdminPlan) => {
      setPlanFormMode('edit');
      setPlanEditingId(plan.id);
      setShowPlanForm(true);
      setPlanForm({
        nome: String(plan.nome || ''),
        codigo: String(plan.codigo || ''),
        descricao: String(plan.descricao || ''),
        preco: String(plan.preco ?? 0),
        periodicidadeCobranca:
          plan.periodicidadeCobranca === 'anual' ? 'anual' : 'mensal',
        diasTrial: String(Math.max(0, Number(plan.diasTrial || 0))),
        gatewayPriceId: String(plan.gatewayPriceId || ''),
        publicadoCheckout: plan.publicadoCheckout !== false,
        limiteUsuarios: String(plan.limiteUsuarios ?? -1),
        limiteClientes: String(plan.limiteClientes ?? -1),
        ativo: Boolean(plan.ativo),
        ordem: String(plan.ordem ?? 0),
        modulosInclusos: resolvePlanModuleIds(plan),
      });
    },
    [resolvePlanModuleIds],
  );

  const togglePlanFormModule = useCallback(
    (moduleId: string) => {
      setPlanForm((current) => {
        const currentModuleIds = new Set(current.modulosInclusos);
        const activeModules = systemModules.filter((moduleItem) => moduleItem.ativo);
        const moduleCatalog = activeModules.length > 0 ? activeModules : systemModules;
        const essentialModuleIds = new Set(
          moduleCatalog
            .filter((moduleItem) =>
              CORE_ADMIN_CANONICAL_ESSENTIAL_MODULE_CODES.has(
                String(moduleItem.codigo || '').trim().toUpperCase(),
              ),
            )
            .map((moduleItem) => moduleItem.id),
        );

        if (currentModuleIds.has(moduleId)) {
          if (essentialModuleIds.has(moduleId)) {
            return current;
          }
          currentModuleIds.delete(moduleId);
        } else {
          currentModuleIds.add(moduleId);
        }

        return {
          ...current,
          modulosInclusos: Array.from(currentModuleIds),
        };
      });
    },
    [systemModules],
  );

  const toggleModuleLinkedScreens = useCallback((moduleCode: string) => {
    setExpandedPlanModuleCodes((current) => ({
      ...current,
      [moduleCode]: !current[moduleCode],
    }));
  }, []);

  const handleSavePlan = useCallback(async () => {
    const nome = planForm.nome.trim();
    const codigo = planForm.codigo.trim().toLowerCase();
    const descricao = planForm.descricao.trim();

    if (!nome || !codigo) {
      toast.error('Informe nome e codigo do plano');
      return;
    }

    if (!planForm.modulosInclusos.length) {
      toast.error('Selecione ao menos um modulo para o plano');
      return;
    }

    const codigoJaExiste = plans.some((plan) => {
      const codigoPlan = String(plan.codigo || '')
        .trim()
        .toLowerCase();
      if (!codigoPlan || codigoPlan !== codigo) {
        return false;
      }

      if (planFormMode === 'edit' && planEditingId) {
        return plan.id !== planEditingId;
      }

      return true;
    });

    if (codigoJaExiste) {
      toast.error(`Ja existe um plano com o codigo "${codigo}".`);
      return;
    }

    const parseNumber = (rawValue: string, fieldLabel: string): number => {
      const normalizedValue = String(rawValue || '')
        .trim()
        .replace(',', '.');
      const parsed = Number(normalizedValue);
      if (!Number.isFinite(parsed)) {
        throw new Error(`${fieldLabel} invalido`);
      }
      return parsed;
    };

    const parseInteger = (
      rawValue: string,
      fieldLabel: string,
      options?: { min?: number; allowNegativeOne?: boolean },
    ): number => {
      const parsed = parseNumber(rawValue, fieldLabel);
      if (!Number.isInteger(parsed)) {
        throw new Error(`${fieldLabel} invalido. Use numero inteiro.`);
      }

      if (options?.allowNegativeOne && parsed === -1) {
        return parsed;
      }

      if (options?.min !== undefined && parsed < options.min) {
        throw new Error(`${fieldLabel} invalido.`);
      }

      return parsed;
    };

    let payload: Parameters<typeof coreAdminService.createPlan>[0];
    try {
      const gatewayPriceId = planForm.gatewayPriceId.trim();
      payload = {
        nome,
        codigo,
        descricao: descricao || undefined,
        preco: parseNumber(planForm.preco, 'Preco'),
        periodicidadeCobranca: planForm.periodicidadeCobranca,
        diasTrial: parseInteger(planForm.diasTrial, 'Dias de trial', { min: 0 }),
        gatewayPriceId: gatewayPriceId || undefined,
        publicadoCheckout: planForm.publicadoCheckout,
        limiteUsuarios: parseInteger(planForm.limiteUsuarios, 'Limite de usuarios', {
          min: 1,
          allowNegativeOne: true,
        }),
        limiteClientes: parseInteger(planForm.limiteClientes, 'Limite de clientes', {
          min: 1,
          allowNegativeOne: true,
        }),
        // Campos legados mantidos para compatibilidade contratual do backend.
        limiteStorage: -1,
        limiteApiCalls: -1,
        whiteLabel: false,
        suportePrioritario: false,
        ativo: planForm.ativo,
        ordem: parseInteger(planForm.ordem, 'Ordem', { min: 0 }),
        modulosInclusos: planForm.modulosInclusos,
      };
    } catch (parseError: any) {
      toast.error(parseError?.message || 'Valores numericos invalidos');
      return;
    }

    const actionKey =
      planFormMode === 'edit' && planEditingId
        ? `plan:save:${planEditingId}`
        : 'plan:save:new';

    await runAction(actionKey, async () => {
      if (planFormMode === 'edit' && planEditingId) {
        await coreAdminService.updatePlan(planEditingId, payload);
        toast.success('Plano atualizado com sucesso');
      } else {
        await coreAdminService.createPlan(payload);
        toast.success('Plano criado com sucesso');
      }

      await loadCoreAdminData();
      resetPlanForm();
    });
  }, [loadCoreAdminData, planEditingId, planForm, planFormMode, plans, resetPlanForm, runAction]);

  const handleToggleBillingStatus = useCallback(
    async (item: CoreAdminBillingItem) => {
      const companyId = item?.empresa?.id;
      if (!companyId || !item.assinatura) {
        return;
      }

      await runAction(`billing:${companyId}`, async () => {
        const canonicalStatus = item.assinatura?.status_canonico || 'unknown';
        if (canonicalStatus === 'active') {
          const reason = window.prompt('Motivo da suspensao da assinatura:');
          if (!reason?.trim()) {
            return;
          }
          await coreAdminService.suspendBillingSubscription(companyId, reason.trim());
          toast.success('Assinatura suspensa com sucesso');
        } else {
          const reason = window.prompt('Motivo da reativacao da assinatura:');
          if (!reason?.trim()) {
            return;
          }
          await coreAdminService.reactivateBillingSubscription(companyId, reason.trim());
          toast.success('Assinatura reativada com sucesso');
        }
        await loadCoreAdminData();
      });
    },
    [loadCoreAdminData, runAction],
  );

  const handleRunDueDateCycle = useCallback(async () => {
    const confirmation = window.prompt(
      'Acao sensivel: para executar o ciclo manual de vencimento, digite EXECUTAR CICLO',
    );
    if ((confirmation || '').trim().toUpperCase() !== 'EXECUTAR CICLO') {
      toast.error('Confirmacao invalida. Ciclo manual cancelado.');
      return;
    }

    await runAction('billing:due-date-cycle', async () => {
      await coreAdminService.runBillingDueDateCycle();
      toast.success('Ciclo de vencimento executado');
      await loadCoreAdminData();
    });
  }, [loadCoreAdminData, runAction]);

  const handleToggleFeatureFlag = useCallback(
    async (flagKey: string, enabled: boolean) => {
      if (!selectedCompanyId) {
        return;
      }

      await runAction(`flag:${flagKey}`, async () => {
        const updatedFlags = await coreAdminService.upsertFeatureFlags(selectedCompanyId, [
          {
            flagKey,
            enabled: !enabled,
            rolloutPercentage: 100,
          },
        ]);

        setCompanyFlags(updatedFlags);
        toast.success(`Feature flag ${!enabled ? 'ativada' : 'desativada'}`);
      });
    },
    [runAction, selectedCompanyId],
  );

  const handleAddCompanyModule = useCallback(async () => {
    if (!selectedCompanyId || !newCompanyModuleCode) {
      return;
    }

    await runAction(`company-module:add:${selectedCompanyId}:${newCompanyModuleCode}`, async () => {
      await coreAdminService.activateCompanyModule(selectedCompanyId, {
        modulo: newCompanyModuleCode,
        ativo: true,
      });
      toast.success('Modulo adicionado para a empresa');
      setNewCompanyModuleCode('');
      await Promise.all([loadSelectedCompanyOperations(), loadCoreAdminData()]);
    });
  }, [
    loadCoreAdminData,
    loadSelectedCompanyOperations,
    newCompanyModuleCode,
    runAction,
    selectedCompanyId,
  ]);

  const handleToggleCompanyModule = useCallback(
    async (moduleItem: CoreAdminCompanyModule) => {
      if (!selectedCompanyId) {
        return;
      }

      await runAction(
        `company-module:toggle:${selectedCompanyId}:${moduleItem.modulo}`,
        async () => {
          if (moduleItem.ativo) {
            await coreAdminService.deactivateCompanyModule(selectedCompanyId, moduleItem.modulo);
            toast.success(`Modulo ${moduleItem.modulo} desativado`);
          } else {
            await coreAdminService.updateCompanyModule(selectedCompanyId, moduleItem.modulo, {
              ativo: true,
            });
            toast.success(`Modulo ${moduleItem.modulo} ativado`);
          }
          await Promise.all([loadSelectedCompanyOperations(), loadCoreAdminData()]);
        },
      );
    },
    [loadCoreAdminData, loadSelectedCompanyOperations, runAction, selectedCompanyId],
  );

  const handleChangeCompanyPlan = useCallback(async () => {
    if (!selectedCompanyId || !companyPlanCodeInput.trim()) {
      toast.error('Informe o plano destino');
      return;
    }

    await runAction(`company-plan:${selectedCompanyId}`, async () => {
      await coreAdminService.changeCompanyPlan(selectedCompanyId, {
        plano: companyPlanCodeInput.trim(),
        motivo: companyPlanReasonInput.trim() || undefined,
      });
      toast.success('Plano da empresa atualizado');
      setCompanyPlanReasonInput('');
      await Promise.all([loadSelectedCompanyOperations(), loadCoreAdminData()]);
    });
  }, [
    companyPlanCodeInput,
    companyPlanReasonInput,
    loadCoreAdminData,
    loadSelectedCompanyOperations,
    runAction,
    selectedCompanyId,
  ]);

  const handleResetCompanyUserPassword = useCallback(
    async (userItem: CoreAdminUser) => {
      if (!selectedCompanyId || !userItem?.id) {
        return;
      }

      const reason = window.prompt(
        `Motivo do reset de senha para ${userItem.nome || userItem.email || userItem.id}:`,
      );
      if (!reason?.trim()) {
        toast.error('Informe o motivo do reset');
        return;
      }

      await runAction(`company-user-reset:${selectedCompanyId}:${userItem.id}`, async () => {
        const result = await coreAdminService.resetCompanyUserPassword(
          selectedCompanyId,
          userItem.id,
          reason.trim(),
        );
        if (result.novaSenha) {
          window.alert(
            `Senha resetada para ${userItem.email || userItem.id}.\nNova senha temporaria: ${result.novaSenha}`,
          );
        } else if (result.resetLinkDispatched) {
          window.alert(
            `Senha resetada para ${userItem.email || userItem.id}.\nFoi disparado um link de recuperacao por e-mail para definicao de nova senha.`,
          );
        } else {
          window.alert(
            `Senha resetada para ${userItem.email || userItem.id}.\nNao houve envio automatico de e-mail (SMTP global indisponivel). Oriente o usuario a usar "Esqueci minha senha".`,
          );
        }
        toast.success('Senha resetada com sucesso');
      });
    },
    [runAction, selectedCompanyId],
  );

  const handleAccessChangeDecision = useCallback(
    async (requestId: string, approve: boolean) => {
      const reasonPrompt = approve
        ? 'Motivo da aprovacao (opcional):'
        : 'Motivo da rejeicao da solicitacao:';
      const reason = window.prompt(reasonPrompt);
      if (!approve && !reason?.trim()) {
        toast.error('Informe o motivo para rejeicao');
        return;
      }

      await runAction(`access-change:${requestId}`, async () => {
        if (approve) {
          await coreAdminService.approveAccessChangeRequest(requestId, reason?.trim() || undefined);
          toast.success('Solicitacao aprovada');
        } else {
          await coreAdminService.rejectAccessChangeRequest(requestId, reason?.trim() || undefined);
          toast.success('Solicitacao rejeitada');
        }
        await Promise.all([loadAccessData(), loadCoreAdminData()]);
      });
    },
    [loadAccessData, loadCoreAdminData, runAction],
  );

  const handleBreakGlassDecision = useCallback(
    async (requestId: string, approve: boolean) => {
      const reasonPrompt = approve
        ? 'Motivo da aprovacao (opcional):'
        : 'Motivo da rejeicao do break-glass:';
      const reason = window.prompt(reasonPrompt);
      if (!approve && !reason?.trim()) {
        toast.error('Informe o motivo para rejeicao');
        return;
      }

      await runAction(`break-glass:${requestId}`, async () => {
        if (approve) {
          await coreAdminService.approveBreakGlassRequest(requestId, reason?.trim() || undefined);
          toast.success('Break-glass aprovado');
        } else {
          await coreAdminService.rejectBreakGlassRequest(requestId, reason?.trim() || '');
          toast.success('Break-glass rejeitado');
        }
        await Promise.all([loadAccessData(), loadCoreAdminData()]);
      });
    },
    [loadAccessData, loadCoreAdminData, runAction],
  );

  const handleRevokeBreakGlass = useCallback(
    async (requestId: string) => {
      const reason = window.prompt('Motivo da revogacao (opcional):');

      await runAction(`break-glass-revoke:${requestId}`, async () => {
        await coreAdminService.revokeBreakGlassAccess(requestId, reason?.trim() || undefined);
        toast.success('Acesso emergencial revogado');
        await Promise.all([loadAccessData(), loadCoreAdminData()]);
      });
    },
    [loadAccessData, loadCoreAdminData, runAction],
  );

  const handleCreateBreakGlassRequest = useCallback(async () => {
    const targetUserId = window.prompt('ID do usuario alvo (UUID):');
    if (!targetUserId?.trim()) {
      return;
    }

    const permissionsRaw = window.prompt(
      'Permissoes (separadas por virgula), ex: users:read,users:update',
    );
    if (!permissionsRaw?.trim()) {
      toast.error('Informe pelo menos uma permissao');
      return;
    }

    const reason = window.prompt('Motivo da solicitacao de break-glass:');
    if (!reason?.trim()) {
      toast.error('Informe o motivo da solicitacao');
      return;
    }

    const durationRaw = window.prompt('Duracao em minutos (opcional, padrao 30):');
    const durationMinutes = durationRaw?.trim() ? Number.parseInt(durationRaw, 10) : undefined;

    await runAction('break-glass:create', async () => {
      await coreAdminService.requestBreakGlassAccess({
        targetUserId: targetUserId.trim(),
        permissions: permissionsRaw
          .split(',')
          .map((permission) => permission.trim())
          .filter(Boolean),
        durationMinutes:
          typeof durationMinutes === 'number' && Number.isFinite(durationMinutes)
            ? durationMinutes
            : undefined,
        reason: reason.trim(),
      });
      toast.success('Solicitacao de break-glass criada');
      await Promise.all([loadAccessData(), loadCoreAdminData()]);
    });
  }, [loadAccessData, loadCoreAdminData, runAction]);

  const handleRecertifyUser = useCallback(
    async (targetUserId: string, approved: boolean) => {
      const reasonPrompt = approved
        ? 'Motivo da recertificacao (opcional):'
        : 'Motivo para reprovar e desativar o usuario:';
      const reason = window.prompt(reasonPrompt);
      if (!approved && !reason?.trim()) {
        toast.error('Informe o motivo para reprovar a recertificacao');
        return;
      }

      await runAction(`recertify:${targetUserId}`, async () => {
        await coreAdminService.recertifyAccess({
          targetUserId,
          approved,
          reason: reason?.trim() || undefined,
        });
        toast.success(
          approved ? 'Recertificacao aprovada' : 'Recertificacao reprovada e usuario desativado',
        );
        await Promise.all([loadAccessData(), loadCoreAdminData()]);
      });
    },
    [loadAccessData, loadCoreAdminData, runAction],
  );

  const handleExportCriticalAudit = useCallback(
    async (format: 'csv' | 'json') => {
      await runAction(`audit-export:${format}`, async () => {
        const exported = await coreAdminService.exportCriticalAudit({
          format,
          limit: 500,
          outcome: auditOutcome || undefined,
          method: auditMethod || undefined,
          dataInicio: auditDateStart || undefined,
          dataFim: auditDateEnd || undefined,
        });

        if (format === 'csv' && typeof exported.data === 'string') {
          downloadTextFile(
            `core-admin-critical-audit-${new Date().toISOString().slice(0, 10)}.csv`,
            exported.data,
            'text/csv;charset=utf-8',
          );
          toast.success('Export CSV concluido');
          return;
        }

        const jsonPayload =
          typeof exported.data === 'string'
            ? exported.data
            : JSON.stringify(exported.data, null, 2);
        downloadTextFile(
          `core-admin-critical-audit-${new Date().toISOString().slice(0, 10)}.json`,
          jsonPayload,
          'application/json;charset=utf-8',
        );
        toast.success('Export JSON concluido');
      });
    },
    [auditDateEnd, auditDateStart, auditMethod, auditOutcome, runAction],
  );

  const availableFlagKeys = useMemo(() => {
    const keys = new Set(featureFlagCatalog);
    companyFlags.forEach((flag) => {
      if (flag.flag_key) {
        keys.add(flag.flag_key);
      }
    });
    return Array.from(keys).sort();
  }, [companyFlags, featureFlagCatalog]);

  const companyFlagsByKey = useMemo(() => {
    const map = new Map<string, CoreAdminFeatureFlag>();
    companyFlags.forEach((flag) => {
      map.set(flag.flag_key, flag);
    });
    return map;
  }, [companyFlags]);

  const companyModuleCodes = useMemo(() => {
    return new Set(
      selectedCompanyModules
        .map((moduleItem) => String(moduleItem.modulo || '').trim().toLowerCase())
        .filter(Boolean),
    );
  }, [selectedCompanyModules]);

  const availableSystemModulesToAdd = useMemo(() => {
    return systemModules.filter((moduleItem) => {
      const code = String(moduleItem.codigo || '').trim().toLowerCase();
      if (!code) {
        return false;
      }
      return !companyModuleCodes.has(code);
    });
  }, [companyModuleCodes, systemModules]);

  const activePlans = useMemo(() => {
    return plans.filter((plan) => plan.ativo);
  }, [plans]);

  const sortedPlans = useMemo(() => {
    return [...plans].sort((left, right) => {
      const leftOrder = Number(left.ordem ?? 0);
      const rightOrder = Number(right.ordem ?? 0);
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return String(left.nome || '').localeCompare(String(right.nome || ''), 'pt-BR');
    });
  }, [plans]);

  const selectablePlanModules = useMemo(() => {
    const activeModules = systemModules.filter((moduleItem) => moduleItem.ativo);
    return activeModules.length > 0 ? activeModules : systemModules;
  }, [systemModules]);

  const selectedPlanModuleIds = useMemo(() => {
    return new Set(planForm.modulosInclusos);
  }, [planForm.modulosInclusos]);

  const formatPlanLimitValue = useCallback((value: number | string | null | undefined) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 'n/d';
    }
    if (parsed < 0) {
      return 'Ilimitado';
    }
    return parsed.toLocaleString('pt-BR');
  }, []);

  const usersTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(usersTotal / usersPageSize || 1));
  }, [usersPageSize, usersTotal]);

  const auditTotalPages = useMemo(() => {
    const metaTotalPages = Number(criticalAuditMeta?.total_pages || criticalAuditMeta?.pages || 0);
    if (Number.isFinite(metaTotalPages) && metaTotalPages > 0) {
      return metaTotalPages;
    }

    const metaTotal = Number(criticalAuditMeta?.total || 0);
    if (Number.isFinite(metaTotal) && metaTotal > 0) {
      return Math.max(1, Math.ceil(metaTotal / auditPageSize));
    }

    return Math.max(1, criticalAudit.length > 0 ? auditPage : 1);
  }, [auditPage, auditPageSize, criticalAudit.length, criticalAuditMeta]);

  const governanceCapabilities = useMemo(() => {
    return [
      {
        key: 'allowBreakGlassRequestCreation',
        label: 'Criacao de break-glass',
        risk: 'alto',
        enabled: Boolean(capabilities?.allowBreakGlassRequestCreation),
        impact: `${overview.pending_break_glass_requests ?? 0} pendentes / ${overview.active_break_glass_accesses ?? 0} ativos`,
      },
      {
        key: 'allowManualBillingDueDateCycle',
        label: 'Ciclo manual de vencimento',
        risk: 'medio',
        enabled: Boolean(capabilities?.allowManualBillingDueDateCycle),
        impact: `${billingItems.length} assinaturas no escopo`,
      },
      {
        key: 'allowPlanDeletion',
        label: 'Exclusao de planos',
        risk: 'alto',
        enabled: Boolean(capabilities?.allowPlanDeletion),
        impact: `${plans.filter((plan) => plan.ativo).length} planos ativos`,
      },
      {
        key: 'allowDirectAccessRecertification',
        label: 'Recertificacao direta',
        risk: 'medio',
        enabled: Boolean(capabilities?.allowDirectAccessRecertification),
        impact: `${usersTotal} usuarios no tenant administrativo`,
      },
      {
        key: 'allowCompanyModuleManagement',
        label: 'Gestao de modulos por empresa',
        risk: 'alto',
        enabled: Boolean(capabilities?.allowCompanyModuleManagement),
        impact: `${companies.filter((company) => company.ativo).length} empresas ativas`,
      },
    ];
  }, [billingItems.length, capabilities, companies, overview.active_break_glass_accesses, overview.pending_break_glass_requests, plans, usersTotal]);

  const governanceAlerts = useMemo(() => {
    const alerts: string[] = [];
    const environment = (runtimeContext.environment || '').toLowerCase();
    const enabledSensitive = governanceCapabilities.filter((capability) => capability.enabled);

    if (environment === 'production' && enabledSensitive.length > 0) {
      alerts.push(
        `Ambiente de producao com capacidades sensiveis habilitadas (${enabledSensitive.length}).`,
      );
    }

    if (!runtimeContext.adminMfaRequired) {
      alerts.push('MFA administrativo nao esta marcado como obrigatorio no runtime.');
    }

    if ((runtimeContext.legacyTransitionMode || '').toLowerCase() !== 'off') {
      alerts.push('Modo de transicao legado esta diferente de OFF.');
    }

    return alerts;
  }, [governanceCapabilities, runtimeContext.adminMfaRequired, runtimeContext.environment, runtimeContext.legacyTransitionMode]);

  const companiesActiveCount = useMemo(() => {
    return companies.filter((company) => company.ativo).length;
  }, [companies]);

  const companiesInactiveCount = useMemo(() => {
    return Math.max(0, companies.length - companiesActiveCount);
  }, [companies.length, companiesActiveCount]);

  const checkoutPublishedPlansCount = useMemo(() => {
    return plans.filter((plan) => plan.ativo && plan.publicadoCheckout !== false).length;
  }, [plans]);

  const checkoutHiddenPlansCount = useMemo(() => {
    return plans.filter((plan) => plan.ativo && plan.publicadoCheckout === false).length;
  }, [plans]);

  const pendingAccessRequestsCount = Number(overview.pending_access_requests ?? 0);
  const pendingBreakGlassRequestsCount = Number(overview.pending_break_glass_requests ?? 0);
  const activeBreakGlassAccessesCount = Number(overview.active_break_glass_accesses ?? 0);

  const enabledHighRiskCapabilitiesCount = useMemo(() => {
    return governanceCapabilities.filter(
      (capability) => capability.enabled && capability.risk === 'alto',
    ).length;
  }, [governanceCapabilities]);

  const overviewHealth = useMemo(() => {
    const hasAttentionSignals =
      governanceAlerts.length > 0 ||
      pendingBreakGlassRequestsCount > 0 ||
      enabledHighRiskCapabilitiesCount > 0;

    if (hasAttentionSignals) {
      return {
        label: 'Atencao operacional',
        tone: 'attention' as const,
        description:
          'Existem sinais de risco ou pendencias de governanca. Priorize a tratativa das acoes recomendadas.',
      };
    }

    return {
      label: 'Operacao estavel',
      tone: 'healthy' as const,
      description:
        'Sem sinais criticos no momento. Mantenha monitoramento continuo de acesso, planos e capacidades.',
    };
  }, [enabledHighRiskCapabilitiesCount, governanceAlerts.length, pendingBreakGlassRequestsCount]);

  const overviewSummaryCards = useMemo(
    () => [
      {
        label: 'Empresas inativas',
        value: String(companiesInactiveCount),
        hint: `${companiesActiveCount}/${companies.length || 0} empresas ativas no SaaS.`,
      },
      {
        label: 'Planos ocultos no checkout',
        value: String(checkoutHiddenPlansCount),
        hint: `${checkoutPublishedPlansCount} planos ativos estao publicados.`,
      },
      {
        label: 'Solicitacoes de acesso pendentes',
        value: String(pendingAccessRequestsCount),
        hint: 'Demandas aguardando aprovacao ou rejeicao.',
      },
      {
        label: 'Break-glass pendentes',
        value: String(pendingBreakGlassRequestsCount),
        hint: `${activeBreakGlassAccessesCount} acessos emergenciais estao ativos.`,
      },
    ],
    [
      activeBreakGlassAccessesCount,
      checkoutHiddenPlansCount,
      checkoutPublishedPlansCount,
      companies.length,
      companiesActiveCount,
      companiesInactiveCount,
      pendingAccessRequestsCount,
      pendingBreakGlassRequestsCount,
    ],
  );

  const overviewRecommendedActions = useMemo(() => {
    const actions: Array<{ id: string; label: string; detail: string; tab: CoreAdminTab }> = [];

    if (pendingAccessRequestsCount > 0) {
      actions.push({
        id: 'pending-access',
        label: 'Tratar solicitacoes de acesso',
        detail: `${pendingAccessRequestsCount} solicitacao(oes) aguardando decisao.`,
        tab: 'access',
      });
    }

    if (pendingBreakGlassRequestsCount > 0 || activeBreakGlassAccessesCount > 0) {
      actions.push({
        id: 'break-glass',
        label: 'Revisar break-glass',
        detail: `${pendingBreakGlassRequestsCount} pendente(s) e ${activeBreakGlassAccessesCount} ativo(s).`,
        tab: 'access',
      });
    }

    if (checkoutHiddenPlansCount > 0) {
      actions.push({
        id: 'hidden-checkout-plans',
        label: 'Revisar planos ocultos',
        detail: `${checkoutHiddenPlansCount} plano(s) ativos nao aparecem no checkout.`,
        tab: 'plans',
      });
    }

    if (!runtimeContext.adminMfaRequired || governanceAlerts.length > 0) {
      actions.push({
        id: 'governance-alerts',
        label: 'Ajustar governanca runtime',
        detail: `Existem ${governanceAlerts.length} alerta(s) de governanca para tratar.`,
        tab: 'governance',
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: 'all-good',
        label: 'Painel sem pendencias criticas',
        detail: 'Operacao atual esta estavel. Faça revisoes preventivas semanalmente.',
        tab: 'overview',
      });
    }

    return actions.slice(0, 4);
  }, [
    activeBreakGlassAccessesCount,
    checkoutHiddenPlansCount,
    governanceAlerts.length,
    pendingAccessRequestsCount,
    pendingBreakGlassRequestsCount,
    runtimeContext.adminMfaRequired,
  ]);

  const handleRefreshRuntimeGovernance = useCallback(async () => {
    await runAction('governance:refresh', async () => {
      const [runtimeContextData, runtimeHistoryData, capabilitiesData] = await Promise.all([
        coreAdminService.getRuntimeContext(),
        coreAdminService.getRuntimeHistory(12),
        coreAdminService.getCapabilities(),
      ]);

      setRuntimeContext(runtimeContextData);
      setRuntimeHistory(runtimeHistoryData);
      setCapabilities(capabilitiesData);
      toast.success('Governanca runtime sincronizada');
    });
  }, [runAction]);

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="rounded-xl border border-red-100 bg-white p-6">
          <h1 className="text-xl font-semibold text-[#002333]">Acesso restrito</h1>
          <p className="mt-2 text-sm text-[#587285]">
            O painel Core Admin e exclusivo para usuarios com role SUPER_ADMIN.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="rounded-xl border border-[#D9E6EC] bg-white p-6 text-sm text-[#587285]">
          Carregando Core Admin...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <header className="rounded-xl border border-[#D9E6EC] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#002333]">Core Admin</h1>
            <p className="mt-1 text-sm text-[#587285]">
              Cockpit de governanca centralizada para operacao SaaS multi-tenant.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadCoreAdminData()}
            className="rounded-lg border border-[#BFD2DC] px-4 py-2 text-sm font-medium text-[#0F5A6B] transition hover:bg-[#F1F7FA]"
          >
            Atualizar dados
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#D9E6EC] bg-[#F7FBFD] p-4 shadow-[0_18px_35px_-30px_rgba(0,35,51,0.45)] sm:p-5">
        <section className="rounded-xl border border-[#D9E6EC] bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CORE_ADMIN_TAB_LABELS) as CoreAdminTab[]).map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  activeTab === tabKey
                    ? 'bg-[#149CA0] text-white'
                    : 'border border-[#D9E6EC] text-[#335B6D] hover:bg-[#F5FAFB]',
                ].join(' ')}
              >
                {CORE_ADMIN_TAB_LABELS[tabKey]}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E3EDF2] bg-white px-4 py-2.5">
          <p className="text-sm text-[#335B6D]">
            Secao ativa: <strong>{CORE_ADMIN_TAB_LABELS[activeTab]}</strong>
          </p>
          {activeTab === 'overview' ? (
            <span
              className={[
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                overviewHealth.tone === 'healthy'
                  ? 'bg-[#D9F4E4] text-[#0A7A3D]'
                  : 'bg-[#FFF4DC] text-[#9A6700]',
              ].join(' ')}
            >
              {overviewHealth.label}
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {activeTab === 'overview' && (
            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Panel title="Saude operacional">
                <p className="text-sm text-[#335B6D]">{overviewHealth.description}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <MetricMini label="Alertas de governanca" value={String(governanceAlerts.length)} />
                  <MetricMini
                    label="Capacidades sensiveis habilitadas"
                    value={String(enabledHighRiskCapabilitiesCount)}
                  />
                </div>
              </Panel>

              <Panel title="Acoes recomendadas">
                <div className="space-y-2">
                  {overviewRecommendedActions.map((actionItem) => (
                    <div
                      key={actionItem.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#002333]">{actionItem.label}</p>
                        <p className="text-xs text-[#587285]">{actionItem.detail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab(actionItem.tab)}
                        className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC]"
                      >
                        Abrir aba
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'overview' ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewSummaryCards.map((card) => (
                <MetricCard key={card.label} label={card.label} value={card.value} hint={card.hint} />
              ))}
            </section>
          ) : null}

      {activeTab === 'overview' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Contexto de runtime">
            <p className="text-sm text-[#335B6D]">
              Ambiente: <strong>{runtimeContext.environment || 'n/d'}</strong>
            </p>
            <p className="text-sm text-[#335B6D]">
              Versao: <strong>{runtimeContext.releaseVersion || 'n/d'}</strong>
            </p>
            <p className="text-sm text-[#335B6D]">
              MFA admin obrigatorio:{' '}
              <strong>{runtimeContext.adminMfaRequired ? 'Sim' : 'Nao'}</strong>
            </p>
            <p className="text-sm text-[#335B6D]">
              Modo legado: <strong>{runtimeContext.legacyTransitionMode || 'n/d'}</strong>
            </p>
            <div className="mt-3 rounded-lg border border-[#E3EDF2] p-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#587285]">
                Historico recente de policy
              </p>
              {runtimeHistory.length === 0 ? (
                <p className="mt-1 text-xs text-[#587285]">Sem snapshots.</p>
              ) : (
                <div className="mt-2 space-y-1">
                  {runtimeHistory.slice(0, 4).map((historyItem, index) => (
                    <p
                      key={historyItem.id || historyItem.createdAt || `runtime-history-${index}`}
                      className="text-xs text-[#335B6D]"
                    >
                      {formatDateTime(historyItem.createdAt)} -{' '}
                      {historyItem.environment || runtimeContext.environment || 'n/d'} -{' '}
                      {historyItem.releaseVersion || 'sem versao'}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Capacidades habilitadas">
            <CapabilityRow
              label="Criacao de break-glass"
              enabled={Boolean(capabilities?.allowBreakGlassRequestCreation)}
            />
            <CapabilityRow
              label="Ciclo manual de vencimento"
              enabled={Boolean(capabilities?.allowManualBillingDueDateCycle)}
            />
            <CapabilityRow
              label="Remocao de planos"
              enabled={Boolean(capabilities?.allowPlanDeletion)}
            />
            <CapabilityRow
              label="Recertificacao direta"
              enabled={Boolean(capabilities?.allowDirectAccessRecertification)}
            />
            <CapabilityRow
              label="Gestao de modulos por empresa"
              enabled={Boolean(capabilities?.allowCompanyModuleManagement)}
            />
          </Panel>
        </section>
      )}

      {activeTab === 'governance' && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Estado atual de runtime"
              extra={
                <button
                  type="button"
                  onClick={() => void handleRefreshRuntimeGovernance()}
                  disabled={busyActions['governance:refresh']}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sincronizar runtime
                </button>
              }
            >
              <p className="text-sm text-[#335B6D]">
                Ambiente: <strong>{runtimeContext.environment || 'n/d'}</strong>
              </p>
              <p className="text-sm text-[#335B6D]">
                Versao: <strong>{runtimeContext.releaseVersion || 'n/d'}</strong>
              </p>
              <p className="text-sm text-[#335B6D]">
                MFA admin obrigatorio:{' '}
                <strong>{runtimeContext.adminMfaRequired ? 'Sim' : 'Nao'}</strong>
              </p>
              <p className="text-sm text-[#335B6D]">
                Modo legado: <strong>{runtimeContext.legacyTransitionMode || 'n/d'}</strong>
              </p>
              <p className="mt-2 text-xs text-[#587285]">
                Ultima geracao de overview: {formatDateTime(overview.generated_at)}
              </p>
            </Panel>

            <Panel title="Alertas de governanca">
              {governanceAlerts.length === 0 ? (
                <p className="text-sm text-[#0A7A3D]">Sem alertas de governanca no momento.</p>
              ) : (
                <div className="space-y-2">
                  {governanceAlerts.map((alertMessage) => (
                    <div
                      key={alertMessage}
                      className="rounded-md border border-[#FFE1B3] bg-[#FFF7E8] px-3 py-2 text-sm text-[#8A5700]"
                    >
                      {alertMessage}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </section>

          <Panel title="Capacidades e impacto operacional">
            <div className="space-y-2">
              {governanceCapabilities.map((capability) => (
                <div
                  key={capability.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E3EDF2] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#002333]">{capability.label}</p>
                    <p className="text-xs text-[#587285]">Impacto: {capability.impact}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        capability.risk === 'alto'
                          ? 'bg-[#FFE7E7] text-[#B42318]'
                          : 'bg-[#FFF4DC] text-[#9A6700]',
                      ].join(' ')}
                    >
                      Risco {capability.risk}
                    </span>
                    <StatusBadge
                      active={capability.enabled}
                      activeLabel="Habilitado"
                      inactiveLabel="Desabilitado"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Historico de snapshots de policy">
            <div className="space-y-2">
              {runtimeHistory.length === 0 ? (
                <p className="text-sm text-[#587285]">Sem snapshots registrados.</p>
              ) : (
                runtimeHistory.map((historyItem, historyIndex) => (
                  <div
                    key={historyItem.id || historyItem.createdAt || `history-${historyIndex}`}
                    className="rounded-lg border border-[#E3EDF2] px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-[#002333]">
                      {formatDateTime(historyItem.createdAt)}
                    </p>
                    <p className="text-xs text-[#587285]">
                      Ambiente: {historyItem.environment || 'n/d'} - Versao:{' '}
                      {historyItem.releaseVersion || 'sem versao'}
                    </p>
                    <p className="text-xs text-[#587285]">
                      Capacidades habilitadas:{' '}
                      {countEnabledCapabilities(historyItem.capabilities || {}).length}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'companies' && (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <Panel title="Empresas">
            <div className="space-y-2">
              {companies.length === 0 ? (
                <p className="text-sm text-[#587285]">Nenhuma empresa encontrada.</p>
              ) : (
                companies.map((company) => (
                  <div
                    key={company.id}
                    className={[
                      'rounded-lg border px-3 py-3',
                      selectedCompanyId === company.id
                        ? 'border-[#149CA0] bg-[#F3FCFC]'
                        : 'border-[#E3EDF2] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedCompanyId(company.id)}
                      >
                        <p className="text-sm font-semibold text-[#002333]">{company.nome}</p>
                        <p className="text-xs text-[#587285]">
                          CNPJ: {company.cnpj || 'n/d'} - Plano: {company.plano || 'n/d'}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <StatusBadge active={Boolean(company.ativo)} />
                        <button
                          type="button"
                          onClick={() => void handleToggleCompany(company)}
                          disabled={busyActions[`company:${company.id}`]}
                          className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {company.ativo ? 'Suspender' : 'Reativar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel
              title="Contexto da empresa selecionada"
              extra={
                <button
                  type="button"
                  onClick={() => void loadSelectedCompanyOperations()}
                  disabled={!selectedCompanyId || loadingCompanyOps}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Atualizar tenant
                </button>
              }
            >
              {!selectedCompanyId ? (
                <p className="text-sm text-[#587285]">Selecione uma empresa para visualizar detalhes.</p>
              ) : loadingCompanyOps ? (
                <p className="text-sm text-[#587285]">Carregando dados da empresa selecionada...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-[#335B6D]">
                    Nome: <strong>{selectedCompanyDetails?.nome || 'n/d'}</strong>
                  </p>
                  <p className="text-sm text-[#335B6D]">
                    Plano atual: <strong>{selectedCompanyDetails?.plano || 'n/d'}</strong>
                  </p>
                  <p className="text-sm text-[#335B6D]">
                    Status: <strong>{selectedCompanyDetails?.status || 'n/d'}</strong>
                  </p>
                  <p className="text-sm text-[#335B6D]">
                    Ultimo acesso:{' '}
                    <strong>{formatDateTime(selectedCompanyDetails?.ultimo_acesso || undefined)}</strong>
                  </p>
                </div>
              )}
            </Panel>

            <Panel title="Usuarios da empresa selecionada">
              {!selectedCompanyId ? (
                <p className="text-sm text-[#587285]">Selecione uma empresa para listar usuarios.</p>
              ) : loadingCompanyOps ? (
                <p className="text-sm text-[#587285]">Carregando usuarios...</p>
              ) : selectedCompanyUsers.length === 0 ? (
                <p className="text-sm text-[#587285]">Nenhum usuario cadastrado para este tenant.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCompanyUsers.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#002333]">{userItem.nome}</p>
                        <p className="text-xs text-[#587285]">
                          {userItem.email || 'sem email'} - {userItem.role || 'n/d'} -{' '}
                          {userItem.ativo ? 'ativo' : 'inativo'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleResetCompanyUserPassword(userItem)}
                        disabled={busyActions[`company-user-reset:${selectedCompanyId}:${userItem.id}`]}
                        className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Resetar senha
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Feature flags por tenant">
              {!selectedCompanyId ? (
                <p className="text-sm text-[#587285]">Selecione uma empresa para editar flags.</p>
              ) : (
                <div className="space-y-2">
                  {availableFlagKeys.map((flagKey) => {
                    const currentFlag = companyFlagsByKey.get(flagKey);
                    const enabled = Boolean(currentFlag?.enabled);
                    return (
                      <div
                        key={flagKey}
                        className="flex items-center justify-between rounded-lg border border-[#E3EDF2] px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#002333]">{flagKey}</p>
                          <p className="text-xs text-[#587285]">
                            Rollout: {currentFlag?.rollout_percentage ?? 100}%
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleToggleFeatureFlag(flagKey, enabled)}
                          disabled={busyActions[`flag:${flagKey}`]}
                          className={[
                            'rounded-md px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                            enabled
                              ? 'bg-[#D9F4E4] text-[#0A7A3D] hover:bg-[#C6ECD7]'
                              : 'bg-[#FFE7E7] text-[#B42318] hover:bg-[#FFD9D9]',
                          ].join(' ')}
                        >
                          {enabled ? 'Ativa' : 'Inativa'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel title="Modulos da empresa">
              {!selectedCompanyId ? (
                <p className="text-sm text-[#587285]">Selecione uma empresa para gerenciar modulos.</p>
              ) : !capabilities?.allowCompanyModuleManagement ? (
                <p className="text-sm text-[#B42318]">
                  Gestao de modulos por empresa esta desabilitada pelas capacidades de runtime.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={newCompanyModuleCode}
                      onChange={(event) => setNewCompanyModuleCode(event.target.value)}
                      className="flex-1 rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                    >
                      <option value="">Adicionar modulo...</option>
                      {availableSystemModulesToAdd.map((moduleItem) => (
                        <option key={moduleItem.id} value={moduleItem.codigo}>
                          {moduleItem.nome} ({moduleItem.codigo})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleAddCompanyModule()}
                      disabled={
                        !newCompanyModuleCode ||
                        busyActions[
                          `company-module:add:${selectedCompanyId}:${newCompanyModuleCode}`
                        ]
                      }
                      className="rounded-md border border-[#BCD3DE] px-3 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Adicionar
                    </button>
                  </div>

                  {selectedCompanyModules.length === 0 ? (
                    <p className="text-sm text-[#587285]">Nenhum modulo vinculado para esta empresa.</p>
                  ) : (
                    selectedCompanyModules.map((moduleItem) => (
                      <div
                        key={moduleItem.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#002333]">{moduleItem.modulo}</p>
                          <p className="text-xs text-[#587285]">
                            Atualizado em {formatDateTime(moduleItem.ultimaAtualizacao)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleToggleCompanyModule(moduleItem)}
                          disabled={
                            busyActions[
                              `company-module:toggle:${selectedCompanyId}:${moduleItem.modulo}`
                            ]
                          }
                          className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {moduleItem.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Panel>

            <Panel title="Troca de plano e historico">
              {!selectedCompanyId ? (
                <p className="text-sm text-[#587285]">Selecione uma empresa para trocar plano.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <select
                      value={companyPlanCodeInput}
                      onChange={(event) => setCompanyPlanCodeInput(event.target.value)}
                      className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                    >
                      <option value="">Selecionar plano...</option>
                      {(activePlans.length > 0 ? activePlans : plans).map((plan) => (
                        <option key={plan.id} value={plan.codigo}>
                          {plan.nome} ({plan.codigo})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={companyPlanReasonInput}
                      onChange={(event) => setCompanyPlanReasonInput(event.target.value)}
                      placeholder="Motivo da mudanca (opcional)"
                      className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleChangeCompanyPlan()}
                      disabled={!companyPlanCodeInput || busyActions[`company-plan:${selectedCompanyId}`]}
                      className="rounded-md border border-[#BCD3DE] px-3 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Aplicar plano
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(selectedCompanyPlanHistory || []).slice(0, 6).map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="rounded-lg border border-[#E3EDF2] px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-[#002333]">
                          {historyItem.planoAnterior || 'n/d'} para {historyItem.planoNovo || 'n/d'}
                        </p>
                        <p className="text-xs text-[#587285]">
                          {formatDateTime(historyItem.dataAlteracao)} - R${' '}
                          {Number(historyItem.valorAnterior || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          para R${' '}
                          {Number(historyItem.valorNovo || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {historyItem.motivo ? (
                          <p className="text-xs text-[#587285]">Motivo: {historyItem.motivo}</p>
                        ) : null}
                      </div>
                    ))}
                    {selectedCompanyPlanHistory.length === 0 ? (
                      <p className="text-sm text-[#587285]">Sem historico de plano para esta empresa.</p>
                    ) : null}
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </section>
      )}

      {activeTab === 'plans' && (
        <Panel
          title="Catalogo de planos"
          extra={
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F1F7FA] px-2 py-1 text-xs font-semibold text-[#335B6D]">
                {sortedPlans.length} plano(s)
              </span>
              <button
                type="button"
                onClick={showPlanForm ? resetPlanForm : handleOpenCreatePlanForm}
                className={[
                  'rounded-md px-3 py-1.5 text-xs font-semibold',
                  showPlanForm
                    ? 'border border-[#BCD3DE] text-[#0F5A6B] hover:bg-[#F3FAFC]'
                    : 'bg-[#149CA0] text-white hover:bg-[#11888B]',
                ].join(' ')}
              >
                {showPlanForm ? 'Fechar editor' : 'Novo plano'}
              </button>
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] bg-[#F8FCFD] px-3 py-2.5">
            <p className="text-xs text-[#587285]">
              Monte planos comerciais com modulos e limites de uso. Modulos essenciais permanecem vinculados automaticamente.
            </p>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#335B6D]">
              Visao unificada
            </span>
          </div>

          {showPlanForm ? (
            <section className="mb-5 rounded-xl border border-[#D9E6EC] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#002333]">
                    {planFormMode === 'edit' ? 'Editar plano' : 'Novo plano'}
                  </h3>
                  <p className="text-xs text-[#587285]">
                    Campos com * sao obrigatorios. Use -1 nos limites para comportamento ilimitado.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                      Nome do plano *
                      <input
                        type="text"
                        value={planForm.nome}
                        onChange={(event) =>
                          setPlanForm((current) => ({ ...current, nome: event.target.value }))
                        }
                        placeholder="Ex.: Business"
                        className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                      />
                    </label>

                    <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                      Codigo *
                      <input
                        type="text"
                        value={planForm.codigo}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            codigo: event.target.value
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^a-z0-9_-]/g, ''),
                          }))
                        }
                        placeholder="Ex.: business"
                        className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                      />
                    </label>

                    <label className="grid gap-1 text-xs font-medium text-[#335B6D] md:col-span-2">
                      Descricao
                      <textarea
                        value={planForm.descricao}
                        onChange={(event) =>
                          setPlanForm((current) => ({ ...current, descricao: event.target.value }))
                        }
                        rows={2}
                        placeholder="Resumo do valor do plano para a equipe comercial"
                        className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border border-[#E3EDF2] bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#587285]">
                      Limites e precificacao
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                        Preco (R$)
                        <input
                          type="number"
                          step="0.01"
                          value={planForm.preco}
                          onChange={(event) =>
                            setPlanForm((current) => ({ ...current, preco: event.target.value }))
                          }
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        />
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                        Periodicidade
                        <select
                          value={planForm.periodicidadeCobranca}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              periodicidadeCobranca:
                                event.target.value === 'anual' ? 'anual' : 'mensal',
                            }))
                          }
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        >
                          <option value="mensal">Mensal</option>
                          <option value="anual">Anual</option>
                        </select>
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                        Dias de trial
                        <input
                          type="number"
                          min={0}
                          value={planForm.diasTrial}
                          onChange={(event) =>
                            setPlanForm((current) => ({ ...current, diasTrial: event.target.value }))
                          }
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        />
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                        Ordem de exibicao
                        <input
                          type="number"
                          value={planForm.ordem}
                          onChange={(event) =>
                            setPlanForm((current) => ({ ...current, ordem: event.target.value }))
                          }
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        />
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                        Limite de usuarios
                        <input
                          type="number"
                          value={planForm.limiteUsuarios}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              limiteUsuarios: event.target.value,
                            }))
                          }
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        />
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-[#335B6D]">
                        Limite de clientes
                        <input
                          type="number"
                          value={planForm.limiteClientes}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              limiteClientes: event.target.value,
                            }))
                          }
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        />
                      </label>

                      <label className="grid gap-1 text-xs font-medium text-[#335B6D] md:col-span-2">
                        Gateway Price ID (opcional)
                        <input
                          type="text"
                          value={planForm.gatewayPriceId}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              gatewayPriceId: event.target.value,
                            }))
                          }
                          placeholder="Ex.: MP-BASIC-MONTHLY-001"
                          className="rounded-md border border-[#C9DCE5] px-2 py-1.5 text-sm font-normal text-[#002333] outline-none focus:border-[#149CA0]"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-[#E3EDF2] bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#587285]">
                      Recursos do plano
                    </p>
                    <div className="grid gap-2">
                      <label className="flex items-center gap-2 rounded-md border border-[#E3EDF2] px-2 py-1.5 text-xs text-[#335B6D]">
                        <input
                          type="checkbox"
                          checked={planForm.ativo}
                          onChange={(event) =>
                            setPlanForm((current) => ({ ...current, ativo: event.target.checked }))
                          }
                        />
                        Plano ativo
                      </label>
                      <label className="flex items-center gap-2 rounded-md border border-[#E3EDF2] px-2 py-1.5 text-xs text-[#335B6D]">
                        <input
                          type="checkbox"
                          checked={planForm.publicadoCheckout}
                          onChange={(event) =>
                            setPlanForm((current) => ({
                              ...current,
                              publicadoCheckout: event.target.checked,
                            }))
                          }
                        />
                        Publicado no checkout
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E3EDF2] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#587285]">
                      Modulos do plano *
                    </p>
                    <p className="mb-2 text-xs text-[#587285]">
                      Modulos essenciais permanecem selecionados para evitar quebra do baseline.
                    </p>
                    <div className="grid max-h-52 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                      {selectablePlanModules.map((moduleItem) => {
                        const isSelected = selectedPlanModuleIds.has(moduleItem.id);
                        const moduleCode = String(moduleItem.codigo || '').trim().toUpperCase();
                        const isEssentialModule =
                          CORE_ADMIN_CANONICAL_ESSENTIAL_MODULE_CODES.has(moduleCode);
                        const isEssentialLocked = Boolean(isEssentialModule && isSelected);
                        const isExpanded = Boolean(expandedPlanModuleCodes[moduleCode]);
                        const linkedScreens = CORE_ADMIN_MODULE_LINKED_SCREENS[moduleCode] || [];
                        return (
                          <div
                            key={moduleItem.id}
                            className={[
                              'rounded-md border px-2 py-1.5 text-xs',
                              isSelected
                                ? 'border-[#B7D8E3] bg-[#F5FBFD] text-[#1C4A5A]'
                                : 'border-[#E3EDF2] bg-white text-[#335B6D]',
                            ].join(' ')}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleModuleLinkedScreens(moduleCode)}
                                className="rounded-md border border-[#BCD3DE] px-1.5 py-0.5 text-[11px] font-semibold text-[#0F5A6B] hover:bg-[#F3FAFC]"
                                title={isExpanded ? 'Ocultar telas vinculadas' : 'Ver telas vinculadas'}
                                aria-label={
                                  isExpanded
                                    ? `Ocultar telas vinculadas ao modulo ${moduleItem.nome}`
                                    : `Exibir telas vinculadas ao modulo ${moduleItem.nome}`
                                }
                              >
                                {isExpanded ? '-' : '+'}
                              </button>
                              <label className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePlanFormModule(moduleItem.id)}
                                  disabled={isEssentialLocked}
                                />
                                <span>
                                  <strong className="text-[#002333]">{moduleItem.nome}</strong>
                                  <br />
                                  {moduleItem.codigo}
                                  {isEssentialModule ? (
                                    <span className="ml-1 rounded-full bg-[#E8F2F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#335B6D]">
                                      Essencial
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            </div>
                            {isExpanded ? (
                              <div className="mt-2 rounded-md border border-[#E3EDF2] bg-white px-2 py-1.5">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#587285]">
                                  Telas vinculadas
                                </p>
                                {linkedScreens.length === 0 ? (
                                  <p className="text-[11px] text-[#587285]">
                                    Sem mapeamento de telas para este modulo.
                                  </p>
                                ) : (
                                  <ul className="space-y-1 text-[11px] text-[#335B6D]">
                                    {linkedScreens.map((screen) => (
                                      <li key={`${moduleCode}:${screen.path}`}>
                                        {screen.label} - {screen.path}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetPlanForm}
                  className="rounded-md border border-[#C9DCE5] px-3 py-2 text-xs font-medium text-[#335B6D] hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSavePlan()}
                  disabled={
                    busyActions[
                      planFormMode === 'edit' && planEditingId
                        ? `plan:save:${planEditingId}`
                        : 'plan:save:new'
                    ]
                  }
                  className="rounded-md bg-[#149CA0] px-3 py-2 text-xs font-semibold text-white hover:bg-[#11888B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {planFormMode === 'edit' ? 'Salvar alteracoes' : 'Criar plano'}
                </button>
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#002333]">Planos cadastrados</h3>
              <p className="text-xs text-[#587285]">Clique em um plano para editar ou alterar status.</p>
            </div>

            {sortedPlans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#D9E6EC] bg-[#FAFCFD] px-4 py-6 text-center">
                <p className="text-sm text-[#587285]">
                  Nenhum plano cadastrado ainda. Crie o primeiro para iniciar a comercializacao.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedPlans.map((plan) => {
                  const modules = (plan.modulosInclusos || [])
                    .map(
                      (moduleItem) =>
                        moduleItem?.modulo?.nome ||
                        moduleItem?.nome ||
                        moduleItem?.modulo?.codigo ||
                        moduleItem?.codigo ||
                        moduleItem?.modulo?.id ||
                        moduleItem?.id,
                    )
                    .filter((value): value is string => Boolean(value));

                  return (
                    <article
                      key={plan.id}
                      className="rounded-xl border border-[#E3EDF2] bg-white p-4 transition hover:border-[#BFD5DF] hover:shadow-[0_6px_20px_rgba(0,35,51,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#002333]">{plan.nome}</p>
                          <p className="text-xs text-[#587285]">{plan.codigo}</p>
                        </div>
                        <StatusBadge active={plan.ativo} activeLabel="Ativo" inactiveLabel="Inativo" />
                      </div>

                      {plan.descricao ? (
                        <p className="mt-2 text-xs text-[#587285]">{plan.descricao}</p>
                      ) : null}

                      <div className="mt-3 flex items-end gap-1">
                        <p className="text-xl font-semibold text-[#0F5A6B]">
                          R$ {Number(plan.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="pb-0.5 text-xs text-[#587285]">
                          /{plan.periodicidadeCobranca === 'anual' ? 'ano' : 'mes'}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-x-4 gap-y-2 rounded-lg border border-[#EEF4F7] bg-[#FBFDFE] px-3 py-2.5 text-sm sm:grid-cols-2">
                        <p className="text-[#335B6D]">
                          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#6A8697]">
                            Usuarios
                          </span>
                          {formatPlanLimitValue(plan.limiteUsuarios)}
                        </p>
                        <p className="text-[#335B6D]">
                          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#6A8697]">
                            Clientes
                          </span>
                          {formatPlanLimitValue(plan.limiteClientes)}
                        </p>
                        <p className="text-[#335B6D]">
                          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#6A8697]">
                            Trial
                          </span>
                          {Math.max(0, Number(plan.diasTrial || 0))} dia(s)
                        </p>
                        <p className="text-[#335B6D]">
                          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#6A8697]">
                            Checkout
                          </span>
                          {plan.publicadoCheckout === false ? 'Oculto' : 'Publicado'}
                        </p>
                      </div>

                      {plan.gatewayPriceId ? (
                        <p className="mt-2 text-xs text-[#587285]">
                          Gateway Price ID: <span className="font-medium text-[#335B6D]">{plan.gatewayPriceId}</span>
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {modules.length === 0 ? (
                          <span className="rounded-full border border-[#E3EDF2] px-2 py-1 text-xs text-[#587285]">
                            Sem modulos definidos
                          </span>
                        ) : (
                          modules.map((moduleName) => (
                            <span
                              key={`${plan.id}:${moduleName}`}
                              className="rounded-full border border-[#D9E6EC] bg-[#F7FBFD] px-2 py-1 text-xs text-[#335B6D]"
                            >
                              {moduleName}
                            </span>
                          ))
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditPlan(plan)}
                          className="rounded-md border border-[#BCD3DE] px-3 py-1.5 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTogglePlan(plan.id)}
                          disabled={busyActions[`plan:${plan.id}`]}
                          className="rounded-md border border-[#BCD3DE] px-3 py-1.5 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {plan.ativo ? 'Desativar plano' : 'Ativar plano'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </Panel>
      )}

      {activeTab === 'billing' && (
        <Panel
          title="Assinaturas por empresa"
          extra={
            capabilities?.allowManualBillingDueDateCycle ? (
              <button
                type="button"
                onClick={() => void handleRunDueDateCycle()}
                disabled={busyActions['billing:due-date-cycle']}
                className="rounded-lg border border-[#F2C094] bg-[#FFF8EF] px-3 py-2 text-xs font-semibold text-[#8A5700] hover:bg-[#FFF1DC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Rodar ciclo manual (sensivel)
              </button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {billingItems.length === 0 ? (
              <p className="text-sm text-[#587285]">Nenhuma assinatura encontrada.</p>
            ) : (
              billingItems.map((item) => {
                const companyId = item?.empresa?.id || `missing-${item?.assinatura?.id || '0'}`;
                const canonicalStatus = item?.assinatura?.status_canonico || 'unknown';
                return (
                  <div
                    key={companyId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#002333]">
                        {item?.empresa?.nome || 'Empresa sem nome'}
                      </p>
                      <p className="text-xs text-[#587285]">
                        Plano: {item?.empresa?.plano || 'n/d'} - Status assinatura: {canonicalStatus}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#0F5A6B]">
                        R$ {Number(item?.assinatura?.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {item.assinatura ? (
                        <button
                          type="button"
                          onClick={() => void handleToggleBillingStatus(item)}
                          disabled={busyActions[`billing:${item.empresa.id}`]}
                          className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {canonicalStatus === 'active' ? 'Suspender' : 'Reativar'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      )}

      {activeTab === 'access' && (
        <div className="space-y-4">
          {loadingAccessTab ? (
            <div className="rounded-lg border border-[#D9E6EC] bg-[#F8FCFD] px-3 py-2 text-sm text-[#587285]">
              Atualizando dados de acesso...
            </div>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Panel
              title="Usuarios (escopo administrador)"
              extra={
                <span className="rounded-full bg-[#F1F7FA] px-2 py-1 text-xs font-semibold text-[#335B6D]">
                  Total: {usersTotal}
                </span>
              }
            >
              <div className="mb-3 grid gap-2 md:grid-cols-4">
                <input
                  type="text"
                  value={usersSearchInput}
                  onChange={(event) => setUsersSearchInput(event.target.value)}
                  placeholder="Buscar nome ou email"
                  className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                />
                <select
                  value={usersRoleInput}
                  onChange={(event) => setUsersRoleInput(event.target.value)}
                  className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                >
                  <option value="">Todos os perfis</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="GERENTE">GERENTE</option>
                  <option value="SUPORTE">SUPORTE</option>
                  <option value="FINANCEIRO">FINANCEIRO</option>
                  <option value="VENDEDOR">VENDEDOR</option>
                </select>
                <select
                  value={usersActiveInput}
                  onChange={(event) => setUsersActiveInput(event.target.value as UsersActiveFilter)}
                  className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Somente ativos</option>
                  <option value="inactive">Somente inativos</option>
                </select>
                <button
                  type="button"
                  onClick={handleApplyUsersFilters}
                  className="rounded-md border border-[#BCD3DE] px-3 py-1 text-sm font-medium text-[#0F5A6B] hover:bg-[#F3FAFC]"
                >
                  Aplicar filtros
                </button>
              </div>

              <div className="space-y-2">
                {users.length === 0 ? (
                  <p className="text-sm text-[#587285]">Nenhum usuario encontrado.</p>
                ) : (
                  users.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#002333]">{userItem.nome}</p>
                        <p className="text-xs text-[#587285]">
                          {userItem.email || 'sem email'} - role {userItem.role || 'n/d'}
                        </p>
                      </div>
                      <StatusBadge
                        active={Boolean(userItem.ativo)}
                        activeLabel="Ativo"
                        inactiveLabel="Inativo"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRecertifyUser(userItem.id, true)}
                          disabled={busyActions[`recertify:${userItem.id}`]}
                          className="rounded-md bg-[#D9F4E4] px-2 py-1 text-xs font-semibold text-[#0A7A3D] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Recertificar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRecertifyUser(userItem.id, false)}
                          disabled={busyActions[`recertify:${userItem.id}`]}
                          className="rounded-md bg-[#FFE7E7] px-2 py-1 text-xs font-semibold text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reprovar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#587285]">
                  Pagina {usersPage} de {usersTotalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUsersPage((current) => Math.max(1, current - 1))}
                    disabled={usersPage <= 1 || loadingAccessTab}
                    className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUsersPage((current) => Math.min(usersTotalPages, current + 1))
                    }
                    disabled={usersPage >= usersTotalPages || loadingAccessTab}
                    className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </Panel>

            <Panel
              title="Solicitacoes de mudanca de acesso"
              extra={
                <button
                  type="button"
                  onClick={() => void loadCoreAdminData()}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC]"
                >
                  Atualizar
                </button>
              }
            >
              <div className="space-y-2">
                {accessChangeRequests.length === 0 ? (
                  <p className="text-sm text-[#587285]">Sem solicitacoes pendentes.</p>
                ) : (
                  accessChangeRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-[#E3EDF2] p-3">
                      <p className="text-sm font-semibold text-[#002333]">
                        {request.target_user?.nome || request.target_user?.email || 'Usuario'}
                      </p>
                      <p className="text-xs text-[#587285]">
                        Acao: {request.action || 'n/d'} - status: {request.status || 'n/d'}
                      </p>
                      <p className="mt-1 text-xs text-[#587285]">
                        Motivo: {request.request_reason || 'nao informado'}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAccessChangeDecision(request.id, true)}
                          disabled={busyActions[`access-change:${request.id}`]}
                          className="rounded-md bg-[#D9F4E4] px-2 py-1 text-xs font-semibold text-[#0A7A3D] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAccessChangeDecision(request.id, false)}
                          disabled={busyActions[`access-change:${request.id}`]}
                          className="rounded-md bg-[#FFE7E7] px-2 py-1 text-xs font-semibold text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </section>

          <section>
            <Panel
              title="Relatorio de recertificacao de acesso"
              extra={
                <button
                  type="button"
                  onClick={handleApplyAccessReviewFilters}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC]"
                >
                  Atualizar relatorio
                </button>
              }
            >
              <div className="mb-3 grid gap-2 md:grid-cols-4">
                <select
                  value={accessReviewRoleInput}
                  onChange={(event) => setAccessReviewRoleInput(event.target.value)}
                  className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
                >
                  <option value="">Todos os perfis</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="GERENTE">GERENTE</option>
                  <option value="SUPORTE">SUPORTE</option>
                  <option value="FINANCEIRO">FINANCEIRO</option>
                  <option value="VENDEDOR">VENDEDOR</option>
                </select>
                <label className="flex items-center gap-2 rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#335B6D]">
                  <input
                    type="checkbox"
                    checked={accessReviewIncludeInactiveInput}
                    onChange={(event) => setAccessReviewIncludeInactiveInput(event.target.checked)}
                  />
                  Incluir inativos
                </label>
              </div>

              <div className="mb-3 grid gap-2 md:grid-cols-3">
                <MetricMini
                  label="Total usuarios"
                  value={String(accessReviewReport?.summary?.total_users ?? 0)}
                />
                <MetricMini
                  label="Ativos"
                  value={String(accessReviewReport?.summary?.active_users ?? 0)}
                />
                <MetricMini
                  label="Inativos"
                  value={String(accessReviewReport?.summary?.inactive_users ?? 0)}
                />
              </div>

              <div className="space-y-2">
                {(accessReviewReport?.users || []).slice(0, 8).map((userItem) => (
                  <div
                    key={`review-${userItem.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3EDF2] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#002333]">{userItem.nome}</p>
                      <p className="text-xs text-[#587285]">
                        {userItem.email || 'sem email'} - {userItem.role || 'n/d'} -{' '}
                        {userItem.ativo ? 'ativo' : 'inativo'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRecertifyUser(userItem.id, true)}
                        disabled={busyActions[`recertify:${userItem.id}`]}
                        className="rounded-md bg-[#D9F4E4] px-2 py-1 text-xs font-semibold text-[#0A7A3D] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Manter acesso
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRecertifyUser(userItem.id, false)}
                        disabled={busyActions[`recertify:${userItem.id}`]}
                        className="rounded-md bg-[#FFE7E7] px-2 py-1 text-xs font-semibold text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Revogar acesso
                      </button>
                    </div>
                  </div>
                ))}
                {!accessReviewReport?.users?.length ? (
                  <p className="text-sm text-[#587285]">Nenhum usuario no relatorio atual.</p>
                ) : null}
              </div>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel
              title="Break-glass pendente"
              extra={
                <button
                  type="button"
                  onClick={() => void handleCreateBreakGlassRequest()}
                  disabled={busyActions['break-glass:create']}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Nova solicitacao
                </button>
              }
            >
              <div className="space-y-2">
                {breakGlassRequests.length === 0 ? (
                  <p className="text-sm text-[#587285]">Sem break-glass pendente.</p>
                ) : (
                  breakGlassRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-[#E3EDF2] p-3">
                      <p className="text-sm font-semibold text-[#002333]">
                        {request.target_user?.nome || request.target_user?.email || 'Usuario alvo'}
                      </p>
                      <p className="text-xs text-[#587285]">
                        Status: {request.status || 'n/d'} - Duracao: {request.duration_minutes || 0}{' '}
                        min
                      </p>
                      <p className="mt-1 text-xs text-[#587285]">
                        Motivo: {request.request_reason || 'nao informado'}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleBreakGlassDecision(request.id, true)}
                          disabled={busyActions[`break-glass:${request.id}`]}
                          className="rounded-md bg-[#D9F4E4] px-2 py-1 text-xs font-semibold text-[#0A7A3D] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleBreakGlassDecision(request.id, false)}
                          disabled={busyActions[`break-glass:${request.id}`]}
                          className="rounded-md bg-[#FFE7E7] px-2 py-1 text-xs font-semibold text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="Break-glass ativo">
              <div className="space-y-2">
                {activeBreakGlassAccesses.length === 0 ? (
                  <p className="text-sm text-[#587285]">Nenhum acesso emergencial ativo.</p>
                ) : (
                  activeBreakGlassAccesses.map((request) => (
                    <div key={request.id} className="rounded-lg border border-[#E3EDF2] p-3">
                      <p className="text-sm font-semibold text-[#002333]">
                        {request.target_user?.nome || request.target_user?.email || 'Usuario alvo'}
                      </p>
                      <p className="text-xs text-[#587285]">
                        Expira em: {formatDateTime(request.expires_at || undefined)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleRevokeBreakGlass(request.id)}
                        disabled={busyActions[`break-glass-revoke:${request.id}`]}
                        className="mt-2 rounded-md bg-[#FFE7E7] px-2 py-1 text-xs font-semibold text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Revogar acesso
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </section>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          {loadingAuditTab ? (
            <div className="rounded-lg border border-[#D9E6EC] bg-[#F8FCFD] px-3 py-2 text-sm text-[#587285]">
              Atualizando dados de auditoria...
            </div>
          ) : null}

          <Panel
            title="Auditoria critica"
            extra={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleExportCriticalAudit('csv')}
                  disabled={busyActions['audit-export:csv']}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportCriticalAudit('json')}
                  disabled={busyActions['audit-export:json']}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Exportar JSON
                </button>
              </div>
            }
          >
            <div className="mb-3 grid gap-2 md:grid-cols-5">
              <select
                value={auditOutcomeInput}
                onChange={(event) => setAuditOutcomeInput(event.target.value)}
                className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
              >
                <option value="">Todos os outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="ERROR">ERROR</option>
                <option value="DENIED">DENIED</option>
              </select>
              <select
                value={auditMethodInput}
                onChange={(event) => setAuditMethodInput(event.target.value)}
                className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
              >
                <option value="">Todos os metodos</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="date"
                value={auditDateStartInput}
                onChange={(event) => setAuditDateStartInput(event.target.value)}
                className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
              />
              <input
                type="date"
                value={auditDateEndInput}
                onChange={(event) => setAuditDateEndInput(event.target.value)}
                className="rounded-md border border-[#C9DCE5] px-2 py-1 text-sm text-[#002333] outline-none focus:border-[#149CA0]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyAuditFilters}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] hover:bg-[#F3FAFC]"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={handleResetAuditFilters}
                  className="rounded-md border border-[#E3EDF2] px-2 py-1 text-xs font-medium text-[#587285] hover:bg-[#FAFCFD]"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {criticalAudit.length === 0 ? (
                <p className="text-sm text-[#587285]">Nenhum evento critico encontrado.</p>
              ) : (
                criticalAudit.map((audit) => (
                  <div key={audit.id} className="rounded-lg border border-[#E3EDF2] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#002333]">
                        {audit.httpMethod || 'METHOD'} {audit.route || 'sem rota'}
                      </p>
                      <span
                        className={[
                          'rounded-full px-2 py-1 text-xs font-semibold',
                          audit.outcome === 'SUCCESS'
                            ? 'bg-[#D9F4E4] text-[#0A7A3D]'
                            : 'bg-[#FFE7E7] text-[#B42318]',
                        ].join(' ')}
                      >
                        {audit.outcome || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#587285]">
                      Actor: {audit.actorEmail || audit.actorUserId || 'n/d'} - Status:{' '}
                      {audit.statusCode || 'n/d'} - {formatDateTime(audit.createdAt)}
                    </p>
                    {audit.errorMessage ? (
                      <p className="mt-1 text-xs text-[#B42318]">{audit.errorMessage}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[#587285]">
                Pagina {auditPage} de {auditTotalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuditPage((current) => Math.max(1, current - 1))}
                  disabled={auditPage <= 1 || loadingAuditTab}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setAuditPage((current) => Math.min(auditTotalPages, current + 1))}
                  disabled={auditPage >= auditTotalPages || loadingAuditTab}
                  className="rounded-md border border-[#BCD3DE] px-2 py-1 text-xs font-medium text-[#0F5A6B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Proxima
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Atividades administrativas recentes">
            <div className="space-y-2">
              {auditActivities.length === 0 ? (
                <p className="text-sm text-[#587285]">Sem atividades administrativas no periodo.</p>
              ) : (
                auditActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-[#E3EDF2] px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-[#002333]">
                      {activity.descricao || 'Atividade administrativa'}
                    </p>
                    <p className="text-xs text-[#587285]">
                      Tipo: {activity.tipo || 'n/d'} - Categoria: {activity.categoria || 'n/d'} -{' '}
                      {formatDateTime(activity.createdAt || activity.created_at || activity.criado_em)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      )}
        </div>
      </section>
    </div>
  );
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'n/d';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('pt-BR');
};

const countEnabledCapabilities = (capabilities: Record<string, unknown>) => {
  return Object.entries(capabilities)
    .filter(([, isEnabled]) => isEnabled === true)
    .map(([capabilityKey]) => capabilityKey);
};

const downloadTextFile = (fileName: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(objectUrl);
};

const Panel: React.FC<{ title: string; children: React.ReactNode; extra?: React.ReactNode }> = ({
  title,
  children,
  extra,
}) => (
  <section className="rounded-xl border border-[#E3EDF2] bg-white p-4 shadow-[0_10px_24px_-26px_rgba(0,35,51,0.45)]">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-[#002333]">{title}</h2>
      {extra}
    </div>
    {children}
  </section>
);

const MetricCard: React.FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="rounded-xl border border-[#E3EDF2] bg-white p-4 shadow-[0_12px_22px_-24px_rgba(16,57,74,0.45)]">
    <p className="text-xs uppercase tracking-wide text-[#587285]">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-[#002333]">{value}</p>
    {hint ? <p className="mt-1.5 text-xs text-[#587285]">{hint}</p> : null}
  </div>
);

const MetricMini: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-[#E3EDF2] bg-white px-3 py-2">
    <p className="text-xs uppercase tracking-wide text-[#587285]">{label}</p>
    <p className="mt-1 text-lg font-semibold text-[#002333]">{value}</p>
  </div>
);

const CapabilityRow: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center justify-between rounded-lg border border-[#E3EDF2] px-3 py-2">
    <p className="text-sm text-[#335B6D]">{label}</p>
    <span
      className={[
        'rounded-full px-2 py-1 text-xs font-semibold',
        enabled ? 'bg-[#D9F4E4] text-[#0A7A3D]' : 'bg-[#FFE7E7] text-[#B42318]',
      ].join(' ')}
    >
      {enabled ? 'Habilitado' : 'Desabilitado'}
    </span>
  </div>
);

const StatusBadge: React.FC<{ active: boolean; activeLabel?: string; inactiveLabel?: string }> = ({
  active,
  activeLabel = 'Ativa',
  inactiveLabel = 'Inativa',
}) => (
  <span
    className={[
      'rounded-full px-2 py-1 text-xs font-semibold',
      active ? 'bg-[#D9F4E4] text-[#0A7A3D]' : 'bg-[#FFE7E7] text-[#B42318]',
    ].join(' ')}
  >
    {active ? activeLabel : inactiveLabel}
  </span>
);

export default CoreAdminPage;
