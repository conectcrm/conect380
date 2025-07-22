/**
 * Componente de Status de Salvamento
 * Mostra o status atual do formulário (salvo, modificado, salvando, etc.)
 */

import React from 'react';
import { Check, Clock, Save, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SaveStatusProps {
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  isFormValid: boolean;
  lastSaveTime?: number;
  autoSaveEnabled?: boolean;
  className?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  hasUnsavedChanges,
  isSubmitting,
  isFormValid,
  lastSaveTime,
  autoSaveEnabled = false,
  className = ''
}) => {
  const getStatus = () => {
    if (isSubmitting) {
      return {
        icon: <Save className="w-4 h-4 animate-pulse" />,
        text: 'Salvando...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    }

    if (!isFormValid && hasUnsavedChanges) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Formulário inválido',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }

    if (hasUnsavedChanges) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: autoSaveEnabled ? 'Alterações detectadas' : 'Não salvo',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50'
      };
    }

    return {
      icon: <Check className="w-4 h-4" />,
      text: lastSaveTime ? `Salvo ${formatLastSave(lastSaveTime)}` : 'Salvo',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  };

  const formatLastSave = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // menos de 1 minuto
      return 'agora';
    } else if (diff < 3600000) { // menos de 1 hora
      const minutes = Math.floor(diff / 60000);
      return `há ${minutes}m`;
    } else {
      const hours = Math.floor(diff / 3600000);
      return `há ${hours}h`;
    }
  };

  const status = getStatus();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.color} ${className}`}>
      {status.icon}
      <span className="text-sm font-medium">{status.text}</span>
      
      {autoSaveEnabled && (
        <div className="flex items-center gap-1 ml-1 opacity-70">
          <Wifi className="w-3 h-3" />
          <span className="text-xs">Auto</span>
        </div>
      )}
    </div>
  );
};
