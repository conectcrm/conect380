import React from 'react';
import { MessageSquare, Inbox, X, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CanalTipo } from '../types';
import { getIconeCanal } from '../utils';

export interface PopupNotificationItem {
  id: string;
  type: 'nova-mensagem' | 'novo-ticket';
  title: string;
  message: string;
  ticketId?: string;
  messageId?: string;
  avatarUrl?: string;
  canal?: CanalTipo;
  createdAt: Date;
  onClick?: () => void;
}

interface PopupNotificationsProps {
  notifications: PopupNotificationItem[];
  onDismiss: (id: string) => void;
}

export const PopupNotifications: React.FC<PopupNotificationsProps> = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-full">
      {notifications.map(notification => {
        const clickable = typeof notification.onClick === 'function';
        const CanalIcon = notification.canal ? getIconeCanal(notification.canal) : null;
        const label = notification.type === 'novo-ticket' ? 'Novo atendimento' : 'Nova mensagem';
        const accentClass = notification.type === 'novo-ticket' ? 'bg-amber-400' : 'bg-blue-500';
        const badgeClass = notification.type === 'novo-ticket'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-blue-100 text-blue-700';
        const elapsed = formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: ptBR });

        return (
          <div
            key={notification.id}
            onClick={() => {
              if (notification.onClick) {
                notification.onClick();
              }
            }}
            className={`pointer-events-auto relative w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-gray-200 bg-white shadow-lg transition-all ${clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl' : ''
              }`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${accentClass}`} aria-hidden="true" />

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDismiss(notification.id);
              }}
              className="absolute right-2 top-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-3 p-4 pr-5">
              <div className="relative flex-shrink-0">
                {notification.avatarUrl ? (
                  <img
                    src={notification.avatarUrl}
                    alt={notification.title}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                    {notification.title ? notification.title.charAt(0).toUpperCase() : <User className="h-5 w-5 text-gray-500" />}
                  </div>
                )}

                {CanalIcon && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                    <CanalIcon className={`h-3 w-3 ${notification.type === 'novo-ticket' ? 'text-amber-500' : 'text-blue-500'}`} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
                    {notification.type === 'novo-ticket' ? (
                      <Inbox className="mr-1 h-3 w-3" />
                    ) : (
                      <MessageSquare className="mr-1 h-3 w-3" />
                    )}
                    {label}
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-gray-400">
                    {elapsed}
                  </span>
                </div>

                <h4 className="mt-2 text-sm font-semibold text-gray-900">
                  {notification.title}
                </h4>
                <p className="mt-1 max-h-12 overflow-hidden text-xs leading-snug text-gray-600">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
