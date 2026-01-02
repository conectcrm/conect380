import React from 'react';
import { Check, Clock, Save } from 'lucide-react';

interface SaveStatusProps {
  isDirty?: boolean;
  isSaving?: boolean;
  lastSaved?: Date;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  isDirty = false,
  isSaving = false,
  lastSaved,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSaving) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <Save className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-medium">Salvando...</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center space-x-2 text-amber-600">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Alterações não salvas</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <Check className="w-4 h-4" />
        <span className="text-sm">Salvo às {formatTime(lastSaved)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <Clock className="w-4 h-4" />
      <span className="text-sm">Novo</span>
    </div>
  );
};
