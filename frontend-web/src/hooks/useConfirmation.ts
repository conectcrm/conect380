/**
 * Hook personalizado para confirmações de modal
 * Substitui o window.confirm do navegador por um modal personalizado do sistema
 */

import { useState, useCallback } from 'react';

export interface ConfirmationOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  icon?: 'warning' | 'danger' | 'info' | 'success';
}

export interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    options: {},
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirmation = useCallback((
    options: ConfirmationOptions & {
      onConfirm: () => void;
      onCancel?: () => void;
    }
  ) => {
    setConfirmationState({
      isOpen: true,
      options: {
        title: options.title || 'Confirmar ação',
        message: options.message || 'Tem certeza que deseja continuar?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        confirmButtonClass: options.confirmButtonClass || 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        icon: options.icon || 'warning'
      },
      onConfirm: () => {
        options.onConfirm();
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        if (options.onCancel) options.onCancel();
        setConfirmationState(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation
  };
};

export default useConfirmation;
