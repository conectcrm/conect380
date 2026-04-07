import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  ListChecks,
  RefreshCw,
  Search,
  User2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../components/layout-v2';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useWebSocketStatus } from '../contexts/WebSocketContext';
import { oportunidadesService } from '../services/oportunidadesService';
import { toastService } from '../services/toastService';
import usuariosService from '../services/usuariosService';
import {
  OportunidadeAtividadesPainelItem,
  OportunidadeAtividadesPainelResult,
  OportunidadeAtividadesPainelStatusFilter,
} from '../types/oportunidades';
import { EstagioOportunidade, TipoAtividade } from '../types/oportunidades/enums';
import { Usuario } from '../types/usuarios';

type FiltrosPainel = {
  periodStart: string;
  periodEnd: string;
  status: OportunidadeAtividadesPainelStatusFilter;
  tipo: TipoAtividade | '';
  busca: string;
  onlyMine: boolean;
  vendedorId: string;
  includeClosed: boolean;
  includeArchived: boolean;
};

const ESTAGIO_LABEL: Record<EstagioOportunidade, string> = {
  [EstagioOportunidade.LEADS]: 'Leads',
  [EstagioOportunidade.QUALIFICACAO]: 'Qualificacao',
  [EstagioOportunidade.PROPOSTA]: 'Proposta',
  [EstagioOportunidade.NEGOCIACAO]: 'Negociacao',
  [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
  [EstagioOportunidade.GANHO]: 'Ganho',
  [EstagioOportunidade.PERDIDO]: 'Perdido',
};

const TIPO_LABEL: Record<TipoAtividade, string> = {
  [TipoAtividade.TAREFA]: 'Atividade',
  [TipoAtividade.NOTA]: 'Anotacao',
  [TipoAtividade.REUNIAO]: 'Reuniao',
  [TipoAtividade.LIGACAO]: 'Chamada',
  [TipoAtividade.EMAIL]: 'E-mail',
};

const STATUS_OPTIONS: Array<{ id: OportunidadeAtividadesPainelStatusFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'due_today', label: 'Hoje' },
  { id: 'due_week', label: 'Semana' },
  { id: 'completed', label: 'Concluidas' },
];

const today = new Date();
const toInputDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const THIRTY_DAYS_AGO = (() => {
  const date = new Date(today);
  date.setDate(date.getDate() - 29);
  return date;
})();

const formatarDataHora = (value?: string | null): string => {
  if (!value) return 'Sem data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatarData = (value?: string | null): string => {
  if (!value) return 'Sem data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data';
  return parsed.toLocaleDateString('pt-BR');
};

const formatarMoeda = (value?: number | null): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isActivityAssignedNotification = (notification: {
  title?: string;
  message?: string;
  data?: Record<string, unknown> | null;
}): boolean => {
  const title = normalizeText(notification.title);
  const message = normalizeText(notification.message);
  const data = notification.data || {};
  const eventName = normalizeText(data.event);
  const moduleName = normalizeText(data.module);

  if (eventName === 'atividade_atribuida') {
    return true;
  }

  if (moduleName === 'pipeline' && eventName.includes('atividade')) {
    return true;
  }

  if (title.includes('nova tarefa da pipeline')) {
    return true;
  }

  return message.includes('atribuiu') && message.includes('oportunidade');
};

const extractRealtimeNotificationId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const realtimePayload = payload as Record<string, unknown>;
  const details =
    realtimePayload.dados && typeof realtimePayload.dados === 'object'
      ? (realtimePayload.dados as Record<string, unknown>)
      : null;

  const candidateId =
    details?.id ??
    details?.notificationId ??
    (details?.data && typeof details.data === 'object'
      ? (details.data as Record<string, unknown>).notificationId
      : null);

  const normalizedId = String(candidateId ?? '').trim();
  return normalizedId || null;
};

const isActivityAssignedRealtimePayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const realtimePayload = payload as Record<string, unknown>;
  const tipo = normalizeText(realtimePayload.tipo);
  if (tipo === 'atividade_atribuida') {
    return true;
  }

  const details =
    realtimePayload.dados && typeof realtimePayload.dados === 'object'
      ? (realtimePayload.dados as Record<string, unknown>)
      : null;

  if (!details) {
    return false;
  }

  return isActivityAssignedNotification({
    title: String(details.title ?? ''),
    message: String(details.message ?? ''),
    data:
      details.data && typeof details.data === 'object'
        ? (details.data as Record<string, unknown>)
        : null,
  });
};

const getActivityBadge = (item: OportunidadeAtividadesPainelItem): { label: string; className: string } => {
  if (item.status === 'completed') {
    return {
      label: 'Concluida',
      className: 'border border-green-200 bg-green-50 text-green-700',
    };
  }

  if (item.flags.overdue) {
    const delayLabel =
      typeof item.flags.daysDelta === 'number'
        ? `Atrasada ${Math.abs(item.flags.daysDelta)}d`
        : 'Atrasada';
    return {
      label: delayLabel,
      className: 'border border-red-200 bg-red-50 text-red-700',
    };
  }

  if (item.flags.dueToday) {
    return {
      label: 'Acao hoje',
      className: 'border border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (item.flags.dueWeek) {
    return {
      label: 'Nesta semana',
      className: 'border border-[#B4BEC9]/50 bg-[#EEF5F8] text-[#335566]',
    };
  }

  return {
    label: 'Planejada',
    className: 'border border-[#B4BEC9]/50 bg-[#EEF5F8] text-[#335566]',
  };
};

const AtividadesComerciaisPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const { subscribe } = useWebSocketStatus();
  const [painel, setPainel] = useState<OportunidadeAtividadesPainelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [concludingId, setConcludingId] = useState<string | null>(null);
  const [vendedores, setVendedores] = useState<Usuario[]>([]);
  const [lastRealtimeSyncAt, setLastRealtimeSyncAt] = useState<Date | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasNotificationHydratedRef = useRef(false);
  const lastRealtimeRefreshMsRef = useRef(0);

  const normalizedRole = String(user?.role || '')
    .trim()
    .toLowerCase();
  const canViewTeam = ['superadmin', 'admin', 'gerente', 'manager'].includes(normalizedRole);

  const [filtros, setFiltros] = useState<FiltrosPainel>({
    periodStart: toInputDate(THIRTY_DAYS_AGO),
    periodEnd: toInputDate(today),
    status: 'all',
    tipo: '',
    busca: '',
    onlyMine: true,
    vendedorId: '',
    includeClosed: true,
    includeArchived: false,
  });

  useEffect(() => {
    if (canViewTeam) return;
    setFiltros((prev) => ({
      ...prev,
      onlyMine: true,
      vendedorId: '',
    }));
  }, [canViewTeam]);

  const carregarVendedores = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await usuariosService.listarUsuarios({ ativo: true, limite: 200 });
      setVendedores(response.usuarios || []);
    } catch (err) {
      console.error('[AtividadesComerciais] erro ao carregar vendedores:', err);
      setVendedores([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const carregarPainel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await oportunidadesService.obterPainelAtividadesComerciais({
        periodStart: filtros.periodStart || undefined,
        periodEnd: filtros.periodEnd || undefined,
        status: filtros.status,
        tipo: filtros.tipo || undefined,
        busca: filtros.busca || undefined,
        onlyMine: canViewTeam ? filtros.onlyMine : true,
        vendedorId: canViewTeam && !filtros.onlyMine ? filtros.vendedorId || undefined : undefined,
        includeClosed: filtros.includeClosed,
        includeArchived: filtros.includeArchived,
        limit: 220,
      });
      setPainel(data);
    } catch (err) {
      console.error('[AtividadesComerciais] erro ao carregar painel:', err);
      setPainel(null);
      setError('Nao foi possivel carregar as atividades agora.');
    } finally {
      setLoading(false);
    }
  }, [canViewTeam, filtros]);

  const triggerRealtimeRefresh = useCallback(
    (_source: 'websocket' | 'notifications') => {
      const now = Date.now();
      if (now - lastRealtimeRefreshMsRef.current < 1200) {
        return;
      }

      lastRealtimeRefreshMsRef.current = now;
      setLastRealtimeSyncAt(new Date(now));
      void carregarPainel();
    },
    [carregarPainel],
  );

  useEffect(() => {
    void carregarVendedores();
  }, [carregarVendedores]);

  useEffect(() => {
    void carregarPainel();
  }, [carregarPainel]);

  useEffect(() => {
    const unsubscribe = subscribe('notificacao', (payload: unknown) => {
      if (!isActivityAssignedRealtimePayload(payload)) {
        return;
      }

      const notificationId = extractRealtimeNotificationId(payload);
      if (notificationId) {
        seenNotificationIdsRef.current.add(notificationId);
      }

      triggerRealtimeRefresh('websocket');
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, triggerRealtimeRefresh]);

  useEffect(() => {
    if (!Array.isArray(notifications)) return;

    if (!hasNotificationHydratedRef.current) {
      notifications.forEach((notification) => {
        seenNotificationIdsRef.current.add(notification.id);
      });
      hasNotificationHydratedRef.current = true;
      return;
    }

    const newNotifications = notifications.filter((notification) => {
      if (seenNotificationIdsRef.current.has(notification.id)) {
        return false;
      }
      seenNotificationIdsRef.current.add(notification.id);
      return true;
    });

    const hasNewAssignedActivity = newNotifications.some((notification) =>
      isActivityAssignedNotification({
        title: notification.title,
        message: notification.message,
        data: notification.data || null,
      }),
    );

    if (!hasNewAssignedActivity) {
      return;
    }

    triggerRealtimeRefresh('notifications');
  }, [notifications, triggerRealtimeRefresh]);

  const handleConcluir = async (item: OportunidadeAtividadesPainelItem) => {
    if (item.status === 'completed') return;
    try {
      setConcludingId(item.id);
      await oportunidadesService.concluirAtividade(item.oportunidade.id, item.id, {
        resultadoConclusao: 'Concluida pela central de atividades.',
      });
      toastService.success('Atividade concluida.');
      await carregarPainel();
    } catch (err) {
      console.error('[AtividadesComerciais] erro ao concluir atividade:', err);
      toastService.error('Nao foi possivel concluir a atividade.');
    } finally {
      setConcludingId(null);
    }
  };

  const abrirOportunidade = (id: string) => {
    navigate(`/crm/pipeline/oportunidades/${id}`, {
      state: {
        from: '/crm/atividades',
        initialTab: 'atividades',
      },
    });
  };

  const items = painel?.items || [];
  const historico = useMemo(() => items.filter((item) => item.status === 'completed').slice(0, 8), [items]);

  return (
    <div className="space-y-3 pt-1 sm:pt-2">
      <SectionCard className="space-y-3 border border-[#BFD4DA]/70 bg-gradient-to-br from-[#F8FCFC] via-white to-[#EAF5F2] p-3 sm:p-4">
        <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_12px_28px_-22px_rgba(16,57,74,0.45)] backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#D4E3E8] bg-[#F5FBFD] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#517082]">
                <ListChecks className="h-3.5 w-3.5 text-[#159A9C]" />
                Central de atividades
              </div>
              <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#19384C] sm:text-3xl">
                Atividades comerciais
              </h1>
              <p className="text-xs leading-relaxed text-[#5B7583] sm:text-sm">
                Acompanhe tarefas, interacoes e historico do time em um unico painel operacional.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void carregarPainel();
              }}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D3E2E7] bg-white px-4 text-sm font-semibold text-[#35586A] transition-colors hover:bg-[#F4FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
            <div className="rounded-xl border border-[#D5E4EA] bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A8796]">Total</p>
              <p className="mt-1 text-lg font-semibold text-[#173649]">{painel?.resumo.total || 0}</p>
            </div>
            <div className="rounded-xl border border-[#D5E4EA] bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6A8796]">Pendentes</p>
              <p className="mt-1 text-lg font-semibold text-[#173649]">{painel?.resumo.pending || 0}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Atrasadas</p>
              <p className="mt-1 text-lg font-semibold text-red-700">{painel?.resumo.overdue || 0}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Hoje</p>
              <p className="mt-1 text-lg font-semibold text-amber-700">{painel?.resumo.dueToday || 0}</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Concluidas</p>
              <p className="mt-1 text-lg font-semibold text-green-700">{painel?.resumo.completed || 0}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="border border-[#B4BEC9]/40 bg-white/95 p-3 shadow-[0_16px_26px_-22px_rgba(16,57,74,0.45)] backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFiltros((prev) => ({ ...prev, status: option.id }))}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  filtros.status === option.id
                    ? 'border-[#159A9C] bg-[#159A9C] text-white'
                    : 'border-[#B4BEC9]/70 bg-white text-[#325164] hover:bg-[#F1F8FA]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#5D7888]">Buscar</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A93A0]" />
                <input
                  value={filtros.busca}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      busca: event.target.value,
                    }))
                  }
                  placeholder="Buscar por descricao, oportunidade ou vendedor..."
                  className="h-10 w-full rounded-lg border border-[#B4BEC9]/70 bg-white pl-9 pr-3 text-sm text-[#1D3B4C] outline-none transition-colors focus:border-[#159A9C]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#5D7888]">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(event) =>
                  setFiltros((prev) => ({
                    ...prev,
                    tipo: event.target.value as TipoAtividade | '',
                  }))
                }
                className="h-10 w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 text-sm text-[#1D3B4C] outline-none transition-colors focus:border-[#159A9C]"
              >
                <option value="">Todos</option>
                <option value={TipoAtividade.TAREFA}>Atividade</option>
                <option value={TipoAtividade.NOTA}>Anotacao</option>
                <option value={TipoAtividade.REUNIAO}>Reuniao</option>
                <option value={TipoAtividade.LIGACAO}>Chamada</option>
                <option value={TipoAtividade.EMAIL}>E-mail</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#5D7888]">Periodo inicial</label>
              <input
                type="date"
                value={filtros.periodStart}
                onChange={(event) =>
                  setFiltros((prev) => ({
                    ...prev,
                    periodStart: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 text-sm text-[#1D3B4C] outline-none transition-colors focus:border-[#159A9C]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#5D7888]">Periodo final</label>
              <input
                type="date"
                value={filtros.periodEnd}
                onChange={(event) =>
                  setFiltros((prev) => ({
                    ...prev,
                    periodEnd: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 text-sm text-[#1D3B4C] outline-none transition-colors focus:border-[#159A9C]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {canViewTeam && (
                <>
                  <div className="inline-flex rounded-lg border border-[#B4BEC9]/70 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setFiltros((prev) => ({ ...prev, onlyMine: true }))}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        filtros.onlyMine
                          ? 'bg-[#159A9C] text-white'
                          : 'text-[#2F5163] hover:bg-[#EEF6F8]'
                      }`}
                    >
                      Minhas
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltros((prev) => ({ ...prev, onlyMine: false }))}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        !filtros.onlyMine
                          ? 'bg-[#159A9C] text-white'
                          : 'text-[#2F5163] hover:bg-[#EEF6F8]'
                      }`}
                    >
                      Equipe
                    </button>
                  </div>

                  {!filtros.onlyMine && (
                    <div className="min-w-[220px]">
                      <select
                        value={filtros.vendedorId}
                        disabled={loadingUsers}
                        onChange={(event) =>
                          setFiltros((prev) => ({
                            ...prev,
                            vendedorId: event.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 text-sm text-[#1D3B4C] outline-none transition-colors focus:border-[#159A9C]"
                      >
                        <option value="">Todos os vendedores</option>
                        {vendedores.map((vendedor) => (
                          <option key={vendedor.id} value={vendedor.id}>
                            {vendedor.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F7987]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filtros.includeClosed}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      includeClosed: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                />
                Incluir ganhos/perdidos
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filtros.includeArchived}
                  onChange={(event) =>
                    setFiltros((prev) => ({
                      ...prev,
                      includeArchived: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                />
                Incluir arquivadas
              </label>
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#D2E0E6] bg-[#F4FAFC] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#507081]">
                <Filter className="h-3.5 w-3.5" />
                Atualizacao: {formatarData(painel?.generatedAt || null)}
              </span>
              {lastRealtimeSyncAt && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#BDE5DE] bg-[#F4FBF9] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0F7B7D]">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync realtime: {lastRealtimeSyncAt.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard className="space-y-3 border border-[#B4BEC9]/40 bg-white/95 p-3 shadow-[0_16px_26px_-22px_rgba(16,57,74,0.45)] backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#607B89]">
              Lista de atividades
            </h2>
            <span className="text-xs text-[#607B89]">{items.length} resultado(s)</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center rounded-xl border border-[#D4E3E8] bg-[#F8FCFD] py-14">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#496677]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando atividades...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-xl border border-[#D4E3E8] bg-[#F8FCFD] p-5 text-center text-sm text-[#4F6B79]">
              Nenhuma atividade encontrada com os filtros selecionados.
            </div>
          )}

          {!loading &&
            !error &&
            items.map((item) => {
              const badge = getActivityBadge(item);
              const nomeOwner = item.responsavel?.nome || item.criadoPor?.nome || 'Sem responsavel';
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-[#D4E2E7] bg-white p-3 shadow-[0_10px_20px_-18px_rgba(16,57,74,0.35)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-[#D4E2E7] bg-[#F3FAFC] px-2 py-0.5 text-xs font-semibold text-[#2D5568]">
                        {TIPO_LABEL[item.tipo]}
                      </span>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-xs text-[#5D7786]">{formatarDataHora(item.dataAtividade)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirOportunidade(item.oportunidade.id)}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0F7B7D] transition-colors hover:text-[#159A9C]"
                  >
                    {item.oportunidade.titulo}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>

                  <p className="mt-2 text-sm text-[#234457]">{item.descricao}</p>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#567280] sm:grid-cols-2">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-[#159A9C]" />
                      Estagio: {ESTAGIO_LABEL[item.oportunidade.estagio]}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5 text-[#159A9C]" />
                      Responsavel: {nomeOwner}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-[#159A9C]" />
                      Valor: {formatarMoeda(item.oportunidade.valor)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-[#159A9C]" />
                      Probabilidade: {item.oportunidade.probabilidade}%
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2EDF1] pt-3">
                    <button
                      type="button"
                      onClick={() => abrirOportunidade(item.oportunidade.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#B4BEC9]/70 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2F5163] transition-colors hover:bg-[#F2F8FA]"
                    >
                      Ver oportunidade
                    </button>

                    {item.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleConcluir(item);
                        }}
                        disabled={concludingId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {concludingId === item.id ? 'Concluindo...' : 'Concluir'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Concluida
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
        </SectionCard>

        <SectionCard className="space-y-3 border border-[#B4BEC9]/40 bg-white/95 p-3 shadow-[0_16px_26px_-22px_rgba(16,57,74,0.45)] backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#607B89]">
              Historico recente
            </h2>
            <span className="text-xs text-[#607B89]">{historico.length}</span>
          </div>

          {historico.length === 0 ? (
            <div className="rounded-xl border border-[#D4E3E8] bg-[#F8FCFD] p-4 text-sm text-[#4F6B79]">
              Nenhuma conclusao encontrada no periodo atual.
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map((item) => (
                <div key={`history-${item.id}`} className="rounded-lg border border-[#DCE8ED] bg-white p-2.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => abrirOportunidade(item.oportunidade.id)}
                        className="line-clamp-1 text-left text-sm font-semibold text-[#20495C] transition-colors hover:text-[#159A9C]"
                      >
                        {item.oportunidade.titulo}
                      </button>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#567280]">{item.descricao}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#6A8594]">
                        <span>{formatarDataHora(item.concluidoEm || item.dataAtividade)}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#D4E2E7] bg-[#F4FAFC] px-2 py-0.5">
                          {TIPO_LABEL[item.tipo]}
                        </span>
                      </div>
                      {item.resultadoConclusao && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-[#E6EDF0] bg-[#FAFDFE] px-2 py-1 text-[11px] text-[#5D7786]">
                          <AlertCircle className="h-3 w-3" />
                          {item.resultadoConclusao}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default AtividadesComerciaisPage;
