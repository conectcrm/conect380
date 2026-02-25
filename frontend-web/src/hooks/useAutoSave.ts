/**
 * Hook personalizado para Auto-Save
 * Salva automaticamente os dados do formulário quando há mudanças
 */

import { useEffect, useRef, useCallback } from 'react';
import { toastService } from '../services/toastService';

interface UseAutoSaveOptions {
  delay?: number; // Delay em ms antes de salvar (padrão: 30000ms = 30s)
  enabled?: boolean; // Se o auto-save está habilitado
  onSave: () => Promise<void>; // Função de salvamento
  hasUnsavedChanges: boolean; // Se há mudanças não salvas
  isFormValid: boolean; // Se o formulário está válido
}

export const useAutoSave = ({
  delay = 30000, // 30 segundos
  enabled = true,
  onSave,
  hasUnsavedChanges,
  isFormValid,
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveAttempt = useRef<number>(0);

  const performAutoSave = useCallback(async () => {
    if (!enabled || !hasUnsavedChanges || !isFormValid) {
      return;
    }

    try {
      await onSave();
      lastSaveAttempt.current = Date.now();
      toastService.success('Auto-save realizado.', { duration: 2000 });
    } catch (error) {
      console.error('Erro no auto-save:', error);
      toastService.error('Erro no auto-save.', { duration: 3000 });
    }
  }, [enabled, hasUnsavedChanges, isFormValid, onSave]);

  // Resetar timer quando há mudanças
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges || !isFormValid) {
      return;
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar novo timeout
    timeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, isFormValid, enabled, delay, performAutoSave]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    lastSaveAttempt: lastSaveAttempt.current,
    performManualSave: performAutoSave,
  };
};
