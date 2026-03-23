import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmActionModal } from '../components/ConfirmActionModal';
import { api } from '../lib/api';

type UserItem = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
};

type AccessRequestItem = {
  id: string;
  action: string;
  status: string;
  created_at: string;
  requested_by?: {
    nome?: string;
    email?: string;
  };
};

type ActionDialogState =
  | {
      mode: 'reject_request';
      actionKey: string;
      title: string;
      subtitle: string;
      reasonRequired: boolean;
      confirmLabel: string;
      successMessage: string;
      requestId: string;
    }
  | {
      mode: 'recertify_revoke';
      actionKey: string;
      title: string;
      subtitle: string;
      reasonRequired: boolean;
      confirmLabel: string;
      successMessage: string;
      user: UserItem;
    };

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
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

export const UsersGovernancePage = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, requestsResponse] = await Promise.all([
        api.get('/admin/bff/users', { params: { limite: 20, pagina: 1 } }),
        api.get('/admin/bff/access-change-requests', {
          params: { status: 'REQUESTED', limit: 20 },
        }),
      ]);

      const userItems = usersResponse.data?.data?.items ?? usersResponse.data?.items ?? [];
      const requestItems = requestsResponse.data?.data ?? [];

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
      setPendingRequests(
        Array.isArray(requestItems)
          ? requestItems.map((item: Record<string, unknown>) => ({
              id: String(item.id ?? ''),
              action: String(item.action ?? ''),
              status: String(item.status ?? ''),
              created_at: String(item.created_at ?? ''),
              requested_by:
                typeof item.requested_by === 'object' && item.requested_by
                  ? (item.requested_by as AccessRequestItem['requested_by'])
                  : undefined,
            }))
          : [],
      );
    } catch (loadError) {
      setError(parseErrorMessage(loadError, 'Falha ao carregar os dados de governanca de usuarios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeUsers = useMemo(() => users.filter((user) => user.ativo).length, [users]);
  const hasActionInProgress = runningActionKey !== null;

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
        setError(parseErrorMessage(actionError, 'Falha ao executar acao administrativa.'));
        return false;
      } finally {
        setRunningActionKey(null);
      }
    },
    [hasActionInProgress, loadData],
  );

  const closeDialog = useCallback(() => {
    if (hasActionInProgress) {
      return;
    }
    setDialog(null);
  }, [hasActionInProgress]);

  const openRejectRequestDialog = useCallback((request: AccessRequestItem) => {
    setError(null);
    setFeedback(null);
    setDialog({
      mode: 'reject_request',
      actionKey: `reject:${request.id}`,
      title: 'Rejeitar solicitacao de acesso',
      subtitle: `${request.action} - ${request.requested_by?.nome || request.requested_by?.email || 'Solicitante'}`,
      reasonRequired: false,
      confirmLabel: 'Confirmar rejeicao',
      successMessage: 'Solicitacao rejeitada com sucesso.',
      requestId: request.id,
    });
  }, []);

  const openRecertifyRevokeDialog = useCallback((user: UserItem) => {
    setError(null);
    setFeedback(null);
    setDialog({
      mode: 'recertify_revoke',
      actionKey: `recertify:${user.id}:reject`,
      title: 'Revogar acesso do usuario',
      subtitle: `${user.nome} (${user.email})`,
      reasonRequired: true,
      confirmLabel: 'Revogar acesso',
      successMessage: `Recertificacao reprovada para ${user.nome}.`,
      user,
    });
  }, []);

  const confirmDialog = useCallback(
    async (reasonInput: string) => {
      if (!dialog) {
        return;
      }

      const reason = reasonInput.trim();
      if (dialog.reasonRequired && !reason) {
        setError('Motivo obrigatorio para esta acao.');
        return;
      }

      if (dialog.mode === 'reject_request') {
        const success = await runAction(
          dialog.actionKey,
          async () => {
            await api.post(`/admin/bff/access-change-requests/${dialog.requestId}/reject`, {
              reason: reason || undefined,
            });
          },
          dialog.successMessage,
        );

        if (success) {
          closeDialog();
        }

        return;
      }

      const success = await runAction(
        dialog.actionKey,
        async () => {
          await api.post('/admin/bff/access-review/recertify', {
            target_user_id: dialog.user.id,
            approved: false,
            reason,
          });
        },
        dialog.successMessage,
      );

      if (success) {
        closeDialog();
      }
    },
    [closeDialog, dialog, runAction],
  );

  const handleApproveRequest = useCallback(
    async (requestId: string) => {
      await runAction(
        `approve:${requestId}`,
        async () => {
          await api.post(`/admin/bff/access-change-requests/${requestId}/approve`, {});
        },
        'Solicitacao aprovada com sucesso.',
      );
    },
    [runAction],
  );

  const handleRecertifyApprove = useCallback(
    async (user: UserItem) => {
      await runAction(
        `recertify:${user.id}:approve`,
        async () => {
          await api.post('/admin/bff/access-review/recertify', {
            target_user_id: user.id,
            approved: true,
          });
        },
        `Recertificacao aprovada para ${user.nome}.`,
      );
    },
    [runAction],
  );

  return (
    <>
      <div className="page-grid">
        <section className="card">
          <header className="card-headline">
            <h2>Usuarios e permissoes</h2>
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
            Operacoes de governanca consumindo o gateway administrativo `/admin/bff`.
          </p>

          <div className="kpi-inline">
            <span>Total listados: {users.length}</span>
            <span>Ativos: {activeUsers}</span>
            <span>Pendencias: {pendingRequests.length}</span>
          </div>

          {loading ? <p>Carregando usuarios...</p> : null}
          {!loading && error ? <p className="error-text">{error}</p> : null}
          {feedback ? <p className="success-text">{feedback}</p> : null}

          {!loading && !error ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Papel</th>
                    <th>Status</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.nome}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.ativo ? 'Ativo' : 'Inativo'}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button secondary tiny"
                            disabled={hasActionInProgress}
                            onClick={() => void handleRecertifyApprove(user)}
                          >
                            Aprovar acesso
                          </button>
                          <button
                            type="button"
                            className="button ghost tiny"
                            disabled={hasActionInProgress}
                            onClick={() => openRecertifyRevokeDialog(user)}
                          >
                            Revogar acesso
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Nenhum usuario encontrado.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>Fila de dupla aprovacao</h2>
          <p className="subtle">
            Mudancas sensiveis de acesso aguardando aprovacao administrativa.
          </p>
          {loading ? <p>Carregando pendencias...</p> : null}
          {!loading && !error ? (
            <ul className="clean-list">
              {pendingRequests.map((request) => (
                <li key={request.id} className="request-item">
                  <div>
                    <strong>{request.action}</strong> - {request.requested_by?.nome || request.requested_by?.email || '-'} -{' '}
                    {formatDate(request.created_at)}
                    <div className="subtle-inline">Status: {request.status || 'REQUESTED'}</div>
                  </div>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button secondary tiny"
                      disabled={hasActionInProgress}
                      onClick={() => void handleApproveRequest(request.id)}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="button ghost tiny"
                      disabled={hasActionInProgress}
                      onClick={() => openRejectRequestDialog(request)}
                    >
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
              {pendingRequests.length === 0 ? <li>Sem pendencias no momento.</li> : null}
            </ul>
          ) : null}
        </section>
      </div>

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
