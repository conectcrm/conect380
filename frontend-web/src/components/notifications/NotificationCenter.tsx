import React, { useState, useRef, useEffect } from 'react';
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
  Filter,
  MoreVertical
} from 'lucide-react';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    settings,
    addNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'error' | 'warning' | 'info' | 'reminder'>('all');
  const [realUnreadCount, setRealUnreadCount] = useState(0);

  // ✅ Usar useRef para persistir o Set entre re-renders (evita duplicadas)
  const processedApiNotificationsRef = useRef<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

        // Adicionar apenas notificações novas (não processadas antes)
        apiNotifications.forEach((apiNotif) => {
          // Se já processamos esta notificação da API, pular
          if (processedApiNotificationsRef.current.has(apiNotif.id)) {
            return;
          }

          // Marcar como processada
          processedApiNotificationsRef.current.add(apiNotif.id);

          // Mapear tipo da API para tipo do contexto
          let type: 'success' | 'error' | 'warning' | 'info' | 'reminder' = 'info';
          if (apiNotif.type === 'COTACAO_APROVADA') type = 'success';
          else if (apiNotif.type === 'COTACAO_REPROVADA') type = 'error';
          else if (apiNotif.type === 'COTACAO_PENDENTE') type = 'warning';

          addNotification({
            id: apiNotif.id, // ✅ Preservar ID do banco de dados
            type,
            title: apiNotif.title,
            message: apiNotif.message,
            autoClose: true, // Fechar automaticamente após 5 segundos
            duration: 5000,
          });
        });
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    // Buscar imediatamente
    fetchNotifications();

    // Polling a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [notifications, addNotification]);

  const filteredNotifications = notifications.filter(notification => {
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
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificações"
      >
        {settings.soundEnabled ? (
          <Bell className="w-6 h-6" />
        ) : (
          <BellOff className="w-6 h-6" />
        )}

        {/* Badge de notificações não lidas */}
        {realUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {realUnreadCount > 99 ? '99+' : realUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <div className="flex items-center space-x-2">
                {realUnreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    title="Marcar todas como lidas"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-800"
                  title="Limpar todas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Settings className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700" />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todas', count: notifications.length },
                { key: 'unread', label: 'Não Lidas', count: realUnreadCount },
                { key: 'reminder', label: 'Lembretes', count: notifications.filter(n => n.type === 'reminder').length },
                { key: 'error', label: 'Erros', count: notifications.filter(n => n.type === 'error').length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {label} {count > 0 && `(${count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">
                  {filter === 'all' ? 'Nenhuma notificação' : `Nenhuma notificação ${filter === 'unread' ? 'não lida' : `do tipo ${filter}`}`}
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Ver histórico completo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${!notification.read ? 'bg-blue-50' : 'bg-white'
                      } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Ícone */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Remover"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Ação personalizada */}
                        {notification.action && (
                          <button
                            onClick={() => {
                              notification.action!.onClick();
                              setIsOpen(false);
                            }}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
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

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
