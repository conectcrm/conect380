import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import {
  type AdminPrivacyRequestItem,
  type PrivacyRequestType,
  usuariosService,
} from '../../services/usuariosService';

type RequestStatus = 'open' | 'in_review' | 'completed' | 'rejected';
type StatusFilter = RequestStatus | 'all';
type TypeFilter = PrivacyRequestType | 'all';

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Aberta',
  in_review: 'Em analise',
  completed: 'Concluida',
  rejected: 'Negada',
};

const TYPE_LABELS: Record<PrivacyRequestType, string> = {
  data_export: 'Exportacao de dados',
  account_anonymization: 'Anonimizacao de conta',
  account_deletion: 'Exclusao de conta',
};

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStatusPillClassName = (status: RequestStatus): string => {
  switch (status) {
    case 'completed':
      return 'border-[#BFE6D6] bg-[#F4FBF8] text-[#11845F]';
    case 'rejected':
      return 'border-[#F1C7C7] bg-[#FFF6F6] text-[#C24848]';
    case 'in_review':
      return 'border-[#F1DFB5] bg-[#FFF9EE] text-[#AE7A14]';
    default:
      return 'border-[#D6E4EA] bg-white text-[#496877]';
  }
};

const getStatusTone = (status: RequestStatus): 'neutral' | 'accent' | 'warning' => {
  if (status === 'completed') return 'accent';
  if (status === 'in_review') return 'warning';
  return 'neutral';
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const apiMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message;
  if (Array.isArray(apiMessage)) {
    const text = apiMessage.filter((item) => typeof item === 'string').join(' ');
    if (text.trim()) return text;
  }
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};

const AdminConformidadePage: React.FC = () => {
  const [items, setItems] = useState<AdminPrivacyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);

  const loadRequests = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data = await usuariosService.listarSolicitacoesPrivacidade({
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          limit: 100,
        });
        setItems(data);
      } catch (error) {
        toast.error(
          getErrorMessage(error, 'Nao foi possivel carregar as solicitacoes de privacidade.'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, typeFilter],
  );

  useEffect(() => {
    void loadRequests('initial');
  }, [loadRequests]);

  const stats = useMemo(() => {
    const total = items.length;
    const open = items.filter((item) => item.status === 'open').length;
    const inReview = items.filter((item) => item.status === 'in_review').length;
    const completed = items.filter((item) => item.status === 'completed').length;
    const rejected = items.filter((item) => item.status === 'rejected').length;
    return [
      { label: 'Total', value: String(total), tone: 'neutral' as const },
      { label: 'Abertas', value: String(open), tone: 'warning' as const },
      { label: 'Em analise', value: String(inReview), tone: 'warning' as const },
      { label: 'Concluidas', value: String(completed), tone: 'accent' as const },
      { label: 'Negadas', value: String(rejected), tone: 'neutral' as const },
    ];
  }, [items]);

  const updateRequestStatus = async (
    item: AdminPrivacyRequestItem,
    status: RequestStatus,
    requireNote = false,
  ) => {
    let resolutionNote: string | undefined;

    if (requireNote) {
      const promptValue = window.prompt(
        'Informe uma observacao de tratamento (opcional, mas recomendada):',
        item.resolution_note || '',
      );
      if (promptValue === null) {
        return;
      }
      resolutionNote = promptValue.trim() || undefined;
    }

    try {
      setSavingRequestId(item.id);
      const updated = await usuariosService.atualizarSolicitacaoPrivacidade(item.id, {
        status,
        resolution_note: resolutionNote,
      });

      setItems((previous) => previous.map((entry) => (entry.id === item.id ? updated : entry)));
      toast.success(`Solicitacao ${updated.protocolo} atualizada para ${STATUS_LABELS[status]}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Nao foi possivel atualizar a solicitacao.'));
    } finally {
      setSavingRequestId(null);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Conformidade e LGPD"
          description="Tratamento administrativo de solicitacoes de privacidade registradas pelos usuarios."
          actions={
            <button
              type="button"
              onClick={() => void loadRequests('refresh')}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D5E3E8] bg-white px-4 text-sm font-semibold text-[#24485B] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          }
        />
        <InlineStats stats={stats} />
      </SectionCard>

      <FiltersBar className="gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="lgpd-filter-status" className="text-xs font-medium text-[#607B89]">
            Status
          </label>
          <select
            id="lgpd-filter-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm text-[#19384C] outline-none focus:border-[#159A9C] focus:ring-4 focus:ring-[#159A9C]/15"
          >
            <option value="all">Todos</option>
            <option value="open">Abertas</option>
            <option value="in_review">Em analise</option>
            <option value="completed">Concluidas</option>
            <option value="rejected">Negadas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="lgpd-filter-type" className="text-xs font-medium text-[#607B89]">
            Tipo
          </label>
          <select
            id="lgpd-filter-type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            className="h-10 rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm text-[#19384C] outline-none focus:border-[#159A9C] focus:ring-4 focus:ring-[#159A9C]/15"
          >
            <option value="all">Todos</option>
            <option value="data_export">Exportacao de dados</option>
            <option value="account_anonymization">Anonimizacao</option>
            <option value="account_deletion">Exclusao</option>
          </select>
        </div>
      </FiltersBar>

      <DataTableCard className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#1E3D50]">Solicitacoes registradas</h2>
            <p className="mt-1 text-xs text-[#688290]">
              Atualize status e registre notas de tratamento para trilha de conformidade.
            </p>
          </div>
          <span className="rounded-full border border-[#DCE8EC] bg-white px-3 py-1 text-xs font-semibold text-[#5D7785]">
            {items.length} em foco
          </span>
        </div>

        {loading ? (
          <LoadingSkeleton lines={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="h-5 w-5" />}
            title="Nenhuma solicitacao encontrada"
            description="Nao ha solicitacoes LGPD para os filtros aplicados."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const status = item.status as RequestStatus;
              const isSaving = savingRequestId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E2ECF0] bg-white p-4 shadow-[0_10px_24px_-24px_rgba(15,57,74,0.45)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#17384B]">
                          {TYPE_LABELS[item.type]}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusPillClassName(
                            status,
                          )}`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : status === 'in_review' ? (
                            <Clock3 className="h-3.5 w-3.5" />
                          ) : status === 'rejected' ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          )}
                          {STATUS_LABELS[status]}
                        </span>
                        <span className="text-xs text-[#6C8794]">Protocolo: {item.protocolo}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-[#345262] sm:grid-cols-2">
                        <div>
                          <span className="text-[#6E8997]">Solicitante: </span>
                          <strong className="font-semibold text-[#19384C]">
                            {item.requester?.nome || 'Usuario'}
                          </strong>
                          {item.requester?.email ? (
                            <span className="ml-1 text-[#688290]">({item.requester.email})</span>
                          ) : null}
                        </div>
                        <div>
                          <span className="text-[#6E8997]">Criada em: </span>
                          <strong className="font-semibold text-[#19384C]">
                            {formatDate(item.created_at)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#6E8997]">Atualizada em: </span>
                          <strong className="font-semibold text-[#19384C]">
                            {formatDate((item.updated_at as string) || item.handled_at || item.created_at)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#6E8997]">Tratada por: </span>
                          <strong className="font-semibold text-[#19384C]">
                            {item.handled_by?.nome || '-'}
                          </strong>
                        </div>
                      </div>

                      {item.reason ? (
                        <div className="rounded-lg border border-[#E8EEF1] bg-[#FAFCFD] px-3 py-2 text-sm text-[#355061]">
                          <span className="font-semibold text-[#5F7886]">Motivo: </span>
                          {item.reason}
                        </div>
                      ) : null}

                      {item.resolution_note ? (
                        <div className="rounded-lg border border-[#DDEBE6] bg-[#F7FCFA] px-3 py-2 text-sm text-[#2C4F43]">
                          <span className="font-semibold text-[#527568]">Nota de tratamento: </span>
                          {item.resolution_note}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-[260px] lg:justify-end">
                      {(['open', 'in_review', 'completed', 'rejected'] as RequestStatus[]).map(
                        (nextStatus) => (
                          <button
                            key={`${item.id}-${nextStatus}`}
                            type="button"
                            disabled={isSaving || status === nextStatus}
                            onClick={() =>
                              void updateRequestStatus(
                                item,
                                nextStatus,
                                nextStatus === 'completed' || nextStatus === 'rejected',
                              )
                            }
                            className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              status === nextStatus
                                ? `${getStatusPillClassName(nextStatus)}`
                                : 'border-[#D7E4E9] bg-white text-[#294A5B] hover:bg-[#F7FBFC]'
                            }`}
                            title={`Marcar como ${STATUS_LABELS[nextStatus]}`}
                          >
                            {isSaving && savingRequestId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              STATUS_LABELS[nextStatus]
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataTableCard>
    </div>
  );
};

export default AdminConformidadePage;
