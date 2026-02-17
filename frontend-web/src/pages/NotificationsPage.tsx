import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
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
} from 'lucide-react';

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

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>(
    'all',
  );

  // Filtrar notificações
  const filteredNotifications = notifications.filter((notification) => {
    const statusMatch =
      filter === 'all' ||
      (filter === 'read' && notification.read) ||
      (filter === 'unread' && !notification.read);

    const typeMatch = typeFilter === 'all' || notification.type === typeFilter;

    return statusMatch && typeMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#159A9C]" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTime = (timestamp: Date) => {
    const timestampMs = timestamp.getTime();
    const now = Date.now();
    const diff = now - timestampMs;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return timestamp.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex md:hidden items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
              <div className="flex items-center space-x-2">
                <Bell className="w-6 h-6 text-[#159A9C]" />
                <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-400 hover:text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                  >
                    Marcar Todas como Lidas
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Limpar Todas
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar com Filtros */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>

              {/* Filtro por Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="all">Todas ({notifications.length})</option>
                  <option value="unread">Não lidas ({unreadCount})</option>
                  <option value="read">Lidas ({notifications.length - unreadCount})</option>
                </select>
              </div>

              {/* Filtro por Tipo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="success">Sucesso</option>
                  <option value="info">Informação</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                </select>
              </div>

              {/* Estatísticas */}
              <div className="space-y-4">
                <div className="bg-[#DEEFE7] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-lg font-bold text-[#159A9C]">{notifications.length}</span>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Não lidas</span>
                    <span className="text-lg font-bold text-red-600">{unreadCount}</span>
                  </div>
                </div>
                <div className="bg-[#159A9C]/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Lembretes</span>
                    <span className="text-lg font-bold text-[#159A9C]">{reminders.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header da Lista */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filter === 'all'
                      ? 'Todas as Notificações'
                      : filter === 'unread'
                        ? 'Notificações Não Lidas'
                        : 'Notificações Lidas'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredNotifications.length} de {notifications.length} notificações
                  </span>
                </div>
              </div>

              {/* Lista */}
              <div className="divide-y divide-gray-200">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? 'bg-[#159A9C]/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Ícone do Tipo */}
                          <div className="flex-shrink-0 mt-1">{getTypeIcon(notification.type)}</div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3
                                className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-[#159A9C] rounded-full"></span>
                              )}
                            </div>
                            <p
                              className={`text-sm ${!notification.read ? 'text-gray-800' : 'text-gray-600'} mb-2`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(notification.timestamp)}</span>
                              </span>
                              <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                                {notification.priority}
                              </span>
                              <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                                {notification.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar como lida"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir notificação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {filter === 'unread'
                        ? 'Nenhuma notificação não lida'
                        : 'Nenhuma notificação encontrada'}
                    </h3>
                    <p className="text-gray-500">
                      {filter === 'unread'
                        ? 'Você está em dia com suas notificações!'
                        : 'As notificações aparecerão aqui conforme você usar o sistema.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Lembretes */}
            {reminders.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Lembretes Ativos</h2>
                    </div>
                    <span className="text-sm text-gray-500">
                      {reminders.length} lembrete{reminders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {reminder.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(reminder.scheduledFor).toLocaleString('pt-BR')}</span>
                            </span>
                            <span className="capitalize px-2 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-xs">
                              {reminder.entityType}
                            </span>
                            {reminder.recurring && (
                              <span className="px-2 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-xs">
                                Recorrente
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeReminder(reminder.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir lembrete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
