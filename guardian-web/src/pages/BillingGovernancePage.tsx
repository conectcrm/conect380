import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ConfirmActionModal,
  type ConfirmActionModalStatus,
} from '../components/ConfirmActionModal';
import { api } from '../lib/api';

type BillingCompany = {
  id: string;
  nome: string;
  status?: string | null;
  plano?: string | null;
  ativo?: boolean | null;
};

type BillingSubscription = {
  id: string;
  status: string;
  status_canonico?: string | null;
  valor_mensal?: number | null;
  proximo_vencimento?: string | null;
  renovacao_automatica?: boolean | null;
  plano?: {
    id?: string;
    nome?: string;
  } | null;
};

type BillingItem = {
  empresa: BillingCompany;
  assinatura: BillingSubscription | null;
};

type ModuleCatalogItem = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  essencial: boolean;
  ordem: number;
};

type PlanCatalogItem = {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco: number | null;
  limiteUsuarios: number | null;
  limiteClientes: number | null;
  limiteStorage: number | null;
  limiteApiCalls: number | null;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ativo: boolean;
  ordem: number;
  modulosInclusos: ModuleCatalogItem[];
};

type PlanFormState = {
  nome: string;
  codigo: string;
  descricao: string;
  preco: string;
  limiteUsuarios: string;
  limiteClientes: string;
  limiteStorage: string;
  limiteApiCalls: string;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ativo: boolean;
  ordem: string;
  modulosInclusos: string[];
};

type ActionDialogState =
  | {
      mode: 'suspend_subscription';
      item: BillingItem;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
      reasonPlaceholder?: string;
      successMessage: string;
    }
  | {
      mode: 'reactivate_subscription';
      item: BillingItem;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
      reasonPlaceholder?: string;
      successMessage: string;
    };

type ActionExecutionResult = { ok: true } | { ok: false; message: string };

type DialogStatusState = {
  status: ConfirmActionModalStatus;
  message: string | null;
};

const createIdleDialogStatus = (): DialogStatusState => ({
  status: 'idle',
  message: null,
});

const createLoadingDialogStatus = (): DialogStatusState => ({
  status: 'loading',
  message: 'Processando acao e registrando auditoria guardian...',
});

const createErrorDialogStatus = (message: string): DialogStatusState => ({
  status: 'error',
  message,
});

const createSuccessDialogStatus = (message: string): DialogStatusState => ({
  status: 'success',
  message,
});

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Ativa' },
  { value: 'past_due', label: 'Inadimplente' },
  { value: 'suspended', label: 'Suspensa' },
  { value: 'canceled', label: 'Cancelada' },
];

const createEmptyPlanForm = (): PlanFormState => ({
  nome: '',
  codigo: '',
  descricao: '',
  preco: '0',
  limiteUsuarios: '-1',
  limiteClientes: '-1',
  limiteStorage: '-1',
  limiteApiCalls: '-1',
  whiteLabel: false,
  suportePrioritario: false,
  ativo: true,
  ordem: '0',
  modulosInclusos: [],
});

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const formatCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatLimit = (value: number | null): string => {
  if (value === null) {
    return '-';
  }
  if (value === -1) {
    return 'Ilimitado';
  }
  return value.toLocaleString('pt-BR');
};

const formatStorageLimit = (value: number | null): string => {
  if (value === null) {
    return '-';
  }
  if (value === -1) {
    return 'Ilimitado';
  }

  const gb = 1024 ** 3;
  const mb = 1024 ** 2;
  if (value >= gb) {
    const quantity = value / gb;
    return `${quantity.toLocaleString('pt-BR', {
      minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
      maximumFractionDigits: 2,
    })} GB`;
  }
  if (value >= mb) {
    const quantity = value / mb;
    return `${quantity.toLocaleString('pt-BR', {
      minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
      maximumFractionDigits: 2,
    })} MB`;
  }

  return `${value.toLocaleString('pt-BR')} B`;
};

const parseErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const parseNumberLike = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const parseBooleanLike = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'sim') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'nao') {
      return false;
    }
  }
  return fallback;
};

const parseModuleItem = (raw: unknown): ModuleCatalogItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = String(item.id ?? '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    nome: String(item.nome ?? item.codigo ?? id),
    codigo: String(item.codigo ?? item.nome ?? id),
    ativo: parseBooleanLike(item.ativo, true),
    essencial: parseBooleanLike(item.essencial, false),
    ordem: parseNumberLike(item.ordem) ?? 0,
  };
};

const parsePlanModules = (raw: unknown): ModuleCatalogItem[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const byId = new Map<string, ModuleCatalogItem>();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const relation = entry as Record<string, unknown>;
    const nestedModule =
      relation.modulo && typeof relation.modulo === 'object' ? relation.modulo : relation;
    const parsedModule = parseModuleItem(nestedModule);

    if (parsedModule && !byId.has(parsedModule.id)) {
      byId.set(parsedModule.id, parsedModule);
    }
  }

  return Array.from(byId.values()).sort(
    (left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, 'pt-BR'),
  );
};

const parsePlanItem = (raw: unknown): PlanCatalogItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = String(item.id ?? '').trim();
  if (!id) {
    return null;
  }

  return {
    id,
    nome: String(item.nome ?? ''),
    codigo: String(item.codigo ?? ''),
    descricao: typeof item.descricao === 'string' ? item.descricao : '',
    preco: parseNumberLike(item.preco),
    limiteUsuarios: parseNumberLike(item.limiteUsuarios),
    limiteClientes: parseNumberLike(item.limiteClientes),
    limiteStorage: parseNumberLike(item.limiteStorage),
    limiteApiCalls: parseNumberLike(item.limiteApiCalls),
    whiteLabel: parseBooleanLike(item.whiteLabel, false),
    suportePrioritario: parseBooleanLike(item.suportePrioritario, false),
    ativo: parseBooleanLike(item.ativo, true),
    ordem: parseNumberLike(item.ordem) ?? 0,
    modulosInclusos: parsePlanModules(item.modulosInclusos),
  };
};

const planToFormState = (plan: PlanCatalogItem): PlanFormState => ({
  nome: plan.nome,
  codigo: plan.codigo,
  descricao: plan.descricao,
  preco: plan.preco !== null ? String(plan.preco) : '0',
  limiteUsuarios: plan.limiteUsuarios !== null ? String(plan.limiteUsuarios) : '-1',
  limiteClientes: plan.limiteClientes !== null ? String(plan.limiteClientes) : '-1',
  limiteStorage: plan.limiteStorage !== null ? String(plan.limiteStorage) : '-1',
  limiteApiCalls: plan.limiteApiCalls !== null ? String(plan.limiteApiCalls) : '-1',
  whiteLabel: plan.whiteLabel,
  suportePrioritario: plan.suportePrioritario,
  ativo: plan.ativo,
  ordem: String(plan.ordem),
  modulosInclusos: plan.modulosInclusos.map((moduleItem) => moduleItem.id),
});

const parseIntegerField = (raw: string): number | null => {
  const normalized = raw.trim();
  if (!normalized || !/^-?\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDecimalField = (raw: string): number | null => {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const BillingGovernancePage = () => {
  const [rows, setRows] = useState<BillingItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [runningCompanyId, setRunningCompanyId] = useState<string | null>(null);
  const [subscriptionFeedback, setSubscriptionFeedback] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const [planCatalog, setPlanCatalog] = useState<PlanCatalogItem[]>([]);
  const [moduleCatalog, setModuleCatalog] = useState<ModuleCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [runningPlanId, setRunningPlanId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [catalogFeedback, setCatalogFeedback] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(() => createEmptyPlanForm());
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [dialogStatus, setDialogStatus] = useState<DialogStatusState>(() => createIdleDialogStatus());

  const loadSubscriptions = useCallback(async () => {
    setLoadingSubscriptions(true);
    setSubscriptionError(null);

    try {
      const params: Record<string, string | number> = {
        page: 1,
        limit: 50,
      };

      const normalizedSearch = search.trim();
      if (normalizedSearch) {
        params.search = normalizedSearch;
      }

      if (statusFilter !== 'ALL') {
        params.subscription_status = statusFilter;
      }

      const response = await api.get('/guardian/bff/billing/subscriptions', { params });
      const payload = Array.isArray(response.data?.data) ? response.data.data : [];

      const nextRows = payload.map((entry: Record<string, unknown>) => {
        const empresaRaw =
          entry.empresa && typeof entry.empresa === 'object'
            ? (entry.empresa as Record<string, unknown>)
            : {};
        const assinaturaRaw =
          entry.assinatura && typeof entry.assinatura === 'object'
            ? (entry.assinatura as Record<string, unknown>)
            : null;

        const subscription: BillingSubscription | null = assinaturaRaw
          ? {
              id: String(assinaturaRaw.id ?? ''),
              status: String(assinaturaRaw.status ?? ''),
              status_canonico:
                typeof assinaturaRaw.status_canonico === 'string'
                  ? assinaturaRaw.status_canonico
                  : null,
              valor_mensal: parseNumberLike(assinaturaRaw.valor_mensal),
              proximo_vencimento:
                typeof assinaturaRaw.proximo_vencimento === 'string'
                  ? assinaturaRaw.proximo_vencimento
                  : null,
              renovacao_automatica:
                typeof assinaturaRaw.renovacao_automatica === 'boolean'
                  ? assinaturaRaw.renovacao_automatica
                  : null,
              plano:
                assinaturaRaw.plano && typeof assinaturaRaw.plano === 'object'
                  ? {
                      id: String((assinaturaRaw.plano as Record<string, unknown>).id ?? ''),
                      nome:
                        typeof (assinaturaRaw.plano as Record<string, unknown>).nome === 'string'
                          ? String((assinaturaRaw.plano as Record<string, unknown>).nome)
                          : undefined,
                    }
                  : null,
            }
          : null;

        return {
          empresa: {
            id: String(empresaRaw.id ?? ''),
            nome: String(empresaRaw.nome ?? '-'),
            status: typeof empresaRaw.status === 'string' ? empresaRaw.status : null,
            plano: typeof empresaRaw.plano === 'string' ? empresaRaw.plano : null,
            ativo: typeof empresaRaw.ativo === 'boolean' ? empresaRaw.ativo : null,
          },
          assinatura: subscription,
        } as BillingItem;
      });

      setRows(nextRows);
    } catch (loadError) {
      setSubscriptionError(
        parseErrorMessage(loadError, 'Falha ao carregar operacoes de cobranca guardian.'),
      );
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [search, statusFilter]);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);

    try {
      const [planResponse, moduleResponse] = await Promise.all([
        api.get('/guardian/planos', { params: { include_inactive: true } }),
        api.get('/guardian/planos/modulos'),
      ]);

      const planItemsRaw = Array.isArray(planResponse.data) ? planResponse.data : [];
      const moduleItemsRaw = Array.isArray(moduleResponse.data) ? moduleResponse.data : [];

      const parsedPlans = planItemsRaw
        .map((item) => parsePlanItem(item))
        .filter((item): item is PlanCatalogItem => item !== null)
        .sort(
          (left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, 'pt-BR'),
        );

      const parsedModules = moduleItemsRaw
        .map((item) => parseModuleItem(item))
        .filter((item): item is ModuleCatalogItem => item !== null)
        .sort(
          (left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, 'pt-BR'),
        );

      setPlanCatalog(parsedPlans);
      setModuleCatalog(parsedModules);
    } catch (loadError) {
      setCatalogError(parseErrorMessage(loadError, 'Falha ao carregar catalogo de planos no guardian.'));
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const runSubscriptionAction = useCallback(
    async (
      companyId: string,
      successMessage: string,
      operation: () => Promise<void>,
    ): Promise<ActionExecutionResult> => {
      setRunningCompanyId(companyId);
      setSubscriptionError(null);
      setSubscriptionFeedback(null);

      try {
        await operation();
        setSubscriptionFeedback(successMessage);
        await loadSubscriptions();
        return { ok: true };
      } catch (actionError) {
        const message = parseErrorMessage(
          actionError,
          'Falha ao executar operacao de cobranca.',
        );
        setSubscriptionError(message);
        return { ok: false, message };
      } finally {
        setRunningCompanyId(null);
      }
    },
    [loadSubscriptions],
  );

  const clearPlanEditor = useCallback(() => {
    setEditingPlanId(null);
    setPlanForm(createEmptyPlanForm());
  }, []);

  const runPlanAction = useCallback(
    async (
      planId: string,
      successMessage: string,
      operation: () => Promise<void>,
    ): Promise<ActionExecutionResult> => {
      setRunningPlanId(planId);
      setCatalogError(null);
      setCatalogFeedback(null);

      try {
        await operation();
        setCatalogFeedback(successMessage);
        await loadCatalog();
        if (editingPlanId === planId) {
          clearPlanEditor();
        }
        return { ok: true };
      } catch (actionError) {
        const message = parseErrorMessage(actionError, 'Falha ao executar acao no catalogo.');
        setCatalogError(message);
        return { ok: false, message };
      } finally {
        setRunningPlanId(null);
      }
    },
    [clearPlanEditor, editingPlanId, loadCatalog],
  );

  const handleEditPlan = useCallback((plan: PlanCatalogItem) => {
    setCatalogError(null);
    setCatalogFeedback(null);
    setEditingPlanId(plan.id);
    setPlanForm(planToFormState(plan));
  }, []);

  const handleTogglePlanModule = useCallback((moduleId: string) => {
    setPlanForm((current) => {
      const hasModule = current.modulosInclusos.includes(moduleId);
      const nextModuleIds = hasModule
        ? current.modulosInclusos.filter((id) => id !== moduleId)
        : [...current.modulosInclusos, moduleId];

      return {
        ...current,
        modulosInclusos: nextModuleIds,
      };
    });
  }, []);

  const handleSavePlan = useCallback(async () => {
    const nome = planForm.nome.trim();
    const codigo = planForm.codigo.trim().toLowerCase();
    const descricao = planForm.descricao.trim();

    const preco = parseDecimalField(planForm.preco);
    const limiteUsuarios = parseIntegerField(planForm.limiteUsuarios);
    const limiteClientes = parseIntegerField(planForm.limiteClientes);
    const limiteStorage = parseIntegerField(planForm.limiteStorage);
    const limiteApiCalls = parseIntegerField(planForm.limiteApiCalls);
    const ordem = parseIntegerField(planForm.ordem);

    const modulosInclusos = Array.from(
      new Set(
        planForm.modulosInclusos
          .map((moduleId) => moduleId.trim())
          .filter((moduleId) => moduleId.length > 0),
      ),
    );

    if (!nome) {
      setCatalogError('Nome do plano obrigatorio.');
      return;
    }
    if (!codigo) {
      setCatalogError('Codigo do plano obrigatorio.');
      return;
    }
    if (preco === null || preco < 0) {
      setCatalogError('Preco invalido. Informe um valor numerico maior ou igual a zero.');
      return;
    }
    if (limiteUsuarios === null || limiteUsuarios < -1) {
      setCatalogError('Limite de usuarios invalido. Use inteiro >= -1.');
      return;
    }
    if (limiteClientes === null || limiteClientes < -1) {
      setCatalogError('Limite de clientes invalido. Use inteiro >= -1.');
      return;
    }
    if (limiteStorage === null || limiteStorage < -1) {
      setCatalogError('Limite de storage invalido. Use inteiro >= -1.');
      return;
    }
    if (limiteApiCalls === null || limiteApiCalls < -1) {
      setCatalogError('Limite de API calls invalido. Use inteiro >= -1.');
      return;
    }
    if (ordem === null || ordem < 0) {
      setCatalogError('Ordem invalida. Use inteiro maior ou igual a zero.');
      return;
    }
    if (modulosInclusos.length === 0) {
      setCatalogError('Selecione ao menos um modulo para o plano.');
      return;
    }

    setSavingPlan(true);
    setCatalogError(null);
    setCatalogFeedback(null);

    try {
      const payload = {
        nome,
        codigo,
        descricao: descricao || undefined,
        preco,
        limiteUsuarios,
        limiteClientes,
        limiteStorage,
        limiteApiCalls,
        whiteLabel: planForm.whiteLabel,
        suportePrioritario: planForm.suportePrioritario,
        ativo: planForm.ativo,
        ordem,
        modulosInclusos,
      };

      if (editingPlanId) {
        await api.put(`/guardian/planos/${editingPlanId}`, payload);
        setCatalogFeedback(`Plano ${nome} atualizado com sucesso.`);
      } else {
        await api.post('/guardian/planos', payload);
        setCatalogFeedback(`Plano ${nome} criado com sucesso.`);
      }

      await loadCatalog();
      clearPlanEditor();
    } catch (saveError) {
      setCatalogError(parseErrorMessage(saveError, 'Falha ao salvar plano no catalogo.'));
    } finally {
      setSavingPlan(false);
    }
  }, [clearPlanEditor, editingPlanId, loadCatalog, planForm]);

  const handleTogglePlanStatus = useCallback(
    async (plan: PlanCatalogItem) => {
      const actionLabel = plan.ativo ? 'arquivado' : 'reativado';
      await runPlanAction(plan.id, `Plano ${plan.nome} ${actionLabel} com sucesso.`, async () => {
        await api.put(`/guardian/planos/${plan.id}/toggle-status`);
      });
    },
    [runPlanAction],
  );

  const hasDialogActionInProgress =
    runningCompanyId !== null || runningPlanId !== null || savingPlan;

  const closeDialog = useCallback(() => {
    if (hasDialogActionInProgress) {
      return;
    }

    setDialogStatus(createIdleDialogStatus());
    setDialog(null);
  }, [hasDialogActionInProgress]);

  const openSuspendDialog = useCallback((item: BillingItem) => {
    setSubscriptionError(null);
    setSubscriptionFeedback(null);
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'suspend_subscription',
      item,
      actionKey: `billing:suspend:${item.empresa.id}`,
      title: 'Suspender assinatura',
      subtitle: `${item.empresa.nome} | a cobranca sera interrompida no billing guardian`,
      confirmLabel: 'Suspender assinatura',
      reasonRequired: true,
      reasonPlaceholder: 'Explique o motivo operacional da suspensao.',
      successMessage: `Assinatura da empresa ${item.empresa.nome} suspensa com sucesso.`,
    });
  }, []);

  const openReactivateDialog = useCallback((item: BillingItem) => {
    setSubscriptionError(null);
    setSubscriptionFeedback(null);
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'reactivate_subscription',
      item,
      actionKey: `billing:reactivate:${item.empresa.id}`,
      title: 'Reativar assinatura',
      subtitle: `${item.empresa.nome} | a empresa voltara a cobrar normalmente`,
      confirmLabel: 'Reativar assinatura',
      reasonRequired: true,
      reasonPlaceholder: 'Explique o motivo da reativacao da assinatura.',
      successMessage: `Assinatura da empresa ${item.empresa.nome} reativada com sucesso.`,
    });
  }, []);

  const confirmDialog = useCallback(
    async (reasonInput: string) => {
      if (!dialog) {
        return;
      }

      const reason = reasonInput.trim();
      if (dialog.reasonRequired && !reason) {
        setDialogStatus(createErrorDialogStatus('Motivo obrigatorio para esta acao.'));
        return;
      }

      setDialogStatus(createLoadingDialogStatus());

      if (dialog.mode === 'suspend_subscription') {
        const result = await runSubscriptionAction(
          dialog.item.empresa.id,
          dialog.successMessage,
          async () => {
            await api.patch(`/guardian/bff/billing/subscriptions/${dialog.item.empresa.id}/suspend`, {
              reason,
            });
          },
        );

        if (result.ok) {
          setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
          return;
        }

        setDialogStatus(createErrorDialogStatus(result.message));

        return;
      }

      if (dialog.mode === 'reactivate_subscription') {
        const result = await runSubscriptionAction(
          dialog.item.empresa.id,
          dialog.successMessage,
          async () => {
            await api.patch(`/guardian/bff/billing/subscriptions/${dialog.item.empresa.id}/reactivate`, {
              reason,
            });
          },
        );

        if (result.ok) {
          setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
          return;
        }

        setDialogStatus(createErrorDialogStatus(result.message));

        return;
      }

    },
    [closeDialog, dialog, runPlanAction, runSubscriptionAction],
  );

  const subscriptionSummary = useMemo(() => {
    const total = rows.length;
    const withSubscription = rows.filter((row) => !!row.assinatura).length;
    const active = rows.filter((row) => row.assinatura?.status_canonico === 'active').length;
    const suspended = rows.filter((row) => row.assinatura?.status_canonico === 'suspended').length;
    const pastDue = rows.filter((row) => row.assinatura?.status_canonico === 'past_due').length;
    return {
      total,
      withSubscription,
      active,
      suspended,
      pastDue,
    };
  }, [rows]);

  const catalogSummary = useMemo(() => {
    const total = planCatalog.length;
    const active = planCatalog.filter((plan) => plan.ativo).length;
    const inactive = total - active;
    return {
      total,
      active,
      inactive,
      modules: moduleCatalog.length,
    };
  }, [moduleCatalog.length, planCatalog]);

  const moduleOptions = useMemo(() => {
    const byId = new Map<string, ModuleCatalogItem>();

    for (const moduleItem of moduleCatalog) {
      byId.set(moduleItem.id, moduleItem);
    }

    for (const plan of planCatalog) {
      for (const moduleItem of plan.modulosInclusos) {
        if (!byId.has(moduleItem.id)) {
          byId.set(moduleItem.id, {
            ...moduleItem,
            ativo: false,
          });
        }
      }
    }

    return Array.from(byId.values()).sort(
      (left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, 'pt-BR'),
    );
  }, [moduleCatalog, planCatalog]);

  const selectedModuleIds = useMemo(
    () => new Set(planForm.modulosInclusos),
    [planForm.modulosInclusos],
  );
  const isPlanActionRunning = savingPlan || runningPlanId !== null;

  return (
    <>
      <section className="card">
        <header className="card-headline">
          <h2>Operacoes de cobranca</h2>
          <div className="inline-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => void loadSubscriptions()}
              disabled={loadingSubscriptions}
            >
              Recarregar
            </button>
          </div>
        </header>
        <p className="subtle">
          Governanca de status de assinatura por empresa. Ciclos de vencimento e conciliacao devem
          ocorrer de forma automatica fora do Guardian; aqui ficam apenas excecoes e decisoes
          sensiveis.
        </p>

        <div className="kpi-inline">
          <span>Empresas listadas: {subscriptionSummary.total}</span>
          <span>Com assinatura: {subscriptionSummary.withSubscription}</span>
          <span>Ativas: {subscriptionSummary.active}</span>
          <span>Suspensas: {subscriptionSummary.suspended}</span>
          <span>Inadimplentes: {subscriptionSummary.pastDue}</span>
        </div>

        <div className="filters-bar">
          <label>
            Buscar empresa
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, email ou CNPJ"
            />
          </label>

          <label>
            Status assinatura
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingSubscriptions ? <p>Carregando operacoes de cobranca...</p> : null}
        {!loadingSubscriptions && subscriptionError ? (
          <p className="error-text">{subscriptionError}</p>
        ) : null}
        {subscriptionFeedback ? <p className="success-text">{subscriptionFeedback}</p> : null}

        {!loadingSubscriptions && !subscriptionError ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Status empresa</th>
                  <th>Status assinatura</th>
                  <th>Plano</th>
                  <th>Valor mensal</th>
                  <th>Proximo vencimento</th>
                  <th>Renovacao</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const status = item.assinatura?.status_canonico || '-';
                  const allowSuspend = status === 'active' || status === 'past_due';
                  const allowReactivate =
                    status === 'suspended' || status === 'past_due' || status === 'trial';
                  const busy = runningCompanyId === item.empresa.id;

                  return (
                    <tr key={item.empresa.id}>
                      <td>{item.empresa.nome}</td>
                      <td>{item.empresa.status || '-'}</td>
                      <td>{status}</td>
                      <td>{item.assinatura?.plano?.nome || item.empresa.plano || '-'}</td>
                      <td>{formatCurrency(item.assinatura?.valor_mensal)}</td>
                      <td>{formatDate(item.assinatura?.proximo_vencimento)}</td>
                      <td>{item.assinatura?.renovacao_automatica ? 'Automatica' : 'Manual'}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button ghost tiny"
                            disabled={!allowSuspend || busy || !item.assinatura}
                            onClick={() => openSuspendDialog(item)}
                          >
                            Suspender
                          </button>
                          <button
                            type="button"
                            className="button secondary tiny"
                            disabled={!allowReactivate || busy || !item.assinatura}
                            onClick={() => openReactivateDialog(item)}
                          >
                            Reativar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Nenhuma assinatura encontrada para os filtros aplicados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="card">
        <header className="card-headline">
          <h2>Catalogo de planos</h2>
          <div className="inline-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => void loadCatalog()}
              disabled={loadingCatalog || isPlanActionRunning}
            >
              Recarregar catalogo
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={clearPlanEditor}
              disabled={isPlanActionRunning}
            >
              Novo plano
            </button>
          </div>
        </header>

        <p className="subtle">
          Catalogo central do Guardian para criar, editar, reativar e arquivar planos com modulos
          vinculados. Exclusao fisica foi removida para preservar historico comercial e auditoria.
        </p>

        <div className="kpi-inline">
          <span>Planos: {catalogSummary.total}</span>
          <span>Ativos: {catalogSummary.active}</span>
          <span>Inativos: {catalogSummary.inactive}</span>
          <span>Modulos disponiveis: {catalogSummary.modules}</span>
        </div>

        {loadingCatalog ? <p>Carregando catalogo de planos...</p> : null}
        {!loadingCatalog && catalogError ? <p className="error-text">{catalogError}</p> : null}
        {catalogFeedback ? <p className="success-text">{catalogFeedback}</p> : null}

        <div className="plan-editor-shell">
          <h3>{editingPlanId ? 'Editar plano' : 'Novo plano'}</h3>

          <div className="plan-form-grid">
            <label>
              Nome
              <input
                value={planForm.nome}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, nome: event.target.value }))
                }
                disabled={isPlanActionRunning}
                placeholder="Plano Professional"
              />
            </label>

            <label>
              Codigo
              <input
                value={planForm.codigo}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, codigo: event.target.value }))
                }
                disabled={isPlanActionRunning}
                placeholder="professional"
              />
            </label>

            <label>
              Preco mensal (BRL)
              <input
                value={planForm.preco}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, preco: event.target.value }))
                }
                disabled={isPlanActionRunning}
                placeholder="199.90"
              />
            </label>

            <label>
              Ordem
              <input
                type="number"
                min={0}
                value={planForm.ordem}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, ordem: event.target.value }))
                }
                disabled={isPlanActionRunning}
              />
            </label>

            <label>
              Limite usuarios (-1 ilimitado)
              <input
                type="number"
                value={planForm.limiteUsuarios}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, limiteUsuarios: event.target.value }))
                }
                disabled={isPlanActionRunning}
              />
            </label>

            <label>
              Limite clientes (-1 ilimitado)
              <input
                type="number"
                value={planForm.limiteClientes}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, limiteClientes: event.target.value }))
                }
                disabled={isPlanActionRunning}
              />
            </label>

            <label>
              Limite storage em bytes (-1 ilimitado)
              <input
                type="number"
                value={planForm.limiteStorage}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, limiteStorage: event.target.value }))
                }
                disabled={isPlanActionRunning}
              />
            </label>

            <label>
              Limite API calls/hora (-1 ilimitado)
              <input
                type="number"
                value={planForm.limiteApiCalls}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, limiteApiCalls: event.target.value }))
                }
                disabled={isPlanActionRunning}
              />
            </label>
          </div>

          <label>
            Descricao
            <textarea
              rows={3}
              value={planForm.descricao}
              onChange={(event) =>
                setPlanForm((current) => ({ ...current, descricao: event.target.value }))
              }
              disabled={isPlanActionRunning}
              placeholder="Descricao interna e comercial do plano"
            />
          </label>

          <div className="inline-actions">
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={planForm.whiteLabel}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, whiteLabel: event.target.checked }))
                }
                disabled={isPlanActionRunning}
              />
              White label
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={planForm.suportePrioritario}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    suportePrioritario: event.target.checked,
                  }))
                }
                disabled={isPlanActionRunning}
              />
              Suporte prioritario
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={planForm.ativo}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, ativo: event.target.checked }))
                }
                disabled={isPlanActionRunning}
              />
              Plano ativo
            </label>
          </div>

          <fieldset className="module-picker">
            <legend>Modulos incluidos no plano</legend>
            <div className="module-checkbox-grid">
              {moduleOptions.map((moduleItem) => {
                const checked = selectedModuleIds.has(moduleItem.id);
                return (
                  <label key={moduleItem.id} className="module-checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTogglePlanModule(moduleItem.id)}
                      disabled={isPlanActionRunning}
                    />
                    <span>{moduleItem.nome}</span>
                    <small>
                      {moduleItem.codigo}
                      {!moduleItem.ativo ? ' (inativo)' : ''}
                    </small>
                  </label>
                );
              })}
            </div>
            {moduleOptions.length === 0 ? (
              <p className="subtle">Nenhum modulo disponivel para vincular ao plano.</p>
            ) : null}
          </fieldset>

          <div className="inline-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => void handleSavePlan()}
              disabled={isPlanActionRunning}
            >
              {savingPlan ? 'Salvando...' : editingPlanId ? 'Atualizar plano' : 'Criar plano'}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={clearPlanEditor}
              disabled={isPlanActionRunning}
            >
              Limpar formulario
            </button>
          </div>
        </div>

        {!loadingCatalog ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Preco</th>
                  <th>Limites</th>
                  <th>Modulos</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {planCatalog.map((plan) => {
                  const busy = runningPlanId === plan.id;
                  return (
                    <tr key={plan.id}>
                      <td>
                        <strong>{plan.nome}</strong>
                        <div className="subtle-inline">{plan.codigo}</div>
                      </td>
                      <td>{plan.ativo ? 'Ativo' : 'Inativo'}</td>
                      <td>{formatCurrency(plan.preco)}</td>
                      <td>
                        <div className="subtle-inline">Usuarios: {formatLimit(plan.limiteUsuarios)}</div>
                        <div className="subtle-inline">Clientes: {formatLimit(plan.limiteClientes)}</div>
                        <div className="subtle-inline">Storage: {formatStorageLimit(plan.limiteStorage)}</div>
                        <div className="subtle-inline">API calls: {formatLimit(plan.limiteApiCalls)}</div>
                      </td>
                      <td>
                        {plan.modulosInclusos.length > 0
                          ? plan.modulosInclusos.map((moduleItem) => moduleItem.nome).join(', ')
                          : '-'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button secondary tiny"
                            onClick={() => handleEditPlan(plan)}
                            disabled={isPlanActionRunning}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="button ghost tiny"
                            onClick={() => void handleTogglePlanStatus(plan)}
                            disabled={isPlanActionRunning || busy}
                          >
                            {plan.ativo ? 'Arquivar' : 'Reativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {planCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhum plano encontrado no catalogo.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <ConfirmActionModal
        open={!!dialog}
        title={dialog?.title || ''}
        subtitle={dialog?.subtitle}
        reasonRequired={dialog?.reasonRequired}
        reasonPlaceholder={dialog?.reasonPlaceholder}
        confirmLabel={dialog?.confirmLabel}
        status={dialogStatus.status}
        statusMessage={dialogStatus.message}
        onCancel={closeDialog}
        onConfirm={(reason) => {
          void confirmDialog(reason);
        }}
      />
    </>
  );
};
