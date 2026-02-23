import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationService from '../../services/notificationService';
import {
  Bell,
  BellOff,
  Check,
  X,
  Trash2,
  Settings,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface NotificationCenterProps {
  className?: string;
}

type NotificationFilter = 'all' | 'unread' | 'success' | 'error' | 'warning' | 'info' | 'reminder';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    settings,
    addNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [realUnreadCount, setRealUnreadCount] = useState(0);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  // IDs já vistos da API (usado para controlar toasts, não para deduplicar lista)
  const seenApiNotificationsRef = useRef<Set<string>>(new Set());
  const isInitialSyncRef = useRef(true);
  const addNotificationRef = useRef(addNotification);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const panelTitleId = `${panelId}-title`;

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    if (!isConfirmingClearAll) return;

    const timeout = window.setTimeout(() => {
      setIsConfirmingClearAll(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [isConfirmingClearAll]);

  useEffect(() => {
    if (isOpen) {
      window.requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    } else if (wasOpenRef.current) {
      triggerButtonRef.current?.focus();
      setIsConfirmingClearAll(false);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsConfirmingClearAll(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Polling: Buscar notificações da API a cada 30 segundos
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const apiNotifications = await notificationService.listar();
        const count = await notificationService.contarNaoLidas();
        setRealUnreadCount(count);

        // Sincronizar notificações da API no contexto local sem criar duplicadas por ID
        apiNotifications.forEach((apiNotif) => {
          // Mapear tipo da API para tipo do contexto
          let type: 'success' | 'error' | 'warning' | 'info' | 'reminder' = 'info';
          if (apiNotif.type === 'COTACAO_APROVADA') type = 'success';
          else if (apiNotif.type === 'COTACAO_REPROVADA') type = 'error';
          else if (apiNotif.type === 'COTACAO_PENDENTE') type = 'warning';

          const parsedTimestamp = new Date(apiNotif.createdAt);
          const timestamp = Number.isNaN(parsedTimestamp.getTime()) ? new Date() : parsedTimestamp;
          const alreadySeen = seenApiNotificationsRef.current.has(apiNotif.id);

          addNotificationRef.current({
            id: apiNotif.id, // Preservar ID do banco de dados
            type,
            title: apiNotif.title,
            message: apiNotif.message,
            read: apiNotif.read,
            timestamp,
            autoClose: true,
            duration: 5000,
            // Evita toasts duplicados em hidratação inicial e atualizações já conhecidas
            silent: isInitialSyncRef.current || alreadySeen || apiNotif.read,
          });

          seenApiNotificationsRef.current.add(apiNotif.id);
        });

        if (isInitialSyncRef.current) {
          isInitialSyncRef.current = false;
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const notificationCounts = useMemo(
    () => ({
      all: notifications.length,
      unreadLocal: notifications.filter((n) => !n.read).length,
      reminder: notifications.filter((n) => n.type === 'reminder').length,
      error: notifications.filter((n) => n.type === 'error').length,
    }),
    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        switch (filter) {
          case 'unread':
            return !notification.read;
          case 'success':
          case 'error':
          case 'warning':
          case 'info':
          case 'reminder':
            return notification.type === filter;
          default:
            return true;
        }
      }),
    [filter, notifications],
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  const closePopover = () => {
    setIsOpen(false);
    setIsConfirmingClearAll(false);
  };

  const handleTogglePopover = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setIsConfirmingClearAll(false);
      return next;
    });
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePopover();
    }
  };

  const handleSettingsClick = () => {
    closePopover();
    navigate('/perfil?section=notifications');
  };

  const handleClearAllRequest = () => {
    setIsConfirmingClearAll(true);
  };

  const handleClearAllConfirm = () => {
    void clearAll();
    setIsConfirmingClearAll(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={handleTogglePopover}
        className="group relative min-h-11 min-w-11 rounded-xl border border-transparent p-1.5 text-gray-600 transition-all duration-200 ease-out hover:border-[#159A9C]/25 hover:bg-[#DEEFE7]/65 hover:text-[#002333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-[1px] sm:min-h-0 sm:min-w-0 sm:p-2"
        title="Notificações"
        aria-label={`Notificações${realUnreadCount > 0 ? `, ${realUnreadCount} não lidas` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
      >
        {settings.soundEnabled ? (
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <BellOff className="h-5 w-5 sm:h-6 sm:w-6" />
        )}

        {realUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {realUnreadCount > 99 ? '99+' : realUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={panelTitleId}
          tabIndex={-1}
          onKeyDown={handlePanelKeyDown}
          className="absolute right-0 bottom-full z-50 mb-2 flex max-h-[600px] w-[calc(100vw-1rem)] flex-col rounded-2xl border border-[#D7E4E8] bg-white shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2 sm:w-96"
        >
          <div className="border-b border-[#E5EEF2] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 id={panelTitleId} className="text-lg font-semibold text-[#19384C]">
                Notificações
              </h3>
              <div className="flex items-center space-x-2">
                {realUnreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    className="rounded-md p-1 text-sm text-[#159A9C] transition-colors duration-200 hover:bg-[#DEEFE7]/55 hover:text-[#0F7B7D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35"
                    title="Marcar todas como lidas"
                    aria-label="Marcar todas as notificações como lidas"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}

                {notifications.length > 0 ? (
                  isConfirmingClearAll ? (
                    <div className="inline-flex items-center gap-1 rounded-lg border border-[#F5D0D5] bg-[#FFF5F6] p-1">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingClearAll(false)}
                        className="rounded-md p-1 text-[#607B89] transition-colors hover:bg-white hover:text-[#19384C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4BEC9]/40"
                        title="Cancelar limpeza"
                        aria-label="Cancelar limpeza de notificações"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllConfirm}
                        className="rounded-md p-1 text-red-600 transition-colors hover:bg-white hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        title="Confirmar limpar todas"
                        aria-label="Confirmar limpeza de todas as notificações"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearAllRequest}
                      className="rounded-md p-1 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      title="Limpar todas"
                      aria-label="Limpar todas as notificações"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )
                ) : null}

                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className="rounded-md p-1 text-sm text-[#607B89] transition-colors duration-200 hover:bg-[#EEF6F8] hover:text-[#19384C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35"
                  title="Preferências de notificações"
                  aria-label="Abrir preferências de notificações"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isConfirmingClearAll ? (
              <div className="mb-3 rounded-lg border border-[#FBE4E8] bg-[#FFF8F9] px-3 py-2 text-xs text-[#9B1C1C]">
                Confirme a limpeza para remover todas as notificações visíveis desta sessão.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todas', count: notificationCounts.all },
                {
                  key: 'unread',
                  label: 'Não Lidas',
                  count: realUnreadCount || notificationCounts.unreadLocal,
                },
                {
                  key: 'reminder',
                  label: 'Lembretes',
                  count: notificationCounts.reminder,
                },
                {
                  key: 'error',
                  label: 'Erros',
                  count: notificationCounts.error,
                },
              ].map(
                ({
                  key,
                  label,
                  count,
                }: {
                  key: NotificationFilter;
                  label: string;
                  count: number;
                }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    className={`rounded-full px-3 py-1.5 text-xs transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 sm:py-1 ${
                      filter === key
                        ? 'bg-[#159A9C] text-white shadow-[0_8px_18px_-14px_rgba(0,35,51,0.6)]'
                        : 'bg-[#F3F7F9] text-[#607B89] hover:bg-[#DEEFE7]/70 hover:text-[#002333]'
                    }`}
                  >
                    {label} {count > 0 && `(${count})`}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-[#B4BEC9]" />
                <p className="mb-4 text-[#607B89]">
                  {filter === 'all'
                    ? 'Nenhuma notificação'
                    : `Nenhuma notificação ${filter === 'unread' ? 'não lida' : `do tipo ${filter}`}`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closePopover();
                    navigate('/notifications');
                  }}
                  className="text-sm font-medium text-[#159A9C] transition-colors hover:text-[#0F7B7D]"
                >
                  Ver histórico completo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF3F5]">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 p-4 transition-colors hover:bg-[#F7FBFC] ${
                      !notification.read ? 'bg-[#159A9C]/4' : 'bg-white'
                    } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                !notification.read ? 'text-[#19384C]' : 'text-[#355061]'
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-[#607B89]">{notification.message}</p>
                            <p className="mt-2 text-xs text-[#7A8F9B]">{formatTime(notification.timestamp)}</p>
                          </div>

                          <div className="ml-2 flex items-center space-x-1">
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() => void markAsRead(notification.id)}
                                className="rounded p-1.5 text-gray-400 transition-colors duration-200 hover:bg-[#DEEFE7]/55 hover:text-[#159A9C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35 sm:p-1"
                                title="Marcar como lida"
                                aria-label={`Marcar notificação ${notification.title} como lida`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void removeNotification(notification.id)}
                              className="rounded p-1.5 text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:p-1"
                              title="Remover"
                              aria-label={`Remover notificação ${notification.title}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {notification.action && (
                          <button
                            type="button"
                            onClick={() => {
                              notification.action.onClick();
                              closePopover();
                            }}
                            className="mt-2 text-sm font-medium text-[#159A9C] hover:text-[#0F7B7D]"
                          >
                            {notification.action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="border-t border-[#E5EEF2] p-3 text-center">
              <button
                type="button"
                onClick={() => {
                  closePopover();
                  navigate('/notifications');
                }}
                className="text-sm font-medium text-[#159A9C] transition-colors hover:text-[#0F7B7D]"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
