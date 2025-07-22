import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

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
  entityType?: 'cliente' | 'proposta' | 'tarefa' | 'agenda';
  entityId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationReminder {
  id: string;
  title: string;
  message: string;
  scheduledFor: Date;
  entityType: 'cliente' | 'proposta' | 'tarefa' | 'agenda';
  entityId: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  active: boolean;
}

interface NotificationContextData {
  // Notificações
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // Lembretes
  reminders: NotificationReminder[];
  addReminder: (reminder: Omit<NotificationReminder, 'id'>) => void;
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
  showReminder: (title: string, message: string, entityType: Notification['entityType'], entityId: string) => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<NotificationReminder[]>([]);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    browserNotifications: true,
    emailNotifications: false,
    reminderInterval: 15, // 15 minutos antes
  });

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedNotifications = localStorage.getItem('fenix-notifications');
    const savedReminders = localStorage.getItem('fenix-reminders');
    const savedSettings = localStorage.getItem('fenix-notification-settings');

    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        const validNotifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(validNotifications);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    }

    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        const validReminders = parsed.map((r: any) => ({
          ...r,
          scheduledFor: new Date(r.scheduledFor)
        }));
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

  // Salvar notificações no localStorage
  useEffect(() => {
    localStorage.setItem('fenix-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Salvar lembretes no localStorage
  useEffect(() => {
    localStorage.setItem('fenix-reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('fenix-notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Verificar lembretes periodicamente
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + settings.reminderInterval * 60000);

      reminders.forEach(reminder => {
        if (reminder.active && reminder.scheduledFor <= reminderTime && reminder.scheduledFor > now) {
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

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar toast
    const toastOptions = {
      duration: notification.autoClose !== false ? (notification.duration || 4000) : Infinity,
      position: 'top-right' as const,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast(notification.message, { 
          ...toastOptions, 
          icon: '⚠️',
          style: { borderLeft: '4px solid #f59e0b' }
        });
        break;
      case 'info':
        toast(notification.message, { 
          ...toastOptions, 
          icon: 'ℹ️',
          style: { borderLeft: '4px solid #3b82f6' }
        });
        break;
      case 'reminder':
        toast(notification.message, { 
          ...toastOptions, 
          icon: '🔔',
          style: { borderLeft: '4px solid #8b5cf6' }
        });
        break;
    }

    // Notificação do navegador
    if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
      });
    }

    // Som (se habilitado)
    if (settings.soundEnabled) {
      playNotificationSound(notification.type);
    }

    return newNotification.id;
  };

  const playNotificationSound = (type: Notification['type']) => {
    try {
      // Criar contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      console.log('Som de notificação não disponível:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const addReminder = (reminder: Omit<NotificationReminder, 'id'>) => {
    const newReminder: NotificationReminder = {
      ...reminder,
      id: generateId(),
    };
    setReminders(prev => [...prev, newReminder]);
    return newReminder.id;
  };

  const updateReminder = (id: string, updates: Partial<NotificationReminder>) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, ...updates } : reminder
      )
    );
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const updateSettings = (newSettings: Partial<NotificationContextData['settings']>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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

  const showReminder = (title: string, message: string, entityType: Notification['entityType'], entityId: string) => {
    addNotification({ 
      type: 'reminder', 
      title, 
      message, 
      priority: 'high', 
      entityType, 
      entityId,
      autoClose: false 
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
