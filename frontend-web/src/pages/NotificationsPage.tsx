import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  PageHeader,
  SectionCard,
} from '../components/layout-v2';
import {
  ArrowLeft,
  Bell,
  Check,
  Trash2,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  X,
} from 'lucide-react';

type StatusFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | 'success' | 'error' | 'warning' | 'info' | 'reminder';

type NotificationItemType = 'success' | 'error' | 'warning' | 'info' | 'reminder';

const controlClassName =
  'h-10 rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm text-[#19384C] shadow-sm transition-colors focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    reminders,
    removeReminder,
  } = useNotifications();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  const typeCounts = useMemo(
    () => ({
      success: notifications.filter((n) => n.type === 'success').length,
      error: notifications.filter((n) => n.type === 'error').length,
      warning: notifications.filter((n) => n.type === 'warning').length,
      info: notifications.filter((n) => n.type === 'info').length,
      reminder: notifications.filter((n) => n.type === 'reminder').length,
    }),
    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        const statusMatch =
          statusFilter === 'all' ||
          (statusFilter === 'read' && notification.read) ||
          (statusFilter === 'unread' && !notification.read);

        const typeMatch = typeFilter === 'all' || notification.type === typeFilter;

        return statusMatch && typeMatch;
      }),
    [notifications, statusFilter, typeFilter],
  );

  const listTitle =
    statusFilter === 'all'
      ? 'Todas as notificações'
      : statusFilter === 'unread'
        ? 'Notificações não lidas'
        : 'Notificações lidas';

  const getTypeIcon = (type: NotificationItemType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-[#159A9C]" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-[#7C5CFF]" />;
      default:
        return <Bell className="h-5 w-5 text-[#607B89]" />;
    }
  };

  const getPriorityAccentClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-[#B4BEC9]';
      default:
        return 'border-l-[#D7E4E8]';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'low':
        return 'border-slate-200 bg-slate-50 text-slate-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const getTypeBadgeClass = (type: NotificationItemType) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'info':
        return 'border-[#BDE5DE] bg-[#F4FBF9] text-[#0F7B7D]';
      case 'reminder':
        return 'border-violet-200 bg-violet-50 text-violet-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  const handleClearAll = () => {
    void clearAll();
    setIsConfirmingClearAll(false);
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Bell className="h-6 w-6 text-[#159A9C]" />
              <span>Notificações</span>
            </span>
          }
          description="Central de alertas, lembretes e atualizações do sistema."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={() => navigate('/perfil?section=notifications')}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                title="Preferências de notificações"
              >
                <Settings className="h-4 w-4" />
                Preferências
              </button>
            </div>
          }
        />

        <InlineStats
          stats={[
            { label: 'Total', value: String(notifications.length), tone: 'neutral' },
            { label: 'Não lidas', value: String(unreadCount), tone: unreadCount > 0 ? 'warning' : 'neutral' },
            {
              label: 'Lidas',
              value: String(Math.max(notifications.length - unreadCount, 0)),
              tone: 'accent',
            },
            { label: 'Lembretes ativos', value: String(reminders.length), tone: 'neutral' },
          ]}
        />
      </SectionCard>

      <FiltersBar className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="notifications-status-filter" className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
            Status
          </label>
          <select
            id="notifications-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={controlClassName}
          >
            <option value="all">Todas ({notifications.length})</option>
            <option value="unread">Não lidas ({unreadCount})</option>
            <option value="read">Lidas ({Math.max(notifications.length - unreadCount, 0)})</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="notifications-type-filter" className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
            Tipo
          </label>
          <select
            id="notifications-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className={controlClassName}
          >
            <option value="all">Todos os tipos</option>
            <option value="success">Sucesso ({typeCounts.success})</option>
            <option value="info">Informação ({typeCounts.info})</option>
            <option value="warning">Aviso ({typeCounts.warning})</option>
            <option value="error">Erro ({typeCounts.error})</option>
            <option value="reminder">Lembrete ({typeCounts.reminder})</option>
          </select>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#BDE5DE] bg-[#F4FBF9] px-4 text-sm font-semibold text-[#0F7B7D] transition-colors hover:bg-[#EAF7F4]"
            >
              <Check className="h-4 w-4" />
              Marcar todas como lidas
            </button>
          ) : null}

          {notifications.length > 0 ? (
            isConfirmingClearAll ? (
              <div className="inline-flex items-center gap-1 rounded-lg border border-[#F5D0D5] bg-[#FFF5F6] p-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#607B89] transition-colors hover:bg-white hover:text-[#19384C]"
                  title="Cancelar limpeza"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-white hover:text-red-700"
                  title="Confirmar limpar todas"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#F5D0D5] bg-white px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-[#FFF5F6]"
              >
                <Trash2 className="h-4 w-4" />
                Limpar todas
              </button>
            )
          ) : null}
        </div>
      </FiltersBar>

      {isConfirmingClearAll ? (
        <SectionCard className="border border-[#FBE4E8] bg-[#FFF8F9] p-3 sm:p-4">
          <p className="text-sm text-[#9B1C1C]">
            Confirme a limpeza para remover todas as notificações desta sessão.
          </p>
        </SectionCard>
      ) : null}

      <DataTableCard>
        <div className="border-b border-[#E5EEF2] bg-[#FBFDFE] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#19384C] sm:text-base">{listTitle}</h2>
            <span className="text-xs font-medium text-[#6A8795] sm:text-sm">
              {filteredNotifications.length} de {notifications.length} notificações
            </span>
          </div>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-[#EEF3F5]">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 px-4 py-4 transition-colors hover:bg-[#F7FBFC] sm:px-5 ${getPriorityAccentClass(
                  notification.priority,
                )} ${!notification.read ? 'bg-[#159A9C]/4' : 'bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getTypeIcon(notification.type)}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm font-semibold sm:text-base ${
                              !notification.read ? 'text-[#19384C]' : 'text-[#355061]'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read ? (
                            <span className="inline-flex h-2 w-2 rounded-full bg-[#159A9C]" />
                          ) : null}
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getTypeBadgeClass(
                              notification.type,
                            )}`}
                          >
                            {notification.type}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPriorityBadgeClass(
                              notification.priority,
                            )}`}
                          >
                            {notification.priority}
                          </span>
                        </div>

                        <p className={`mt-1 text-sm ${!notification.read ? 'text-[#355061]' : 'text-[#607B89]'}`}>
                          {notification.message}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7A8F9B]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>

                        {notification.action ? (
                          <button
                            type="button"
                            onClick={() => notification.action?.onClick()}
                            className="mt-2 inline-flex items-center rounded-lg border border-[#BDE5DE] bg-[#F4FBF9] px-3 py-1.5 text-xs font-semibold text-[#0F7B7D] transition-colors hover:bg-[#EAF7F4]"
                          >
                            {notification.action.label}
                          </button>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-1 self-start">
                        {!notification.read ? (
                          <button
                            type="button"
                            onClick={() => void markAsRead(notification.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE8EC] bg-white text-[#607B89] transition-colors hover:bg-[#F4FBF9] hover:text-[#159A9C]"
                            title="Marcar como lida"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => void removeNotification(notification.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F5D0D5] bg-white text-red-600 transition-colors hover:bg-[#FFF5F6] hover:text-red-700"
                          title="Excluir notificação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title={
                statusFilter === 'unread'
                  ? 'Nenhuma notificação não lida'
                  : 'Nenhuma notificação encontrada'
              }
              description={
                statusFilter === 'unread'
                  ? 'Você está em dia com suas notificações.'
                  : 'As notificações aparecerão aqui conforme você usar o sistema.'
              }
              action={
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao dashboard
                </button>
              }
            />
          </div>
        )}
      </DataTableCard>

      {reminders.length > 0 ? (
        <DataTableCard>
          <div className="border-b border-[#F2E7B8] bg-[#FFFBEA] px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#19384C] sm:text-base">
                <Calendar className="h-4 w-4 text-[#C98A19]" />
                Lembretes ativos
              </h2>
              <span className="text-xs font-medium text-[#8F7A3A] sm:text-sm">
                {reminders.length} lembrete{reminders.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#EEF3F5]">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="bg-white px-4 py-4 transition-colors hover:bg-[#F7FBFC] sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#19384C] sm:text-base">{reminder.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#607B89] sm:text-sm">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(reminder.scheduledFor).toLocaleString('pt-BR')}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#BDE5DE] bg-[#F4FBF9] px-2 py-0.5 text-[11px] font-semibold text-[#0F7B7D]">
                        {reminder.entityType}
                      </span>
                      {reminder.recurring ? (
                        <span className="inline-flex items-center rounded-full border border-[#DCE8EC] bg-[#FBFDFE] px-2 py-0.5 text-[11px] font-semibold text-[#607B89]">
                          Recorrente
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeReminder(reminder.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F5D0D5] bg-white text-red-600 transition-colors hover:bg-[#FFF5F6] hover:text-red-700"
                    title="Excluir lembrete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DataTableCard>
      ) : null}
    </div>
  );
};

export default NotificationsPage;
