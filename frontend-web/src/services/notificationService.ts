import api from './api';

export interface NotificationData {
  id: string;
  userId: string;
  type: 'COTACAO_APROVADA' | 'COTACAO_REPROVADA' | 'COTACAO_PENDENTE' | 'SISTEMA';
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any>;
  createdAt: string;
  readAt: string | null;
}

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Busca todas as notificações do usuário
   */
  async listar(onlyUnread?: boolean): Promise<NotificationData[]> {
    const params = onlyUnread ? { onlyUnread: 'true' } : {};
    const response = await api.get<NotificationData[]>('/notifications', { params });
    return response.data;
  }

  /**
   * Conta notificações não lidas
   */
  async contarNaoLidas(): Promise<number> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  }

  /**
   * Marca uma notificação como lida
   */
  async marcarComoLida(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`);
  }

  /**
   * Marca todas as notificações como lidas
   */
  async marcarTodasComoLidas(): Promise<void> {
    await api.put('/notifications/mark-all-read');
  }

  /**
   * Cria uma notificação (admin)
   */
  async criar(data: CreateNotificationDto): Promise<NotificationData> {
    const response = await api.post<NotificationData>('/notifications', data);
    return response.data;
  }
}

export default new NotificationService();
