import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type CompanyItem = {
  id: string;
  nome: string;
  plano?: string;
  status?: string;
  ativo?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [runningCompanyId, setRunningCompanyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planDraftByCompanyId, setPlanDraftByCompanyId] = useState<Record<string, string>>({});
  const [moduleDraftByCompanyId, setModuleDraftByCompanyId] = useState<Record<string, string>>({});
  const [usersLimitDraftByCompanyId, setUsersLimitDraftByCompanyId] = useState<Record<string, string>>({});

  const availablePlans = useMemo(() => {
    const activePlans = planCatalog.filter((plan) => plan.ativo);
    return activePlans.length > 0 ? activePlans : planCatalog;
  }, [planCatalog]);

  const availableModules = useMemo(() => {
    const activeModules = moduleCatalog.filter((moduleItem) => moduleItem.ativo);
    return activeModules.length > 0 ? activeModules : moduleCatalog;
  }, [moduleCatalog]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [companiesResponse, plansResponse, modulesResponse] = await Promise.all([
        api.get('/guardian/bff/companies', { params: { page: 1, limit: 20 } }),
        api.get('/guardian/planos'),
        api.get('/guardian/planos/modulos'),
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

      setCompanies(nextCompanies);
      setPlanCatalog(nextPlans);
      setModuleCatalog(nextModules);

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

  const runCompanyAction = useCallback(
    async (companyId: string, successMessage: string, operation: () => Promise<void>) => {
      setRunningCompanyId(companyId);
      setError(null);
      setFeedback(null);
      try {
        await operation();
        setFeedback(successMessage);
        await loadData();
      } catch (operationError) {
        setError(parseErrorMessage(operationError, 'Falha ao executar operacao de governanca.'));
      } finally {
        setRunningCompanyId(null);
      }
    },
    [loadData],
  );

  const handleSuspend = useCallback(
    async (company: CompanyItem) => {
      const reason = window.prompt(
        `Motivo da suspensao para ${company.nome || company.id}:`,
        'Suspensao operacional',
      );
      if (reason === null) {
        return;
      }

      await runCompanyAction(
        company.id,
        `Empresa ${company.nome || company.id} suspensa com sucesso.`,
        async () => {
          await api.patch(`/guardian/empresas/${company.id}/suspender`, { motivo: reason.trim() || 'N/A' });
        },
      );
    },
    [runCompanyAction],
  );

  const handleReactivate = useCallback(
    async (company: CompanyItem) => {
      await runCompanyAction(
        company.id,
        `Empresa ${company.nome || company.id} reativada com sucesso.`,
        async () => {
          await api.patch(`/guardian/empresas/${company.id}/reativar`);
        },
      );
    },
    [runCompanyAction],
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
          await api.patch(`/guardian/empresas/${company.id}/plano`, {
            plano: nextPlan,
            motivo: 'Ajuste de plano via guardian-web',
          });
        },
      );
    },
    [planDraftByCompanyId, runCompanyAction],
  );

  const handleUsersLimitUpdate = useCallback(
    async (company: CompanyItem) => {
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
          await api.patch(`/guardian/empresas/${company.id}/modulos/${encodeURIComponent(modulo)}`, {
            limites: {
              usuarios: usersLimit,
            },
          });
        },
      );
    },
    [moduleDraftByCompanyId, runCompanyAction, usersLimitDraftByCompanyId],
  );

  return (
    <section className="card">
      <h2>Empresas governadas</h2>
      <p className="subtle">
        Governanca de tenant com listagem, status, plano e gestao de limites por modulo.
      </p>

      <div className="kpi-inline">
        <span>Empresas: {companies.length}</span>
        <span>Planos em catalogo: {availablePlans.length}</span>
        <span>Modulos em catalogo: {availableModules.length}</span>
      </div>

      {loading ? <p>Carregando empresas...</p> : null}
      {!loading && error ? <p className="error-text">{error}</p> : null}
      {feedback ? <p className="success-text">{feedback}</p> : null}

      {!loading && !error ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Ativa</th>
                <th>Limite usuarios por modulo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.nome}</td>
                  <td>
                    <div className="inline-actions">
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
                  <td>{company.status || '-'}</td>
                  <td>{company.ativo ? 'Sim' : 'Nao'}</td>
                  <td>
                    <div className="inline-actions">
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
                      <button
                        type="button"
                        className="button secondary tiny"
                        disabled={runningCompanyId === company.id}
                        onClick={() => void handleUsersLimitUpdate(company)}
                      >
                        Atualizar
                      </button>
                    </div>
                  </td>
                  <td>
                    {company.ativo ? (
                      <button
                        type="button"
                        className="button ghost tiny"
                        disabled={runningCompanyId === company.id}
                        onClick={() => void handleSuspend(company)}
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button secondary tiny"
                        disabled={runningCompanyId === company.id}
                        onClick={() => void handleReactivate(company)}
                      >
                        Reativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6}>Nenhuma empresa encontrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};
