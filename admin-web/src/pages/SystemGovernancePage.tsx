import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { api } from '../lib/api';

type GovernanceUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
};

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

const parsePermissionsText = (input: string): string[] =>
  input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const SystemGovernancePage = () => {
  const [users, setUsers] = useState<GovernanceUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BreakGlassRequest[]>([]);
  const [activeAccesses, setActiveAccesses] = useState<BreakGlassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);

  const [requestForm, setRequestForm] = useState({
    targetUserId: '',
    permissions: 'admin.empresas.manage',
    durationMinutes: '30',
    reason: '',
  });

  const hasActionInProgress = runningActionKey !== null;

  const activeUsers = useMemo(() => users.filter((user) => user.ativo), [users]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, pendingResponse, activeResponse] = await Promise.all([
        api.get('/admin/bff/users', {
          params: { limite: 120, pagina: 1, ativo: true, ordenacao: 'nome', direcao: 'asc' },
        }),
        api.get('/admin/bff/break-glass/requests', {
          params: { status: 'REQUESTED', limit: 50 },
        }),
        api.get('/admin/bff/break-glass/active', {
          params: { limit: 50 },
        }),
      ]);

      const userItems = usersResponse.data?.data?.items ?? usersResponse.data?.items ?? [];
      const pendingItems = pendingResponse.data?.data ?? [];
      const activeItems = activeResponse.data?.data ?? [];

      setUsers(
        Array.isArray(userItems)
          ? userItems.map((item: Record<string, unknown>) => ({
              id: String(item.id ?? ''),
              nome: String(item.nome ?? ''),
              email: String(item.email ?? ''),
              role: String(item.role ?? ''),
              ativo: Boolean(item.ativo),
            }))
          : [],
      );

      setPendingRequests(Array.isArray(pendingItems) ? (pendingItems as BreakGlassRequest[]) : []);
      setActiveAccesses(Array.isArray(activeItems) ? (activeItems as BreakGlassRequest[]) : []);
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
    async (actionKey: string, operation: () => Promise<void>, successMessage: string) => {
      if (hasActionInProgress) {
        return false;
      }

      setRunningActionKey(actionKey);
      setFeedback(null);
      setError(null);
      try {
        await operation();
        setFeedback(successMessage);
        await loadData();
        return true;
      } catch (actionError) {
        setError(parseErrorMessage(actionError, 'Falha ao executar acao de governanca.'));
        return false;
      } finally {
        setRunningActionKey(null);
      }
    },
    [hasActionInProgress, loadData],
  );

  const handleCreateRequest = useCallback(async () => {
    const targetUserId = requestForm.targetUserId.trim();
    const reason = requestForm.reason.trim();
    const permissions = parsePermissionsText(requestForm.permissions);
    const durationMinutes = Number.parseInt(requestForm.durationMinutes, 10);

    if (!targetUserId) {
      setError('Selecione o usuario alvo para solicitar o acesso emergencial.');
      return;
    }
    if (permissions.length === 0) {
      setError('Informe ao menos uma permissao canonica para o break-glass.');
      return;
    }
    if (!reason) {
      setError('Justificativa obrigatoria para solicitar break-glass.');
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError('Duracao invalida. Informe um valor em minutos.');
      return;
    }

    await runAction(
      `request:${targetUserId}`,
      async () => {
        await api.post('/admin/bff/break-glass/requests', {
          target_user_id: targetUserId,
          permissions,
          duration_minutes: durationMinutes,
          reason,
        });
      },
      'Solicitacao de acesso emergencial registrada com sucesso.',
    );

    setRequestForm((current) => ({
      ...current,
      reason: '',
    }));
  }, [requestForm, runAction]);

  const closeDialog = useCallback(() => {
    if (hasActionInProgress) return;
    setDialog(null);
  }, [hasActionInProgress]);

  const openApproveDialog = useCallback((item: BreakGlassRequest) => {
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
        setError('Motivo obrigatorio para esta acao.');
        return;
      }

      if (dialog.mode === 'approve_request') {
        const success = await runAction(
          dialog.actionKey,
          async () => {
            await api.post(`/admin/bff/break-glass/requests/${dialog.requestId}/approve`, {
              reason: reason || undefined,
            });
          },
          dialog.successMessage,
        );
        if (success) closeDialog();
        return;
      }

      if (dialog.mode === 'reject_request') {
        const success = await runAction(
          dialog.actionKey,
          async () => {
            await api.post(`/admin/bff/break-glass/requests/${dialog.requestId}/reject`, {
              reason,
            });
          },
          dialog.successMessage,
        );
        if (success) closeDialog();
        return;
      }

      const success = await runAction(
        dialog.actionKey,
        async () => {
          await api.post(`/admin/bff/break-glass/${dialog.requestId}/revoke`, {
            reason: reason || undefined,
          });
        },
        dialog.successMessage,
      );
      if (success) closeDialog();
    },
    [closeDialog, dialog, runAction],
  );

  return (
    <>
      <div className="page-grid">
        <section className="card">
          <header className="card-headline">
            <h2>Break-glass: solicitacao emergencial</h2>
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
            Fluxo emergencial com justificativa obrigatoria, aprovacao de segundo responsavel e expiracao automatica.
          </p>

          <div className="kpi-inline">
            <span>Usuarios elegiveis: {activeUsers.length}</span>
            <span>Pendentes: {pendingRequests.length}</span>
            <span>Ativos: {activeAccesses.length}</span>
          </div>

          {loading ? <p>Carregando governanca break-glass...</p> : null}
          {!loading && error ? <p className="error-text">{error}</p> : null}
          {feedback ? <p className="success-text">{feedback}</p> : null}

          <div className="form-grid form-grid-compact">
            <label>
              Usuario alvo
              <select
                value={requestForm.targetUserId}
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, targetUserId: event.target.value }))
                }
                disabled={hasActionInProgress}
              >
                <option value="">Selecione...</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Permissoes temporarias (separadas por virgula)
              <input
                value={requestForm.permissions}
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, permissions: event.target.value }))
                }
                placeholder="admin.empresas.manage, users.update"
                disabled={hasActionInProgress}
              />
            </label>

            <label>
              Duracao (minutos)
              <input
                type="number"
                min={5}
                max={240}
                value={requestForm.durationMinutes}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
                disabled={hasActionInProgress}
              />
            </label>

            <label>
              Justificativa
              <textarea
                rows={3}
                value={requestForm.reason}
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="Contexto do incidente e porque o acesso emergencial e necessario."
                disabled={hasActionInProgress}
              />
            </label>

            <div className="inline-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => void handleCreateRequest()}
                disabled={hasActionInProgress || loading}
              >
                Solicitar break-glass
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Fila pendente de aprovacao</h2>
          <p className="subtle">Solicitacoes aguardando decisao de superadmin/admin.</p>

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
        loading={hasActionInProgress}
        onCancel={closeDialog}
        onConfirm={(reason) => {
          void confirmDialog(reason);
        }}
      />
    </>
  );
};
