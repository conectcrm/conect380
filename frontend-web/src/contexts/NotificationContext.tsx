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
import { AlertTriangle, Bell, Info } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { buildScopedStorageKey } from '../utils/storageScope';

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
  entityType?: ReminderEntityType | 'client' | 'reuniao' | 'reuniao';
  entityId?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  active?: boolean;
}

interface NotificationContextData {
  // Notificacoes
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

  // Configuracoes
  settings: {
    soundEnabled: boolean;
    browserNotifications: boolean;
    emailNotifications: boolean;
    reminderInterval: number; // minutos antes do evento
  };
  updateSettings: (settings: Partial<NotificationContextData['settings']>) => void;

  // Metodos de conveniencia
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY = 'conect-notification-settings';
const NOTIFICATION_SETTINGS_STORAGE_KEY_BASE = 'conect-notification-settings:v2';
const LEGACY_USER_REMINDERS_STORAGE_KEY_BASE = 'conect-reminders';
const REMINDERS_STORAGE_KEY_BASE = 'conect-reminders:v2';
const DEFAULT_NOTIFICATION_SETTINGS: NotificationContextData['settings'] = {
  soundEnabled: true,
  browserNotifications: true,
  emailNotifications: false,
  reminderInterval: 15,
};

const isPersistedNotificationId = (value?: string | null): boolean => {
  if (typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
};

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
  const { isAuthenticated, user } = useAuth();
  //  Garantir que estados iniciais sejam arrays validos
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);
  const [reminders, setReminders] = useState<NotificationReminder[]>([]);
  const [settings, setSettings] = useState<NotificationContextData['settings']>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [loadedReminderScopeKey, setLoadedReminderScopeKey] = useState<string | null>(null);
  const [loadedSettingsScopeKey, setLoadedSettingsScopeKey] = useState<string | null>(null);
  const resolvedEmpresaId = user?.empresa?.id ?? null;
  const settingsStorageKey =
    isAuthenticated && user?.id
      ? buildScopedStorageKey(NOTIFICATION_SETTINGS_STORAGE_KEY_BASE, {
          includeEmpresa: true,
          includeUser: true,
          fallbackEmpresaId: resolvedEmpresaId,
          fallbackUserId: user.id,
        })
      : LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY;
  const remindersStorageKey =
    isAuthenticated && user?.id
      ? buildScopedStorageKey(REMINDERS_STORAGE_KEY_BASE, {
          includeEmpresa: true,
          includeUser: true,
          fallbackEmpresaId: resolvedEmpresaId,
          fallbackUserId: user.id,
        })
      : null;
  const legacyUserRemindersStorageKey = user?.id
    ? `${LEGACY_USER_REMINDERS_STORAGE_KEY_BASE}:${user.id}`
    : null;

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
        case 'reuniao':
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

  // Carregar dados do localStorage.
  // Notificacoes nao sao persistidas; lembretes sao persistidos por usuario autenticado.
  useEffect(() => {
    localStorage.removeItem('conect-notifications');

    const savedSettings = localStorage.getItem(settingsStorageKey);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (isRecord(parsed)) {
          setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
        } else {
          setSettings(DEFAULT_NOTIFICATION_SETTINGS);
        }
      } catch (error) {
        console.error('Erro ao carregar configuraes:', error);
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    }
    setLoadedSettingsScopeKey(settingsStorageKey);

    if (!isAuthenticated || !remindersStorageKey) {
      setReminders([]);
      setLoadedReminderScopeKey(null);

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      return;
    }

    const savedScopedReminders = localStorage.getItem(remindersStorageKey);
    const savedLegacyUserReminders = legacyUserRemindersStorageKey
      ? localStorage.getItem(legacyUserRemindersStorageKey)
      : null;
    const sourceRemindersPayload = savedScopedReminders ?? savedLegacyUserReminders;

    if (!sourceRemindersPayload) {
      setReminders([]);
      setLoadedReminderScopeKey(remindersStorageKey);
    } else {
      try {
        const parsed = JSON.parse(sourceRemindersPayload);
        if (!Array.isArray(parsed)) {
          console.warn('savedReminders nao um array, ignorando:', parsed);
          localStorage.removeItem(remindersStorageKey);
          if (savedLegacyUserReminders && legacyUserRemindersStorageKey) {
            localStorage.removeItem(legacyUserRemindersStorageKey);
          }
          setReminders([]);
          setLoadedReminderScopeKey(remindersStorageKey);
        } else {
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
                console.warn('Lembrete invalido ignorado:', innerError);
                return null;
              }
            })
            .filter(
              (reminder: NotificationReminder | null): reminder is NotificationReminder =>
                reminder !== null,
            );
          setReminders(validReminders);
          setLoadedReminderScopeKey(remindersStorageKey);

          // Migracao automatica da chave legada para a chave escopada por usuario.
          if (!savedScopedReminders && savedLegacyUserReminders && legacyUserRemindersStorageKey) {
            localStorage.setItem(remindersStorageKey, sourceRemindersPayload);
            localStorage.removeItem(legacyUserRemindersStorageKey);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar lembretes:', error);
        setReminders([]);
        setLoadedReminderScopeKey(remindersStorageKey);
      }
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [
    isAuthenticated,
    legacyUserRemindersStorageKey,
    remindersStorageKey,
    settingsStorageKey,
  ]);

  //  REMOVIDO: Nao persistir notificacoes nao localStorage
  // Motivo: Causava vazamento de notificacoes entre usuarios
  // As notificacoes vem da API com polling e sao filtradas por userId nao backend

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    notificationsRef.current = [];
    setNotifications([]);
    toast.dismiss();
  }, [isAuthenticated]);

  // Salvar lembretes nao localStorage
  useEffect(() => {
    if (!isAuthenticated || !remindersStorageKey) {
      return;
    }
    if (loadedReminderScopeKey !== remindersStorageKey) {
      return;
    }

    localStorage.setItem(remindersStorageKey, JSON.stringify(reminders));
  }, [isAuthenticated, loadedReminderScopeKey, reminders, remindersStorageKey]);

  // Salvar configuraes nao localStorage
  useEffect(() => {
    if (loadedSettingsScopeKey !== settingsStorageKey) {
      return;
    }

    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  }, [loadedSettingsScopeKey, settings, settingsStorageKey]);

  // Verificar lembretes periodicamente
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const checkReminders = () => {
      const now = Date.now();
      // Tolera atraso de aba inativa sem adiantar lembrete.
      const reminderGracePeriodMs = 5 * 60 * 1000;

      reminders.forEach((reminder) => {
        const scheduledForMs = reminder.scheduledFor.getTime();
        const isDueNow =
          scheduledForMs <= now && scheduledForMs >= now - reminderGracePeriodMs;

        if (
          reminder.active &&
          isDueNow
        ) {
          // Criar notificacao para o lembrete
          addNotification({
            id: `agenda:runtime-reminder:${reminder.id}:${scheduledForMs}`,
            type: 'reminder',
            title: `Lembrete: ${reminder.title}`,
            message: reminder.message,
            priority: 'high',
            entityType: reminder.entityType,
            entityId: reminder.entityId,
            autoClose: true,
            duration: 8000,
          });

          // Desativar lembrete se nao for recorrente
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
  }, [isAuthenticated, reminders]);

  const addNotification = useCallback((notification: AddNotificationInput) => {
    if (!isAuthenticated) {
      return;
    }

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

    // Verificar se ja existe uma notificacao similar muito recente (ultimos 2 minutos para erros)
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
        console.debug('Notificao duplicada evitada:', notificationData.title);
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
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        });
        break;
      case 'info':
        toast(notificationData.message, {
          ...toastOptions,
          icon: <Info className="h-4 w-4 text-[#159A9C]" />,
        });
        break;
      case 'reminder':
        toast(notificationData.message, {
          ...toastOptions,
          icon: <Bell className="h-4 w-4 text-[#159A9C]" />,
        });
        break;
    }

    const shouldShowBrowserNotification =
      browser === true
        ? true
        : browser === false
          ? false
          : shouldAutoShowBrowserNotification(newNotification);

    // Notificao do navegador
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
  }, [isAuthenticated, settings.browserNotifications, settings.soundEnabled]);

  const playNotificationSound = (type: Notification['type']) => {
    // Som desabilitado por padro devido  poltica de autoplay dos navegadores
    // O AudioContext precisa ser criado apos interacao do usuario
    // Para habilitar: usuario deve clicar em algum lugar da pgina primeiro
    return;

    /* CDIGO DE SOM DESABILITADO - Remover comentrio apos implementar boto de ativao
    try {
      // Verificar se Web Audio API est disponvel
      if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in (window as any))) {
        return; // Navegador nao suporta
      }

      // Criar contexto de udio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Verificar se AudioContext foi suspenso pela poltica do navegador
      if (audioContext.state === 'suspended') {
        // Tentar resumir (s funciona apos interacao do usuario)
        audioContext.resume().catch(() => {
          // Silenciosamente ignorar - som nao critico
        });
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frequncias diferentes para cada tipo
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
      // Silenciosamente ignorar - som nao critico
    }
    */
  };

  const markAsRead = async (id: string) => {
    try {
      // Atualizar estado local imediatamente (UX responsivo)
      setNotifications((prev) => {
        //  Garantir que prev  um array valido
        if (!Array.isArray(prev)) {
          console.warn(' notifications nao um array em markAsRead, resetando');
          notificationsRef.current = [];
          return [];
        }
        const next = prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        );
        notificationsRef.current = next;
        return next;
      });

      // Persistir nao backend apenas para notificacoes reais (UUID)
      if (!isPersistedNotificationId(id)) {
        return;
      }

      const notificationService = await import('../services/notificationService');
      await notificationService.default.marcarComoLida(id);
    } catch (error) {
      console.error('Erro ao marcar notificacao como lida:', error);
      // Se falhar nao backend, estado local ja est atualizado para melhor UX
    }
  };

  const markAllAsRead = async () => {
    try {
      // Atualizar estado local imediatamente (UX responsivo)
      setNotifications((prev) => {
        //  Garantir que prev  um array valido
        if (!Array.isArray(prev)) {
          console.warn(' notifications nao um array em markAllAsRead, resetando');
          notificationsRef.current = [];
          return [];
        }
        const next = prev.map((notification) => ({ ...notification, read: true }));
        notificationsRef.current = next;
        return next;
      });

      // Persistir nao backend
      const notificationService = await import('../services/notificationService');
      await notificationService.default.marcarTodasComoLidas();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      // Se falhar nao backend, estado local ja est atualizado para melhor UX
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

      // Remover do backend apenas para notificacoes reais (UUID)
      if (!isPersistedNotificationId(id)) {
        return;
      }

      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Erro ao remover notificacao:', error);
      // Se falhar nao backend, nao recarregar - usuario ja viu a remocao
    }
  };

  const clearAll = async () => {
    try {
      // Limpar estado local imediatamente
      notificationsRef.current = [];
      setNotifications([]);

      // Limpar nao backend
      await api.delete('/notifications');
    } catch (error) {
      console.error('Erro ao limpar notificacoes:', error);
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
      //  Garantir que prev  um array valido
      if (!Array.isArray(prev)) {
        console.warn(' reminders nao um array em updateReminder, resetando');
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

  // Metodos de conveniencia
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



