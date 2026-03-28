import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ConfirmActionModal,
  type ConfirmActionModalStatus,
} from '../components/ConfirmActionModal';
import { api } from '../lib/api';

type CompanyItem = {
  id: string;
  nome: string;
  plano?: string;
  status?: string;
  ativo?: boolean;
};

type CompanyUserItem = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  created_at?: string;
};

type PlanCatalogItem = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
};

type ModuleCatalogItem = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
};

type GuardianCapabilities = {
  allowCompanyModuleManagement: boolean;
};

type LastResetPasswordState = {
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  temporaryPassword: string;
};

type ActionDialogState =
  | {
      mode: 'suspend_company';
      company: CompanyItem;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
      reasonPlaceholder?: string;
      successMessage: string;
    }
  | {
      mode: 'reactivate_company';
      company: CompanyItem;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
      reasonPlaceholder?: string;
      successMessage: string;
    }
    | {
      mode: 'reset_user_password';
      company: CompanyItem;
      user: CompanyUserItem;
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

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const formatCompanyStatus = (value?: string): string => {
  if (!value) {
    return 'Sem status';
  }

  switch (value.trim().toLowerCase()) {
    case 'active':
      return 'Operando';
    case 'suspended':
      return 'Suspensa';
    case 'trial':
      return 'Trial';
    case 'inactive':
      return 'Inativa';
    default:
      return value;
  }
};

const resolveCompanyStatusTone = (value?: string): string => {
  switch (value?.trim().toLowerCase()) {
    case 'active':
      return 'ok';
    case 'trial':
      return 'info';
    case 'suspended':
      return 'warn';
    default:
      return 'muted';
  }
};

const toNormalizedPlanToken = (value: string) => value.trim().toLowerCase();

const resolveInitialPlanDraft = (companyPlan: string | undefined, plans: PlanCatalogItem[]): string => {
  const activePlans = plans.filter((plan) => plan.ativo);
  const availablePlans = activePlans.length > 0 ? activePlans : plans;

  if (companyPlan) {
    const normalizedCurrentPlan = toNormalizedPlanToken(companyPlan);

    const byCode = availablePlans.find(
      (plan) => toNormalizedPlanToken(plan.codigo) === normalizedCurrentPlan,
    );
    if (byCode) {
      return byCode.codigo;
    }

    const byName = availablePlans.find(
      (plan) => toNormalizedPlanToken(plan.nome) === normalizedCurrentPlan,
    );
    if (byName) {
      return byName.codigo;
    }
  }

  return availablePlans[0]?.codigo || '';
};

export const CompaniesGovernancePage = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [planCatalog, setPlanCatalog] = useState<PlanCatalogItem[]>([]);
  const [moduleCatalog, setModuleCatalog] = useState<ModuleCatalogItem[]>([]);
  const [capabilities, setCapabilities] = useState<GuardianCapabilities>({
    allowCompanyModuleManagement: false,
  });
  const [loading, setLoading] = useState(true);
  const [runningCompanyId, setRunningCompanyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planDraftByCompanyId, setPlanDraftByCompanyId] = useState<Record<string, string>>({});
  const [moduleDraftByCompanyId, setModuleDraftByCompanyId] = useState<Record<string, string>>({});
  const [usersLimitDraftByCompanyId, setUsersLimitDraftByCompanyId] = useState<Record<string, string>>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyUsersByCompanyId, setCompanyUsersByCompanyId] = useState<Record<string, CompanyUserItem[]>>({});
  const [loadingUsersCompanyId, setLoadingUsersCompanyId] = useState<string | null>(null);
  const [runningUserActionKey, setRunningUserActionKey] = useState<string | null>(null);
  const [lastResetPassword, setLastResetPassword] = useState<LastResetPasswordState | null>(null);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [dialogStatus, setDialogStatus] = useState<DialogStatusState>(() => createIdleDialogStatus());

  const availablePlans = useMemo(() => {
    const activePlans = planCatalog.filter((plan) => plan.ativo);
    return activePlans.length > 0 ? activePlans : planCatalog;
  }, [planCatalog]);

  const availableModules = useMemo(() => {
    const activeModules = moduleCatalog.filter((moduleItem) => moduleItem.ativo);
    return activeModules.length > 0 ? activeModules : moduleCatalog;
  }, [moduleCatalog]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const selectedCompanyUsers = useMemo(() => {
    if (!selectedCompanyId) {
      return [];
    }

    return companyUsersByCompanyId[selectedCompanyId] ?? [];
  }, [companyUsersByCompanyId, selectedCompanyId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [companiesResponse, plansResponse, modulesResponse, capabilitiesResponse] = await Promise.all([
        api.get('/core-admin/bff/companies', { params: { page: 1, limit: 20 } }),
        api.get('/core-admin/planos'),
        api.get('/core-admin/planos/modulos', { params: { include_inactive: true } }),
        api.get('/core-admin/bff/capabilities'),
      ]);

      const companyItemsRaw = companiesResponse.data?.data ?? [];
      const nextCompanies = Array.isArray(companyItemsRaw)
        ? companyItemsRaw.map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ''),
            nome: String(item.nome ?? ''),
            plano: typeof item.plano === 'string' ? item.plano : undefined,
            status: typeof item.status === 'string' ? item.status : undefined,
            ativo: typeof item.ativo === 'boolean' ? item.ativo : undefined,
          }))
        : [];

      const planItemsRaw = Array.isArray(plansResponse.data) ? plansResponse.data : [];
      const nextPlans = planItemsRaw.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        nome: String(item.nome ?? ''),
        codigo: String(item.codigo ?? ''),
        ativo: item.ativo !== false,
      }));

      const moduleItemsRaw = Array.isArray(modulesResponse.data) ? modulesResponse.data : [];
      const nextModules = moduleItemsRaw.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        nome: String(item.nome ?? ''),
        codigo: String(item.codigo ?? ''),
        ativo: item.ativo !== false,
      }));
      const nextCapabilitiesRaw = capabilitiesResponse.data?.data;

      setCompanies(nextCompanies);
      setPlanCatalog(nextPlans);
      setModuleCatalog(nextModules);
      setCapabilities({
        allowCompanyModuleManagement:
          nextCapabilitiesRaw?.allowCompanyModuleManagement === true,
      });

      setPlanDraftByCompanyId((current) => {
        const nextState = { ...current };
        for (const company of nextCompanies) {
          if (!nextState[company.id]) {
            nextState[company.id] = resolveInitialPlanDraft(company.plano, nextPlans);
          }
        }
        return nextState;
      });

      setModuleDraftByCompanyId((current) => {
        const nextState = { ...current };
        for (const company of nextCompanies) {
          if (!nextState[company.id]) {
            nextState[company.id] = '';
          }
        }
        return nextState;
      });
    } catch (loadError) {
      setError(parseErrorMessage(loadError, 'Falha ao carregar empresas no painel guardian.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedCompanyId) {
      return;
    }

    const stillExists = companies.some((company) => company.id === selectedCompanyId);
    if (!stillExists) {
      setSelectedCompanyId(null);
    }
  }, [companies, selectedCompanyId]);

  const runCompanyAction = useCallback(
    async (
      companyId: string,
      successMessage: string,
      operation: () => Promise<void>,
    ): Promise<ActionExecutionResult> => {
      setRunningCompanyId(companyId);
      setError(null);
      setFeedback(null);
      try {
        await operation();
        setFeedback(successMessage);
        await loadData();
        return { ok: true };
      } catch (operationError) {
        const message = parseErrorMessage(
          operationError,
          'Falha ao executar operacao de governanca.',
        );
        setError(message);
        return { ok: false, message };
      } finally {
        setRunningCompanyId(null);
      }
    },
    [loadData],
  );

  const handlePlanUpdate = useCallback(
    async (company: CompanyItem) => {
      const nextPlan = (planDraftByCompanyId[company.id] || '').trim();
      if (!nextPlan) {
        setError('Selecione um plano valido para atualizar a empresa.');
        return;
      }

      await runCompanyAction(
        company.id,
        `Plano da empresa ${company.nome || company.id} atualizado para ${nextPlan}.`,
        async () => {
          await api.patch(`/core-admin/empresas/${company.id}/plano`, {
            plano: nextPlan,
            motivo: 'Ajuste de plano via core-admin',
          });
        },
      );
    },
    [planDraftByCompanyId, runCompanyAction],
  );

  const handleUsersLimitUpdate = useCallback(
    async (company: CompanyItem) => {
      if (!capabilities.allowCompanyModuleManagement) {
        setError('Gestao de modulos por empresa esta desabilitada no Guardian.');
        return;
      }

      const modulo = (moduleDraftByCompanyId[company.id] || '').trim();
      const usersLimitValue = usersLimitDraftByCompanyId[company.id];
      const usersLimit = Number.parseInt(usersLimitValue || '', 10);

      if (!modulo) {
        setError('Informe o modulo para atualizar limite de usuarios.');
        return;
      }
      if (!Number.isFinite(usersLimit) || usersLimit <= 0) {
        setError('Informe um limite de usuarios valido (inteiro positivo).');
        return;
      }

      await runCompanyAction(
        company.id,
        `Limite de usuarios atualizado no modulo ${modulo} para ${company.nome || company.id}.`,
        async () => {
          await api.patch(`/core-admin/empresas/${company.id}/modulos/${encodeURIComponent(modulo)}`, {
            limites: {
              usuarios: usersLimit,
            },
          });
        },
      );
    },
    [
      capabilities.allowCompanyModuleManagement,
      moduleDraftByCompanyId,
      runCompanyAction,
      usersLimitDraftByCompanyId,
    ],
  );

  const loadCompanyUsers = useCallback(async (company: CompanyItem) => {
    setLoadingUsersCompanyId(company.id);
    setSelectedCompanyId(company.id);
    setError(null);
    setFeedback(null);

    try {
      const response = await api.get(`/core-admin/empresas/${company.id}/usuarios`);
      const rawItems = Array.isArray(response.data) ? response.data : [];
      const users = rawItems.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        nome: String(item.nome ?? ''),
        email: String(item.email ?? ''),
        role: String(item.role ?? ''),
        ativo: item.ativo !== false,
        created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
      }));

      setCompanyUsersByCompanyId((current) => ({
        ...current,
        [company.id]: users,
      }));
      setFeedback(`Usuarios de ${company.nome || company.id} carregados.`);
    } catch (loadUsersError) {
      setError(parseErrorMessage(loadUsersError, 'Falha ao carregar usuarios da empresa selecionada.'));
    } finally {
      setLoadingUsersCompanyId(null);
    }
  }, []);

  const runUserAction = useCallback(
    async (
      actionKey: string,
      operation: () => Promise<void>,
      successMessage: string,
    ): Promise<ActionExecutionResult> => {
      setRunningUserActionKey(actionKey);
      setError(null);
      setFeedback(null);
      try {
        await operation();
        setFeedback(successMessage);
        return { ok: true };
      } catch (operationError) {
        const message = parseErrorMessage(operationError, 'Falha ao executar operacao de usuario.');
        setError(message);
        return { ok: false, message };
      } finally {
        setRunningUserActionKey(null);
      }
    },
    [],
  );

  const handleCopyTemporaryPassword = useCallback(async () => {
    if (!lastResetPassword?.temporaryPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lastResetPassword.temporaryPassword);
      setFeedback('Senha temporaria copiada para a area de transferencia.');
    } catch {
      setError('Nao foi possivel copiar automaticamente. Copie manualmente o valor exibido.');
    }
  }, [lastResetPassword]);

  const hasRunningCompanyOperation = runningCompanyId !== null;
  const hasRunningUserOperation = runningUserActionKey !== null;
  const hasDialogActionInProgress = hasRunningCompanyOperation || hasRunningUserOperation;
  const companyModuleManagementEnabled = capabilities.allowCompanyModuleManagement;
  const hasModuleCatalog = companyModuleManagementEnabled && availableModules.length > 0;
  const companiesTableColumnCount = hasModuleCatalog ? 5 : 4;

  const closeDialog = useCallback(() => {
    if (hasDialogActionInProgress) {
      return;
    }

    setDialogStatus(createIdleDialogStatus());
    setDialog(null);
  }, [hasDialogActionInProgress]);

  const openSuspendDialog = useCallback((company: CompanyItem) => {
    setError(null);
    setFeedback(null);
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'suspend_company',
      company,
      actionKey: `suspend:${company.id}`,
      title: 'Suspender empresa governada',
      subtitle: `${company.nome || company.id} | a empresa ficara bloqueada para operacao`,
      confirmLabel: 'Suspender empresa',
      reasonRequired: true,
      reasonPlaceholder: 'Descreva o motivo operacional da suspensao.',
      successMessage: `Empresa ${company.nome || company.id} suspensa com sucesso.`,
    });
  }, []);

  const openReactivateDialog = useCallback((company: CompanyItem) => {
    setError(null);
    setFeedback(null);
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'reactivate_company',
      company,
      actionKey: `reactivate:${company.id}`,
      title: 'Reativar empresa governada',
      subtitle: `${company.nome || company.id} | a empresa voltara a operar no tenant principal`,
      confirmLabel: 'Reativar empresa',
      reasonRequired: false,
      successMessage: `Empresa ${company.nome || company.id} reativada com sucesso.`,
    });
  }, []);

  const openResetUserPasswordDialog = useCallback((company: CompanyItem, user: CompanyUserItem) => {
    setError(null);
    setFeedback(null);
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'reset_user_password',
      company,
      user,
      actionKey: `reset:${company.id}:${user.id}`,
      title: 'Resetar senha de usuario',
      subtitle: `${user.nome || user.email} | ${company.nome || company.id}`,
      confirmLabel: 'Resetar senha',
      reasonRequired: true,
      reasonPlaceholder: 'Explique o contexto do reset administrativo da senha.',
      successMessage: `Senha de ${user.nome || user.email} resetada com sucesso.`,
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

      if (dialog.mode === 'suspend_company') {
        const result = await runCompanyAction(
          dialog.company.id,
          dialog.successMessage,
          async () => {
            await api.patch(`/core-admin/empresas/${dialog.company.id}/suspender`, {
              motivo: reason || 'N/A',
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

      if (dialog.mode === 'reactivate_company') {
        const result = await runCompanyAction(
          dialog.company.id,
          dialog.successMessage,
          async () => {
            await api.patch(`/core-admin/empresas/${dialog.company.id}/reativar`);
          },
        );

        if (result.ok) {
          setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
          return;
        }

        setDialogStatus(createErrorDialogStatus(result.message));

        return;
      }

      const result = await runUserAction(
        dialog.actionKey,
        async () => {
          const response = await api.put(
            `/core-admin/empresas/${dialog.company.id}/usuarios/${dialog.user.id}/reset-senha`,
            {
              motivo: reason || undefined,
            },
          );

          const temporaryPassword = String(response.data?.novaSenha ?? '').trim();
          if (!temporaryPassword) {
            throw new Error('Resposta do endpoint sem campo novaSenha.');
          }

          setLastResetPassword({
            companyId: dialog.company.id,
            companyName: dialog.company.nome || dialog.company.id,
            userId: dialog.user.id,
            userName: dialog.user.nome || dialog.user.email,
            userEmail: dialog.user.email,
            temporaryPassword,
          });

          await loadCompanyUsers(dialog.company);
        },
        dialog.successMessage,
      );

      if (result.ok) {
        setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
        return;
      }

      setDialogStatus(createErrorDialogStatus(result.message));
    },
    [closeDialog, dialog, loadCompanyUsers, runCompanyAction, runUserAction],
  );

  return (
    <>
      <div className="page-grid companies-governance-layout">
      <section className="card companies-governance-card">
        <h2>Empresas governadas</h2>
        <p className="subtle">
          Governanca de tenant com listagem, status, plano e acesso cross-tenant aos usuarios.
          Clique no nome da empresa para carregar os usuarios no painel lateral.
        </p>

        <div className="kpi-inline">
          <span>Empresas: {companies.length}</span>
          <span>Planos em catalogo: {availablePlans.length}</span>
          <span>
            {companyModuleManagementEnabled
              ? `Modulos em catalogo: ${availableModules.length}`
              : 'Limites por modulo ocultos'}
          </span>
        </div>

        {!companyModuleManagementEnabled ? (
          <p className="subtle-inline">
            Limites por modulo ficam indisponiveis ate o catalogo Guardian ser publicado com
            versionamento e governanca adequados.
          </p>
        ) : null}

        {loading ? <p>Carregando empresas...</p> : null}
        {!loading && error ? <p className="error-text">{error}</p> : null}
        {feedback ? <p className="success-text">{feedback}</p> : null}

        {!loading && !error ? (
          <div className="table-wrap companies-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Situacao</th>
                  <th>Plano</th>
                  {hasModuleCatalog ? <th>Limite usuarios por modulo</th> : null}
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className={selectedCompanyId === company.id ? 'selected-company-row' : undefined}
                  >
                    <td className="company-name-cell">
                      <button
                        type="button"
                        className={`company-name-button ${selectedCompanyId === company.id ? 'active' : ''}`}
                        disabled={hasRunningCompanyOperation || hasRunningUserOperation}
                        onClick={() => void loadCompanyUsers(company)}
                      >
                        {company.nome}
                      </button>
                      <span className="company-name-hint">
                        {selectedCompanyId === company.id ? 'Usuarios carregados' : 'Abrir usuarios'}
                      </span>
                    </td>
                    <td className="company-state-cell">
                      <div className="company-state-stack">
                        <span className={`company-state-pill ${resolveCompanyStatusTone(company.status)}`}>
                          {formatCompanyStatus(company.status)}
                        </span>
                        <span className={`company-state-pill ${company.ativo ? 'ok' : 'muted'}`}>
                          {company.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </td>
                    <td className="company-plan-cell">
                      <div className="company-control-stack company-plan-stack">
                        <select
                          value={planDraftByCompanyId[company.id] || ''}
                          onChange={(event) =>
                            setPlanDraftByCompanyId((current) => ({
                              ...current,
                              [company.id]: event.target.value,
                            }))
                          }
                          disabled={runningCompanyId === company.id || availablePlans.length === 0}
                        >
                          {availablePlans.length === 0 ? (
                            <option value="">Sem planos disponiveis</option>
                          ) : (
                            availablePlans.map((plan) => (
                              <option key={plan.id || plan.codigo} value={plan.codigo}>
                                {plan.nome} ({plan.codigo})
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          className="button secondary tiny"
                          disabled={
                            runningCompanyId === company.id ||
                            availablePlans.length === 0 ||
                            !(planDraftByCompanyId[company.id] || '').trim()
                          }
                          onClick={() => void handlePlanUpdate(company)}
                        >
                          Salvar plano
                        </button>
                      </div>
                    </td>
                    {hasModuleCatalog ? (
                      <td className="company-limit-cell">
                        <div className="company-control-stack company-limit-stack">
                          <div className="company-limit-row">
                            <select
                              value={moduleDraftByCompanyId[company.id] || ''}
                              onChange={(event) =>
                                setModuleDraftByCompanyId((current) => ({
                                  ...current,
                                  [company.id]: event.target.value,
                                }))
                              }
                              disabled={runningCompanyId === company.id || availableModules.length === 0}
                            >
                              <option value="">Selecionar modulo</option>
                              {availableModules.map((moduleItem) => (
                                <option key={moduleItem.id || moduleItem.codigo} value={moduleItem.codigo}>
                                  {moduleItem.nome} ({moduleItem.codigo})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={usersLimitDraftByCompanyId[company.id] || ''}
                              onChange={(event) =>
                                setUsersLimitDraftByCompanyId((current) => ({
                                  ...current,
                                  [company.id]: event.target.value,
                                }))
                              }
                              placeholder="usuarios"
                              disabled={runningCompanyId === company.id}
                            />
                          </div>
                          <button
                            type="button"
                            className="button secondary tiny"
                            disabled={runningCompanyId === company.id}
                            onClick={() => void handleUsersLimitUpdate(company)}
                          >
                            Atualizar limite
                          </button>
                        </div>
                      </td>
                    ) : null}
                    <td className="company-action-cell">
                      <div className="table-actions">
                        {company.ativo ? (
                          <button
                            type="button"
                            className="button ghost tiny"
                            disabled={runningCompanyId === company.id}
                            onClick={() => openSuspendDialog(company)}
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button secondary tiny"
                            disabled={runningCompanyId === company.id}
                            onClick={() => openReactivateDialog(company)}
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={companiesTableColumnCount}>Nenhuma empresa encontrada.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="card company-users-governance-card">
        <header className="card-headline">
          <div>
            <h2>Usuarios da empresa</h2>
            {selectedCompany ? (
              <p className="subtle-inline">
                {selectedCompany.nome} | {selectedCompanyUsers.length} usuario(s) carregados
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={!selectedCompany || loadingUsersCompanyId === selectedCompany.id}
            onClick={() => {
              if (!selectedCompany) {
                return;
              }
              void loadCompanyUsers(selectedCompany);
            }}
          >
            Recarregar usuarios
          </button>
        </header>
        <p className="subtle">
          Consulta cross-tenant e reset de senha por usuario com registro de auditoria guardian.
        </p>

        {lastResetPassword ? (
          <div className="plan-editor-shell">
            <h3>Senha temporaria gerada</h3>
            <p className="subtle">
              Empresa: {lastResetPassword.companyName} | Usuario: {lastResetPassword.userName} (
              {lastResetPassword.userEmail})
            </p>
            <div className="inline-actions">
              <code>{lastResetPassword.temporaryPassword}</code>
              <button
                type="button"
                className="button secondary tiny"
                onClick={() => void handleCopyTemporaryPassword()}
              >
                Copiar senha
              </button>
              <button
                type="button"
                className="button ghost tiny"
                onClick={() => setLastResetPassword(null)}
              >
                Ocultar
              </button>
            </div>
          </div>
        ) : null}

        {!selectedCompany ? <p>Selecione uma empresa na tabela para carregar os usuarios.</p> : null}

        {selectedCompany && loadingUsersCompanyId === selectedCompany.id ? (
          <p>Carregando usuarios de {selectedCompany.nome || selectedCompany.id}...</p>
        ) : null}

        {selectedCompany && loadingUsersCompanyId !== selectedCompany.id ? (
          <div className="company-users-shell">
            <div className="company-users-summary">
              <strong>{selectedCompany.nome}</strong>
              <div className="company-state-row">
                <span className={`company-state-pill ${resolveCompanyStatusTone(selectedCompany.status)}`}>
                  {formatCompanyStatus(selectedCompany.status)}
                </span>
                <span className={`company-state-pill ${selectedCompany.ativo ? 'ok' : 'muted'}`}>
                  {selectedCompany.ativo ? 'Empresa ativa' : 'Empresa inativa'}
                </span>
              </div>
            </div>

            {selectedCompanyUsers.length === 0 ? (
              <div className="company-users-empty">Nenhum usuario encontrado para esta empresa.</div>
            ) : (
              <div className="company-users-list">
                {selectedCompanyUsers.map((user) => (
                  <article key={user.id} className="company-user-item">
                    <div className="company-user-top">
                      <div className="company-user-main">
                        <strong>{user.nome}</strong>
                        <span>{user.email}</span>
                      </div>
                      <div className="company-user-meta">
                        <span className="company-state-pill info">{user.role || 'Sem papel'}</span>
                        <span className={`company-state-pill ${user.ativo ? 'ok' : 'muted'}`}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <div className="company-user-footer">
                      <span className="company-user-date">Criado em {formatDateTime(user.created_at)}</span>
                      <button
                        type="button"
                        className="button ghost tiny"
                        disabled={hasRunningCompanyOperation || hasRunningUserOperation}
                        onClick={() => openResetUserPasswordDialog(selectedCompany, user)}
                      >
                        Resetar senha
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>
      </div>

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

