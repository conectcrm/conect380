import { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ConfirmActionModal,
  type ConfirmActionModalStatus,
} from '../components/ConfirmActionModal';
import { api } from '../lib/api';

type BreakGlassRequest = {
  id: string;
  status: string;
  scope_permissions: string[];
  duration_minutes: number;
  request_reason: string;
  approval_reason?: string | null;
  revocation_reason?: string | null;
  requested_at?: string;
  approved_at?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  target_user?: {
    id?: string;
    nome?: string;
    email?: string;
    role?: string;
  } | null;
  requested_by?: {
    nome?: string;
    email?: string;
  } | null;
  approved_by?: {
    nome?: string;
    email?: string;
  } | null;
};

type RuntimeContext = {
  environment: string;
  policySource: string;
  releaseVersion?: string | null;
  adminMfaRequired: boolean;
  legacyTransitionMode: string;
  capabilities: {
    allowBreakGlassRequestCreation: boolean;
    allowManualBillingDueDateCycle: boolean;
    allowPlanDeletion: boolean;
    allowDirectAccessRecertification: boolean;
    allowCompanyModuleManagement: boolean;
  };
};

type RuntimeSnapshot = {
  id: number;
  environment: string;
  policySource: string;
  releaseVersion?: string | null;
  adminMfaRequired: boolean;
  legacyTransitionMode: string;
  enabledCapabilities: string[];
  createdAt: string;
};

type ActionDialogState =
  | {
      mode: 'approve_request';
      requestId: string;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
      successMessage: string;
    }
  | {
      mode: 'reject_request';
      requestId: string;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
      successMessage: string;
    }
  | {
      mode: 'revoke_active';
      requestId: string;
      actionKey: string;
      title: string;
      subtitle: string;
      confirmLabel: string;
      reasonRequired: boolean;
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

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
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

export const SystemGovernancePage = () => {
  const [pendingRequests, setPendingRequests] = useState<BreakGlassRequest[]>([]);
  const [activeAccesses, setActiveAccesses] = useState<BreakGlassRequest[]>([]);
  const [runtimeContext, setRuntimeContext] = useState<RuntimeContext | null>(null);
  const [runtimeHistory, setRuntimeHistory] = useState<RuntimeSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [dialogStatus, setDialogStatus] = useState<DialogStatusState>(() => createIdleDialogStatus());

  const hasActionInProgress = runningActionKey !== null;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

      try {
      const [pendingResponse, activeResponse, runtimeResponse, runtimeHistoryResponse] = await Promise.all([
        api.get('/core-admin/bff/break-glass/requests', {
          params: { status: 'REQUESTED', limit: 50 },
        }),
        api.get('/core-admin/bff/break-glass/active', {
          params: { limit: 50 },
        }),
        api.get('/core-admin/bff/runtime-context'),
        api.get('/core-admin/bff/runtime-history', {
          params: { limit: 8 },
        }),
      ]);

      const pendingItems = pendingResponse.data?.data ?? [];
      const activeItems = activeResponse.data?.data ?? [];

      setPendingRequests(Array.isArray(pendingItems) ? (pendingItems as BreakGlassRequest[]) : []);
      setActiveAccesses(Array.isArray(activeItems) ? (activeItems as BreakGlassRequest[]) : []);
      setRuntimeContext((runtimeResponse.data?.data as RuntimeContext | undefined) ?? null);
      const historyItems = runtimeHistoryResponse.data?.data ?? [];
      setRuntimeHistory(Array.isArray(historyItems) ? (historyItems as RuntimeSnapshot[]) : []);
    } catch (loadError) {
      setError(parseErrorMessage(loadError, 'Falha ao carregar governanca de acesso emergencial.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runAction = useCallback(
    async (
      actionKey: string,
      operation: () => Promise<void>,
      successMessage: string,
    ): Promise<ActionExecutionResult> => {
      if (hasActionInProgress) {
        return { ok: false, message: 'Ja existe uma acao guardian em andamento.' };
      }

      setRunningActionKey(actionKey);
      setFeedback(null);
      setError(null);
      try {
        await operation();
        setFeedback(successMessage);
        await loadData();
        return { ok: true };
      } catch (actionError) {
        const message = parseErrorMessage(actionError, 'Falha ao executar acao de governanca.');
        setError(message);
        return { ok: false, message };
      } finally {
        setRunningActionKey(null);
      }
    },
    [hasActionInProgress, loadData],
  );

  const closeDialog = useCallback(() => {
    if (hasActionInProgress) return;
    setDialogStatus(createIdleDialogStatus());
    setDialog(null);
  }, [hasActionInProgress]);

  const openApproveDialog = useCallback((item: BreakGlassRequest) => {
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'approve_request',
      requestId: item.id,
      actionKey: `approve:${item.id}`,
      title: 'Aprovar acesso emergencial',
      subtitle: `${item.target_user?.nome || item.target_user?.email || 'Usuario'} | expira em ${item.duration_minutes} min`,
      confirmLabel: 'Aprovar solicitacao',
      reasonRequired: false,
      successMessage: 'Solicitacao aprovada com sucesso.',
    });
  }, []);

  const openRejectDialog = useCallback((item: BreakGlassRequest) => {
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'reject_request',
      requestId: item.id,
      actionKey: `reject:${item.id}`,
      title: 'Rejeitar acesso emergencial',
      subtitle: `${item.target_user?.nome || item.target_user?.email || 'Usuario'}`,
      confirmLabel: 'Rejeitar solicitacao',
      reasonRequired: true,
      successMessage: 'Solicitacao rejeitada com sucesso.',
    });
  }, []);

  const openRevokeDialog = useCallback((item: BreakGlassRequest) => {
    setDialogStatus(createIdleDialogStatus());
    setDialog({
      mode: 'revoke_active',
      requestId: item.id,
      actionKey: `revoke:${item.id}`,
      title: 'Revogar acesso emergencial ativo',
      subtitle: `${item.target_user?.nome || item.target_user?.email || 'Usuario'} | expira em ${formatDate(item.expires_at)}`,
      confirmLabel: 'Revogar acesso',
      reasonRequired: false,
      successMessage: 'Acesso emergencial revogado com sucesso.',
    });
  }, []);

  const confirmDialog = useCallback(
    async (reasonInput: string) => {
      if (!dialog) return;

      const reason = reasonInput.trim();
      if (dialog.reasonRequired && !reason) {
        setDialogStatus(createErrorDialogStatus('Motivo obrigatorio para esta acao.'));
        return;
      }

      setDialogStatus(createLoadingDialogStatus());

      if (dialog.mode === 'approve_request') {
        const result = await runAction(
          dialog.actionKey,
          async () => {
            await api.post(`/core-admin/bff/break-glass/requests/${dialog.requestId}/approve`, {
              reason: reason || undefined,
            });
          },
          dialog.successMessage,
        );
        if (result.ok) {
          setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
          return;
        }
        setDialogStatus(createErrorDialogStatus(result.message));
        return;
      }

      if (dialog.mode === 'reject_request') {
        const result = await runAction(
          dialog.actionKey,
          async () => {
            await api.post(`/core-admin/bff/break-glass/requests/${dialog.requestId}/reject`, {
              reason,
            });
          },
          dialog.successMessage,
        );
        if (result.ok) {
          setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
          return;
        }
        setDialogStatus(createErrorDialogStatus(result.message));
        return;
      }

      const result = await runAction(
        dialog.actionKey,
        async () => {
          await api.post(`/core-admin/bff/break-glass/${dialog.requestId}/revoke`, {
            reason: reason || undefined,
          });
        },
        dialog.successMessage,
      );
      if (result.ok) {
        setDialogStatus(createSuccessDialogStatus(dialog.successMessage));
        return;
      }
      setDialogStatus(createErrorDialogStatus(result.message));
    },
    [closeDialog, dialog, runAction],
  );

  const activeRuntimeExceptions = runtimeContext
    ? Object.values(runtimeContext.capabilities).filter((enabled) => enabled).length
    : 0;

  return (
    <>
      <div className="page-grid">
        <section className="card">
          <header className="card-headline">
            <h2>Governanca de break-glass</h2>
            <button
              type="button"
              className="button secondary"
              onClick={() => void loadData()}
              disabled={loading}
            >
              Recarregar
            </button>
          </header>
          <p className="subtle">
            O Guardian aprova, audita e revoga acessos emergenciais. A solicitacao precisa nascer
            no fluxo operacional controlado fora deste painel.
          </p>

          <div className="kpi-inline">
            <span>Pendentes: {pendingRequests.length}</span>
            <span>Ativos: {activeAccesses.length}</span>
            <span>Solicitacao fora do Guardian</span>
            {runtimeContext ? <span>Excecoes runtime: {activeRuntimeExceptions}</span> : null}
          </div>

          {loading ? <p>Carregando governanca break-glass...</p> : null}
          {!loading && error ? <p className="error-text">{error}</p> : null}
          {feedback ? <p className="success-text">{feedback}</p> : null}

          <div className="plan-editor-shell">
            <h3>Escopo do Guardian</h3>
            <p className="subtle">
              O painel do proprietario nao deve ser usado para autoelevacao. Solicite o
              break-glass no fluxo operacional previsto e use esta area apenas para aprovacao,
              acompanhamento e revogacao.
            </p>
          </div>

          {runtimeContext ? (
            <div className="system-runtime-grid">
              <article className="system-runtime-card">
                <span>Ambiente</span>
                <strong>{runtimeContext.environment}</strong>
                <small>
                  Origem: {runtimeContext.policySource}
                  {runtimeContext.releaseVersion ? ` | Release: ${runtimeContext.releaseVersion}` : ''}
                </small>
              </article>
              <article className="system-runtime-card">
                <span>MFA administrativo</span>
                <strong>{runtimeContext.adminMfaRequired ? 'Obrigatorio' : 'Flexivel'}</strong>
                <small>Politica aplicada no runtime do backend</small>
              </article>
              <article className="system-runtime-card">
                <span>Transicao legado</span>
                <strong>{runtimeContext.legacyTransitionMode}</strong>
                <small>Backoffice legado versus Guardian</small>
              </article>
              <article className="system-runtime-card">
                <span>Excecoes sensiveis</span>
                <strong>{activeRuntimeExceptions}</strong>
                <small>Flags liberadas fora do baseline seguro</small>
              </article>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Fila pendente de aprovacao</h2>
          <p className="subtle">Solicitacoes aguardando decisao de superadmin guardian.</p>

          {loading ? <p>Carregando pendencias...</p> : null}
          {!loading ? (
            <ul className="clean-list">
              {pendingRequests.map((item) => (
                <li key={item.id} className="request-item">
                  <div>
                    <strong>{item.target_user?.nome || item.target_user?.email || '-'}</strong> -{' '}
                    {item.scope_permissions.join(', ') || '-'}
                    <div className="subtle-inline">
                      Solicitado por {item.requested_by?.nome || item.requested_by?.email || '-'} em{' '}
                      {formatDate(item.requested_at)}
                    </div>
                    <div className="subtle-inline">
                      Duracao: {item.duration_minutes} min | Status: {item.status}
                    </div>
                  </div>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button secondary tiny"
                      disabled={hasActionInProgress}
                      onClick={() => openApproveDialog(item)}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="button ghost tiny"
                      disabled={hasActionInProgress}
                      onClick={() => openRejectDialog(item)}
                    >
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
              {pendingRequests.length === 0 ? <li>Sem solicitacoes pendentes.</li> : null}
            </ul>
          ) : null}
        </section>
      </div>

      <section className="card">
        <header className="card-headline">
          <h2>Historico de politica Guardian</h2>
          <span className="subtle-inline">Snapshots imutaveis por mudanca de politica/release</span>
        </header>
        {loading ? <p>Carregando historico runtime...</p> : null}
        {!loading ? (
          <ul className="clean-list runtime-history-list">
            {runtimeHistory.map((item) => (
              <li key={item.id} className="runtime-history-item">
                <div>
                  <strong>
                    {item.environment}
                    {item.releaseVersion ? ` | ${item.releaseVersion}` : ''}
                  </strong>
                  <div className="subtle-inline">
                    {formatDate(item.createdAt)} | origem {item.policySource} | transicao{' '}
                    {item.legacyTransitionMode}
                  </div>
                  <div className="subtle-inline">
                    MFA admin: {item.adminMfaRequired ? 'obrigatorio' : 'flexivel'}
                  </div>
                </div>
                <div className="runtime-history-tags">
                  {item.enabledCapabilities.length > 0 ? (
                    item.enabledCapabilities.map((capability) => (
                      <span key={`${item.id}-${capability}`} className="runtime-history-tag enabled">
                        {capability}
                      </span>
                    ))
                  ) : (
                    <span className="runtime-history-tag">baseline seguro</span>
                  )}
                </div>
              </li>
            ))}
            {runtimeHistory.length === 0 ? <li>Nenhum snapshot registrado ainda.</li> : null}
          </ul>
        ) : null}
      </section>

      <section className="card">
        <h2>Acessos emergenciais ativos</h2>
        <p className="subtle">Acessos aprovados com validade temporaria e revogacao manual opcional.</p>

        {loading ? <p>Carregando acessos ativos...</p> : null}
        {!loading ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Permissoes</th>
                  <th>Aprovado por</th>
                  <th>Inicio</th>
                  <th>Expira em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {activeAccesses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.target_user?.nome || item.target_user?.email || '-'}</td>
                    <td>{item.scope_permissions.join(', ') || '-'}</td>
                    <td>{item.approved_by?.nome || item.approved_by?.email || '-'}</td>
                    <td>{formatDate(item.starts_at)}</td>
                    <td>{formatDate(item.expires_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="button ghost tiny"
                        disabled={hasActionInProgress}
                        onClick={() => openRevokeDialog(item)}
                      >
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
                {activeAccesses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhum acesso emergencial ativo.</td>
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


