import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Mail,
  MailX,
  Monitor,
  MonitorOff,
  Clock,
  Save,
  TestTube,
} from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, showSuccess, showError, showWarning, showInfo } =
    useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    showSuccess('Configurações Salvas', 'Suas preferências de notificação foram atualizadas.');
    onClose();
  };

  const handleTest = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Teste de Sucesso', message: 'Esta é uma notificação de sucesso!' },
      error: { title: 'Teste de Erro', message: 'Esta é uma notificação de erro!' },
      warning: { title: 'Teste de Aviso', message: 'Esta é uma notificação de aviso!' },
      info: { title: 'Teste de Informação', message: 'Esta é uma notificação informativa!' },
    };

    const { title, message } = messages[type];
    switch (type) {
      case 'success':
        showSuccess(title, message);
        break;
      case 'error':
        showError(title, message);
        break;
      case 'warning':
        showWarning(title, message);
        break;
      case 'info':
        showInfo(title, message);
        break;
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setLocalSettings((prev) => ({ ...prev, browserNotifications: true }));
        showSuccess('Permissão Concedida', 'Notificações do navegador foram habilitadas.');
      } else {
        showError('Permissão Negada', 'Não foi possível habilitar as notificações do navegador.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configurações de Notificação</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Som */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {localSettings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-green-500" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Som das Notificações</p>
                <p className="text-sm text-gray-500">Reproduzir som ao receber notificações</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Notificações do Navegador */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {localSettings.browserNotifications ? (
                <Monitor className="w-5 h-5 text-blue-500" />
              ) : (
                <MonitorOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Notificações do Navegador</p>
                <p className="text-sm text-gray-500">Mostrar notificações na área de trabalho</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!localSettings.browserNotifications &&
                'Notification' in window &&
                Notification.permission !== 'granted' && (
                  <button
                    onClick={requestBrowserPermission}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Permitir
                  </button>
                )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.browserNotifications}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      browserNotifications: e.target.checked,
                    }))
                  }
                  disabled={'Notification' in window && Notification.permission !== 'granted'}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {localSettings.emailNotifications ? (
                <Mail className="w-5 h-5 text-yellow-500" />
              ) : (
                <MailX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">Receber notificações por email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.emailNotifications}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, emailNotifications: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Intervalo de Lembretes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900">Antecedência dos Lembretes</p>
                <p className="text-sm text-gray-500">Minutos antes do evento para notificar</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-8">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={localSettings.reminderInterval}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    reminderInterval: parseInt(e.target.value),
                  }))
                }
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                {localSettings.reminderInterval} min
              </span>
            </div>
          </div>

          {/* Testes */}
          <div className="space-y-3">
            <p className="font-medium text-gray-900 flex items-center space-x-2">
              <TestTube className="w-4 h-4" />
              <span>Testar Notificações</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTest('success')}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                Sucesso
              </button>
              <button
                onClick={() => handleTest('error')}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Erro
              </button>
              <button
                onClick={() => handleTest('warning')}
                className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
              >
                Aviso
              </button>
              <button
                onClick={() => handleTest('info')}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                Info
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
