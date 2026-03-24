import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  entityType?: 'cliente' | 'proposta' | 'tarefa' | 'agenda' | 'oportunidade' | 'cotacao';
  entityId?: string;
  data?: Record<string, unknown> | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoClose?: boolean;
  duration?: number;
}

export type ReminderEntityType = 'cliente' | 'proposta' | 'tarefa' | 'agenda';

export interface NotificationReminder {
  id: string;
  title: string;
  message: string;
  scheduledFor: Date;
  entityType: ReminderEntityType;
  entityId?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  active: boolean;
}

export interface NotificationReminderInput {
  id?: string;
  title: string;
  message?: string;
  scheduledFor: Date | string | number;
  entityType?: ReminderEntityType | 'client' | 'reunião' | 'reuniao';
  entityId?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  active?: boolean;
}

interface NotificationContextData {
  // Notificações
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: AddNotificationInput) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Lembretes
  reminders: NotificationReminder[];
  addReminder: (reminder: NotificationReminderInput) => string;
  updateReminder: (id: string, updates: Partial<NotificationReminder>) => void;
  removeReminder: (id: string) => void;

  // Configurações
  settings: {
    soundEnabled: boolean;
    browserNotifications: boolean;
    emailNotifications: boolean;
    reminderInterval: number; // minutos antes do evento
  };
  updateSettings: (settings: Partial<NotificationContextData['settings']>) => void;

  // Métodos de conveniência
  showSuccess: (title: string, message: string, action?: Notification['action']) => void;
  showError: (title: string, message: string, action?: Notification['action']) => void;
  showWarning: (title: string, message: string, action?: Notification['action']) => void;
  showInfo: (title: string, message: string, action?: Notification['action']) => void;
  showReminder: (
    title: string,
    message: string,
    entityType: Notification['entityType'],
    entityId: string,
  ) => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

type AddNotificationInput = Omit<Notification, 'id' | 'timestamp' | 'read' | 'priority'> &
  Partial<Pick<Notification, 'id' | 'timestamp' | 'read' | 'priority'>> & {
    silent?: boolean;
    browser?: boolean;
  };

const normalizeBrowserText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const shouldAutoShowBrowserNotification = (notification: Notification): boolean => {
  if (notification.type === 'reminder') {
    return notification.priority === 'high' || notification.priority === 'urgent';
  }

  const normalizedContent = normalizeBrowserText(`${notification.title} ${notification.message}`);
  const omnichannelTextHints = [
    'omnichannel',
    'chat',
    'inbox',
    'nova mensagem',
    'mensagem recebida',
  ];
  const isOmnichannelByText = omnichannelTextHints.some((hint) =>
    normalizedContent.includes(hint),
  );

  let isOmnichannelByData = false;
  if (isRecord(notification.data)) {
    const normalizedData = [
      notification.data.modulo,
      notification.data.module,
      notification.data.channel,
      notification.data.canal,
      notification.data.context,
      notification.data.contexto,
      notification.data.feature,
      notification.data.origin,
      notification.data.origem,
    ]
      .map((value) => normalizeBrowserText(value))
      .join(' ');

    isOmnichannelByData =
      normalizedData.includes('omnichannel') ||
      normalizedData.includes('chat') ||
      normalizedData.includes('inbox');
  }

  const isUrgentOperationalAlert =
    notification.priority === 'urgent' &&
    (notification.type === 'error' || notification.type === 'warning');

  return isOmnichannelByText || isOmnichannelByData || isUrgentOperationalAlert;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // ✅ Garantir que estados iniciais sejam arrays válidos
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);
  const [reminders, setReminders] = useState<NotificationReminder[]>([]);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    browserNotifications: true,
    emailNotifications: false,
    reminderInterval: 15, // 15 minutos antes
  });

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Normaliza a estrutura de lembretes independente da origem do dado
  const normalizeReminder = (
    reminder: NotificationReminderInput,
    existingId?: string,
  ): NotificationReminder => {
    const normalizeEntityType = (
      entityType?: NotificationReminderInput['entityType'],
    ): ReminderEntityType => {
      switch (entityType) {
        case 'client':
          return 'cliente';
        case 'reunião':
        case 'reuniao':
          return 'agenda';
        case 'proposta':
        case 'tarefa':
        case 'cliente':
        case 'agenda':
          return entityType;
        default:
          return 'agenda';
      }
    };

    const scheduledForValue =
      reminder.scheduledFor instanceof Date
        ? reminder.scheduledFor
        : new Date(reminder.scheduledFor);

    const scheduledFor = Number.isNaN(scheduledForValue.getTime()) ? new Date() : scheduledForValue;

    return {
      id: reminder.id ?? existingId ?? generateId(),
      title: reminder.title,
      message: reminder.message ?? '',
      scheduledFor,
      entityType: normalizeEntityType(reminder.entityType),
      entityId: reminder.entityId,
      recurring: reminder.recurring,
      active: reminder.active ?? true,
    };
  };

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    // ❌ REMOVIDO: Não persistir notificações no localStorage
    // Motivo: Notificações são específicas por usuário (via API + JWT)
    // Persistir causava vazamento entre usuários no mesmo navegador

    // Limpar notificações antigas do localStorage (se existirem)
    localStorage.removeItem('conect-notifications');

    const savedReminders = localStorage.getItem('conect-reminders');
    const savedSettings = localStorage.getItem('conect-notification-settings');

    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        // ✅ Garantir que parsed é um array válido
        if (!Array.isArray(parsed)) {
          console.warn('⚠️ savedReminders não é um array, ignorando:', parsed);
          localStorage.removeItem('conect-reminders');
          return;
        }
        const validReminders = parsed
          .map((r: any) => {
            try {
              return normalizeReminder(
                {
                  title: r.title ?? 'Lembrete',
                  message: r.message,
                  scheduledFor: r.scheduledFor ?? r.dateTime ?? new Date(),
                  entityType: r.entityType,
                  entityId: r.entityId,
                  recurring: r.recurring,
                  active: r.active,
                },
                r.id,
              );
            } catch (innerError) {
              console.warn('Lembrete inválido ignorado:', innerError);
              return null;
            }
          })
          .filter(
            (reminder: NotificationReminder | null): reminder is NotificationReminder =>
              reminder !== null,
          );
        setReminders(validReminders);
      } catch (error) {
        console.error('Erro ao carregar lembretes:', error);
      }
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }

    // Solicitar permissão para notificações do navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ❌ REMOVIDO: Não persistir notificações no localStorage
  // Motivo: Causava vazamento de notificações entre usuários
  // As notificações vêm da API com polling e são filtradas por userId no backend

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Salvar lembretes no localStorage
  useEffect(() => {
    localStorage.setItem('conect-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('conect-notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Verificar lembretes periodicamente
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + settings.reminderInterval * 60000);

      reminders.forEach((reminder) => {
        if (
          reminder.active &&
          reminder.scheduledFor <= reminderTime &&
          reminder.scheduledFor > now
        ) {
          // Criar notificação para o lembrete
          addNotification({
            type: 'reminder',
            title: `Lembrete: ${reminder.title}`,
            message: reminder.message,
            priority: 'high',
            entityType: reminder.entityType,
            entityId: reminder.entityId,
            autoClose: false,
          });

          // Desativar lembrete se não for recorrente
          if (!reminder.recurring) {
            updateReminder(reminder.id, { active: false });
          }
        }
      });
    };

    // Verificar a cada minuto
    const interval = setInterval(checkReminders, 60000);
    checkReminders(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, [reminders, settings.reminderInterval]);

  const addNotification = useCallback((notification: AddNotificationInput) => {
    const { silent = false, browser, ...notificationData } = notification;
    const currentNotifications = Array.isArray(notificationsRef.current)
      ? notificationsRef.current
      : [];
    const resolvedId = notificationData.id || generateId();

    const parsedTimestamp =
      notificationData.timestamp instanceof Date
        ? notificationData.timestamp
        : notificationData.timestamp
          ? new Date(notificationData.timestamp)
          : new Date();
    const normalizedTimestamp = Number.isNaN(parsedTimestamp.getTime()) ? new Date() : parsedTimestamp;

    const existingIndex = currentNotifications.findIndex((item) => item.id === resolvedId);
    if (existingIndex >= 0) {
      const existingNotification = currentNotifications[existingIndex];
      const updatedNotification: Notification = {
        ...existingNotification,
        ...notificationData,
        id: resolvedId,
        timestamp: normalizedTimestamp,
        read: notificationData.read ?? existingNotification.read,
        priority: notificationData.priority ?? existingNotification.priority ?? 'medium',
      };

      const hasChanged =
        existingNotification.type !== updatedNotification.type ||
        existingNotification.title !== updatedNotification.title ||
        existingNotification.message !== updatedNotification.message ||
        existingNotification.read !== updatedNotification.read ||
        existingNotification.priority !== updatedNotification.priority ||
        existingNotification.autoClose !== updatedNotification.autoClose ||
        existingNotification.duration !== updatedNotification.duration ||
        existingNotification.entityType !== updatedNotification.entityType ||
        existingNotification.entityId !== updatedNotification.entityId ||
        JSON.stringify(existingNotification.data ?? null) !==
          JSON.stringify(updatedNotification.data ?? null) ||
        existingNotification.timestamp.getTime() !== updatedNotification.timestamp.getTime();

      if (!hasChanged) {
        return resolvedId;
      }

      const nextNotifications = [...currentNotifications];
      nextNotifications[existingIndex] = updatedNotification;
      notificationsRef.current = nextNotifications;
      setNotifications(nextNotifications);
      return resolvedId;
    }

    // Verificar se já existe uma notificação similar muito recente (últimos 2 minutos para erros)
    const timeWindow = notificationData.type === 'error' ? 2 * 60 * 1000 : 5 * 60 * 1000;
    const recentTimeAgo = new Date(Date.now() - timeWindow);
    const recentSimilar = currentNotifications.find(
      (existing) =>
        existing.title === notificationData.title &&
        existing.type === notificationData.type &&
        existing.message === notificationData.message &&
        existing.entityType === notificationData.entityType &&
        existing.timestamp > recentTimeAgo,
    );

    if (recentSimilar) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Notificação duplicada evitada:', notificationData.title);
      }
      return;
    }

    const newNotification: Notification = {
      ...notificationData,
      id: resolvedId,
      timestamp: normalizedTimestamp,
      read: notificationData.read ?? false,
      priority: notificationData.priority ?? 'medium',
    };

    const nextNotifications = [newNotification, ...currentNotifications];
    notificationsRef.current = nextNotifications;
    setNotifications(nextNotifications);

    if (silent) {
      return newNotification.id;
    }

    // Mostrar toast
    const toastOptions = {
      id: newNotification.id,
      duration: notificationData.autoClose !== false ? notificationData.duration || 4000 : Infinity,
      position: 'top-right' as const,
    };

    switch (notificationData.type) {
      case 'success':
        toast.success(notificationData.message, toastOptions);
        break;
      case 'error':
        toast.error(notificationData.message, toastOptions);
        break;
      case 'warning':
        toast(notificationData.message, {
          ...toastOptions,
          icon: '⚠️',
        });
        break;
      case 'info':
        toast(notificationData.message, {
          ...toastOptions,
          icon: 'ℹ️',
        });
        break;
      case 'reminder':
        toast(notificationData.message, {
          ...toastOptions,
          icon: '🔔',
        });
        break;
    }

    const shouldShowBrowserNotification =
      browser === true
        ? true
        : browser === false
          ? false
          : shouldAutoShowBrowserNotification(newNotification);

    // Notificação do navegador
    if (
      shouldShowBrowserNotification &&
      settings.browserNotifications &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(notificationData.title, {
        body: notificationData.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
      });
    }

    // Som (se habilitado)
    if (settings.soundEnabled) {
      playNotificationSound(notificationData.type);
    }

    return newNotification.id;
  }, [settings.browserNotifications, settings.soundEnabled]);

  const playNotificationSound = (type: Notification['type']) => {
    // Som desabilitado por padrão devido à política de autoplay dos navegadores
    // O AudioContext precisa ser criado após interação do usuário
    // Para habilitar: usuário deve clicar em algum lugar da página primeiro
    return;

    /* CÓDIGO DE SOM DESABILITADO - Remover comentário após implementar botão de ativação
    try {
      // Verificar se Web Audio API está disponível
      if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in (window as any))) {
        return; // Navegador não suporta
      }

      // Criar contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Verificar se AudioContext foi suspenso pela política do navegador
      if (audioContext.state === 'suspended') {
        // Tentar resumir (só funciona após interação do usuário)
        audioContext.resume().catch(() => {
          // Silenciosamente ignorar - som não é crítico
        });
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frequências diferentes para cada tipo
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 700,
        reminder: 900,
      };

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silenciosamente ignorar - som não é crítico
    }
    */
  };

  const markAsRead = async (id: string) => {
    try {
      // Atualizar estado local imediatamente (UX responsivo)
      setNotifications((prev) => {
        // ✅ Garantir que prev é um array válido
        if (!Array.isArray(prev)) {
          console.warn('⚠️ notifications não é um array em markAsRead, resetando');
          notificationsRef.current = [];
          return [];
        }
        const next = prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        );
        notificationsRef.current = next;
        return next;
      });

      // Persistir no backend
      const notificationService = await import('../services/notificationService');
      await notificationService.default.marcarComoLida(id);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      // Se falhar no backend, estado local já está atualizado para melhor UX
    }
  };

  const markAllAsRead = async () => {
    try {
      // Atualizar estado local imediatamente (UX responsivo)
      setNotifications((prev) => {
        // ✅ Garantir que prev é um array válido
        if (!Array.isArray(prev)) {
          console.warn('⚠️ notifications não é um array em markAllAsRead, resetando');
          notificationsRef.current = [];
          return [];
        }
        const next = prev.map((notification) => ({ ...notification, read: true }));
        notificationsRef.current = next;
        return next;
      });

      // Persistir no backend
      const notificationService = await import('../services/notificationService');
      await notificationService.default.marcarTodasComoLidas();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      // Se falhar no backend, estado local já está atualizado para melhor UX
    }
  };

  const removeNotification = async (id: string) => {
    try {
      // Remover do estado local imediatamente (UX responsivo)
      setNotifications((prev) => {
        const next = prev.filter((notification) => notification.id !== id);
        notificationsRef.current = next;
        return next;
      });

      // Remover do backend
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      // Se falhar no backend, não recarregar - usuário já viu a remoção
    }
  };

  const clearAll = async () => {
    try {
      // Limpar estado local imediatamente
      notificationsRef.current = [];
      setNotifications([]);

      // Limpar no backend
      await api.delete('/notifications');
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const addReminder = (reminder: NotificationReminderInput) => {
    const newReminder = normalizeReminder(reminder);
    setReminders((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === newReminder.id);
      if (existingIndex === -1) {
        return [...prev, newReminder];
      }

      const next = [...prev];
      next[existingIndex] = newReminder;
      return next;
    });
    return newReminder.id;
  };

  const updateReminder = (id: string, updates: Partial<NotificationReminder>) => {
    setReminders((prev) => {
      // ✅ Garantir que prev é um array válido
      if (!Array.isArray(prev)) {
        console.warn('⚠️ reminders não é um array em updateReminder, resetando');
        return [];
      }
      return prev.map((reminder) => (reminder.id === id ? { ...reminder, ...updates } : reminder));
    });
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  };

  const updateSettings = (newSettings: Partial<NotificationContextData['settings']>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Métodos de conveniência
  const showSuccess = (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'success', title, message, priority: 'medium', action });
  };

  const showError = (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'error', title, message, priority: 'high', action, autoClose: false });
  };

  const showWarning = (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'warning', title, message, priority: 'medium', action });
  };

  const showInfo = (title: string, message: string, action?: Notification['action']) => {
    addNotification({ type: 'info', title, message, priority: 'low', action });
  };

  const showReminder = (
    title: string,
    message: string,
    entityType: Notification['entityType'],
    entityId: string,
  ) => {
    addNotification({
      type: 'reminder',
      title,
      message,
      priority: 'high',
      entityType,
      entityId,
      autoClose: false,
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextData = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    reminders,
    addReminder,
    updateReminder,
    removeReminder,
    settings,
    updateSettings,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showReminder,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
