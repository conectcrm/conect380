/**
 * Hook para atalhos de teclado em modais
 * Implementa atalhos comuns como Ctrl+S (salvar) e Esc (fechar)
 */

import { useEffect } from 'react';

interface UseModalKeyboardShortcutsOptions {
  isOpen: boolean;
  onSave?: () => void;
  onClose?: () => void;
  canSave?: boolean;
  enabled?: boolean;
}

export const useModalKeyboardShortcuts = ({
  isOpen,
  onSave,
  onClose,
  canSave = true,
  enabled = true,
}: UseModalKeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!isOpen || !enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S ou Cmd+S para salvar
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (onSave && canSave) {
          onSave();
        }
        return;
      }

      // Esc para fechar
      if (event.key === 'Escape') {
        event.preventDefault();
        if (onClose) {
          onClose();
        }
        return;
      }
    };

    // Adicionar listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onSave, onClose, canSave, enabled]);

  return {
    shortcuts: [
      { key: 'Ctrl+S', description: 'Salvar', enabled: canSave },
      { key: 'Esc', description: 'Fechar', enabled: true },
    ],
  };
};
